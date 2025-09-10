# Termcast CLI Architecture Guide

This guide explains how to implement new components and extensions using the established patterns in termcast/cli.

## Using Dialogs for Overlays

### When to Use Dialogs

Use dialogs when you need:

- Action panels (Ctrl+K menus)
- Modal forms or inputs
- Confirmation prompts
- Dropdown menus
- Any temporary overlay that should appear above the main content

### How to Implement Dialogs

```tsx
import { useDialog } from '@termcast/cli/src/internal/dialog'

const dialog = useDialog()

// Push a new dialog
dialog.push(element, position) // position: 'center' | 'top-right' | 'bottom-right'

// Replace all dialogs with a new one
dialog.replace(element, position)

// Clear all dialogs
dialog.clear()

// Access current dialog stack
dialog.stack
```

### Dialog Positioning Options

- `'center'` - Modal-style centered dialog
- `'top-right'` - Dropdown from top-right corner (good for filters)
- `'bottom-right'` - Bottom-right panel (standard for action menus)

## Handling Keyboard Input with Focus

### The Focus Rule

**ALWAYS check if your component is in focus before handling keyboard events.** This prevents components underneath dialogs from responding to input.

### How to Check Focus

```tsx
import { useIsInFocus } from '@termcast/cli/src/internal/focus-context'
import { useKeyboard } from '@opentui/react'

function MyComponent() {
  const inFocus = useIsInFocus()

  useKeyboard((evt) => {
    if (!inFocus) return // Ignore input if not in focus

    // Handle keyboard events
    if (evt.name === 'return') {
      // Do something
    }
  })
}
```

## Implementing Actions (Ctrl+K Pattern)

### When to Add Actions

Add actions to components that need contextual operations:

- List items (open, copy, delete, share)
- Detail views (edit, export, navigate)
- Forms (submit, reset, cancel)
- Any component with user operations

### Step 1: Define Your Actions

```tsx
<ActionPanel>
  <Action title='Copy' onAction={() => {}} />
  <Action.CopyToClipboard content='text' />
  <Action.OpenInBrowser url='https://...' />
</ActionPanel>
```

### Step 2: Handle Ctrl+K in Your Component

For custom components that aren't List or Detail, implement the Ctrl+K handler:

```tsx
import { useDialog } from '@termcast/cli/src/internal/dialog'
import { useIsInFocus } from '@termcast/cli/src/internal/focus-context'

const dialog = useDialog()
const inFocus = useIsInFocus()

useKeyboard((evt) => {
  if (!inFocus) return

  // Show actions on Ctrl+K
  if (evt.name === 'k' && evt.ctrl && actions) {
    dialog.push(actions, 'bottom-right')
  }

  // Optional: Also show on Return key
  if (evt.name === 'return' && actions) {
    dialog.push(actions, 'bottom-right')
  }
})
```

### Step 3: Pass Actions to Components

**For List Items:**

```tsx
<List>
  <List.Item
    title='Item'
    actions={
      <ActionPanel>
        <Action title='Open' onAction={handleOpen} />
        <Action.CopyToClipboard content={itemText} />
      </ActionPanel>
    }
  />
</List>
```

**For Detail Views:**

```tsx
<Detail
  markdown='# Content'
  actions={
    <ActionPanel>
      <Action.OpenInBrowser url={url} />
      <Action.Push target={<AnotherView />} />
    </ActionPanel>
  }
/>
```

## Implementing Navigation

### When to Use Navigation

Use navigation for:

- Moving from list to detail view
- Multi-step forms or wizards
- Drill-down interfaces
- Settings → subsettings
- Any full-screen view transition

### How to Navigate Between Views

```tsx
import { useNavigation } from '@termcast/cli/src/internal/navigation'

const navigation = useNavigation()

// Push a new component
navigation.push(component, onPop) // onPop callback when popped

// Pop current component
navigation.pop()
```

### Navigation Rules

1. **Pushing clears dialogs** - When you push a new view, all dialogs are automatically closed
2. **ESC key behavior** - ESC pops navigation if stack > 1, otherwise closes dialogs
3. **Root is permanent** - The first view cannot be popped
4. **Cleanup callbacks** - Use onPop for cleanup when user goes back

### Example: List to Detail Navigation

```tsx
function ListView() {
  const navigation = useNavigation()

  const openDetail = () => {
    navigation.push(<DetailView itemId={selectedId} />, () =>
      console.log('Detail view closed'),
    )
  }
}
```

## Managing State

### When to Use Global State

**Use global state ONLY for:**

- Toast notifications that appear anywhere
- Current extension/command context
- Dev mode settings
- Cross-component communication that can't use props

**Use local state for everything else:**

- Form data
- Search text
- Selection state
- Component-specific UI state

### Global State Structure

```tsx
interface AppState {
  // UI State
  toast: ReactNode | null
  dialogStack: DialogStackItem[]
  navigationStack: NavigationStackItem[]

  // Dev Mode
  devElement: ReactNode | null
  devRebuildCount: number

  // Extension State
  extensionPath: string | null
  extensionPackageJson: RaycastPackageJson | null
  currentCommandName: string | null
}
```

### How to Use Global State

**In React Components:**

```tsx
const toast = useStore((state) => state.toast)
const dialogStack = useStore((state) => state.dialogStack)
```

**In Event Handlers/Async Functions:**

```tsx
// Get current state
const state = useStore.getState()

// Update state (merges automatically)
useStore.setState({
  toast: <Toast message='Success!' />,
  dialogStack: [],
})
```

## Available Action Types

- `Action` - Basic action with custom onAction handler
- `Action.Push` - Navigate to another view
- `Action.CopyToClipboard` - Copy text/data with toast feedback
- `Action.OpenInBrowser` - Open URLs in default browser
- `Action.Open` - Open files with system handler
- `Action.OpenWith` - Open files with specific application
- `Action.Paste` - Paste content to active application
- `Action.ShowInFinder` - Reveal file/folder in file manager
- `Action.Trash` - Move files to trash
- `Action.SubmitForm` - Submit form data (use in forms)

## Toast Notifications

### Showing User Feedback

```tsx
import { showToast, Toast } from '@termcast/cli/src/toast'

// Success
showToast({
  title: 'Success',
  message: 'File saved',
  style: Toast.Style.Success,
})

// Error
showToast({
  title: 'Error',
  message: error.message,
  style: Toast.Style.Failure,
})

// Loading
showToast({
  title: 'Loading',
  message: 'Fetching data...',
  style: Toast.Style.Animated,
})
```

## Implementation Checklist

When building a new component:

- [ ] Check `useIsInFocus()` before handling keyboard
- [ ] Add actions prop if component has operations
- [ ] Handle Ctrl+K to show actions (if custom component)
- [ ] Use Return key for primary action
- [ ] Show toasts for user feedback
- [ ] Use navigation.push() for view transitions
- [ ] Use dialog.push() for overlays
- [ ] Keep state local unless truly global
- [ ] Provide onPop cleanup if needed
- [ ] Test with ESC key behavior

## Code Examples

### Complete List with Actions

```tsx
function MyList() {
  const navigation = useNavigation()

  return (
    <List>
      {items.map((item) => (
        <List.Item
          key={item.id}
          title={item.name}
          subtitle={item.description}
          actions={
            <ActionPanel>
              <Action.Push
                title='View Details'
                target={<DetailView item={item} />}
              />
              <Action.CopyToClipboard title='Copy ID' content={item.id} />
              <Action.OpenInBrowser title='View Online' url={item.url} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  )
}
```

### Custom Component with Actions

```tsx
function CustomView({ data }) {
  const dialog = useDialog()
  const inFocus = useIsInFocus()

  const actions = (
    <ActionPanel>
      <Action title='Process' onAction={() => processData(data)} />
      <Action.CopyToClipboard content={data.text} />
    </ActionPanel>
  )

  useKeyboard((evt) => {
    if (!inFocus) return

    if (evt.name === 'k' && evt.ctrl) {
      dialog.push(actions, 'bottom-right')
    }
  })

  return <box>{/* Your component UI */}</box>
}
```

### Form with Submit Action

```tsx
function MyForm() {
  const navigation = useNavigation()
  const [name, setName] = useState('')

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            onSubmit={(values) => {
              // Process form
              showToast({
                title: 'Saved',
                style: Toast.Style.Success,
              })
              navigation.pop()
            }}
          />
          <Action title='Cancel' onAction={() => navigation.pop()} />
        </ActionPanel>
      }
    >
      <Form.TextField id='name' title='Name' value={name} onChange={setName} />
    </Form>
  )
}
```

## Important Notes

### Auto-Execute Single Actions

The ActionPanel automatically executes if there's only one action. You don't need to handle this - it's built-in.

### ESC Key Handling

Don't override ESC key behavior. The system handles it:

1. First ESC closes dialogs
2. Second ESC pops navigation (if possible)
3. Let the default handlers work

### Return vs Enter

In keyboard events, the Enter key is called `'return'`:

```tsx
if (evt.name === 'return') {
  // NOT 'enter'
  // Handle enter key
}
```
