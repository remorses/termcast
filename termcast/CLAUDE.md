## Porting @raycast/api components and hooks to @termcast/cli

ALWAYS use @termcast/cli to import things, instead of relative imports. This is possible thanks to exports in package.json. for example:

import {List} from '@termcast/cli'

ALWAYS use .tsx extension for every new file.

NEVER use mocks in vitest tests

prefer object args instead of positional args. as a way to implement named arguments, put the typescript definition inline

## Goal

This project ports @raycast/api components and apis to use @opentui/react and other Bun APIs

We are basically implementing the package @raycast/api from scratch

This should be done one piece at a time, one hook and component at a time

## opentui

opentui is the framework used to render the tui, using react.

IMPORTANT! before starting every task ALWAYS read opentui docs with `curl -s https://raw.githubusercontent.com/sst/opentui/refs/heads/main/packages/react/README.md`

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
- to render examples components use renderExample not render
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

IMPORTANT: When using the descendants pattern from src/descendants.tsx, the `map.current` from `useDescendants()` is NOT reactive and CANNOT be used during render. It can only be accessed inside:
- useEffect or useLayoutEffect to handle effects
- Event handlers (useKeyboard, onChange, etc)

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
        .filter(item => item.index !== -1)
        .sort((a, b) => a.index - b.index)
        .map(item => item.props)
    // Handle your logic with items, e.g. navigating with up/down
})
```

You CANNOT use .map.current to render items of a list for example. Instead move the rendering in the items themselves! To handle filtering render null in the item component and pass the search query via context

read file @src/examples/internal/descendants.tsx for a real usage example

## testing

bun must be used to write tests

inline snapshots with .toMatchInlineSnapshots or other snapshots are the preferred way to test things. NO MOCKS.

never update inline snapshots manually, instead always use `bun test -u` to update snapshots. No need to reset snapshots before updating them with -u

never use -- to pass flags to pnpm. just add at bottom of the command.

some tests end with .vitest.tsx. to run these you will need to use `bun test:vitest`
