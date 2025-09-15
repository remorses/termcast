# Project Coding Guidelines

NOTICE: AGENTS.md is generated using AGENTS.sh and should NEVER be manually updated.


---

# termcast specific rules


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

We are basically implementing the package @raycast/api from scratch. DO NOT implement functions exported by @raycast/utils

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
- NEVER pass children to useEffect depependencies! it makes no sense!
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

---
# core guidelines

when summarizing changes at the end of the message, be super short, a few words and in bullet points, use bold text to highlight important keywords. use markdown.

please ask questions and confirm assumptions before generating complex architecture code.

NEVER run commands with & at the end to run them in the background. this is leaky and harmful! instead ask me to run commands in the background if needed.

NEVER commit yourself unless asked to do so. I will commit the code myself.

NEVER add comments unless I tell you

## files

always use kebab case for new filenames. never use uppercase letters in filenames


## see files in the repo

use `git ls-files | tree --fromfile` to see files in the repo. this command will ignore files ignored by git


---

# typescript

- ALWAYS use normal imports instead of dynamic imports, unless there is an issue with es module only packages and you are in a commonjs package (this is rare).

- use a single object argument instead of multiple positional args: use object arguments for new typescript functions if the function would accept more than one argument, so it is more readable, ({a,b,c}) instead of (a,b,c). this way you can use the object as a sort of named argument feature, where order of arguments does not matter and it's easier to discover parameters.

- always add the {} block body in arrow functions: arrow functions should never be written as `onClick={(x) => setState('')}`. NEVER. instead you should ALWAYS write `onClick={() => {setState('')}}`. this way it's easy to add new statements in the arrow function without refactoring it.

- minimize useless comments: do not add useless comments if the code is self descriptive. only add comments if requested or if this was a change that i asked for, meaning it is not obvious code and needs some inline documentation. if a comment is required because the part of the code was result of difficult back and forth with me, keep it very short.

- ALWAYS add all information encapsulated in my prompt to comments: when my prompt is super detailed and in depth, all this information should be added to comments in your code. this is because if the prompt is very detailed it must be the fruit of a lot of research. all this information would be lost if you don't put it in the code. next LLM calls would misinterpret the code and miss context.

- NEVER write comments that reference changes between previous and old code generated between iterations of our conversation. do that in prompt instead. comments should be used for information of the current code. code that is deleted does not matter.

- use early returns (and breaks in loops): do not nest code too much. follow the go best practice of if statements: avoid else, nest as little as possible, use top level ifs. minimize nesting. instead of doing `if (x) { if (b) {} }` you should do `if (x && b) {};` for example. you can always convert multiple nested ifs or elses into many linear ifs at one nesting level. use the @think tool for this if necessary.

- typecheck after updating code: after any change to typescript code ALWAYS run the `pnpm typecheck` script of that package, or if there is no typecheck script run `pnpm tsc` yourself

- do not use any: you must NEVER use any. if you find yourself using `as any` or `:any`, use the @think tool to think hard if there are types you can import instead. do even a search in the project for what the type could be. any should be used as a last resort.

- NEVER do `(x as any).field` or `'field' in x` before checking if the code compiles first without it. the code probably doesn't need any or the in check. even if it does not compile, use think tool first! before adding (x as any).something, ALWAYS read the .d.ts to understand the types

- after any change to typescript code ALWAYS run the `pnpm typecheck` script of that package, or if there is no typecheck script run `pnpm tsc` yourself

- do not declare uninitialized variables that are defined later in the flow. instead use an IIFE with returns. this way there is less state. also define the type of the variable before the iife. here is an example:

- use || over in: avoid 'x' in obj checks. prefer doing `obj?.x || ''` over doing `'x' in obj ? obj.x : ''`. only use the in operator if that field causes problems in typescript checks because typescript thinks the field is missing, as a last resort.

- when creating urls from a path and a base url, prefer using `new URL(path, baseUrl).toString()` instead of normal string interpolation. use type-safe react-router `href` or spiceflow `this.safePath` (available inside routes) if possible

- for node built-in imports, never import singular names. instead do `import fs from 'node:fs'`, same for path, os, etc.

- NEVER start the development server with pnpm dev yourself. there is no reason to do so, even with &

- When creating classes do not add setters and getters for a simple private field. instead make the field public directly so user can get it or set it himself without abstractions on top

- if you encounter typescript lint errors for an npm package, read the node_modules/package/\*.d.ts files to understand the typescript types of the package. if you cannot understand them, ask me to help you with it.

```ts
// BAD. DO NOT DO THIS
let favicon: string | undefined
if (docsConfig?.favicon) {
    if (typeof docsConfig.favicon === 'string') {
        favicon = docsConfig.favicon
    } else if (docsConfig.favicon?.light) {
        // Use light favicon as default, could be enhanced with theme detection
        favicon = docsConfig.favicon.light
    }
}
// DO THIS. use an iife. Immediately Invoked Function Expression
const favicon: string = (() => {
    if (!docsConfig?.favicon) {
        return ''
    }
    if (typeof docsConfig.favicon === 'string') {
        return docsConfig.favicon
    }
    if (docsConfig.favicon?.light) {
        // Use light favicon as default, could be enhanced with theme detection
        return docsConfig.favicon.light
    }
    return ''
})()
// if you already know the type use it:
const favicon: string = () => {
    // ...
}
```

- when a package has to import files from another packages in the workspace never add a new tsconfig path, instead add that package as a workspace dependency using `pnpm i "package@workspace:*"`

## typescript

NEVER use require. always esm imports

always try to use non-relative imports. each package has an absolute import with the package name, you can find it in the tsconfig.json paths section. for example, paths inside website can be imported from website. notice these paths also need to include the src directory.

this is preferable to other aliases like @/ because i can easily move the code from one package to another without changing the import paths. this way you can even move a file and import paths do not change much.

always specify the type when creating arrays, especially for empty arrays. if you don't, typescript will infer the type as `never[]`, which can cause type errors when adding elements later.

**Example:**

```ts
// BAD: Type will be never[]
const items = []

// GOOD: Specify the expected type
const items: string[] = []
const numbers: number[] = []
const users: User[] = []
```

remember to always add the explicit type to avoid unexpected type inference.


---

# package manager: pnpm with workspace

this project uses pnpm workspaces to manage dependencies. important scripts are in the root package.json or various packages' package.json

try to run commands inside the package folder that you are working on. for example you should never run `pnpm test` from the root

if you need to install packages always use pnpm

instead of adding packages directly in package.json use `pnpm install package` inside the right workspace folder. NEVER manually add a package by updating package.json

## updating a package

when i ask you to update a package always run `pnpm update -r packagename`. to update to latest also add --latest

Do not do `pnpm add packagename` to update a package. only to add a missing one. otherwise other packages versions will get out of sync.

## fixing duplicate pnpm dependencies

sometimes typescript will fail if there are 2 duplicate packages in the workspace node_modules. this can happen in pnpm if a package is used in 2 different places (even if inside a node_module package, transitive dependency) with a different set of versions for a peer dependency

for example if better-auth depends on zod peer dep and zod is in different versions in 2 dependency subtrees

to identify if a pnpm package is duplicated, search for the string " packagename@" inside `pnpm-lock.yaml`, notice the space in the search string. then if the result returns multiple instances with a different set of peer deps inside the round brackets, it means that this package is being duplicated. here is an example of a package getting duplicated:

```

  better-auth@1.3.6(react-dom@19.1.1(react@19.1.1))(react@19.1.1)(zod@3.25.76):
    dependencies:
      '@better-auth/utils': 0.2.6
      '@better-fetch/fetch': 1.1.18
      '@noble/ciphers': 0.6.0
      '@noble/hashes': 1.8.0
      '@simplewebauthn/browser': 13.1.2
      '@simplewebauthn/server': 13.1.2
      better-call: 1.0.13
      defu: 6.1.4
      jose: 5.10.0
      kysely: 0.28.5
      nanostores: 0.11.4
      zod: 3.25.76
    optionalDependencies:
      react: 19.1.1
      react-dom: 19.1.1(react@19.1.1)

  better-auth@1.3.6(react-dom@19.1.1(react@19.1.1))(react@19.1.1)(zod@4.0.17):
    dependencies:
      '@better-auth/utils': 0.2.6
      '@better-fetch/fetch': 1.1.18
      '@noble/ciphers': 0.6.0
      '@noble/hashes': 1.8.0
      '@simplewebauthn/browser': 13.1.2
      '@simplewebauthn/server': 13.1.2
      better-call: 1.0.13
      defu: 6.1.4
      jose: 5.10.0
      kysely: 0.28.5
      nanostores: 0.11.4
      zod: 4.0.17
    optionalDependencies:
      react: 19.1.1
      react-dom: 19.1.1(react@19.1.1)

```

as you can see, better-auth is listed twice with different sets of peer deps. in this case it's because of zod being in version 3 and 4 in two subtrees of our workspace dependencies.

as a first step, try running `pnpm dedupe better-auth` with your package name and see if there is still the problem.

below i will describe how to generally deduplicate a package. i will use zod as an example. it works with any dependency found in the previous step.

to deduplicate the package, we have to make sure we only have 1 version of zod installed in your workspace. DO NOT use overrides for this. instead, fix the problem by manually updating the dependencies that are forcing the older version of zod in the dependency tree.

to do so, we first have to run the command `pnpm -r why zod@3.25.76` to see the reason the older zod version is installed. in this case, the result is something like this:

```

website /Users/morse/Documents/GitHub/holocron/website (PRIVATE)

dependencies:
@better-auth/stripe 1.2.10
├─┬ better-auth 1.3.6
│ └── zod 3.25.76 peer
└── zod 3.25.76
db link:../db
└─┬ docs-website link:../docs-website
  ├─┬ fumadocs-docgen 2.0.1
  │ └── zod 3.25.76
  ├─┬ fumadocs-openapi link:../fumadocs/packages/openapi
  │ └─┬ @modelcontextprotocol/sdk 1.17.3
  │   ├── zod 3.25.76
  │   └─┬ zod-to-json-schema 3.24.6
  │     └── zod 3.25.76 peer
  └─┬ searchapi link:../searchapi
    └─┬ agents 0.0.109
      ├─┬ @modelcontextprotocol/sdk 1.17.3
      │ ├── zod 3.25.76
      │ └─┬ zod-to-json-schema 3.24.6
      │   └── zod 3.25.76 peer
      └─┬ ai 4.3.19
        ├─┬ @ai-sdk/provider-utils 2.2.8
        │ └── zod 3.25.76 peer
        └─┬ @ai-sdk/react 1.2.12
          ├─┬ @ai-sdk/provider-utils 2.2.8
          │ └── zod 3.25.76 peer
          └─┬ @ai-sdk/ui-utils 1.2.11
            └─┬ @ai-sdk/provider-utils 2.2.8
              └── zod 3.25.76 peer
```

here we can see zod 3 is installed because of @modelcontextprotocol/sdk, @better-auth/stripe and agents packages. to fix the problem, we can run

```
pnpm update -r --latest  @modelcontextprotocol/sdk @better-auth/stripe agents
```

this way, if these packages include the newer version of the dependency, zod will be deduplicated automatically.

in this case, we could have only updated @better-auth/stripe to fix the issue too, that's because @better-auth/stripe is the one that has better-auth as a peer dep. but finding what is the exact problematic package is difficult, so it is easier to just update all packages you notice that we depend on directly in our workspace package.json files.

if after doing this we still have duplicate packages, you will have to ask the user for help. you can try deleting the node_modules and restarting the approach, but it rarely helps.


---

# reading github repositories

you can use gitchamber.com to read repo files. run `curl https://gitchamber.com` to see how the API works. always use curl to fetch the responses of gitchamber.com

### vercel ai sdk documentation

when working with the vercel ai sdk, you can fetch the latest docs using:
https://gitchamber.com/repos/repos/vercel/ai/main/files

use gitchamber to read the .md files using curl

you can swap out the topic with text you want to search docs for. you can also limit the total results returned with the param token to limit the tokens that will be added to the context window


---

# react

- never test react code. instead put as much code as possible in react-agnostic functions or classes and test those if needed.

- hooks, all functions that start with use, MUST ALWAYS be called in the component render scope, never inside other closures in the component or event handlers. follow react rules of hooks.

- always put all hooks at the start of component functions. put hooks that are bigger and longer later if possible. all other non-hooks logic should go after hooks section, things like conditionals, expressions, etc

## react code

- `useEffect` is bad: the use of useEffect is discouraged. please do not use it unless strictly necessary. before using useEffect call the @think tool to make sure that there are no other options. usually you can colocate code that runs inside useEffect to the functions that call that useEffect dependencies setState instead

- too many `useState` calls are bad. if some piece of state is dependent on other state just compute it as an expression in render. do not add new state unless strictly necessary. before adding a new useState to a component, use @think tool to think hard if you can instead: use expression with already existing local state, use expression with some global state, use expression with loader data, use expression with some other existing variable instead. for example if you need to show a popover when there is an error you should use the error as open state for the popover instead of adding new useState hook

- `useCallback` is bad. it should be always avoided.

- NEVER pass functions to useEffect or useMemo dependencies. when you start passing functions to hook dependencies you need to add useCallback everywhere in the code, useCallback is a virus that infects the codebase and should be ALWAYS avoided.

- custom hooks are bad. NEVER add custom hooks unless asked to do so by me. instead of creating hooks create generic react-independent functions. every time you find yourself creating a custom hook call @think and think hard if you can just create a normal function instead, or just inline the expression in the component if small enough

- minimize number of props. do not use props if you can use zustand state instead. the app has global zustand state that lets you get a piece of state down from the component tree by using something like `useStore(x => x.something)` or `useLoaderData<typeof loader>()` or even useRouteLoaderData if you are deep in the react component tree

- do not consider local state truthful when interacting with server. when interacting with the server with rpc or api calls never use state from the render function as input for the api call. this state can easily become stale or not get updated in the closure context. instead prefer using zustand `useStore.getState().stateValue`. notice that useLoaderData or useParams should be fine in this case.

- when using useRef with a generic type always add undefined in the call, for example `useRef<number>(undefined)`. this is required by the react types definitions

- when using && in jsx make sure that the result type is not of type number. in that case add Boolean() wrapper. this way jsx will not show zeros when the value is falsy.

## components

- place new components in the src/components folder. shadcn components will go to the src/components/ui folder, usually they are not manually updated but added with the shadcn cli (which is preferred to be run without npx, either with pnpm or globally just shadcn)

- component filenames should follow kebab case structure

- do not create a new component file if this new code will only be used in another component file. only create a component file if the component is used by multiple components or routes. colocate related components in the same file.

- non component code should be put in the src/lib folder.

- hooks should be put in the src/hooks.tsx file. do not create a new file for each new hook. also notice that you should never create custom hooks, only do it if asked for.


---

# sentry

this project uses sentry to notify about unexpected errors.

the website folder will have a src/lib/errors.ts file with an exported function `notifyError(error: Error, contextMessage: string)`.

you should ALWAYS use notifyError in these cases:

- create a new spiceflow api app, put notifyError in the onError callback with context message including the api route path
- suppressing an error for operations that can fail. instead of doing console.error(error) you should instead call notifyError
- wrapping a promise with cloudflare `waitUntil`. add a .catch and a notifyError so errors are tracked

this function will add the error in sentry so that the developer is able to track users' errors

## errors.ts file

if a package is missing the errors.ts file, here is the template for adding one.

notice that

- dsn should be replaced by the user with the right one. ask to do so
- use the sentries npm package, this handles correctly every environment like Bun, Node, Browser, etc

```tsx
import { captureException, flush, init } from "sentries";

init({
  dsn: "https://e702f9c3dff49fd1aa16500c6056d0f7@o4509638447005696.ingest.de.sentry.io/4509638454476880",
  integrations: [],
  tracesSampleRate: 0.01,
  profilesSampleRate: 0.01,
  beforeSend(event) {
    if (process.env.NODE_ENV === "development") {
      return null;
    }
    if (process.env.BYTECODE_RUN) {
      return null;
    }
    if (event?.["name"] === "AbortError") {
      return null;
    }

    return event;
  },
});

export async function notifyError(error: any, msg?: string) {
  console.error(msg, error);
  captureException(error, { extra: { msg } });
  await flush(1000);
}

export class AppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AppError";
  }
}
```

## app error

every time you throw a user-readable error you should use AppError instead of Error

AppError messages will be forwarded to the user as is. normal Error instances instead could have their messages obfuscated


---

# testing

do not write new test files unless asked. do not write tests if there is not already a test or describe block for that function or module.

tests should validate complex and non-obvious logic. if a test looks like a placeholder, do not add it.

use vitest to run tests. tests should be run from the current package directory and not root. try using the test script instead of vitest directly. additional vitest flags can be added at the end, like --run to disable watch mode or -u to update snapshots.

to understand how the code you are writing works, you should add inline snapshots in the test files with expect().toMatchInlineSnapshot(), then run the test with `pnpm test -u --run` or `pnpm vitest -u --run` to update the snapshot in the file, then read the file again to inspect the result. if the result is not expected, update the code and repeat until the snapshot matches your expectations. never write the inline snapshots in test files yourself. just leave them empty and run `pnpm test -u --run` to update them.

> always call `pnpm vitest` or `pnpm test` with `--run` or they will hang forever waiting for changes!
> ALWAYS read back the test if you use the `-u` option to make sure the inline snapshots are as you expect.

- for very long snapshots you should use `toMatchFileSnapshot(filename)` instead of `toMatchInlineSnapshot()`. put the snapshot files in a snapshots/ directory and use the appropriate extension for the file based on the content

never test client react components. only server code that runs on the server.

most tests should be simple calls to functions with some expect calls, no mocks. test files should be called the same as the file where the tested function is being exported from.

NEVER use mocks. the database does not need to be mocked, just use it. simply do not test functions that mutate the database if not asked.

tests should strive to be as simple as possible. the best test is a simple `.toMatchInlineSnapshot()` call. these can be easily evaluated by reading the test file after the run passing the -u option. you can clearly see from the inline snapshot if the function behaves as expected or not.

try to use only describe and test in your tests. do not use beforeAll, before, etc if not strictly required.

NEVER write tests for react components or react hooks. NEVER write tests for react components. you will be fired if you do.

sometimes tests work directly on database data, using prisma. to run these tests you have to use the package.json script, which will call `doppler run -- vitest` or similar. never run doppler cli yourself as you could delete or update production data. tests generally use a staging database instead.

never write tests yourself that call prisma or interact with database or emails. for these, ask the user to write them for you.

---

# changelog

after you make a change that is noteworthy, add an entry in the CHANGELOG.md file in the root of the package. there are 2 kinds of packages, public and private packages. private packages have a private: true field in package.json, public packages do not and instead have a version field in package.json. public packages are the ones that are published to npm.

to write a changelog.md file for a public package, use the following format, add a heading with the new version and a bullet list of your changes, like this:

```md
## 0.1.3

### Patch Changes

- bug fixes

## 0.1.2

### Patch Changes

- add support for githubPath
```

for private packages, which do not have versions, you must instead use the current date and time, for example:

```md
# Changelog

## 2025-01-24 19:50

- Added a feature to improve user experience
- Fixed a bug that caused the app to crash on startup
```

these are just examples. be clear and concise in your changelog entries.

use present tense. be detailed but concise, omit useless verbs like "implement", "added", just put the subject there instead, so it is shorter. it's implicit we are adding features or fixes. do not use nested bullet points. always show example code snippets if applicable, and use proper markdown formatting.

```

the website package has a dependency on docs-website. instead of duplicating code that is needed both in website and docs-website keep a file in docs-website instead and import from there for the website package.

---

# writing docs

when generating a .md or .mdx file to document things, always add a frontmatter with title and description. also add a prompt field with the exact prompt used to generate the doc. use @ to reference files and urls and provide any context necessary to be able to recreate this file from scratch using a model. if you used urls also reference them. reference all files you had to read to create the doc. use yaml | syntax to add this prompt and never go over the column width of 80

---

# secrets

this project uses doppler to manage secrets, with a single project with 3 envs: dev, preview and production. dev is the env already selected and implicit in doppler calls.

in typescript never use process.env directly. instead find the closest `env.ts` file that exports an env object (this file should already exist). so the env can be used type-safely and i can clearly see which secrets are available and need to be added.

---

# cac for cli development

the cli uses cac npm package.


---

# prisma

this project uses prisma to interact with the database. if you need to add new queries always read the schema.prisma inside the db folder first so you understand the shape of the tables in the database.

never add new tables to the prisma schema, instead ask me to do so.

prisma upsert calls are preferable over updates, so that you also handle the case where the row is missing.

never make changes to schema.prisma yourself, instead propose a change with a message and ask me to do it. this file is too important to be edited by agents.

NEVER run `pnpm push` in db or commands like `pnpm prisma db push` or other prisma commands that mutate the database!

### prisma queries for relations

- NEVER add more than 1 include nesting. this is very bad for performance because prisma will have to do the query to get the relation sequentially. instead of adding a new nested `include` you should add a new prisma query and wrap them in a `Promise.all`

### prisma transactions for complex relations inserts

for very complex updates or inserts that involve more than 3 related tables, for example a Chat with ChatMessages and ChatMessagePath, you should use transaction instead of a super complex single query:

- start a transaction
- delete the parent table, the one with cascade deletes, so that the related tables are also deleted
- recreate all the tables again, reuse the old existing rows data when you don't have all the fields available
- make sure to create all the rows in the related tables. use for loops if necessary

### prisma, always make sure user has access to prisma tables

> IMPORTANT! always read the schema.prisma file before adding a new prisma query, to understand how to structure it

try to never write sql by hand, use prisma

if a query becomes too complex because fetching too deeply into related tables (more than 1 `include` nesting), use different queries instead, put them in a Promise.all

### prisma, concurrency

when doing prisma queries or other async operations try to parallelize them using Promise.all

this will speed up operations that can be done concurrently.

this is especially important in react-router loaders

### prisma security

all loaders, actions and spiceflow routes of the project should have authorization checks.

these checks should check that the current user, identified by userId, has access to the fetched and updated rows.

this simply means to always include a check in prisma queries to make sure that the user has access to the updated or queried rows, for example:

```typescript
const resource = await prisma.resource.findFirst({
    where: { resourceId, parentResource: { users: { some: { userId } } } },
})
if (!resource) {
    throw new AppError(`cannot find resource`)
}
```

### prisma transactions

NEVER use prisma interactive transactions (passing a function to `prisma.$transaction`), instead pass an array of operations. this is basically the same thing, operations are executed in order, but it has much better performance.

if you need to use complex logic to construct the array of operations, create an empty array using `const operations: Prisma.PrismaPromise<any>[]` first, then push to this array the queries you want to execute

> IMPORTANT! while constructing the operations array you should never call await in between, this would cause the prisma query to start and would make the transaction invalid.

````typescript

## errors

if you throw an error that is not unexpected you should use the `AppError` class, this way I can skip sending these errors to Sentry in the `notifyError` function

for example for cases where a resource is not found or user has no subscription.

you can even throw response errors, for example:

```typescript
if (!user.subscription) {
    throw new ResponseError(
        403,
        JSON.stringify({ message: `user has no subscription` }),
    )
}
````

---

# react router v7

the website uses react-router v7.

NEVER start the dev server yourself with `pnpm dev`, instead ask me to do so.

react-router framework is the successor of remix. it is basically the same framework and it uses loaders and actions as core features.

react-router follows all the conventions of remix but all imports must be updated to point to `react-router` instead of `@remix-run/react` or `@remix-run/node`.

## react-router navigation state

react-router has the hook `useNavigation` that exposes the navigation state. ALWAYS use this hook to track loading state for navigation

```ts
const navigation = useNavigation()

if (navigation.state === 'loading' || navigation.state === 'submitting') {
    return null
}
```

> when making changes to the website code only use the `pnpm typecheck` script to validate changes, NEVER run `pnpm build` unless asked. It is too slow.

## Creating New Routes and Handling Types

When creating a new React Router route, follow these steps:

### 1. Create the route file
Create a file in `src/routes/` using flat routes naming convention (dots for separators, $ for params, kebab-case).

### 2. Generate types
**IMPORTANT**: Types are NOT automatically generated. After creating a route, run:
```bash
pnpm exec react-router typegen
```

### 3. Import Route types
```typescript
import type { Route } from './+types/your-route-name'
```
Note: The `+types` directory doesn't physically exist - it's virtual/generated.

### 4. Verify with typecheck
```bash
pnpm typecheck  # This runs typegen first, then tsc
```

### Troubleshooting Missing Types
- Types missing? Run `pnpm exec react-router typegen`
- Import failing? Check filename matches import path exactly
- Types not updating? Run `pnpm typecheck` to regenerate
- The `+types` directory is virtual - don't look for it in the filesystem

### Best Practices
- Always run `pnpm typecheck` after creating/modifying routes
- Export `Route` type from layout routes for child routes to import
- Use `href()` for all internal paths, even in redirects

## react-router layout routes

react-router layout routes are simply routes that share a prefix with some children routes. these routes will run their loaders and components also when the children paths are fetched.

components can render children routes using the Outlet component

```tsx
export function Component() {
    return <Outlet />
}
```

the loader data from parent layouts will NOT be present in the children routes `Route.componentProps['loaderData']` type. instead you have to use the `useRouteLoaderData('/prefix-path')` instead. always add the type to these calls getting the `Route` type from the parent layout

> layout routes should ALWAYS export their own Route namespace types so that child route can use it to type `useRouteLoaderData`!

## cookies

never use react-router or remix `createCookieSessionStorage`. instead just use the npm cookie package to serialize and parse cookies. keep it simple.

if you want to store json data in cookies, remember to use encodeURIComponent to encode the data before storing it in the cookie, and decodeURIComponent to decode it when reading it back. this is because cookies can only store string values.

## website, react-routes

website routes use the flat routes filesystem routes, inside src/routes. these files encode the routing logic in the filename, using $id for params and dot . for slashes.

if 2 routes share the same prefix, then the loader of both routes is run on a request and the route with the shorter route name is called a layout. a layout can also use <Outlet /> to render the child route inside it. for example, /org/x/site will run loaders in `org.$orgid` and `org.$orgid.site`. if you want instead to create a route that is not a layout route, where the loader does not run for routes that share the prefix, append \_index to the filename, for example `org.$orgid._index` in the example before.

if you need to add new prisma queries or data fetching in loaders, put it in layouts if possible. this way the data is fetched less often. you can do this if the data does not depend on the children routes' specific parameters.

## route file exports

you can export the functions `loader` and `action` to handle loading data and submitting user data.

the default export (not always required for API routes) is the jsx component that renders the page visually.

notice that the `json` util was removed from `react-router`. instead there is a function `data` which is very similar and accepts a second argument to add headers and status like `json` does, but it supports more data types than json, like generators, async generators, dates, map, sets, etc.

## Route type safety

react-router exports a `Route` namespace with types like `Route.LoaderArgs`, `Route.ActionArgs` and `Route.ComponentProps`

these types can be used for the main route exports, they must be imported from `./+types/{route-basename}`

for example, if the current file is `src/routes/home.tsx` you can import `import { Route } from './+types/home'`.

when using loader data in components, it is preferable to use useRouteLoaderData instead of just useLoaderData, so that if the route data is not accessible an error is thrown instead of silently failing with the wrong data.

you can use the Route types even to type other components that rely on `useRouteLoaderData`. but to do this you cannot import from `+types`, only route files can do that. instead you should export the Route type from the route file and let the component file import from the route.

here is an example to get the loader data type safely from a component:

> useRouteLoaderData return type is `Route.componentProps['loaderData']`

```ts
import type { Route } from 'website/src/routes/root'

const { userId } = useRouteLoaderData(
    'root',
) as Route.componentProps['loaderData']
```

```ts
// this path should export Route first. make sure of that
import type { Route } from 'website/src/routes/org.$orgId'

const { userId } = useRouteLoaderData(
    'routes/org.$orgId',
) as Route.componentProps['loaderData']
```

you can do the same thing with action data, using `Route.componentProps['actionData']`

## links type safety

ALWAYS use the react-router href function to create links, it works as follow

```ts
import { href } from 'react-router'

const path = href('/org/:orgId', { orgId })
```

if you need to have an absolute url you can do `new URL(href('/some/path'), env.PUBLIC_URL)`

the only case where you should not use href is for urls outside of the current app or routes like `routes/$.tsx`, basically routes that match all paths.

> if you cannot use `href` simply because the route you would like to link to does not exist, you should do the following: list all the files in the src/routes folder first, to see if it already exists but not with the name you would expect. if still you can't find one, create a simple placeholder react-router route with a simple page component and a simple loader that does what you would expect. do not write too much code. you can improve on it in later messages.

## showing spinner while loader does work and then redirect

for routes that do slow operations like creating PRs and then redirect, use a loader that returns a promise. the component uses window.location.replace when the promise resolves.

> IMPORTANT: react router does not preserve errors thrown in promises returned from loaders. NEVER throw errors inside promises returned from loaders. instead, add a .catch to make sure errors are never thrown and returned as values instead. then use instanceof check in client

```tsx
export async function loader({ request, params: { id } }: Route.LoaderArgs) {
    const url = new URL(request.url)
    const data = url.searchParams.get('data')
    const promise = doSlowWork(id, data)
        .catch(error => {
            notifyError(error)
            return error
        })
    return { promise }
}

export default function Page() {
    const { promise } = useLoaderData<typeof loader>()
    const [error, setError] = useState('')

    useEffect(() => {
        promise.then(result => {
            if (result instanceof Error) {
                setError(result.message)
                return
            }
            window.location.replace(result.url)
        })
    }, [promise])

    if (error) return <p className='text-red-600'>Error: {error}</p>
    return <Loader2Icon className='h-6 w-6 animate-spin' />
}
```

## do not redirect to missing routes that do not exist

never redirect or link to a route that does not exist. instead create a simple placeholder route with a simple loader and component. then redirect there using type-safe path with `href`

if instead it's not clear where to redirect because a user resource is missing, check if an onboarding route exists for that resource or a generic onboarding route. redirect there instead

also keep in mind it's preferable to throw redirects in loaders instead of returning responses, so loader keeps type safety.

## client side navigation is preferred

always try to use react-router `useNavigate` or `Link` instead of doing window.location.href update.

so that internal navigation is done client side and is faster. notice that navigate only accepts a relative path and not a full url, so if you have a full url you should do new URL(url).pathname. only use navigate if you know the url is relative to the app.

## Link or a components are preferred over `navigate`

ALWAYS use link components instead of the navigate function if possible. for example, in a dropdown component you should wrap the dropdown item in a link instead of adding an onClick handler.

# Creating New React Router Routes and Handling Types

When creating a new React Router route, follow these steps:

## 1. Create the route file
Create a file in `src/routes/` using flat routes naming convention (dots for separators, $ for params, kebab-case).

## 2. Generate types
**IMPORTANT**: Types are NOT automatically generated. After creating a route, run:
```bash
pnpm exec react-router typegen
```

## 3. Import Route types
```typescript
import type { Route } from './+types/your-route-name'
```
Note: The `+types` directory doesn't physically exist - it's virtual/generated.

## 4. Verify with typecheck
```bash
pnpm typecheck  # This runs typegen first, then tsc
```

## Troubleshooting Missing Types
- Types missing? Run `pnpm exec react-router typegen`
- Import failing? Check filename matches import path exactly
- The `+types` directory is virtual - don't look for it in the filesystem

## Best Practices
- Always run `pnpm typecheck` after creating/modifying routes
- Export `Route` type from layout routes for child routes to import
- Use `href()` for all internal paths, even in redirects


---

# styling

- always use tailwind for styling. prefer using simple styles using flex and gap. margins should be avoided, instead use flexbox gaps, grid gaps, or separate spacing divs.

- use shadcn theme colors instead of tailwind default colors. this way there is no need to add `dark:` variants most of the time.

- `flex flex-col gap-3` is preferred over `space-y-3`. same for the x direction.

- try to keep styles as simple as possible, for breakpoints too.

- to join many classes together use the `cn('class-1', 'class-2')` utility instead of `${}` or other methods. this utility is usually used in shadcn-compatible projects and mine is exported from `website/src/lib/cn` usually. prefer doing `cn(bool && 'class')` instead of `cn(bool ? 'class' : '')`

- prefer `size-4` over `w-4 h-4`

## components

this project uses shadcn components placed in the website/src/components/ui folder. never add a new shadcn component yourself by writing code. instead use the shadcn cli installed locally.

try to reuse these available components when you can, for example for buttons, tooltips, scroll areas, etc.

---

# tailwind v4

this project uses tailwind v4. this new tailwind version does not use tailwind.config.js. instead it does all configuration in css files.

read https://tailwindcss.com/docs/upgrade-guide to understand the updates landed in tailwind v4 if you do not have tailwind v4 in your training context. ignore the parts that talk about running the upgrade cli. this project already uses tailwind v4 so no need to upgrade anything.

---

# lucide icons

use lucide-react to import icons. always add the Icon import name, for example `ImageIcon` instead of just `Image`.

---

# spiceflow

before writing or updating spiceflow related code always execute this command to get Spiceflow full documentation: `curl -s https://gitchamber.com/repos/remorses/spiceflow/main/files/README.md`

spiceflow is an API library similar to hono, it allows you to write api servers using whatwg requests and responses

use zod to create schemas and types that need to be used for tool inputs or spiceflow API routes.

## calling the server from the clientE

you can obtain a type safe client for the API using `createSpiceflowClient` from `spiceflow/client`

for simple routes that only have one interaction in the page, for example a form page, you should use react-router forms and actions to interact with the server.

but when you do interactions from a component that can be rendered from multiple routes, or simply is not implemented inside a route page, you should use spiceflow client instead.

> ALWAYS use the fetch tool to get the latest docs if you need to implement a new route in a spiceflow API app server or need to add a new rpc call with a spiceflow api client!

spiceflow has support for client-side type-safe rpc. use this client when you need to interact with the server from the client, for example for a settings save deep inside a component. here is example usage of it

> SUPER IMPORTANT! if you add a new route to a spiceflow app, use the spiceflow app state like `userId` to add authorization to the route. if there is no state then you can use functions like `getSession({request})` or similar.
> make sure the current userId has access to the fetched or updated rows. this can be done by checking that the parent row or current row has a relation with the current userId. for example `prisma.site.findFirst({where: {users: {some: {userId }}}})`

> IMPORTANT! spiceflow api client cannot be called server side to call a route! In that case instead you MUST call the server functions used in the route directly, otherwise the server would do fetch requests that would fail!

always use `const {data, error} = await apiClient...` when calling spiceflow rpc. if data is already declared, give it a different name with `const {data: data2, error} = await apiClient...`. this pattern of destructuring is preferred for all apis that return data and error object fields.

## getting spiceflow docs

spiceflow is a little-known api framework. if you add server routes to a file that includes spiceflow in the name or you are using the apiClient rpc, you always need to fetch the spiceflow docs first, using the @fetch tool on https://getspiceflow.com/

this url returns a single long documentation that covers your use case. always fetch this document so you know how to use spiceflow. spiceflow is different from hono and other api frameworks, that's why you should ALWAYS fetch the docs first before using it

## using spiceflow client in published public workspace packages

usually you can just import the App type from the server workspace to create the client with createSpiceflowClient

if you want to use the spiceflow client in a published package instead we will use the pattern of generating .d.ts and copying these in the workspace package, this way the package does not need to depend on unpublished private server package.

example:

```json
{
  "scripts": {
    "gen-client": "export DIR=../plugin-mcp/src/generated/ && cd ../website && tsc --incremental && cd ../plugin-mcp && rm -rf $DIR && mkdir -p $DIR && cp ../website/dist/src/lib/api-client.* $DIR"
  }
}
```

notice that if you add a route in the spiceflow server you will need to run `pnpm --filter website gen-client` to update the apiClient inside cli.


---

# ai sdk

i use the vercel ai sdk to interact with LLMs, also known as the npm package `ai`. never use the openai sdk or provider-specific sdks, always use the vercel ai sdk, npm package `ai`. streamText is preferred over generateText, unless the model used is very small and fast and the current code doesn't care about streaming tokens or showing a preview to the user. `streamObject` is also preferred over generateObject.

ALWAYS fetch the latest docs for the ai sdk using this url with curl:
https://gitchamber.com/repos/vercel/ai/main/files

use gitchamber to read the .md files using curl

you can swap out the topic with text you want to search docs for. you can also limit the total results returned with the param token to limit the tokens that will be added to the context window

---

# playwright

you can control the browser using the playwright mcp tools. these tools let you control the browser to get information or accomplish actions

if i ask you to test something in the browser, know that the website dev server is already running at http://localhost:7664 for website and :7777 for docs-website (but docs-website needs to use the website domain specifically, for example name-hash.localhost:7777)

---

# zod

when you need to create a complex type that comes from a prisma table, do not create a new schema that tries to recreate the prisma table structure. instead just use `z.any() as ZodType<PrismaTable>)` to get type safety but leave any in the schema. this gets most of the benefits of zod without having to define a new zod schema that can easily go out of sync.

## converting zod schema to jsonschema

you MUST use the built in zod v4 toJSONSchema and not the npm package `zod-to-json-schema` which is outdated and does not support zod v4.

```ts
import { toJSONSchema } from "zod";

const mySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(3).max(100),
  age: z.number().min(0).optional(),
});

const jsonSchema = toJSONSchema(mySchema, {
  removeAdditionalStrategy: "strict",
});
```


---

