<!-- This AGENTS.md file is generated. Look for an agents.md package.json script to see what files to update instead. -->

# Project Coding Guidelines

NOTICE: AGENTS.md is generated using `bun agents.md` and should NEVER be manually updated. only update PREFIX.md

ALWAYS use bun to install dependencies

---

# termcast specific rules

## Porting @raycast/api components and hooks to termcast

ALWAYS use termcast to import things, instead of relative imports. This is possible thanks to exports in package.json. for example:

import {List} from 'termcast'

ALWAYS use .tsx extension for every new file.

NEVER use mocks in vitest tests

prefer object args instead of positional args. as a way to implement named arguments, put the typescript definition inline

## see files in the repo

use `git ls-files | tree --fromfile` to see files in the repo. this command will ignore files ignored by git

## Goal

This project ports @raycast/api components and apis to use @opentui/react and other Bun APIs

We are basically implementing the package @raycast/api from scratch. DO NOT implement functions exported by @raycast/utils

This should be done one piece at a time, one hook and component at a time

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

## todos

if you cannot port a real implementation for some raycast APIs and instead simulate a "fake" response, always add `// TODO` comments so i can easily find these later and implement them

## zustand

NEVER add zustand state setter methods. instead use useStore.setState to set state.

NEVER do useStore((state) => ({something: state.currentCommandName})). it will trigger an infinite render loop. instead only return scalar values and not objects in zustand state selectors

you can use zustand state from @state.tsx also outside of React using `useStore.getState()`

NEVER do useStore((state) => ({something: state.currentCommandName})). it will trigger an infinite render loop. instead only return scalar values and not objects in zustand state selectors

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
import { useIsInFocus } from 'termcast/src/internal/focus-context'

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
import { useDescendants } from 'termcast/src/descendants'

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

## tuistory

tuistory is used for e2e tests. After any change to tuistory source files, you must rebuild it:

```bash
cd tuistory && bun run build
```

## testing

bun must be used to write tests

inline snapshots with .toMatchInlineSnapshots or other snapshots are the preferred way to test things. NO MOCKS.

never update inline snapshots manually, instead always use `bun test -u` to update snapshots. No need to reset snapshots before updating them with -u

some tests in src/examples end with .vitest.tsx. to run these you will need to use `bun e2e -u`

for example `bun e2e src/examples/form-dropdown.vitest.tsx`

these tests are for ensuring the examples work correctly

important: when esc is pressed when there is no navigation stack or toast it will exit the process of the tui. make sure to not do this in tests

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

after validating snapshots are correct, add 1-2 `expect(text).toContain('keyword')` assertions to verify key behavior. use shortest unique string, no whitespace. example:

```tsx
expect(beforeEnter).toContain('[Undo')
expect(afterEnter).toContain('Undone')
```

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
- if you run examples use a short timeout. these will hang the process but you will still be able to see the initial output in case you need that. using vitest tests is preferred because you can set cold and rows precisely and see the output after some input keys via tomatchinlinesnapshot

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


## Submodules

the folders tuistory and ghostty-opentui are submodules. they should always stay in branch main and not be detached. do not commit unless asked.

## tuistory

this is a package to test tui interfaces. 

if there are issues with ANSI sequences in the snapshots the problem is probably in the package ghostty-opentui. which is where most of terminal rendering logic is

The following folders are git submodules:

- `tuistory/` - Package for testing TUI interfaces
- `ghostty-opentui/` - Zig/Ghostty terminal emulation library

## Submodule Detached HEAD Issue

Git submodules frequently end up in a "detached HEAD" state. This happens because:

1. **Submodules track commits, not branches** - The parent repo stores a specific commit SHA, not a branch name like "main"
2. **`git submodule update` checks out commits** - Running `git submodule update` or cloning with `--recurse-submodules` checks out that specific SHA, putting you in detached HEAD
3. **No branch tracking by default** - `.gitmodules` doesn't specify a branch to follow

### Fixing detached HEAD while keeping changes

If you made commits on the detached HEAD:

```bash
cd <submodule>
git checkout main
git cherry-pick <commit-sha>...  # cherry-pick your commits onto main
```

Or if no divergence from main:

```bash
cd <submodule>
git checkout main
```

### Prevention

After any submodule update, cd into submodules and run `git checkout main` before making changes.

## Submodule Rules

- Submodules should always stay on branch `main`, never detached
- Do not commit submodule changes unless explicitly asked
- Each submodule has its own AGENTS.md with package-specific guidelines

## OAuth System

Termcast uses an OAuth proxy hosted on termcast.app to handle OAuth for Raycast extensions. This allows extensions to authenticate with providers like GitHub, Linear, Slack, etc. without needing their own OAuth apps.

### Architecture

```
Extension calls OAuthService.github()
    ↓
Opens browser: https://termcast.app/oauth/github/authorize
    ↓
termcast.app redirects to GitHub OAuth
    ↓
User authenticates on GitHub
    ↓
GitHub redirects to: https://termcast.app/oauth/github/callback
    ↓
termcast.app redirects to: http://localhost:8989/oauth/callback?code=XXX
    ↓
Termcast CLI receives code, calls: POST https://termcast.app/oauth/github/token
    ↓
termcast.app exchanges code for token (using client_secret stored server-side)
    ↓
Termcast CLI receives and stores access_token
```

### Key Files

- `website/src/routes/oauth.$provider.*.tsx` - OAuth proxy routes (generic for all providers)
- `website/src/lib/oauth-providers.ts` - Provider configuration (URLs, extra params)
- `raycast-utils/` - Forked @raycast/utils with termcast.app URLs (branch: `termcast-oauth-proxy`)
- `termcast/src/apis/oauth.tsx` - PKCEClient handles authorization code flow
- `termcast/src/preload.tsx` - Redirects @raycast/utils imports to our fork

### Adding a New OAuth Provider

1. Add provider config to `website/src/lib/oauth-providers.ts`:
```typescript
export const OAUTH_PROVIDERS = {
  // ...
  newprovider: {
    authorizeUrl: 'https://newprovider.com/oauth/authorize',
    tokenUrl: 'https://newprovider.com/oauth/token',
  },
}
```

2. Register OAuth app with the provider, set callback URL to: `https://termcast.app/oauth/newprovider/callback`

3. Set environment variables on website deployment:
```
NEWPROVIDER_OAUTH_CLIENT_ID=...
NEWPROVIDER_OAUTH_CLIENT_SECRET=...
```

4. If needed, add the provider to `raycast-utils/src/oauth/OAuthService.ts`

### Environment Variables

The website needs these env vars for each provider:
- `{PROVIDER}_OAUTH_CLIENT_ID` - OAuth app client ID
- `{PROVIDER}_OAUTH_CLIENT_SECRET` - OAuth app client secret (kept server-side)

Supported providers: github, linear, slack, asana, google, jira, zoom, notion, spotify, dropbox

## termcast forms

- tab is used to change focused input
- shift tab goes to the previous focused input 
- arrows change selected item inside the focused input. for example in a dropdown
- ctrl p will show the actions available for the form. or ctrl enter to submit it

## publish termcast

to publish termcast

- bump termcast/package.json version. never a major bump
- update termcast/CHANGELOG.md with changes that were made. see pas commits if you do not know
- commit
- create a tag with termcast@0.0.0 where 0.0.0 is new version
- push with tags (never trigger release with gh workflow run)
- release script should publish the npm version. and also the binary in gh releases. 
- see gh ci for in progress script and make sure they are successful


## navigation push() limitation: props will not sync

when rendering an element with push the props passed will not be dynamic. instead if you need the child pushed element to react on parent state changes you must  use zustand state. if this state is local you can create the zustand state inside useMemo() or `const [store] = useState(() => create<StateType>({}))` and pass it down via props.

# Extension Execution Modes

termcast supports two ways to run extensions: dev mode and compiled.

## Storage Paths

| Mode | Extension Path | SQLite Database |
|------|----------------|-----------------|
| Dev | Local folder (e.g. `~/my-extension`) | `{extensionPath}/.termcast-bundle/data.db` |
| Compiled | N/A (embedded in binary) | `~/.termcast/{extensionName}/data.db` |

For dev mode, the database path is determined by `extensionPath` in state. For compiled mode, no filesystem path exists - data is stored in user's home directory. 

## Dev Mode

Entry: `startDevMode({ extensionPath })`

1. Reads `package.json` from local `extensionPath`
2. Builds commands with esbuild (ESM format, bun target)
3. Sets state: `extensionPath`, `extensionPackageJson`
4. Shows command list, imports bundled files with cache-busting query param on each rebuild
5. Watches for changes and triggers `triggerRebuild()`

## Compiled Mode

Entry: `startCompiledExtension({ packageJson, compiledCommands })`

1. Commands are pre-compiled and passed as `Component` functions
2. `packageJson` is embedded directly into the binary at compile time (no filesystem reads)
3. Sets state: `extensionPackageJson` (no `extensionPath` needed)
4. No build step needed - components are already bundled
5. Binary is fully portable - no hardcoded paths

## Preferences

Preferences are stored in SQLite with keys:
- Extension-level: `preferences.{extensionName}`
- Command-level: `preferences.{extensionName}.{commandName}`

The `ExtensionPreferences` component loads preference definitions from `package.json` at the extension path.

## logs

logs that happen during extension execution are output in a local app.log file, in the cwd where the extension was run

## Testing extensions

See `TESTING_RAYCAST_EXTENSIONS.md` for detailed instructions on testing extensions, including how to skip tests in CI when the extension folder doesn't exist.


## opentui

opentui is the framework used to render the tui, using react.

IMPORTANT! before starting every task ALWAYS read opentui docs with `curl -s https://raw.githubusercontent.com/sst/opentui/refs/heads/main/packages/react/README.md`

do this every time you have to edit .tsx files in the project.

## React

NEVER NEVER use forwardRef. it is not needed. instead just use a ref prop like React 19 best practice

NEVER pass function or callbacks as dependencies of useEffect, this will very easily cause infinite loops if you forget to use useCallback

NEVER use useCallback other than for ref callbacks. it is useless if we never pass functions in useEffect dependencies

Try to never use useEffect if possible. usually you can move logic directly in event handlers instead

This is not a plain react project, instead it is a project using opentui renderer, which supports box, group, textarea, etc

Styles are implemented via Yoga. there is a style prop to pass an object or you can also pass styles using a prop for each style (which is preferred)

Not all CSS and react style props are implemented. Only flexbox one. 

To understand how to use these components read other files in the project. try to use the theme.tsx file for colors.

## text wrapping

text elements wrap by default. to disable this pass wrapMode="none"


## researching opentui patterns

you can read more examples of opentui react code using gitchamber by listing and reading files from the correct endpoint: https://gitchamber.com/repos/sst/opentui/main/files?glob=packages/react/examples/**

or for example to see how to use the `<code>` opentui element: https://gitchamber.com/repos/sst/opentui/main/search/<code?glob=\*\*

do something like this for every new element you want to use and not know about, for exampel `<scrollbox>`, to see examples

## keys

cdm modifier (named hyper in opentui) cannot be intercepted in opentui. because parent terminal app will not forward it. instead use alt or ctrl

enter key is named return in opentui. alt is option.

## overlapping text in boxes

if you see text elements too close to each other the issues is probably that the content does not fit in the box row so elements shrink and gaps or paddings are no longer respected. 

to fix this issue add flexShrink={0} to all elements inside the row

this common when using wrapMode none.

# core guidelines

when summarizing changes at the end of the message, be super short, a few words and in bullet points, use bold text to highlight important keywords. use markdown.

please ask questions and confirm assumptions before generating complex architecture code.

NEVER run commands with & at the end to run them in the background. this is leaky and harmful! instead ask me to run commands in the background using tmux if needed.

NEVER commit yourself unless asked to do so. I will commit the code myself.

NEVER use git to revert files to previous state if you did not create those files yourself! there can be user changes in files you touched, if you revert those changes the user will be very upset!

## files

always use kebab case for new filenames. never use uppercase letters in filenames

never write temporary files to /tmp. instead write them to a local ./tmp folder instead. make sure it is in .gitignore too

## see files in the repo

use `git ls-files | tree --fromfile` to see files in the repo. this command will ignore files ignored by git

## handling unexpected file contents after a read or write

if you find code that was not there since the last time you read the file it means the user or another agent edited the file. do not revert the changes that were added. instead keep them and integrate them with your new changes

IMPORTANT: NEVER commit your changes unless clearly and specifically asked to!

## opening me files in zed to show me a specific portion of code

you can open files when i ask me "open in zed the line where ..." using the command `zed path/to/file:line`


Use tmux to run long-lived background commands as background “tasks” like vite dev servers, commands with watch mode.  
Each task should be a tmux **session** that the agent can start, inspect, and stop via CLI.

ALWAYS give long and descriptive names for the sessions, so other agents know what they are for.

Run a background task (e.g. Vite dev server) without blocking:

```bash
tmux new-session -d -s project-name-vite-dev-port-8034 'cd /path/to/project && npm run dev --port 8034'
```

Every time you are about to start a new session, first check if there is one already.

List all background tasks (sessions):

```bash
tmux ls
```

You can assume sessions that do not have names were not started by you or agents so you can ignore them

Kill a background task:

```bash
tmux kill-session -t vite-dev
```

Never attach to a session. You are inside a non TTY terminal, meaning you instead will have to read the latest n logs instead.


Fetch the last N log lines for a task without attaching (returns immediately):

```bash
tmux capture-pane -t vite-dev:0 -S -100 -p
```

Example pattern for a coding agent:

1. Start a task:

   ```bash
   tmux new-session -d -s build 'cd /repo && npm run build'
   ```

2. Poll logs:

   ```bash
   tmux capture-pane -t build:0 -S -80 -p
   ```

3. List all running tasks:

   ```bash
   tmux ls
   ```

4. Stop a task when done:

   ```bash
   tmux kill-session -t build
   ```

# github


you can use the `gh` cli to do operations on github for the current repository. For example: open issues, open PRs, check actions status, read workflow logs, etc.

## creating issues and pull requests

when opening issues and pull requests with gh cli, never use markdown headings or sections. instead just use simple paragraphs, lists and code examples. be as short as possible while remaining clear and using good English.

example:

```bash
gh issue create --title "Fix login timeout" --body "The login form times out after 5 seconds on slow connections. This affects users on mobile networks.

Steps to reproduce:
1. Open login page on 3G connection
2. Enter credentials
3. Click submit

Expected: Login completes within 30 seconds
Actual: Request times out after 5 seconds

Error in console:
\`\`\`bash
Error: Request timeout at /api/auth/login
\`\`\`"
```

## get current github repo

`git config --get remote.origin.url`

## checking status of latest github actions workflow run

```bash
gh run list # lists latest actions runs
gh run watch <id> --exit-status # if workflow is in progress, wait for the run to complete. the actions run is finished when this command exits. Set a tiemout of at least 10 minutes when running this command
gh pr checks --watch --fail-fast # watch for current branch pr ci checks to finish
gh run view <id> --log-failed | tail -n 300 # read the logs for failed steps in the actions run
gh run view <id> --log | tail -n 300 # read all logs for a github actions run
```

## responding to PR reviews and comments (gh-pr-review extension)

```bash
# view reviews and get thread IDs
gh pr-review review view 42 -R owner/repo --unresolved

# reply to a review comment
gh pr-review comments reply 42 -R owner/repo \
  --thread-id PRRT_kwDOAAABbcdEFG12 \
  --body "Fixed in latest commit"

# resolve a thread
gh pr-review threads resolve 42 -R owner/repo --thread-id PRRT_kwDOAAABbcdEFG12
```

## listing, searching, reading github repos files with gitchamber

you MUST use gitchamber.com to read repo files. first ALWAYS run `curl https://gitchamber.com` to read detailed usage docs. always use curl to fetch the responses of gitchamber.com

for example when working with the vercel ai sdk, you can fetch the latest docs using:

https://gitchamber.com/repos/facebook/react/main/files

https://gitchamber.com/repos/remorses/fumabase/main/files?glob=**/*.ts

https://gitchamber.com/repos/facebook/react/main/files/README.md?start=10&end=50

https://gitchamber.com/repos/facebook/react/main/search/useState

gitchamber allows you to list, search and read files in a repo. you MUST use it over alternatives likes raw.github.com, because 
- it allows you to use context usage better via limit and offset pagination
- it can list files, even filtering by a specific glob (default is *.md and *.mdx)
- it can search a repo for a specific substring
- it can show the code with line numbers for each line, letting you find a specific line number

# typescript

- ALWAYS use normal imports instead of dynamic imports, unless there is an issue with es module only packages and you are in a commonjs package (this is rare).

- use a single object argument instead of multiple positional args: use object arguments for new typescript functions if the function would accept more than one argument, so it is more readable, ({a,b,c}) instead of (a,b,c). this way you can use the object as a sort of named argument feature, where order of arguments does not matter and it's easier to discover parameters.

- always add the {} block body in arrow functions: arrow functions should never be written as `onClick={(x) => setState('')}`. NEVER. instead you should ALWAYS write `onClick={() => {setState('')}}`. this way it's easy to add new statements in the arrow function without refactoring it.

- in array operations .map, .filter, .reduce and .flatMap are preferred over .forEach and for of loops. For example prefer doing `.push(...array.map(x => x.items))` over mutating array variables inside for loops. Always think of how to turn for loops into expressions using .map, .filter or .flatMap if you ever are about to write a for loop.

- if you encounter typescript errors like "undefined | T is not assignable to T" after .filter(Boolean) operations: use a guarded function instead of Boolean: `.filter(isTruthy)`. implemented as `function isTruthy<T>(value: T): value is NonNullable<T> { return Boolean(value) }`

- minimize useless comments: do not add useless comments if the code is self descriptive. only add comments if requested or if this was a change that i asked for, meaning it is not obvious code and needs some inline documentation. if a comment is required because the part of the code was result of difficult back and forth with me, keep it very short.

- ALWAYS add all information encapsulated in my prompt to comments: when my prompt is super detailed and in depth, all this information should be added to comments in your code. this is because if the prompt is very detailed it must be the fruit of a lot of research. all this information would be lost if you don't put it in the code. next LLM calls would misinterpret the code and miss context.

- NEVER write comments that reference changes between previous and old code generated between iterations of our conversation. do that in prompt instead. comments should be used for information of the current code. code that is deleted does not matter.

- use early returns (and breaks in loops): do not nest code too much. follow the go best practice of if statements: avoid else, nest as little as possible, use top level ifs. minimize nesting. instead of doing `if (x) { if (b) {} }` you should do `if (x && b) {};` for example. you can always convert multiple nested ifs or elses into many linear ifs at one nesting level. use the @think tool for this if necessary.

- typecheck after updating code: after any change to typescript code ALWAYS run the `pnpm typecheck` script of that package, or if there is no typecheck script run `pnpm tsc` yourself

- do not use any: you must NEVER use any. if you find yourself using `as any` or `:any`, use the @think tool to think hard if there are types you can import instead. do even a search in the project for what the type could be. any should be used as a last resort.

- NEVER do `(x as any).field` or `'field' in x` before checking if the code compiles first without it. the code probably doesn't need any or the in check. even if it does not compile, use think tool first! before adding (x as any).something, ALWAYS read the .d.ts to understand the types

- do not declare uninitialized variables that are defined later in the flow. instead use an IIFE with returns. this way there is less state. also define the type of the variable before the iife. here is an example:

- use || over in: avoid 'x' in obj checks. prefer doing `obj?.x || ''` over doing `'x' in obj ? obj.x : ''`. only use the in operator if that field causes problems in typescript checks because typescript thinks the field is missing, as a last resort.

- when creating urls from a path and a base url, prefer using `new URL(path, baseUrl).toString()` instead of normal string interpolation. use type-safe react-router `href` or spiceflow `this.safePath` (available inside routes) if possible

- for node built-in imports, never import singular exported names. instead do `import fs from 'node:fs'`, same for path, os, etc.

- NEVER start the development server with pnpm dev yourself. there is no reason to do so, even with &

- When creating classes do not add setters and getters for a simple private field. instead make the field public directly so user can get it or set it himself without abstractions on top

- if you encounter typescript lint errors for an npm package, read the node_modules/package/\*.d.ts files to understand the typescript types of the package. if you cannot understand them, ask me to help you with it.

- NEVER silently suppress errors in catch {} blocks if they contain more than one function call
```ts
// BAD. DO NOT DO THIS
let favicon: string | undefined;
if (docsConfig?.favicon) {
  if (typeof docsConfig.favicon === "string") {
    favicon = docsConfig.favicon;
  } else if (docsConfig.favicon?.light) {
    // Use light favicon as default, could be enhanced with theme detection
    favicon = docsConfig.favicon.light;
  }
}
// DO THIS. use an iife. Immediately Invoked Function Expression
const favicon: string = (() => {
  if (!docsConfig?.favicon) {
    return "";
  }
  if (typeof docsConfig.favicon === "string") {
    return docsConfig.favicon;
  }
  if (docsConfig.favicon?.light) {
    // Use light favicon as default, could be enhanced with theme detection
    return docsConfig.favicon.light;
  }
  return "";
})();
// if you already know the type use it:
const favicon: string = () => {
  // ...
};
```

- when a package has to import files from another packages in the workspace never add a new tsconfig path, instead add that package as a workspace dependency using `pnpm i "package@workspace:*"`

NEVER use require. always esm imports

always try to use non-relative imports. each package has an absolute import with the package name, you can find it in the tsconfig.json paths section. for example, paths inside website can be imported from website. notice these paths also need to include the src directory.

this is preferable to other aliases like @/ because i can easily move the code from one package to another without changing the import paths. this way you can even move a file and import paths do not change much.

always specify the type when creating arrays, especially for empty arrays. if you don't, typescript will infer the type as `never[]`, which can cause type errors when adding elements later.

**Example:**

```ts
// BAD: Type will be never[]
const items = [];

// GOOD: Specify the expected type
const items: string[] = [];
const numbers: number[] = [];
const users: User[] = [];
```

remember to always add the explicit type to avoid unexpected type inference.

- when using nodejs APIs like fs always import the module and not the named exports. I prefer hacing nodejs APIs accessed on the module namspace like fs, os, path, etc.

DO `import fs from 'fs'; fs.writeFileSync(...)`
DO NOT `import { writeFileSync } from 'fs';`

# github


you can use the `gh` cli to do operations on github for the current repository. For example: open issues, open PRs, check actions status, read workflow logs, etc.

## creating issues and pull requests

when opening issues and pull requests with gh cli, never use markdown headings or sections. instead just use simple paragraphs, lists and code examples. be as short as possible while remaining clear and using good English.

example:

```bash
gh issue create --title "Fix login timeout" --body "The login form times out after 5 seconds on slow connections. This affects users on mobile networks.

Steps to reproduce:
1. Open login page on 3G connection
2. Enter credentials
3. Click submit

Expected: Login completes within 30 seconds
Actual: Request times out after 5 seconds

Error in console:
\`\`\`bash
Error: Request timeout at /api/auth/login
\`\`\`"
```

## get current github repo

`git config --get remote.origin.url`

## checking status of latest github actions workflow run

```bash
gh run list # lists latest actions runs
gh run watch <id> --exit-status # if workflow is in progress, wait for the run to complete. the actions run is finished when this command exits. Set a tiemout of at least 10 minutes when running this command
gh pr checks --watch --fail-fast # watch for current branch pr ci checks to finish
gh run view <id> --log-failed | tail -n 300 # read the logs for failed steps in the actions run
gh run view <id> --log | tail -n 300 # read all logs for a github actions run
```

## responding to PR reviews and comments (gh-pr-review extension)

```bash
# view reviews and get thread IDs
gh pr-review review view 42 -R owner/repo --unresolved

# reply to a review comment
gh pr-review comments reply 42 -R owner/repo \
  --thread-id PRRT_kwDOAAABbcdEFG12 \
  --body "Fixed in latest commit"

# resolve a thread
gh pr-review threads resolve 42 -R owner/repo --thread-id PRRT_kwDOAAABbcdEFG12
```

## listing, searching, reading github repos files with gitchamber

you MUST use gitchamber.com to read repo files. first ALWAYS run `curl https://gitchamber.com` to read detailed usage docs. always use curl to fetch the responses of gitchamber.com

for example when working with the vercel ai sdk, you can fetch the latest docs using:

https://gitchamber.com/repos/facebook/react/main/files

https://gitchamber.com/repos/remorses/fumabase/main/files?glob=**/*.ts

https://gitchamber.com/repos/facebook/react/main/files/README.md?start=10&end=50

https://gitchamber.com/repos/facebook/react/main/search/useState

gitchamber allows you to list, search and read files in a repo. you MUST use it over alternatives likes raw.github.com, because 
- it allows you to use context usage better via limit and offset pagination
- it can list files, even filtering by a specific glob (default is *.md and *.mdx)
- it can search a repo for a specific substring
- it can show the code with line numbers for each line, letting you find a specific line number

# react

- never test react code. instead put as much code as possible in react-agnostic functions or classes and test those if needed.

- hooks, all functions that start with use, MUST ALWAYS be called in the component render scope, never inside other closures in the component or event handlers. follow react rules of hooks.

- always put all hooks at the start of component functions. put hooks that are bigger and longer later if possible. all other non-hooks logic should go after hooks section, things like conditionals, expressions, etc

## react code

- `useEffect` is bad: the use of useEffect is discouraged. please do not use it unless strictly necessary. before using useEffect call the @think tool to make sure that there are no other options. usually you can colocate code that runs inside useEffect to the functions that call that useEffect dependencies setState instead

- too many `useState` calls are bad. if some piece of state is dependent on other state just compute it as an expression in render. do not add new state unless strictly necessary. before adding a new useState to a component, use @think tool to think hard if you can instead: use expression with already existing local state, use expression with some global state, use expression with loader data, use expression with some other existing variable instead. for example if you need to show a popover when there is an error you should use the error as open state for the popover instead of adding new useState hook

- `useCallback` is bad. it should be always avoided unless for ref props. ref props ALWAYS need to be passed memoized functions or the component could remount on ever render!

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

## zustand

zustand is the preferred way to created global React state. put it in files like state.ts or x-state.ts where x is something that describe a portion of app state in case of multiple global states or multiple apps

- NEVER add zustand state setter methods. instead use useStore.setState to set state. For example never add a method `setVariable` in the state type. Instead call `setState` directly

- zustand already merges new partial state with the previous state. NEVER DO `useStore.setState({ ...useStore.getInitialState(), ... })` unless for resetting state

## non controlled input components

some components do not have a value prop to set the value via React state. these are called uncontrolled components. Instead they usually let you get the current input value via ref. something like ref.current.value. They usually also have an onChange prop that let you know when the value changes

these usually have a initialValue or defaultValue to programmatically set the initial value of the input

when using these components you SHOULD not track their state via React: instead you should programmatically set their value and read their value via refs in event handlers

tracking uncontrolled inputs via React state means that you will need to add useEffect to programmatically change their value when our state changes. this is an anti pattern. instead you MUST keep in mind the uncontrolled input manages its own state and we interface with it via refs and initialValue prop. 

using React state in these cases is only necessary if you have to show the input value during render. if that is not the case you can just use `inputRef.current.value` instead and set the value via `inputRef.current.value = something`

# testing

.toMatchInlineSnapshot is the preferred way to write tests. leave them empty the first time, update them with -u. check git diff for the test file every time you update them with -u

never use timeouts longer than 5 seconds for expects and other statements timeouts. increase timeouts for tests if required, up to 1 minute

do not create dumb tests that test nothing. do not write tests if there is not already a test file or describe block for that function or module.

if the inputs for the tests is an array of repetitive fields and long content, generate this input data programmatically instead of hardcoding everything. only hardcode the important parts and generate other repetitive fields in a .map or .reduce

tests should validate complex and non-obvious logic. if a test looks like a placeholder, do not add it.

use vitest or bun test to run tests. tests should be run from the current package directory and not root. try using the test script instead of vitest directly. additional vitest flags can be added at the end, like --run to disable watch mode or -u to update snapshots.

to understand how the code you are writing works, you should add inline snapshots in the test files with expect().toMatchInlineSnapshot(), then run the test with `pnpm test -u --run` or `pnpm vitest -u --run` to update the snapshot in the file, then read the file again to inspect the result. if the result is not expected, update the code and repeat until the snapshot matches your expectations. never write the inline snapshots in test files yourself. just leave them empty and run `pnpm test -u --run` to update them.

> always call `pnpm vitest` or `pnpm test` with `--run` or they will hang forever waiting for changes!
> ALWAYS read back the test if you use the `-u` option to make sure the inline snapshots are as you expect.

- NEVER write the snapshots content yourself in `toMatchInlineSnapshot`. instead leave it as is and call `pnpm test -u` to fill in snapshots content. the first time you call `toMatchInlineSnapshot()` you can leave it empty

- when updating implementation and `toMatchInlineSnapshot` should change, DO NOT remove the inline snapshots yourself, just run `pnpm test -u` instead! This will replace contents of the snapshots without wasting time doing it yourself.

- for very long snapshots you should use `toMatchFileSnapshot(filename)` instead of `toMatchInlineSnapshot()`. put the snapshot files in a snapshots/ directory and use the appropriate extension for the file based on the content

never test client react components. only React and browser independent code. 

most tests should be simple calls to functions with some expect calls, no mocks. test files should be called the same as the file where the tested function is being exported from.

NEVER use mocks. the database does not need to be mocked, just use it. simply do not test functions that mutate the database if not asked.

tests should strive to be as simple as possible. the best test is a simple `.toMatchInlineSnapshot()` call. these can be easily evaluated by reading the test file after the run passing the -u option. you can clearly see from the inline snapshot if the function behaves as expected or not.

try to use only describe and test in your tests. do not use beforeAll, before, etc if not strictly required.

NEVER write tests for react components or react hooks. NEVER write tests for react components. you will be fired if you do.

sometimes tests work directly on database data, using prisma. to run these tests you have to use the package.json script, which will call `doppler run -- vitest` or similar. never run doppler cli yourself as you could delete or update production data. tests generally use a staging database instead.

never write tests yourself that call prisma or interact with database or emails. for these, ask the user to write them for you.

changelogs.md
# writing docs

when generating a .md or .mdx file to document things, always add a frontmatter with title and description. also add a prompt field with the exact prompt used to generate the doc. use @ to reference files and urls and provide any context necessary to be able to recreate this file from scratch using a model. if you used urls also reference them. reference all files you had to read to create the doc. use yaml | syntax to add this prompt and never go over the column width of 80
# cac for cli development

the cli uses cac npm package.

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

# Scrollbox with Descendants Pattern

How to add scrollbox support to opentui components using the descendants pattern.

## Overview

1. Store element refs in descendant props
2. Track selected index in parent
3. On selection change, scroll so the top of the item is centered in the viewport

## Implementation

### 1. Add `elementRef` to descendant type

```tsx
interface ItemDescendant {
  title: string
  elementRef?: BoxRenderable | null
}

const { DescendantsProvider, useDescendants, useDescendant } =
  createDescendants<ItemDescendant>()
```

### 2. Parent: scrollToItem function

```tsx
const scrollBoxRef = React.useRef<any>(null)

const scrollToItem = (item: { props?: ItemDescendant }) => {
  const scrollBox = scrollBoxRef.current
  const elementRef = item.props?.elementRef
  if (!scrollBox || !elementRef) return

  const contentY = scrollBox.content?.y || 0
  const viewportHeight = scrollBox.viewport?.height || 10

  // Calculate item position relative to content
  const itemTop = elementRef.y - contentY

  // Scroll so the top of the item is centered in the viewport
  const targetScrollTop = itemTop - viewportHeight / 2
  scrollBox.scrollTo(Math.max(0, targetScrollTop))
}
```

### 3. Parent: call scrollToItem on move

```tsx
const move = (direction: -1 | 1) => {
  const items = Object.values(context.map.current)
    .filter((item) => item.index !== -1)
    .sort((a, b) => a.index - b.index)

  let nextIndex = selectedIndex + direction
  // wrap around
  if (nextIndex < 0) nextIndex = items.length - 1
  if (nextIndex >= items.length) nextIndex = 0

  const nextItem = items[nextIndex]
  if (nextItem) {
    setSelectedIndex(nextIndex)
    scrollToItem(nextItem)
  }
}
```

### 4. Item: capture ref and pass to descendant

```tsx
function Item(props: { title: string; isSelected: boolean }) {
  const elementRef = React.useRef<BoxRenderable>(null)
  
  useDescendant({
    title: props.title,
    elementRef: elementRef.current,
  })

  return (
    <box ref={elementRef}>
      <text>{props.isSelected ? '›' : ' '}{props.title}</text>
    </box>
  )
}
```

## Full Example

See `src/examples/internal/scrollbox-with-descendants.tsx`

