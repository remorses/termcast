/**
 * Custom Action Renderables Example
 *
 * Demonstrates using opentui renderable wrappers for actions:
 * - CustomActionRenderable: thin wrapper storing title/onAction
 * - CustomActionPanelRenderable: traverses opentui tree to find first action title
 * - Offscreen rendering to extract first action title
 * - Dialog to show actions when pressed
 */

import {
  Renderable,
  BoxRenderable,
  type RenderContext,
  type BoxOptions,
} from '@opentui/core'
import { extend, useKeyboard } from '@opentui/react'
import React, { useRef, useState } from 'react'
import { renderWithProviders } from '../../utils'
import { Theme } from 'termcast/src/theme'
import { Offscreen } from 'termcast/src/internal/offscreen'
import { CustomDropdown } from './custom-dropdown'

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Find parent of specific type by traversing up
// ─────────────────────────────────────────────────────────────────────────────

function findParent<T>(node: Renderable, type: abstract new (...args: any[]) => T): T | undefined {
  let current: Renderable | null = node.parent
  while (current) {
    if (current instanceof type) {
      return current
    }
    current = current.parent
  }
  return undefined
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Find children of specific type by traversing down
// ─────────────────────────────────────────────────────────────────────────────

function findChildren<T>(node: Renderable, type: abstract new (...args: any[]) => T): T[] {
  const results: T[] = []
  
  function traverse(current: Renderable) {
    if (current instanceof type) {
      results.push(current)
    }
    // Traverse children using getChildren()
    for (const child of current.getChildren()) {
      traverse(child as Renderable)
    }
  }
  
  // Start from node's children, not node itself
  for (const child of node.getChildren()) {
    traverse(child as Renderable)
  }
  
  return results
}

// ─────────────────────────────────────────────────────────────────────────────
// CustomActionRenderable - thin wrapper for Action
// ─────────────────────────────────────────────────────────────────────────────

interface CustomActionOptions extends BoxOptions {
  actionTitle?: string
  onAction?: () => void
}

class CustomActionRenderable extends BoxRenderable {
  public actionTitle = ''
  public onAction?: () => void

  constructor(ctx: RenderContext, options: CustomActionOptions) {
    super(ctx, options)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CustomActionSectionRenderable - thin wrapper for ActionPanel.Section
// ─────────────────────────────────────────────────────────────────────────────

interface CustomActionSectionOptions extends BoxOptions {
  sectionTitle?: string
}

class CustomActionSectionRenderable extends BoxRenderable {
  public sectionTitle?: string

  constructor(ctx: RenderContext, options: CustomActionSectionOptions) {
    super(ctx, options)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CustomActionPanelRenderable - tracks actions via tree traversal
// ─────────────────────────────────────────────────────────────────────────────

interface CustomActionPanelOptions extends BoxOptions {}

class CustomActionPanelRenderable extends BoxRenderable {
  constructor(ctx: RenderContext, options: CustomActionPanelOptions) {
    super(ctx, options)
  }

  // Get first action title by traversing children synchronously
  getFirstActionTitle(): string {
    const actions = findChildren(this, CustomActionRenderable)
    return actions[0]?.actionTitle ?? ''
  }

  // Get all actions by traversing children
  getAllActions(): CustomActionRenderable[] {
    return findChildren(this, CustomActionRenderable)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Register custom elements with opentui
// ─────────────────────────────────────────────────────────────────────────────

extend({
  'custom-action': CustomActionRenderable,
  'custom-action-section': CustomActionSectionRenderable,
  'custom-action-panel': CustomActionPanelRenderable,
})

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'custom-action': CustomActionOptions & { ref?: React.Ref<CustomActionRenderable> }
      'custom-action-section': CustomActionSectionOptions & { ref?: React.Ref<CustomActionSectionRenderable> }
      'custom-action-panel': CustomActionPanelOptions & { ref?: React.Ref<CustomActionPanelRenderable> }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// React Components
// ─────────────────────────────────────────────────────────────────────────────

interface ActionProps {
  title: string
  onAction?: () => void
}

function Action({ title, onAction }: ActionProps): any {
  return <custom-action actionTitle={title} onAction={onAction} />
}

interface ActionPanelSectionProps {
  title?: string
  children?: React.ReactNode
}

function ActionPanelSection({ title, children }: ActionPanelSectionProps): any {
  return (
    <custom-action-section sectionTitle={title}>
      {children}
    </custom-action-section>
  )
}

interface ActionPanelProps {
  children?: React.ReactNode
}

interface ActionPanelType {
  (props: ActionPanelProps): any
  Section: typeof ActionPanelSection
}

const ActionPanel: ActionPanelType = ({ children }) => {
  return <custom-action-panel>{children}</custom-action-panel>
}

ActionPanel.Section = ActionPanelSection

// ─────────────────────────────────────────────────────────────────────────────
// ActionTitleExtractor - renders offscreen, extracts title via tree traversal
// ─────────────────────────────────────────────────────────────────────────────

interface ActionTitleExtractorProps {
  actions: React.ReactNode
  onTitleExtracted: (title: string) => void
}

function ActionTitleExtractor({ actions, onTitleExtracted }: ActionTitleExtractorProps): any {
  const containerRef = useRef<BoxRenderable>(null)

  // Traverse the opentui tree to find the ActionPanel and extract first title
  React.useLayoutEffect(() => {
    if (containerRef.current) {
      // Find CustomActionPanelRenderable in subtree
      const panels = findChildren(containerRef.current, CustomActionPanelRenderable)
      if (panels.length > 0) {
        const title = panels[0].getFirstActionTitle()
        onTitleExtracted(title)
      }
    }
  })

  return (
    <box ref={containerRef} visible={false} height={0}>
      {actions}
    </box>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ActionsDropdown - shows actions using CustomDropdown
// ─────────────────────────────────────────────────────────────────────────────

interface ActionsDropdownProps {
  actions: React.ReactNode
  onClose: () => void
}

function ActionsDropdown({ actions, onClose }: ActionsDropdownProps): any {
  const panelRef = useRef<CustomActionPanelRenderable>(null)
  const [allActions, setAllActions] = useState<CustomActionRenderable[]>([])

  // After tree is built, extract actions (run once on mount)
  React.useLayoutEffect(() => {
    if (panelRef.current) {
      setAllActions(panelRef.current.getAllActions())
    }
  }, [])

  // Handle escape to close
  useKeyboard((evt) => {
    if (evt.name === 'escape') {
      onClose()
    }
  })

  return (
    <box
      flexDirection="column"
      padding={1}
      border={['top', 'bottom', 'left', 'right']}
      borderStyle="single"
      borderColor={Theme.border}
      backgroundColor={Theme.background}
    >
      <text marginBottom={1}>Actions</text>
      
      {/* Render the actions offscreen to register them in opentui tree */}
      <box visible={false} height={0}>
        <custom-action-panel ref={panelRef}>
          {actions}
        </custom-action-panel>
      </box>

      {/* Use CustomDropdown to display and navigate actions */}
      <CustomDropdown
        placeholder="Search actions..."
        onSelect={(id) => {
          const action = allActions.find((a) => a.actionTitle === id)
          if (action?.onAction) {
            action.onAction()
            onClose()
          }
        }}
      >
        {allActions.map((action) => (
          <CustomDropdown.Item
            key={action.actionTitle}
            id={action.actionTitle}
            title={action.actionTitle}
          />
        ))}
      </CustomDropdown>

      <text marginTop={1} fg={Theme.textMuted}>↑↓ navigate • ⏎ select • esc close</text>
    </box>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Example Component
// ─────────────────────────────────────────────────────────────────────────────

function Example(): any {
  const [firstActionTitle, setFirstActionTitle] = useState('')
  const [showDialog, setShowDialog] = useState(false)

  // Sample actions
  const actions = (
    <ActionPanel>
      <ActionPanel.Section title="Main">
        <Action
          title="Eat Apple"
          onAction={() => {
            console.log('Eating apple!')
          }}
        />
        <Action
          title="Cook Apple"
          onAction={() => {
            console.log('Cooking apple!')
          }}
        />
      </ActionPanel.Section>
      <ActionPanel.Section title="Other">
        <Action
          title="Throw Apple"
          onAction={() => {
            console.log('Throwing apple!')
          }}
        />
      </ActionPanel.Section>
    </ActionPanel>
  )

  useKeyboard((evt) => {
    if (showDialog) return // Let dialog handle keys

    if (evt.name === 'return') {
      setShowDialog(true)
    }
  })

  return (
    <box flexDirection="column" padding={1}>
      <text marginBottom={1}>Custom Action Renderables Example</text>
      
      <text>Press ⏎ to show actions</text>
      
      <text marginTop={1}>
        First action: {firstActionTitle || '(extracting...)'}
      </text>

      {/* Offscreen rendering to extract first action title */}
      <Offscreen>
        <ActionTitleExtractor
          actions={actions}
          onTitleExtracted={setFirstActionTitle}
        />
      </Offscreen>

      {/* Actions dropdown */}
      {showDialog && (
        <ActionsDropdown
          actions={actions}
          onClose={() => {
            setShowDialog(false)
          }}
        />
      )}
    </box>
  )
}

export { Action, ActionPanel, Example }

if (import.meta.main) {
  renderWithProviders(<Example />)
}
