// Standalone Markdown component for rendering themed markdown in terminal UI.
// Wraps opentui's <markdown> element with termcast's custom renderNode hook
// (link URL stripping, borderless tables, OSC 8 hyperlinks) and automatic
// theme-aware syntax highlighting. Accepts BoxProps so it can be composed
// with Row, Heatmap, Graph, etc.

import { useMemo } from 'react'
import { useRenderer } from '@opentui/react'
import type { BoxProps } from '@opentui/react'
import { markdownSyntaxStyle } from 'termcast/src/theme'
import { createMarkdownRenderNode } from 'termcast/src/markdown-utils'

export interface MarkdownProps extends BoxProps {
  content: string
}

function Markdown({ content, children, ...boxProps }: MarkdownProps): any {
  const renderer = useRenderer()
  const renderNode = useMemo(() => {
    return createMarkdownRenderNode(renderer)
  }, [renderer])

  return (
    <box {...boxProps}>
      <markdown content={content} syntaxStyle={markdownSyntaxStyle} conceal renderNode={renderNode} />
    </box>
  )
}

export { Markdown }
