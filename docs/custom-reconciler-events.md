# Event Handling in Custom Renderables

How actions, shortcuts, and callbacks work in the custom reconciler architecture.

## The Challenge

Raycast's API allows rich action definitions via JSX:

```tsx
<List.Item
  title="My File"
  actions={
    <ActionPanel>
      <ActionPanel.Section title="Main">
        <Action
          title="Open"
          shortcut={{ modifiers: ["cmd"], key: "o" }}
          onAction={() => openFile(file)}
        />
        <Action
          title="Copy Path"
          shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
          onAction={() => copyToClipboard(file.path)}
        />
      </ActionPanel.Section>
      <ActionPanel.Section title="Danger">
        <Action
          title="Delete"
          style={Action.Style.Destructive}
          onAction={() => deleteFile(file)}
        />
      </ActionPanel.Section>
    </ActionPanel>
  }
/>
```

We need to:
1. Store these action definitions
2. Match keyboard shortcuts
3. Trigger the correct `onAction` callback
4. Render the action panel UI when opened

## Action Renderables

### ActionRenderable

```typescript
interface ActionRenderableProps extends RenderableOptions {
  title: string
  icon?: ImageLike
  shortcut?: Shortcut
  style?: ActionStyle
  onAction: () => void | Promise<void>
}

export class ActionRenderable extends Renderable {
  props: ActionRenderableProps
  parentSection?: ActionPanelSectionRenderable
  parentPanel?: ActionPanelRenderable
  
  constructor(ctx: RenderContext, props: ActionRenderableProps) {
    super(ctx, props)
    this.props = props
  }
  
  updateProps(newProps: ActionRenderableProps) {
    this.props = newProps
    // Actions don't need to notify parent - they're not filtered
  }
  
  trigger() {
    const result = this.props.onAction()
    
    // Handle async actions
    if (result instanceof Promise) {
      result.catch(err => {
        console.error('Action failed:', err)
      })
    }
  }
  
  matchesShortcut(evt: KeyEvent): boolean {
    const shortcut = this.props.shortcut
    if (!shortcut) return false
    
    // Check key
    if (evt.key.toLowerCase() !== shortcut.key.toLowerCase()) return false
    
    // Check modifiers
    const mods = shortcut.modifiers || []
    
    if (mods.includes('cmd') || mods.includes('meta')) {
      if (!evt.meta) return false
    }
    if (mods.includes('ctrl')) {
      if (!evt.ctrl) return false
    }
    if (mods.includes('alt') || mods.includes('opt')) {
      if (!evt.alt) return false
    }
    if (mods.includes('shift')) {
      if (!evt.shift) return false
    }
    
    return true
  }
}
```

### ActionPanelSectionRenderable

```typescript
interface ActionPanelSectionProps extends RenderableOptions {
  title?: string
}

export class ActionPanelSectionRenderable extends Renderable {
  props: ActionPanelSectionProps
  actions: ActionRenderable[] = []
  parentPanel?: ActionPanelRenderable
  
  constructor(ctx: RenderContext, props: ActionPanelSectionProps) {
    super(ctx, props)
    this.props = props
  }
  
  add(child: Renderable) {
    super.add(child)
    
    if (child instanceof ActionRenderable) {
      child.parentSection = this
      child.parentPanel = this.parentPanel
      this.actions.push(child)
    }
  }
  
  remove(childId: string) {
    const index = this.actions.findIndex(a => a.id === childId)
    if (index !== -1) {
      this.actions.splice(index, 1)
    }
    super.remove(childId)
  }
}
```

### ActionPanelRenderable

```typescript
interface ActionPanelRenderableProps extends RenderableOptions {
  title?: string
}

export class ActionPanelRenderable extends Renderable {
  props: ActionPanelRenderableProps
  
  // Direct actions (not in sections)
  private directActions: ActionRenderable[] = []
  private sections: ActionPanelSectionRenderable[] = []
  
  parentItem?: ListItemRenderable
  
  constructor(ctx: RenderContext, props: ActionPanelRenderableProps) {
    super(ctx, props)
    this.props = props
  }
  
  add(child: Renderable) {
    super.add(child)
    
    if (child instanceof ActionRenderable) {
      child.parentPanel = this
      this.directActions.push(child)
    } else if (child instanceof ActionPanelSectionRenderable) {
      child.parentPanel = this
      this.sections.push(child)
    }
  }
  
  remove(childId: string) {
    const directIndex = this.directActions.findIndex(a => a.id === childId)
    if (directIndex !== -1) {
      this.directActions.splice(directIndex, 1)
      super.remove(childId)
      return
    }
    
    const sectionIndex = this.sections.findIndex(s => s.id === childId)
    if (sectionIndex !== -1) {
      this.sections.splice(sectionIndex, 1)
    }
    
    super.remove(childId)
  }
  
  getPrimaryAction(): ActionRenderable | undefined {
    // First direct action, or first action in first section
    return this.directActions[0] ?? this.sections[0]?.actions[0]
  }
  
  getAllActions(): ActionRenderable[] {
    return [
      ...this.directActions,
      ...this.sections.flatMap(s => s.actions),
    ]
  }
  
  getSectionsWithActions(): Array<{
    title?: string
    actions: ActionRenderable[]
  }> {
    const result: Array<{ title?: string; actions: ActionRenderable[] }> = []
    
    // Direct actions as unnamed section
    if (this.directActions.length > 0) {
      result.push({ title: undefined, actions: this.directActions })
    }
    
    // Named sections
    for (const section of this.sections) {
      if (section.actions.length > 0) {
        result.push({
          title: section.props.title,
          actions: section.actions,
        })
      }
    }
    
    return result
  }
  
  findActionByShortcut(evt: KeyEvent): ActionRenderable | undefined {
    for (const action of this.getAllActions()) {
      if (action.matchesShortcut(evt)) {
        return action
      }
    }
    return undefined
  }
}
```

## ListItemRenderable with Actions

```typescript
export class ListItemRenderable extends Renderable {
  props: ListItemProps
  parentList?: ListRenderable
  parentSection?: ListSectionRenderable
  
  // Action panel child
  actionPanel?: ActionPanelRenderable
  
  // Detail child
  detail?: ListItemDetailRenderable
  
  add(child: Renderable) {
    super.add(child)
    
    if (child instanceof ActionPanelRenderable) {
      child.parentItem = this
      this.actionPanel = child
    } else if (child instanceof ListItemDetailRenderable) {
      this.detail = child
    }
  }
  
  remove(childId: string) {
    if (this.actionPanel?.id === childId) {
      this.actionPanel = undefined
    }
    if (this.detail?.id === childId) {
      this.detail = undefined
    }
    super.remove(childId)
  }
  
  getPrimaryAction(): ActionRenderable | undefined {
    return this.actionPanel?.getPrimaryAction()
  }
  
  getAllActions(): ActionRenderable[] {
    return this.actionPanel?.getAllActions() ?? []
  }
  
  findActionByShortcut(evt: KeyEvent): ActionRenderable | undefined {
    return this.actionPanel?.findActionByShortcut(evt)
  }
}
```

## ListRenderable Event Handling

### Shortcut Matching

```typescript
class ListRenderable extends Renderable {
  // ... previous code ...
  
  private handleActionShortcut(evt: KeyEvent): boolean {
    const selectedItem = this.getSelectedItem()
    if (!selectedItem) return false
    
    const action = selectedItem.renderable.findActionByShortcut(evt)
    if (action) {
      action.trigger()
      return true
    }
    
    return false
  }
  
  private setupKeyboard() {
    this.onKeyboard((evt) => {
      // Action panel has its own keyboard handling
      if (this.isShowingActionPanel) {
        this.handleActionPanelKey(evt)
        return
      }
      
      // Check shortcuts FIRST (before navigation)
      if (this.handleActionShortcut(evt)) return
      
      // Then handle navigation
      switch (evt.name) {
        case 'up':
          this.moveSelection(-1)
          break
        case 'down':
          this.moveSelection(1)
          break
        case 'return':
          this.activateSelected()
          break
        case 'escape':
          // Close detail or do nothing
          break
      }
      
      // Cmd+K opens action panel
      if (evt.key === 'k' && (evt.meta || evt.ctrl)) {
        this.showActionPanel()
      }
    })
  }
}
```

### Action Panel UI

```typescript
class ListRenderable extends Renderable {
  private isShowingActionPanel = false
  private actionPanelBox?: BoxRenderable
  private actionPanelSelectedIndex = 0
  private actionPanelActions: ActionRenderable[] = []
  
  private showActionPanel() {
    const selectedItem = this.getSelectedItem()
    if (!selectedItem?.renderable.actionPanel) return
    
    this.isShowingActionPanel = true
    this.actionPanelSelectedIndex = 0
    this.actionPanelActions = selectedItem.renderable.getAllActions()
    
    // Build the UI
    this.actionPanelBox = new BoxRenderable(this.ctx, {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      maxHeight: '50%',
      backgroundColor: '#1a1a1a',
      border: true,
      borderColor: '#333333',
      flexDirection: 'column',
    })
    
    // Title bar
    const titleBar = new BoxRenderable(this.ctx, {
      paddingLeft: 2,
      paddingRight: 2,
      borderBottom: true,
      borderColor: '#333333',
    })
    titleBar.add(new TextRenderable(this.ctx, {
      content: 'Actions',
      bold: true,
    }))
    this.actionPanelBox.add(titleBar)
    
    // Actions list
    const sections = selectedItem.renderable.actionPanel!.getSectionsWithActions()
    
    let actionIndex = 0
    for (const section of sections) {
      // Section title
      if (section.title) {
        const sectionHeader = new BoxRenderable(this.ctx, {
          paddingLeft: 2,
          paddingTop: 1,
        })
        sectionHeader.add(new TextRenderable(this.ctx, {
          content: section.title,
          color: '#888888',
          bold: true,
        }))
        this.actionPanelBox.add(sectionHeader)
      }
      
      // Actions
      for (const action of section.actions) {
        const isSelected = actionIndex === this.actionPanelSelectedIndex
        const actionRow = this.createActionRow(action, isSelected)
        this.actionPanelBox.add(actionRow)
        actionIndex++
      }
    }
    
    this.container.add(this.actionPanelBox)
    this.requestRender()
  }
  
  private createActionRow(action: ActionRenderable, isSelected: boolean): BoxRenderable {
    const row = new BoxRenderable(this.ctx, {
      flexDirection: 'row',
      paddingLeft: 2,
      paddingRight: 2,
      backgroundColor: isSelected ? '#0066cc' : 'transparent',
    })
    
    // Icon
    if (action.props.icon) {
      row.add(new TextRenderable(this.ctx, {
        content: this.renderIcon(action.props.icon) + ' ',
      }))
    }
    
    // Title
    const titleColor = action.props.style === ActionStyle.Destructive
      ? '#ff6b6b'
      : isSelected ? '#ffffff' : '#cccccc'
    
    row.add(new TextRenderable(this.ctx, {
      content: action.props.title,
      color: titleColor,
    }))
    
    // Spacer
    row.add(new BoxRenderable(this.ctx, { flexGrow: 1 }))
    
    // Shortcut
    if (action.props.shortcut) {
      row.add(new TextRenderable(this.ctx, {
        content: this.formatShortcut(action.props.shortcut),
        color: '#666666',
      }))
    }
    
    return row
  }
  
  private formatShortcut(shortcut: Shortcut): string {
    const parts: string[] = []
    const mods = shortcut.modifiers || []
    
    if (mods.includes('cmd') || mods.includes('meta')) parts.push('⌘')
    if (mods.includes('ctrl')) parts.push('⌃')
    if (mods.includes('alt') || mods.includes('opt')) parts.push('⌥')
    if (mods.includes('shift')) parts.push('⇧')
    
    parts.push(shortcut.key.toUpperCase())
    
    return parts.join('')
  }
  
  private hideActionPanel() {
    if (!this.isShowingActionPanel) return
    
    this.isShowingActionPanel = false
    
    if (this.actionPanelBox) {
      this.container.remove(this.actionPanelBox.id)
      this.actionPanelBox = undefined
    }
    
    this.actionPanelActions = []
    this.requestRender()
  }
  
  private handleActionPanelKey(evt: KeyEvent) {
    switch (evt.name) {
      case 'escape':
        this.hideActionPanel()
        break
        
      case 'up':
        this.moveActionPanelSelection(-1)
        break
        
      case 'down':
        this.moveActionPanelSelection(1)
        break
        
      case 'return':
        this.triggerSelectedAction()
        break
    }
  }
  
  private moveActionPanelSelection(delta: number) {
    const newIndex = this.actionPanelSelectedIndex + delta
    if (newIndex < 0 || newIndex >= this.actionPanelActions.length) return
    
    this.actionPanelSelectedIndex = newIndex
    
    // Rebuild action panel to update selection
    // (Could optimize to just update affected rows)
    this.hideActionPanel()
    this.showActionPanel()
  }
  
  private triggerSelectedAction() {
    const action = this.actionPanelActions[this.actionPanelSelectedIndex]
    if (action) {
      this.hideActionPanel()
      action.trigger()
    }
  }
}
```

## Callback Lifecycle

### How Callbacks Stay Valid

Unlike vicinae which serializes callbacks to IDs for IPC, our callbacks remain as JavaScript functions:

```tsx
// User code
<Action
  title="Delete"
  onAction={() => {
    // This closure captures `file` from parent scope
    deleteFile(file)
  }}
/>
```

The lifecycle:

1. **createInstance**: ActionRenderable created with props including `onAction` function
2. **appendChild**: ActionRenderable added to ActionPanelRenderable
3. **Props stored**: `this.props = props` keeps reference to `onAction`
4. **Trigger**: `action.trigger()` calls `this.props.onAction()`

The closure remains valid because:
- React keeps the component mounted
- The ActionRenderable keeps a reference to props
- Props contain the original function reference

### When Props Update

```tsx
// User code with changing dependency
function MyItem({ file }) {
  return (
    <List.Item
      title={file.name}
      actions={
        <ActionPanel>
          <Action
            title="Delete"
            onAction={() => deleteFile(file)}  // New function each render!
          />
        </ActionPanel>
      }
    />
  )
}
```

When `file` changes:

1. React re-renders, creates new `onAction` function
2. Reconciler calls `prepareUpdate` → detects props changed
3. Reconciler calls `commitUpdate(action, oldProps, newProps)`
4. ActionRenderable updates: `this.props = newProps`
5. Next trigger uses new `onAction` with new `file`

```typescript
class ActionRenderable extends Renderable {
  updateProps(newProps: ActionRenderableProps) {
    // Simply replace props - new onAction function is captured
    this.props = newProps
  }
}
```

## Event Flow Diagram

```
User types ⌘+O
     │
     ▼
ListRenderable.onKeyboard(evt)
     │
     ├─ isShowingActionPanel? ──yes──▶ handleActionPanelKey()
     │                                        │
     │                                        ▼
     │                                 (handle panel nav)
     │
     ▼
handleActionShortcut(evt)
     │
     ▼
selectedItem.renderable.findActionByShortcut(evt)
     │
     ▼
actionPanel.findActionByShortcut(evt)
     │
     ├── for each action:
     │      action.matchesShortcut(evt)?
     │
     ▼
Found matching ActionRenderable
     │
     ▼
action.trigger()
     │
     ▼
this.props.onAction()
     │
     ▼
User's closure executes: deleteFile(file)
```

## Summary

Key points about event handling:

1. **Actions are renderables** that store their props including `onAction` callbacks
2. **No serialization needed** - callbacks are JavaScript functions kept in memory
3. **Shortcuts matched imperatively** - parent iterates actions, checks each shortcut
4. **Action panel is overlay** - built from action renderables when opened
5. **Props update via reconciler** - `commitUpdate` keeps callbacks fresh
6. **Closures stay valid** - React component stays mounted, references preserved
