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

export type TableCellContent = string | StyledText

export interface TableRenderableOptions extends RenderableOptions<TableRenderable> {
  headers?: TableCellContent[]
  rows?: TableCellContent[][]
  syntaxStyle?: SyntaxStyle
}

export class TableRenderable extends Renderable {
  private _headers: TableCellContent[] = []
  private _rows: TableCellContent[][] = []
  private _syntaxStyle?: SyntaxStyle
  private _tableDirty = true
  private _tableStructureDirty = true

  constructor(ctx: RenderContext, options: TableRenderableOptions) {
    super(ctx, {
      ...options,
      flexDirection: 'row',
    })

    this._headers = options.headers ?? []
    this._rows = options.rows ?? []
    this._syntaxStyle = options.syntaxStyle

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
    const structureChanged = value.length !== this._rows.length
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

  private rebuild(): void {
    // Remove all existing children (copy array since remove mutates it)
    const children = [...(this as any)._childrenInLayoutOrder] as Renderable[]
    for (const child of children) {
      this.remove(child.id)
    }

    const colCount = this._headers.length
    if (colCount === 0 || this._rows.length === 0) return

    const headingStyle =
      this.getStyle('markup.heading') || this.getStyle('default')
    const concealStyle = this.getStyle('conceal')
    const headerBg = headingStyle?.fg
    const headerFg = headingStyle?.bg
    const stripeBg = concealStyle?.bg

    for (let col = 0; col < colCount; col++) {
      const columnBox = new BoxRenderable(this.ctx, {
        id: `${this.id}-col-${col}`,
        flexDirection: 'column',
      })

      const headerContent = this._headers[col] ?? ''
      let headerStyledText = this.toStyledText(headerContent)

      if (headerFg) {
        const styledChunks = headerStyledText.chunks.map((chunk) => ({
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
        headerStyledText = new StyledText(styledChunks)
      }

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

      for (let row = 0; row < this._rows.length; row++) {
        const cell = this._rows[row]?.[col] ?? ''
        const cellContent = this.toStyledText(cell)
        const isOddRow = row % 2 === 1

        const cellText = new TextRenderable(this.ctx, {
          id: `${this.id}-col-${col}-row-${row}`,
          content: cellContent,
          height: 1,
          overflow: 'hidden',
          paddingLeft: 1,
          paddingRight: 1,
        })

        const cellBox = new BoxRenderable(this.ctx, {
          id: `${this.id}-col-${col}-row-${row}-box`,
          backgroundColor: isOddRow ? stripeBg : undefined,
        })
        cellBox.add(cellText)
        columnBox.add(cellBox)
      }

      this.add(columnBox)
    }
  }

  private updateInPlace(): void {
    const headingStyle =
      this.getStyle('markup.heading') || this.getStyle('default')
    const concealStyle = this.getStyle('conceal')
    const headerBg = headingStyle?.fg
    const headerFg = headingStyle?.bg
    const stripeBg = concealStyle?.bg

    const columns = (this as any)._childrenInLayoutOrder as Renderable[]
    const colCount = this._headers.length

    for (let col = 0; col < colCount; col++) {
      const columnBox = columns[col]
      if (!columnBox) continue

      const columnChildren = (columnBox as any)
        ._childrenInLayoutOrder as Renderable[]

      // Update header
      const headerBox = columnChildren[0]
      if (headerBox instanceof BoxRenderable) {
        headerBox.backgroundColor = headerBg ?? 'transparent'
        const headerChildren = (headerBox as any)
          ._childrenInLayoutOrder as Renderable[]
        const headerText = headerChildren[0]
        if (headerText instanceof TextRenderable) {
          const headerContent = this._headers[col] ?? ''
          let headerStyledText = this.toStyledText(headerContent)
          if (headerFg) {
            const styledChunks = headerStyledText.chunks.map((chunk) => ({
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
            headerStyledText = new StyledText(styledChunks)
          }
          headerText.content = headerStyledText
        }
      }

      // Update data rows
      for (let row = 0; row < this._rows.length; row++) {
        const childIndex = row + 1
        const cellContainer = columnChildren[childIndex]
        if (cellContainer instanceof BoxRenderable) {
          const isOddRow = row % 2 === 1
          cellContainer.backgroundColor =
            isOddRow && stripeBg ? stripeBg : 'transparent'
          const cellChildren = (cellContainer as any)
            ._childrenInLayoutOrder as Renderable[]
          const cellText = cellChildren[0] as TextRenderable
          if (cellText) {
            const cell = this._rows[row]?.[col] ?? ''
            cellText.content = this.toStyledText(cell)
          }
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

export interface TableProps {
  /** Column header labels */
  headers: string[]
  /** Row data – each inner array is one row of cell strings */
  rows: string[][]
  /** Width (default: 100%) */
  width?: number | 'auto' | `${number}%`
  /** Height (default: auto) */
  height?: number | 'auto' | `${number}%`
}

export function Table(props: TableProps): any {
  const { headers, rows, width = '100%', height } = props

  const syntaxStyle = React.useMemo(() => {
    return getMarkdownSyntaxStyle()
  }, [])

  return (
    <table-view
      headers={headers}
      rows={rows}
      syntaxStyle={syntaxStyle}
      width={width}
      height={height}
    />
  )
}
