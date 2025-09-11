## Porting @raycast/api components and hooks to @termcast/cli

ALWAYS use @termcast/cli to import things, instead of relative imports. This is possible thanks to exports in package.json. for example:

import {List} from '@termcast/cli'

ALWAYS use .tsx extension for every new file.

NEVER use mocks in vitest tests

prefer object args instead of positional args. as a way to implement named arguments, put the typescript definition inline

## see files in the repo

use `git ls-files | tree --fromfile` to see files in the repo. this command will ignore files ignored by git

## Goal

This project ports @raycast/api components and apis to use @opentui/react and other Bun APIs

We are basically implementing the package @raycast/api from scratch

This should be done one piece at a time, one hook and component at a time

## opentui

opentui is the framework used to render the tui, using react.

IMPORTANT! before starting every task ALWAYS read opentui docs with `curl -s https://raw.githubusercontent.com/sst/opentui/refs/heads/main/packages/react/README.md`

ALWAYS!

## React

NEVER pass function or callbacks as dependencies of useEffect, this will very easily cause infinite loops if you forget to use useCallback

NEVER use useCallback. it is useless if we never pass functions in useEffect dependencies

Try to never use useEffect if possible. usually you can move logic directly in event handlers instead

## Porting a new Raycast component or feature

Here is the process to follow to implement each API:

- decide which component or hook or function we are porting
- read the .d.ts of the @raycast/api package for the component or hook
- generate a new file or decide to which file to add this new API in src folder
- start by adding a signature without any actual implementation. Only a function or class or constant without any actual implementation
- try typechecking with `bun run tsc`. fix any errors that is not related to the missing implementation (like missing returns)
- then think, is the signature the same as Raycast?
- start implementing the component or function, before doing this
  - decide on what @opentui/react components to use
  - do so by reading opentui .d.ts files and see available components
  - read .d.ts to understand available styling options and attributes
- typecheck
- if the added feature is a component or adds support for a new prop for a component, add an example usage component in the src/examples directory. create a descriptive name for it in the file. use simple-{component-name} for basic implementations examples
- if the implemented feature is function or other API, add an action in the file examples/miscellaneus.tsx, add a list item for the new feature, for example "show a error toast" if we are implementing toasts
- do not add an example if our feature is already covered by other example files
- DO NOT run the examples then. instead ask me to do it. do not add these as scripts in package.json
- typecheck to make sure the example is correct

## Rules

- for return type of React components just use any
- keep types as close as possible to rayacst
- DO NOT use as any. instead try to understand how to fix the types in other ways
- to implement compound components like `List.Item` first define the type of List, using a interface, then use : to implement it and add compound components later using . and omitting the props types given they are already typed by the interface, here is an example
- DO NOT use console.log. only use logger.log instead
- <input> uses onInput not onChange. it is passed a simple string value and not an event object
- to render examples components use renderWithProviders not render
- ALWAYS bind all class methods to `this` in the constructor. This ensures methods work correctly when called in any context (callbacks, event handlers, etc). Example:

  ```typescript
  constructor(options: Options) {
    // Initialize properties
    this.prop = options.prop

    // Bind all methods to this instance
    this.method1 = this.method1.bind(this)
    this.method2 = this.method2.bind(this)
    this.privateMethod = this.privateMethod.bind(this)
  }
  ```

```typescript
interface ListType {
  (props: ListProps): any
  Item: (props: ListItemProps) => any
  Section: (props: ListSectionProps) => any
}

const List: ListType = (props) => {
  // implementation
}

List.Item = (props) => {
  // implementation
}

List.Section = (props) => {
  // implementation
}
```

## keeping the implementation compatible with raycast

the goal of this project is to use same props and api as @racyast/api so try to follow raycast types and behaviour exactly

to understand behaviour (not covered by .d.ts) you MUST read the racyast docs using commands like this one, that reads the List component docs:

curl -s https://developers.raycast.com/api-reference/user-interface/list.md

> IMPORTANT! Add the ending .md to fetch markdown! Or it will return html!

You can see the full list of raycast docs pages using

curl -s https://developers.raycast.com/sitemap-pages.xml

NEVER import @raycast/api to reuse their types. we are porting that package into this repo, you cannot import it, instead implement it again

## understanding how to use opentui React elements

This is not a plain react project, instead it is a React with opentui renderer, which supports box, group, input, etc

To understand how to use these components read other files in the project. try to use the theme.tsx file for colors

## todos

if you cannot port a real implementation for some raycast APIs and instead simulate a "fake" response, always add `// TODO` comments so i can easily find these later and implement them

## zustand

NEVER add zustand state setter methods. instead use useStore.setState to set state.

you can use zustand state from @state.tsx also outside of React using `useStore.getState()`

zustand already merges new partial state with the previous state. NEVER DO `useStore.setState({ ...useStore.getInitialState(), ... })` unless for resetting state

## adding new core extensions

when adding core extensions like a store extension that installs other extensions you should carefully manage @state.tsx state, setting it appropriately when navigating to another extension or command

## strings with new lines

to create strings with new lines use the dedent package so it is more readable

## examples

NEVER run examples yourself with bun src/examples/etc

These will hang. These are made for real people

## focus

when you handle key presses with

```tsx
import { useIsInFocus } from '@termcast/cli/src/internal/focus-context'

const inFocus = useIsInFocus()
useKeyboard((evt) => {
  if (!inFocus) return
  // ...
  // notice that enter is called return in evt.name
})
```

## descendants pattern and map.current

### Why the descendants pattern is useful

The descendants pattern is essential for building compound components (like `List` with `List.Item`, `Form` with `Form.TextField`, etc.) because it solves a fundamental React challenge: **parent components need to know about and coordinate their children dynamically**.

In traditional React, parent components cannot easily:

1. Track which children are rendered and in what order
2. Implement keyboard navigation across children
3. Manage selection state across dynamic children
4. Handle filtering/searching while maintaining correct indexes

The descendants pattern solves this by:

- **Automatic indexing**: Each child component registers itself and gets a unique index automatically
- **Dynamic tracking**: Children can be added, removed, or reordered, and the parent stays in sync
- **Decoupled state management**: Parent manages navigation/selection state without tightly coupling to children
- **Composition friendly**: Works with any level of nesting and conditional rendering

This is why Raycast components like List, Form, and Grid use this pattern - it enables rich keyboard navigation and selection across dynamically rendered items without requiring explicit index props or brittle parent-child contracts.

### useDescendant return values

The `useDescendant` hook returns `{ index, descendantId }`:

- `index`: The current position of the item in the rendered list (changes when items are filtered/reordered)
- `descendantId`: A stable unique ID for the item (remains constant for the component's lifetime)

**IMPORTANT**: Always use `descendantId` (not `index`) for tracking item-specific state like:

- Selection state (which items are selected)
- Expanded/collapsed state
- Item-specific data

Using `index` for state tracking is incorrect because when items are conditionally rendered or filtered, a single index can be associated with different items at different times. The `descendantId` provides a stable identity that persists across re-renders and filtering.

Example from the descendants example:

```tsx
// CORRECT: Using descendantId for selection tracking
const isSelected = selectedIds.has(descendant.descendantId)

// WRONG: Using index for selection tracking
// const isSelected = selectedIndexes.has(descendant.index)
```

### Important implementation notes

IMPORTANT: When using the descendants pattern from src/descendants.tsx, the `map.current` from `useDescendants()` is NOT reactive and CANNOT be used during render. It can only be accessed inside:

- useEffect or useLayoutEffect to handle effects
- Event handlers (useKeyboard, onChange, etc)

.map.current CANNOT be called inside render or useMemo!

Example of WRONG usage (accessing map.current during render):

```tsx
// WRONG - this will not update when descendants change
const items = Object.values(descendantsContext.map.current)
```

Example of CORRECT usage (accessing map.current inside an event handler, such as with useKeyboard, see @src/examples/internal/descendants.tsx):

```tsx
import { useKeyboard } from '@opentui/react'
import { useDescendants } from '@termcast/cli/src/descendants'

const { map } = useDescendants()

useKeyboard((evt) => {
  // Access map.current during useEffect or event handlers, NOT during render
  const items = Object.values(map.current)
    .filter((item) => item.index !== -1)
    .sort((a, b) => a.index - b.index)
    .map((item) => item.props)
  // Handle your logic with items, e.g. navigating with up/down
})
```

You CANNOT use .map.current to render items of a list for example. Instead move the rendering in the items themselves! To handle filtering render null in the item component and pass the search query via context

read file @src/examples/internal/descendants.tsx for a real usage example with selection, navigation, pagination, submit support.

## testing

bun must be used to write tests

inline snapshots with .toMatchInlineSnapshots or other snapshots are the preferred way to test things. NO MOCKS.

never update inline snapshots manually, instead always use `bun test -u` to update snapshots. No need to reset snapshots before updating them with -u

some tests in src/examples end with .vitest.tsx. to run these you will need to use `bun e2e -u`

for example `bun e2e src/examples/form-dropdown.vitest.tsx`

these tests are for ensuring the examples work correctly

## fixing bugs in termcast

when you are trying to fix an issue identify first the issue in an existing .vitest.tsx test file. by looking if the existing snapshots already exhibit the issue. if not add a new test case for the issue.

then iterate to

- try to fix the issue by changing code in src
- run tests again
- read back the test snapshot. if not fixed repeat
- try to keep changes minimal to fix the issue

## adding a test for an example in src/examples

To see an example of a test see @src/examples/list-with-sections.vitest.tsx

you should first understand what the example file does and which key sequences should be used to test it

then create a file ending with .vitest.tsx with same basename as the example.

then add empty .toMatchInlineSnapshot() calls for every expected output

run bun tsc to make sure it typechecks. if some keys you are trying to press are missing add them in the e2e-node.tsx file as methods.

then run `bun test -u` to update the snapshots

read back the inline snapshots and make sure they are what you expect

> notice that await driver.text() already waits for the pty to render so no need to add `waitIdle` everywhere. only add one if the test seems flaky

make sure to pass an adeguate timeout in the test, passing a number as second arg of test

## npm diffs

you can see diffs for different npm packages versions using

`curl -fs https://npmdiff.dev/%40opentui%2Fcore/0.1.11/0.1.13/`

> NOTICE the need for using url encoded strings in the path!

this is helpful when an update breaks our code

## reading .d.ts for node_modules

you should read the .d.ts for the packages you want to use to discover their API. for opentui you must also read the web guide fetching the .md file.

if you are inside the termcast/termcast folder (the termcast package) you will usually find node modules in the parent folder: `../node_modules/@opentui/core`

## react code guidelines

- NEVER set state inside a setTimeout. this has no effect and just makes the code more difficult to debug or understand
- Try to use as little useEffect or useLayoutEffect as possible. instead put the code directly in the relevant event handlers
- Keep as little useState as possible. computed state should be a simple expression in render if possible

## form components styling

- NEVER make text bold on focus in components. This causes layout shifts when focusing/unfocusing fields. Always maintain consistent text weight regardless of focus state. Instead change background or color or add an unicode character before or after focused text for selection like List does.

## important reminders

- never update snapshots yourself. if you want to test something you must read the snapshots yourself after running the tests
- NEVER run examples files with commands like `bun src/examlpes/something.tsx`! This is very important. this will hang the command and give you no information and break the current claude code terminal! instead use vitest tests

## Hooks

hooks, functions starting with use, CANNOT be called inside callbacks or other functions. only in the component scope level!

this code is invalid:

```tsx
<Controller
  name={props.id}
  control={control}
  defaultValue={props.defaultValue || props.value || ''}
  render={({ field, fieldState, formState }) => {
    // Store selected title for display
    // ❌ INVALID: React hooks like useState cannot be called inside render props or callbacks
    // Instead, move hooks to the top-level of your component, not inside the render prop
    // The below is incorrect usage and will cause React errors
    const [selectedTitle, setSelectedTitle] = React.useState<string>('')
    const [dropdownItems, setDropdownItems] = React.useState<FormDropdownItemDescendant[]>([])

    // ...rest of render logic
    return (
      /* JSX goes here */
    )
  }}
/>
```

To resolve this issue you can create a different component to pass in render:

```tsx
function MyRenderComponent({ field, fieldState, formState }) {
  const [selectedTitle, setSelectedTitle] = React.useState<string>('')
  const [dropdownItems, setDropdownItems] = React.useState<FormDropdownItemDescendant[]>([])

  // ...rest of render logic
  return (
    /* JSX goes here */
  )
}

// ...

<Controller
  name={props.id}
  control={control}
  defaultValue={props.defaultValue || props.value || ''}
  render={(args) => <MyRenderComponent {...args} />}
 />
```

Or lift hooks in component scope

## NEVER use setTimeout

setTimeout must never be used to schedule React updates after some time. This strategy is stupid and never makes sense.
