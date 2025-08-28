## Porting @raycast/api components and hooks to @termcast/api

ALWAYS use @termcast/api to import things, instead of relative imports. This is possible thanks to exports in package.json. for example:

import {List} from '@termcast/api'

ALWAYS use .tsx extension for every new file.

NEVER use mocks in vitest tests

prefer object args instead of positional args. as a way to implement named arguments, put the typescript definition inline

## Goal

This project ports @raycast/api components and apis to use @opentui/react and other Bun APIs

We are basically implementing the package @raycast/api from scratch

This should be done one piece at a time, one hook and component at a time

## Porting a new Raycast component or feature

Here is the process to follow to implement each API:

- decide which component or hook or function we are porting
- read the .d.ts of the @raycast/api package for the component or hook
- generate a new file or decide to which file to add this new API in src folder
- start by adding a signature without any actual implementation. Only a function or class or constant without any actual implementation
- try typechecking with `pnpm tsc`. fix any errors that is not related to the missing implementation (like missing returns)
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


To render with opentui use

```ts
import { render } from '@opentui/react'
render(<App />)
```

## keeping the implementation compatible with raycast

the goal of this project is to use same props and api as @racyast/api so try to follow raycast types and behaviour exactly

to understand behaviour (not covered by .d.ts) you MUST read the racyast docs using commands like this one, that reads the List component docs:

curl -s https://developers.raycast.com/api-reference/user-interface/list.md

> Notice the ending .md to fetch markdown

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

## context-based component architecture

When implementing compound components (like List.Dropdown), use React contexts instead of traversing children:

- Create a context at the parent level (e.g., ListContext) to share state with descendants
- Create child-specific contexts (e.g., DropdownContext) for component-specific state
- Move rendering logic into child components - they register themselves via context
- This allows wrapping components in custom wrappers without breaking functionality

Example pattern:
- Parent provides context with state/methods
- Children use context to register themselves (e.g., Dropdown.Item registers its value/title)
- Parent collects registered items through context, not by traversing children
- Child components handle their own rendering based on context state

This approach is more flexible than children traversal and supports arbitrary component wrapping.

## adding new core extensions

when adding core extensions like a store extension that installs other extensions you should carefully manage @state.tsx state, setting it appropriately when navigating to another extension or command
