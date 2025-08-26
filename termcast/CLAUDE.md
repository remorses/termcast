This project ports @raycast/api components and apis to use @opentui/react and other Bun APIs

We are basically implementing the package @raycast/api from scratch

This should be done one piece at a time, one hook and component at a time

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
- if the feature added support for a new prop, add an example usage component in the src/examples directory. create a descriptive name for it in the file. use simple-{component-name} for basic implementations examples
- do not add an example if our feature is already covered by other example files
- DO NOT run the examples then. instead ask me to do it. do not add these as scripts in package.json
- typecheck to make sure the example is correct

## rules

- for return type of React components just use any
- keep types as close as possible to rayacst
- DO NOT use as any. instead try to understand how to fix the types in other ways
- to implement compound components like `List.Item` first define the type of List, using a interface, then use : to implement it and add compound components later using . and omitting the props types given they are already typed by the interface, here is an example
- DO NOT use console.log. only use logger.log instead
- <input> uses onInput not onChange

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
