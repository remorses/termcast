// Standalone table renderable with borderless design, header background, and alternating row stripes.
// Header uses inverted markup.heading colors (fg becomes box bg, bg becomes text fg).
// Odd data rows use conceal.bg for stripe; even rows are transparent.
//
// Ported from opentui core. Imports now reference @opentui/core.
// Registered as <table-view> JSX element via extend().
// React wrapper <Table> at the bottom provides a declarative API.
import {
  Renderable,
  type RenderableOptions,
  type RenderContext,
  SyntaxStyle,
  type StyleDefinition,
  StyledText,
  type TextChunk,
  createTextAttributes,
  TextRenderable,
  BoxRenderable,
  type OptimizedBuffer,
} from '@opentui/core'
import { extend } from '@opentui/react'
import React from 'react'
import { getMarkdownSyntaxStyle } from 'termcast/src/theme'
import { useStore } from 'termcast/src/state'
import { parseInlineMarkdown } from 'termcast/src/markdown-utils'

export type TableCellContent = string | StyledText

export interface TableRenderableOptions extends RenderableOptions<TableRenderable> {
  headers?: TableCellContent[]
  rows?: TableCellContent[][]
  syntaxStyle?: SyntaxStyle
  /** When true, cell text wraps instead of being truncated to one line. Default false. */
  wrapText?: boolean
}

export class TableRenderable extends Renderable {
  private _headers: TableCellContent[] = []
  private _rows: TableCellContent[][] = []
  private _syntaxStyle?: SyntaxStyle
  private _wrapText: boolean = false
  private _tableDirty = true
  private _tableStructureDirty = true

  constructor(ctx: RenderContext, options: TableRenderableOptions) {
    super(ctx, {
      ...options,
      // Direction set in rebuild() based on wrapText:
      // - wrapText=false: 'row' (column-based, content-sized columns)
      // - wrapText=true:  'column' (row-based, synchronized row heights)
      flexDirection: options.wrapText ? 'column' : 'row',
    })

    this._headers = options.headers ?? []
    this._rows = options.rows ?? []
    this._syntaxStyle = options.syntaxStyle
    this._wrapText = options.wrapText ?? false

    // Build eagerly on construction (safe since no existing children)
    this._tableDirty = false
    this._tableStructureDirty = false
    this.rebuild()
  }

  get headers(): TableCellContent[] {
    return this._headers
  }

  set headers(value: TableCellContent[]) {
    const structureChanged = value.length !== this._headers.length
    this._headers = value
    this._tableDirty = true
    if (structureChanged) this._tableStructureDirty = true
    this.requestRender()
  }

  get rows(): TableCellContent[][] {
    return this._rows
  }

  set rows(value: TableCellContent[][]) {
    const newColCount = value[0]?.length || 0
    const oldColCount = this._rows[0]?.length || 0
    const structureChanged = value.length !== this._rows.length || newColCount !== oldColCount
    this._rows = value
    this._tableDirty = true
    if (structureChanged) this._tableStructureDirty = true
    this.requestRender()
  }

  get syntaxStyle(): SyntaxStyle | undefined {
    return this._syntaxStyle
  }

  set syntaxStyle(value: SyntaxStyle | undefined) {
    this._syntaxStyle = value
    this._tableDirty = true
    this.requestRender()
  }

  get wrapText(): boolean {
    return this._wrapText
  }

  set wrapText(value: boolean) {
    if (this._wrapText !== value) {
      this._wrapText = value
      this._tableDirty = true
      this._tableStructureDirty = true
      this.requestRender()
    }
  }

  private getStyle(group: string): StyleDefinition | undefined {
    if (!this._syntaxStyle) return undefined
    let style = this._syntaxStyle.getStyle(group)
    if (!style && group.includes('.')) {
      const baseName = group.split('.')[0]
      style = this._syntaxStyle.getStyle(baseName)
    }
    return style
  }

  private toStyledText(content: TableCellContent): StyledText {
    if (content instanceof StyledText) return content
    const defaultStyle = this.getStyle('default')
    const chunk: TextChunk = {
      __isChunk: true,
      text: content,
      fg: defaultStyle?.fg,
      bg: defaultStyle?.bg,
      attributes: defaultStyle
        ? createTextAttributes({
            bold: defaultStyle.bold,
            italic: defaultStyle.italic,
            underline: defaultStyle.underline,
            dim: defaultStyle.dim,
          })
        : 0,
    }
    return new StyledText([chunk])
  }

  private styledHeaderChunks(content: StyledText, headingStyle: StyleDefinition | undefined, headerFg: StyleDefinition['fg']): StyledText {
    if (!headerFg) return content
    const styledChunks = content.chunks.map((chunk) => ({
      ...chunk,
      fg: headerFg,
      bg: undefined,
      attributes: headingStyle
        ? createTextAttributes({
            bold: headingStyle.bold,
            italic: headingStyle.italic,
            underline: headingStyle.underline,
            dim: headingStyle.dim,
          })
        : chunk.attributes,
    }))
    return new StyledText(styledChunks)
  }

  private rebuild(): void {
    // Remove all existing children (copy array since remove mutates it)
    const children = [...(this as any)._childrenInLayoutOrder] as Renderable[]
    for (const child of children) {
      this.remove(child.id)
    }

    const colCount = this._headers.length || this._rows[0]?.length || 0
    if (colCount === 0 || this._rows.length === 0) return

    const headingStyle =
      this.getStyle('markup.heading') || this.getStyle('default')
    const concealStyle = this.getStyle('conceal')
    const headerBg = headingStyle?.fg
    const headerFg = headingStyle?.bg
    const stripeBg = concealStyle?.bg

    // Update flex direction based on wrapText mode
    this.flexDirection = this._wrapText ? 'column' : 'row'

    if (this._wrapText) {
      this.rebuildRowBased(colCount, headingStyle, headerBg, headerFg, stripeBg)
    } else {
      this.rebuildColumnBased(colCount, headingStyle, headerBg, headerFg, stripeBg)
    }
  }

  // Column-based: each column is a vertical stack. Content-sized, compact.
  // Used when wrapText=false (all cells are height:1, no alignment issues).
  private rebuildColumnBased(
    colCount: number,
    headingStyle: StyleDefinition | undefined,
    headerBg: StyleDefinition['fg'],
    headerFg: StyleDefinition['fg'],
    stripeBg: StyleDefinition['fg'],
  ): void {
    const hasHeaders = this._headers.length > 0

    for (let col = 0; col < colCount; col++) {
      const columnBox = new BoxRenderable(this.ctx, {
        id: `${this.id}-col-${col}`,
        flexDirection: 'column',
      })

      if (hasHeaders) {
        const headerContent = this._headers[col] ?? ''
        let headerStyledText = this.toStyledText(headerContent)
        headerStyledText = this.styledHeaderChunks(headerStyledText, headingStyle, headerFg)

        const headerBox = new BoxRenderable(this.ctx, {
          id: `${this.id}-col-${col}-header-box`,
          backgroundColor: headerBg,
        })
        headerBox.add(
          new TextRenderable(this.ctx, {
            id: `${this.id}-col-${col}-header`,
            content: headerStyledText,
            height: 1,
            overflow: 'hidden',
            paddingLeft: 1,
            paddingRight: 1,
          }),
        )
        columnBox.add(headerBox)
      }

      for (let row = 0; row < this._rows.length; row++) {
        const cell = this._rows[row]?.[col] ?? ''
        const cellContent = this.toStyledText(cell)
        const isOddRow = row % 2 === 1

        const cellBox = new BoxRenderable(this.ctx, {
          id: `${this.id}-col-${col}-row-${row}-box`,
          backgroundColor: isOddRow ? stripeBg : undefined,
        })
        cellBox.add(
          new TextRenderable(this.ctx, {
            id: `${this.id}-col-${col}-row-${row}`,
            content: cellContent,
            height: 1,
            overflow: 'hidden',
            paddingLeft: 1,
            paddingRight: 1,
          }),
        )
        columnBox.add(cellBox)
      }

      this.add(columnBox)
    }
  }

  // Row-based: each row is a horizontal box. Equal-width columns but
  // cells in the same row share height, so wrapped text aligns correctly.
  private rebuildRowBased(
    colCount: number,
    headingStyle: StyleDefinition | undefined,
    headerBg: StyleDefinition['fg'],
    headerFg: StyleDefinition['fg'],
    stripeBg: StyleDefinition['fg'],
  ): void {
    if (this._headers.length > 0) {
      const headerRow = new BoxRenderable(this.ctx, {
        id: `${this.id}-header-row`,
        flexDirection: 'row',
        backgroundColor: headerBg,
      })
      for (let col = 0; col < colCount; col++) {
        const headerContent = this._headers[col] ?? ''
        let headerStyledText = this.toStyledText(headerContent)
        headerStyledText = this.styledHeaderChunks(headerStyledText, headingStyle, headerFg)

        headerRow.add(
          new TextRenderable(this.ctx, {
            id: `${this.id}-header-${col}`,
            content: headerStyledText,
            flexGrow: 1,
            flexBasis: 0,
            paddingLeft: 1,
            paddingRight: 1,
          }),
        )
      }
      this.add(headerRow)
    }

    for (let row = 0; row < this._rows.length; row++) {
      const isOddRow = row % 2 === 1
      const rowBox = new BoxRenderable(this.ctx, {
        id: `${this.id}-row-${row}`,
        flexDirection: 'row',
        backgroundColor: isOddRow ? stripeBg : undefined,
      })

      for (let col = 0; col < colCount; col++) {
        const cell = this._rows[row]?.[col] ?? ''
        const cellContent = this.toStyledText(cell)

        rowBox.add(
          new TextRenderable(this.ctx, {
            id: `${this.id}-row-${row}-col-${col}`,
            content: cellContent,
            flexGrow: 1,
            flexBasis: 0,
            paddingLeft: 1,
            paddingRight: 1,
          }),
        )
      }

      this.add(rowBox)
    }
  }

  private updateInPlace(): void {
    if (this._wrapText) {
      this.updateInPlaceRowBased()
    } else {
      this.updateInPlaceColumnBased()
    }
  }

  private updateInPlaceColumnBased(): void {
    const headingStyle =
      this.getStyle('markup.heading') || this.getStyle('default')
    const concealStyle = this.getStyle('conceal')
    const headerBg = headingStyle?.fg
    const headerFg = headingStyle?.bg
    const stripeBg = concealStyle?.bg

    const columns = (this as any)._childrenInLayoutOrder as Renderable[]
    const colCount = this._headers.length || this._rows[0]?.length || 0
    const hasHeaders = this._headers.length > 0

    for (let col = 0; col < colCount; col++) {
      const columnBox = columns[col]
      if (!columnBox) continue

      const columnChildren = (columnBox as any)._childrenInLayoutOrder as Renderable[]

      if (hasHeaders) {
        // Update header
        const headerBox = columnChildren[0]
        if (headerBox instanceof BoxRenderable) {
          headerBox.backgroundColor = headerBg ?? 'transparent'
          const headerChildren = (headerBox as any)._childrenInLayoutOrder as Renderable[]
          const headerText = headerChildren[0]
          if (headerText instanceof TextRenderable) {
            const headerContent = this._headers[col] ?? ''
            let headerStyledText = this.toStyledText(headerContent)
            headerStyledText = this.styledHeaderChunks(headerStyledText, headingStyle, headerFg)
            headerText.content = headerStyledText
          }
        }
      }

      // Update data rows
      const rowOffset = hasHeaders ? 1 : 0
      for (let row = 0; row < this._rows.length; row++) {
        const cellContainer = columnChildren[row + rowOffset]
        if (cellContainer instanceof BoxRenderable) {
          const isOddRow = row % 2 === 1
          cellContainer.backgroundColor = isOddRow && stripeBg ? stripeBg : 'transparent'
          const cellChildren = (cellContainer as any)._childrenInLayoutOrder as Renderable[]
          const cellText = cellChildren[0] as TextRenderable
          if (cellText) {
            const cell = this._rows[row]?.[col] ?? ''
            cellText.content = this.toStyledText(cell)
          }
        }
      }
    }
  }

  private updateInPlaceRowBased(): void {
    const headingStyle =
      this.getStyle('markup.heading') || this.getStyle('default')
    const concealStyle = this.getStyle('conceal')
    const headerBg = headingStyle?.fg
    const headerFg = headingStyle?.bg
    const stripeBg = concealStyle?.bg

    const allRows = (this as any)._childrenInLayoutOrder as Renderable[]
    const colCount = this._headers.length || this._rows[0]?.length || 0
    const hasHeaders = this._headers.length > 0

    if (hasHeaders) {
      const headerRow = allRows[0]
      if (headerRow instanceof BoxRenderable) {
        headerRow.backgroundColor = headerBg ?? 'transparent'
        const headerCells = (headerRow as any)._childrenInLayoutOrder as Renderable[]
        for (let col = 0; col < colCount; col++) {
          const headerText = headerCells[col]
          if (headerText instanceof TextRenderable) {
            const headerContent = this._headers[col] ?? ''
            let headerStyledText = this.toStyledText(headerContent)
            headerStyledText = this.styledHeaderChunks(headerStyledText, headingStyle, headerFg)
            headerText.content = headerStyledText
          }
        }
      }
    }

    const rowOffset = hasHeaders ? 1 : 0
    for (let row = 0; row < this._rows.length; row++) {
      const rowBox = allRows[row + rowOffset]
      if (!(rowBox instanceof BoxRenderable)) continue

      const isOddRow = row % 2 === 1
      rowBox.backgroundColor = isOddRow && stripeBg ? stripeBg : 'transparent'

      const rowCells = (rowBox as any)._childrenInLayoutOrder as Renderable[]
      for (let col = 0; col < colCount; col++) {
        const cellText = rowCells[col]
        if (cellText instanceof TextRenderable) {
          const cell = this._rows[row]?.[col] ?? ''
          cellText.content = this.toStyledText(cell)
        }
      }
    }
  }

  protected renderSelf(buffer: OptimizedBuffer, deltaTime: number): void {
    if (this._tableDirty) {
      this._tableDirty = false
      if (this._tableStructureDirty) {
        this._tableStructureDirty = false
        this.rebuild()
      } else {
        this.updateInPlace()
      }
    }
  }
}

// ── Register as JSX element ──────────────────────────────────────────

extend({ 'table-view': TableRenderable })

declare module '@opentui/react' {
  interface OpenTUIComponents {
    'table-view': typeof TableRenderable
  }
}

// ── React wrapper ────────────────────────────────────────────────────

// Layout props picked from RenderableOptions that don't conflict with
// the table's internal styling (header bg, stripe bg, borderless design).
type TableLayoutProps = Partial<
  Pick<
    RenderableOptions<TableRenderable>,
    | 'flexGrow'
    | 'flexShrink'
    | 'flexBasis'
    | 'alignSelf'
    | 'padding'
    | 'paddingX'
    | 'paddingY'
    | 'paddingTop'
    | 'paddingRight'
    | 'paddingBottom'
    | 'paddingLeft'
    | 'margin'
    | 'marginX'
    | 'marginY'
    | 'marginTop'
    | 'marginRight'
    | 'marginBottom'
    | 'marginLeft'
    | 'minWidth'
    | 'minHeight'
    | 'maxWidth'
    | 'maxHeight'
  >
>

export interface TableProps extends TableLayoutProps {
  /** Column header labels. When omitted, no header row is rendered — useful for
   *  key-value tables where headers like "Field"/"Value" add no information. */
  headers?: string[]
  /** Row data – each inner array is one row of cell strings */
  rows: string[][]
  /** When true, cell text wraps instead of being truncated to one line. Default false. */
  wrapText?: boolean
  /** Width (default: 100%) */
  width?: number | 'auto' | `${number}%`
  /** Height (default: auto) */
  height?: number | 'auto' | `${number}%`
}

export function Table(props: TableProps): any {
  const { headers = [], rows, wrapText, width = '100%', height, ...layoutProps } = props

  const themeName = useStore((state) => state.currentThemeName)
  const syntaxStyle = React.useMemo(() => {
    return getMarkdownSyntaxStyle()
  }, [themeName])

  // Parse inline markdown (bold, italic, code, links) in cell strings
  // into StyledText so formatting is preserved in rendered cells.
  const parsedHeaders = React.useMemo(() => {
    return headers.map((h) => {
      return parseInlineMarkdown(h)
    })
  }, [headers])

  const parsedRows = React.useMemo(() => {
    return rows.map((row) => {
      return row.map((cell) => {
        return parseInlineMarkdown(cell)
      })
    })
  }, [rows])

  return (
    <table-view
      headers={parsedHeaders}
      rows={parsedRows}
      wrapText={wrapText}
      syntaxStyle={syntaxStyle}
      width={width}
      height={height}
      {...layoutProps}
    />
  )
}
