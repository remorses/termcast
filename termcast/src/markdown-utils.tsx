// Markdown renderNode hook for terminal rendering.
// Overrides paragraph rendering to hide URLs from links,
// showing only the link title text with distinct cyan color and underline.
// Uses opentui's renderNode callback on the <markdown> element.
//
// Link text gets TextChunk.link = { url } which encodes as OSC 8 terminal
// hyperlinks when the terminal supports it. Supported terminals include:
// - Ghostty, kitty, WezTerm, Alacritty, iTerm2
// In these terminals, links are clickable natively (cmd+click or hover).
// In unsupported terminals, links still display with distinct color/underline
// but won't be clickable.

import {
  TextRenderable,
  StyledText,
  type TextChunk,
  parseColor,
  createTextAttributes,
  type Renderable,
  type RenderContext,
  type SyntaxStyle,
} from '@opentui/core'
import { getResolvedTheme } from './themes'
import { useStore } from './state'
import { TableRenderable, type TableCellContent } from 'termcast/src/components/table'

// Minimal token types from marked (dependency of opentui, not termcast directly)
interface Token {
  type: string
  text?: string
  raw?: string
  href?: string
  tokens?: Token[]
  // Table-specific fields (from marked Tokens.Table)
  header?: TableCell[]
  rows?: TableCell[][]
}

interface TableCell {
  text: string
  tokens: Token[]
}

// Matches RenderNodeContext from @opentui/core/renderables/Markdown
interface RenderNodeContext {
  syntaxStyle: SyntaxStyle
  defaultRender: () => Renderable | null
}

interface LinkInfo {
  text: string
  href: string
}

// Recursively check if a token or any of its children contain link tokens
function hasLinks(token: Token): boolean {
  if (!Array.isArray(token.tokens)) {
    return false
  }
  return token.tokens.some((t) => {
    return t.type === 'link' || hasLinks(t)
  })
}

// Recursively flatten inline tokens into chunks, stripping link URLs.
// Handles nested structures like **[link](url)** or *[link](url)*.
function flattenInlineTokens({
  tokens,
  chunks,
  links,
  primaryColor,
  linkColor,
  textColor,
  defaultAttr,
}: {
  tokens: Token[]
  chunks: TextChunk[]
  links: LinkInfo[]
  primaryColor: ReturnType<typeof parseColor>
  linkColor: ReturnType<typeof parseColor>
  textColor: ReturnType<typeof parseColor>
  defaultAttr?: number
}): void {
  for (const token of tokens) {
    if (token.type === 'link') {
      links.push({ text: token.text || '', href: token.href || '' })
      // Render link title only with distinct link color, underline, and OSC 8 terminal hyperlink
      const linkAttr = createTextAttributes({ underline: true })
      chunks.push({
        __isChunk: true,
        text: token.text || '',
        fg: linkColor,
        attributes: linkAttr,
        link: { url: token.href || '' },
      })
    } else if (token.type === 'strong') {
      const boldAttr = createTextAttributes({ bold: true })
      // Recurse into strong children to handle nested links like **[link](url)**
      flattenInlineTokens({
        tokens: token.tokens || [],
        chunks,
        links,
        primaryColor,
        linkColor,
        textColor,
        defaultAttr: boldAttr,
      })
    } else if (token.type === 'em') {
      const italicAttr = createTextAttributes({ italic: true })
      // Recurse into em children to handle nested links like *[link](url)*
      flattenInlineTokens({
        tokens: token.tokens || [],
        chunks,
        links,
        primaryColor,
        linkColor,
        textColor,
        defaultAttr: italicAttr,
      })
    } else if (token.type === 'del') {
      const strikeAttr = createTextAttributes({ strikethrough: true })
      flattenInlineTokens({
        tokens: token.tokens || [],
        chunks,
        links,
        primaryColor,
        linkColor,
        textColor,
        defaultAttr: strikeAttr,
      })
    } else if (token.type === 'codespan') {
      chunks.push({
        __isChunk: true,
        text: token.text || '',
        fg: primaryColor,
        attributes: defaultAttr,
      })
    } else if (token.type === 'br') {
      chunks.push({
        __isChunk: true,
        text: '\n',
        fg: textColor,
      })
    } else {
      // text, escape, etc.
      chunks.push({
        __isChunk: true,
        text: token.text ?? token.raw ?? '',
        fg: textColor,
        attributes: defaultAttr,
      })
    }
  }
}

// Create a renderNode function that overrides paragraph rendering
// to hide link URLs and make link text bold + bright.
// Links get OSC 8 terminal hyperlinks via TextChunk.link so terminals
// can handle click-to-open natively (cmd+click in iTerm2, kitty, Ghostty).
export function createMarkdownRenderNode(renderer: RenderContext): (token: Token, context: RenderNodeContext) => Renderable | undefined {
  let nodeCounter = 0

  return (token: Token, context: RenderNodeContext) => {
    // Override table tokens with our custom borderless TableRenderable
    // (header background + alternating row stripes instead of ASCII borders).
    // Converts inline markdown tokens (bold, italic, code, links) into
    // StyledText so formatting is preserved in table cells.
    if (token.type === 'table' && token.header && token.rows) {
      const themeName = useStore.getState().currentThemeName
      const theme = getResolvedTheme(themeName)
      const primaryColor = parseColor(theme.primary)
      const linkColor = parseColor(theme.markdownLinkText)
      const textColor = parseColor(theme.text)

      const cellToStyledText = (tokens: Token[] | undefined): TableCellContent => {
        if (!tokens || tokens.length === 0) {
          return new StyledText([{ __isChunk: true, text: ' ', fg: textColor }])
        }
        const chunks: TextChunk[] = []
        const links: LinkInfo[] = []
        flattenInlineTokens({ tokens, chunks, links, primaryColor, linkColor, textColor })
        if (chunks.length === 0) {
          return new StyledText([{ __isChunk: true, text: ' ', fg: textColor }])
        }
        return new StyledText(chunks)
      }

      const headers = token.header.map((cell) => {
        return cellToStyledText(cell.tokens)
      })
      const rows = token.rows.map((row) => {
        return row.map((cell) => {
          return cellToStyledText(cell.tokens)
        })
      })
      if (headers.length === 0 || rows.length === 0) {
        return undefined
      }
      return new TableRenderable(renderer, {
        id: `table-${nodeCounter++}`,
        headers,
        rows,
        syntaxStyle: context.syntaxStyle,
        width: '100%',
        marginBottom: 1,
      })
    }

    // Only override paragraphs that contain links (including nested)
    if (token.type !== 'paragraph' || !hasLinks(token)) {
      return undefined // use default rendering
    }

    const themeName = useStore.getState().currentThemeName
    const theme = getResolvedTheme(themeName)
    const primaryColor = parseColor(theme.primary)
    const linkColor = parseColor(theme.markdownLinkText)
    const textColor = parseColor(theme.text)

    const chunks: TextChunk[] = []
    const links: LinkInfo[] = []
    flattenInlineTokens({
      tokens: token.tokens || [],
      chunks,
      links,
      primaryColor,
      linkColor,
      textColor,
    })

    return new TextRenderable(renderer, {
      id: `para-links-${nodeCounter++}`,
      content: new StyledText(chunks),
      width: '100%',
      marginBottom: 1,
    })
  }
}
