when summarizing changes at the end of the message be super short, a few words and in bullet points, use bold text to highlight important keywords. use markdown.

Please ask questions and confirm assumptions before generating complex architecture code.

NEVER run command with & at the end to run them in the background. This is leaky and harmful! Instead ask me to run commands in the background if needed.

NEVER commit yourself unless asked to do so. I will commit the code myself.

NEVER add comments unless I tell you

# package manager: bun with workspace

This project uses bun workspaces to manage dependencies. Important scripts are in the root package.json or various packages package.json

try to run commands inside the package folder that you are working on. for example you should never run `bun test` from the root

if you need to install packages always use bun

instead of adding packages directly in package.json use `bun add package` inside the right workspace folder. NEVER manually add a package by updating package.json

# typescript

- ALWAYS use normal imports instead of dynamic imports. Unless there is an issues with es module only packages and you are in a commonjs package (this is rare).

- use a single object argument instead of multiple positional args: use object arguments for new typescript functions if the function would accept more than one argument, so it is more readable, ({a,b,c}) instead of (a,b,c), this way you can use the object as a sort of named argument feature, where order of arguments does not matter and it's easier to discover parameters.

- always add the {} block body in arrow functions: arrow functions should never be written as `onClick={(x) => setState('')}`. NEVER. Instead you should ALWAYS write `onClick={() => {setState('')}}`. This way it's easy to add new statements in the arrow function without refactoring it.

- minimize useless comments: do not add useless comments if the code is self descriptive. only add comments if requested or if this was a change that i asked for, meaning it is not obvious code and needs some inline documentation. if a comment is required because the part of the code was result of difficult back and forth with me, keep it very short.

- ALWAYS add all information encapsulated in my prompt to comments: when my prompt is super detailed and in depth all this information should be added to comments in your code. this is because if the prompt is very detailed it must be fruit of a lot of research, all this information would be lost if you don't put it in the code. next LLMs calls would misinterpret the code and miss context.

- NEVER write comments that reference changes between previous and old code generated between iterations of our conversation. do that in prompt instead. comments should be used for information of the current code. code that is deleted does not matter.

- use early returns (and breaks in loops): do not nest code too much, follow the go best practice of if statements: avoid else, nest as little as possible, use top level ifs. minimize nesting. instead of doing `if (x) { if (b) {} }` you should do `if (x && b) {};` for example. You can always convert multiple nested ifs or elses into many linear ifs at one nesting level. Use the @think tool for this if necessary.

- typecheck after updating code: after any change to typescript code ALWAYS run the `bun run typecheck` script of that package, or if there is no typecheck script run `bun run tsc` yourself

- do not use any: you must NEVER use any, if you find yourself using `as any` or `:any` use the @think tool to think hard if there are types you can import instead. do even a search in the project for what the type could be. any should be used as a last resort.

- NEVER do `(x as any).field` or `'field' in x` before checking if the code compiles first without it. the code probably doesn't need any or the in check. even if it does not compile, use think tool first! Before adding (x as any).something ALWAYS read the .d.ts to understand the types

- after any change to typescript code ALWAYS run the `bun run typecheck` script of that package, or if there is no typecheck script run `bun run tsc` yourself

- do not declare uninitialized variables that are defined later in the flow. Instead use an IIFE with returns. this way there is less state. Also define the type of the variable before the iife. Here is an example:

- use || over in: avoid 'x' in obj checks. prefer doing `obj?.x || ''` over doing `'x' in obj ? obj.x : ''`. only use the in operator if that field causes problems in typescript checks because typescript thinks the field is missing, as a last resort.

- when creating urls from a path and a base url prefer using `new URL(path, baseUrl).toString()` instead of normal string interpolation. use type safe react-router `href` or spiceflow `this.safePath` (available inside routes) if possible

- for node built ins imports never import singular names, instead do `import fs from 'node:fs'`, same for path, os, etc.

- NEVER start the development server with bun dev yourself. there is not reason to do so, even with &

- if you encounter typescript lint errors for a npm package, read the node_modules/package/\*.d.ts files to understand the typescript types of the package. If you cannot understand them, ask me to help you with it.

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

- when a package has to import files from another packages in the workspace never add a new tsconfig path, instead add that package as a workspace dependency using `bun add "package@workspace:*"`

## react

- never test react code. instead put as much code as possible in react agonistic function or classes and test those if needed.

- hooks, all functions that start with use, MUST ALWAYS be called in the component render scope, never inside other closures in the component or event handlers. Follow react rules of hooks.

- always put all hooks at the start of component functions. Put hooks that are bigger and longer later if possible. all other non hooks logic should go after hooks section, things like conditionals, expressions, etc

# testing

do not write new test files unless asked. do not write tests if there is not already a test or describe block for that function or module.

tests should validate complex and non obvious logic, if a test looks like a placeholder, do not add it.

Use vitest to run tests. Tests should be run from the current package directory and not root, try using the test script instead of vitest directly. Additional vitest flags can be added at the end, like --run to disable watch mode or -u to update snapshots.

To understand how the code you are writing works you should add inline snapshots in the test files with expect().toMatchInlineSnapshot(), then run the test with `bun test -u --run` or `bun run vitest -u --run` to update the snapshot in the file, then read the file again to inspect the result. If the result is not expected, update the code and repeat until the snapshot matches your expectations. Never write the inline snapshots in test files yourself. Just leave them empty and run `bun test -u --run` to update them.

> Always call `bun run vitest` or `bun test` with `--run` or they will hang forever waiting for changes!
> ALWAYS read back the test if you use the `-u` option, to make sure the inline snapshot are as you expect.

- for very long snapshots you should use `toMatchFileSnapshot(filename)` instead of `toMatchInlineSnapshot()`. Put the snapshots files in a snapshots/ directory and use the appropriate extension for the file based on the content

Never test client React components. Only server code that runs on the server.

Most tests should be simple calls to functions with some expect calls, no mocks. Test files should be called same as the file where the tested function is being exported from.

NEVER use mocks. the database does not need to be mocked, just use it. simply do not test functions that mutate the database if not asked.

Tests should strive to be as simple as possible, the best test is a simple `.toMatchInlineSnapshot()` call. These can be easily evaluated reading the test file after the run passing the -u option. You can clearly see from the inline snapshot if the function behaves as expected or not.

Try to use only describe and test in your tests. Do not use beforeAll, before, etc if not strictly required.

NEVER write tests for React components or React hooks. NEVER write tests for React components. You will be fired if you do.

Sometimes tests work directly on database data, using prisma. To run these tests you have to use the package.json script, which will call `doppler run -- vitest` or similar. Never run doppler cli yourself as you could delete or update production data. Tests generally use a staging database instead.

Never write tests yourself that call prisma or interact with database or emails. For these asks the user to write them for you.

# secrets

this project uses Doppler to manage secrets, with a single project with 3 envs: dev, preview and production. dev is the env already selected and implicing in doppler calls.

in typescript never use process.env directly, instead find the closes `env.ts` file that export a env object (this file should already exist). so the env can be used type safely and i can clearly see which secrets are available and need to be added.

# react router v7

the website uses react-router v7.

NEVER start the dev server yourself with `pnpm dev`, instead ask me to do so.

React-router framework is the successor of Remix, it is basically the same framework and it uses loaders and actions as core features.

react-router follows all the conventions of remix but all imports must be updated to point to `react-router` instead of `@remix-run/react` or `@remix-run/node`.

## react-router navigation state

react-router has the hook `useNavigation` that expose the navigation state, ALWAYS use this hook to track loading state for navigation

```ts
const navigation = useNavigation()

if (navigation.state === 'loading' || navigation.state === 'submitting') {
    return null
}
```

> when making changes to the website code only use the `bun run typecheck` script to validate changes, NEVER run `bun run build` unless asked. It is too slow.

## react-router layout routes

react-router layout routes are simply routes that share a prefix with some children routes. these routes will run their loaders and components also when the children paths are fetched.

components can render children routes using the Outlet component

```tsx
export function Component() {
    return <Outlet />
}
```

the loader data from parent layouts will NOT be present in the children routes `Route.componentProps['loaderData']` type. Instead you have to use the `useRouteLoaderData('/prefix-path')` instead. Always add the type to this calls getting the `Route` type from the parent layout

> layout routes should ALWAYS export their own Route namespace types so that child route can use it to type `useRouteLoaderData`!

## cookies

never use react-router or remix `createCookieSessionStorage`, instead just use the npm cookie package to serialize and parse cookies. keep it simple.

if you want to store json data in cookies remember to use encodeURIComponent to encode the data before storing it in the cookie, and decodeURIComponent to decode it when reading it back. This is because cookies can only store string values.

## website, react-routes

website routes use the flat routes filesystem routes, inside src/routes. these files encode the routing logic in the filename, using $id for params and dot . for slashes.

if 2 routes share the same prefix then the loader of both routes is run on a request and the route with the shorter routename is called a layout. a layout can also use <Outlet /> to render the child route inside it. for example /org/x/site will run loaders in `org.$orgid` and `org.$orgid.site`. if you want instead to create a route that is not a layout route, where the loader does not run for routes that share the prefix, append \_index to the filename, for example `org.$orgid._index` in the example before.

if you need to add new prisma queries or data fetching in loaders put it in layouts if possible, this way the data is fetched less often. you can do this if the data does not depend on the children routes specific parameters.

## route file exports

You can export the functions `loader` and `action` to handle loading data and submitting user data.

The default export (not always required for API routes) is the jsx component that renders the page visually.

Notice that the `json` utils was removed from `react-router`, instead there is a function `data` which is very similar and accepts a second argument to add headers and status like `json` does, but it supports more data types than json, like generators, async generators, dates, map, sets, etc.

## Route type safety

react-router exports a `Route` namespace with types like `Route.LoaderArgs`, `Route.ActionArgs` and `Route.ComponentProps`

these types can be used for the main route exports, they must be imported from `./+types/{route-basename}`

For example if the current file is `src/routes/home.tsx` you can import `import { Route } from './+types/home'`.

When using loader data in components it is preferable to use useRouteLoaderData instead of just useLoaderData, so that if the route data is not accessible a error is thrown instead of silently fail with the wrong data.

You can use the Route types even to type other components that rely on `useRouteLoaderData`. But to do this you cannot import from `+types`, only routes files can do that. Instead you should export the Route type from the route file and let the component file import from the route.

Here is an example to get the loader data type safely from a component:

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

You can do the same thing with action data, using `Route.componentProps['actionData']`

## links type safety

ALWAYS use the react-router href function to create links, it works as follow

```ts
import { href } from 'react-router'

const path = href('/org/:orgId', { orgId })
```

If you need to have an absolute url you can do `new URL(href('/some/path'), env.PUBLIC_URL)`

The only case where you should not use href is for urls outside of current app or routes like `routes/$.tsx`, basically routes that match all paths.

> if you cannot use `href` simply because the route you would like to link to does not exist you should do the following: list all the files in the src/routes folder first, to see if it already exists but not with the name you would expect. If still you can't find one, create a simple placeholder react-router route with a simple Page component and a simple loader that does what you would expect. do not write too much code. you can improve on it in later messages.

## showing spinner while loader does work and then redirect

For routes that do slow operations like creating PRs and then redirect, use a loader that returns a promise. The component uses window.location.replace when the promise resolves.

```tsx
export async function loader({ request, params: { id } }: Route.LoaderArgs) {
    const url = new URL(request.url)
    const data = url.searchParams.get('data')
    const promise = doSlowWork(id, data)
    return { promise }
}

export default function Page() {
    const { promise } = useLoaderData<typeof loader>()
    const [error, setError] = useState('')

    useEffect(() => {
        promise.then(({ url }) => {
            window.location.replace(url)
        }).catch(e => setError(e.message))
    }, [promise])

    if (error) return <p className='text-red-600'>Error: {error}</p>
    return <Loader2Icon className='h-6 w-6 animate-spin' />
}
```

## do not redirect to missing routes that do not exist

never redirect or link to a route that does not exist, instead create a simple placeholder route with a simple loader and component instead. then redirect there using type safe path with `href`

if instead it's not clear where to redirect because an user resource is missing, check if an onboarding route exists for that resource or a generic onboarding route. redirect there instead

also keep in mind it's preferable to throw redirects in loaders instead of returning responses, so loader keeps type safety.

## typescript

NEVER use require. always esm imports

Always try to use non relative imports, each package has a absolute import with the package name, you can find it in the tsconfig.json paths section, for example paths inside website can be imported from website. Notice these paths also need to include the src directory.

This is preferable other aliases like @/ because i can easily move the code from one package to another without changing the import paths. This way you can even move a file and import paths do not change much.

Always specify the type when creating arrays, especially for empty arrays. If you don't, TypeScript will infer the type as `never[]`, which can cause type errors when adding elements later.

**Example:**

```ts
// BAD: Type will be never[]
const items = []

// GOOD: Specify the expected type
const items: string[] = []
const numbers: number[] = []
const users: User[] = []
```

Remember to always add the explicit type to avoid unexpected type inference.

## styling

- always use tailwind for styling, prefer using simple styles using flex and gap. Margins should be avoided, instead use flexbox gaps, grid gaps, or separate spacing divs.

- Use shadcn theme colors instead of tailwind default colors. This way there is no need to add `dark:` variants most of the time.

- `flex flex-col gap-3` is preferred over `space-y-3`. same for the x direction.

- Try to keep styles as simple as possible, for breakpoint too.

- to join many classes together use the `cn('class-1', 'class-2')` utility instead of `${}` or other methods. this utility is usually used in shadcn compatible projects and mine is exported from `website/src/lib/cn` usually. Prefer doing `cn(bool && 'class')` instead of `cn(bool ? 'class' : '')`

- prefer `size-4` over `w-4 h-4`

## components

This project uses shadcn components placed in the website/src/components/ui folder. never add a new shadcn component yourself writing code, instead use the shadcn cli installed locally instead.

Try to reuse these available components when you can, for example for buttons, tooltips, scroll areas, etc.

## client side navigation is preferred

always try use use react-router `useNavigate` or `Link` instead of doing window.location.href update.

so that internal navigation are done client side and are faster. notice that navigate only accepts a relative path and not a full url, so if you have a full url you should do new URL(url).pathname. only use navigate if you know the url is relative to the app.

## Link or a components are preferred over `navigate`

ALWAYS use link components instead of the navigate function if possible, for example in a dropdown component you should wrap the dropdown item in a link instead of adding a onClick handler.

## calling the server from the client

for simple routes that only have one interaction in the page, for example a form page, you should use react-router forms and actions to interact with the server.

but when you do interactions from a component that can be rendered from multiple routes, or simply is not implemented inside a route page, you should use spiceflow client instead.

the website exposes an API via Spiceflow. here is spiceflow docs: https://getspiceflow.com/

> ALWAYS use the fetch tool to get the latest docs if you need to implement a new route in a Spiceflow API app server or need to add a new rpc call with a spiceflow api client!

Spiceflow has support for client side type safe rpc, use this client when you need to interact with the server from the client, for example for a settings save deep inside a component. here is example usage of it

> SUPER IMPORTANT! if you add a new route to a spiceflow app, use the spiceflow app state like `userId` to add authorization to the route. If there is no state then you can use functions like `getSession({request})` or similar.
> Make sure the current userId has access to the fetched or updated rows. This can be done by checking that the parent row or current row has a relation with the current userId. For example `prisma.site.findFirst({where: {users: {some: {userId }}}})`

Always use `const {data, error} = await apiClient...` when calling spiceflow rpc. If data is already declared, give it a different name with `const {data: data2, error} = await apiClient...` This patten of destructuring is preferred over for all apis that return data and error object fields.

## getting spiceflow docs

spiceflow is a little known api framework. If you add server routes to a file that includes spiceflow in the name or you are using the apiClient rpc you always need to fetch the Spiceflow docs first, using the @fetch tool on https://getspiceflow.com/

This url returns a single long documentation that covers your use case, always fetch this document so you know how to use Spiceflow. Spiceflow is different than hono and other api frameworks, that's why you should ALWAYS fetch the docs first before using it

## prisma

this project uses prisma to interact with the database. if you need to add new queries always read the schema.prisma inside the db folder first so you understand the shape of the tables in the database.

never add new tables to the prisma schema, instead ask me to do so.

prisma upsert calls are preferable over updates, so that you also handle the case where the row is missing.

never make changes to schema.prisma yourself, instead propose a change with a message and ask me to do it. this file is too important to be edited by agents.

NEVER run `bun run push` in db or commands like `bun run prisma db push` or other prisma commands that mutate the database!

### prisma queries for relations

- NEVER add more than 1 include nesting. This is very bad for performance because prisma will have to do the query to get the relation sequentially. Instead of adding a new nested `include` you should add a new prisma query and wrap them in a `Promise.all`

### prisma transactions for complex relations inserts

for very complex updates or inserts that involve more than 3 related tables, for example a Chat with ChatMessages and ChatMessagePath, you should use transaction instead of a super complex single query:

- start a transaction
- delete the parent table, the one with cascade deletes, so that the related tables are also deleted
- recreate all the tables again, reuse the old existing rows data when you don't have all the fields available
- make sure to create all the rows in the related tables. use for loops if necessary

### prisma, always make sure use has access to prisma tables

> IMPORTANT! always read the schema.prisma file before adding a new prisma query, to understand how to structure it

try to never write sql by hand, user prisma

if a query becomes too complex because fetching too deeply into related tables (more than 1 `include` nesting), use different queries instead, put them in a Promise.all

### prisma, concurrency

when doing prisma queries or other async operations try to parallelize them using Promise.all

this will speed up operations that can be done concurrently.

this is especially important in react-router loaders

### prisma security

All loaders, actions and Spiceflow routes of the project should have authorization checks.

These checks should check that the current user, identified by userId, has access to the fetched and updated rows.

This simply mean to always include a check in prisma queries to make sure that the user has access to the updated or queries rows, for example:

```typescript
const resource = await prisma.resource.findFirst({
    where: { resourceId, parentResource: { users: { some: { userId } } } },
})
if (!resource) {
    throw new AppError(`cannot find resource`)
}
```

### prisma transactions

NEVER use prisma interactive transatciont (passing a function to `prisma.$transaction`), instead pass an array of operations. this is basically the same thing, operations are executed in order, but it has much better performance.

If you need to use complex logic to construct the array of operations, create a empty array using `const operations: Prisma.PrismaPromise<any>[]` first, then push to this array the queries you want to excecute

> IMPORTANT! while constructing the operations array you should never call await in between, this would cause the prisma query to start and would make the transaction invalid.

````typescript

## errors

if you throw an error that is not unexpected you should use the `AppError` class, this way I can skip sending these errors to Sentry in the `notifyError` function

For example for cases where a resource is not found or user has no subscription.

you can even throw response errors, for example:

```typescript
if (!user.subscription) {
    throw new ResponseError(
        403,
        JSON.stringify({ message: `user has no subscription` }),
    )
}
````

## react code

- `useEffect` is bad: The use of useEffect is discouraged. please do not use it unless strictly necessary, before using useEffect call the @think tool to make sure that there are no other options. Usually you can colocate code that runs inside useEffect to the functions that call that useEffect dependencies setState instead

- too many `useState` calls are bad. If some piece of state is dependent on other state just compute it as an expression in render. Do not add new state unless strictly necessary. Before adding a new useState to a component, use @think tool to think hard if you can instead: use expression with already existing local state, use expression with some global state, use expression with loader data, use expression with some other existing variable instead. For example if you need to show a Popover when there is an error you should use the error as open state for the popover instead of adding new useState hook

- `useCallback` is bad. it should be always avoided.

- NEVER pass functions to useEffect or useMemo dependencies. when you start passing functions to hook dependencies you need to add useCallback everywhere in the code, useCallback is a virus that infects the codebase and should be ALWAYS avoided.

- custom hooks are bad. NEVER add custom hooks unless asked to do so by me. instead of creating hooks create generic react independent functions. Every time you find yourself creating a custom hook call @think and think hard if you can just create a normal function instead, or just inline the expression in the component if small enough

- minimize number of props. do not use props if you can use Zustand state instead. The app has global Zustand state that let's you get a piece of state down from the component tree by using something like `useStore(x => x.something)` or `useLoaderData<typeof loader>()` or even useRouteLoaderData if you are deep in the react component tree

- do not consider local state truthful when interactive with server. when interacting with the server with rpc or api calls never use state from the render function as input for the api call. This state can easily become stale or not get updated in the closure context. instead prefer using Zustand `useStore.getState().stateValue`. Notice that useLoaderData or useParams should be fine in this case.

- when using useRef with a generic type always add undefined in the call, for example `useRef<number>(undefined)`. this is required by the rect types definitions

- when using && in jsx make sure that the result type is no of type number, in that case add Boolean() wrapper. This way jsx will not show zeros when the value is falsy.

## components

- place new components in the src/components folder. shadcn comopnents will go to the src/components/ui folder, usually they are not manually updated but added with the shadcn cli (which is preferred to be run without npx, either with pnpm or globally just shadcn)

- component filenames should follow kebab case structure

- do not create a new component file if this new code will only be used in another component file. only create a component file if the component is used by multiple components or routes. colocate related components in the same file.

- non component code should be put in the src/lib folder.

- hooks should be put in the src/hooks.tsx file. do not create a new file for each new hook. also notice that you should never create custom hook, only do it if asked for.

## ai sdk

I use the vercel ai sdk to interact with LLMs, also know as the npm package `ai`. never use the openai sdk or provider specific sdks, always use the vercel ai sdk, npm package `ai`. streamText is preferred over generateText, unless the model used is very small and fast and the current code doesn't care about streaming tokens or showing a preview to the user. `streamObject` is also preferred over generateObject.

ALWAYS fetch the latest docs for the ai sdk using this url with curl:
https://gitchamber.com/repos/vercel/ai/main/files

use gitchamber to read the .md files using curl

You can swap out the topic with text you want to search docs for. You can also limit the total results returned with the param token to limit the tokens that will be added to the context window

## lucide icons

use lucide-react to import icons. always add the Icon import name, for example `ImageIcon` instead of just `Image`.

## cli folder

the cli uses cac npm package.

notice that if you add a route in the spiceflow server you will need to run `bun run --filter website gen-client` to update the apiClient inside cli.

## files

always use kebab case for new filenames. never use uppercase letters in filenames

## changelog

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

For private packages, which do not have versions, you must instead use the current date and time, for example:

```md
# Changelog

## 2025-01-24 19:50

- Added a feature to improve user experience
- Fixed a bug that caused the app to crash on startup
```

these are just example, be clear and consies in your changelog entries.

use present tense. Be detailed but concise, omit useless verbs like "implement", "added", just put the subject there instead, so it is showerer. it's implicit we are adding feature or fixes. do not use nested bullet points. Always show example code snippets if applicable, and use proper markdown formatting.

```

the website package has a dependency on docs-website. instead of duplicating code that is needed both in website and docs-website keep a file in docs-website instead and import from there for the website package.


## playwriter

you can run control the browser using the playwriter mcp tools. these tools let you control the browser to get information or accomplish actions

if i ask you to test something in the browser, know that the website dev server is already running at http://localhost:7664 for website and :7777 for docs-website (but docs-website need to use the website domain specifically, for example name-hash.localhost:7777)

## Zod

Use zod to create schemas and types that needs to be used for tool inputs or Spiceflow API routes.

When you need to create a complex type that comes from Prisma table do not create a new schema that tries to recreate the Prisma table structure, instead just use `z.any() as ZodType<PrismaTable>)` to get type safety but leave any in the schema. This gets most of the benefits of Zod without having to define a new Zod schema that can easily go out of sync.
```


## tailwind v4

this project uses tailwind v4. this new tailwind version does not use tailwind.config.js. instead it does all configuration in css files.

read https://tailwindcss.com/docs/upgrade-guide to understand the updates landed in tailwind v4 if you do not have tailwind v4 in your training context. Ignore the parts that talk about running the upgrade cli. this project already uses tailwind v4 so no need to upgrade anything.


## writing docs

when generating a .md or .mdx file to document things, always add a frontmatter with title and description. also add a prompt field with the exact prompt used to generate the doc. use @ to reference files and urls and provide any context necessary to be able to recreate this file from scratch using a model. if you used urls also reference them. reference all files you ad to read to create the doc. use yaml | syntax to add this prompt and never go over the column width of 80

## reading github repositories

You can use gitchamber.com to read repos files. run `curl https://gitchamber.com` to see how the API works. Always use curl to fetch the responses of gitchamber.com


## fixing duplicate bun dependencies

sometimes typescript will fail if there are 2 duplicate packages in the workspace node_modules. this can happen in bun if a package is usedin 2 different places (even if inside a node_module package, transitive dependency) with a different set of versions for a peer dependency

for example if better-auth depends on zod peer dep and zod is in different versions in 2 dependency subtrees

to identify if a bun package is duplicated search for the string " packagename@" inside `bun.lockb`, notice the space in the search string. Then if the result returns multiple instances with a different set of peer deps inside the round brackets it means that this package is being duplicated. Here is an example of a package getting duplicated:

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

As you can see better-auth is listed twice with different set of peer deps. In this case it's because of zod being in version 3 and 4 in two subtrees of our workspace dependencies.

As a first step try running `bun dedupe better-auth` with your package name and see if there is still the problem.

below i will describe how to generally deduplicate a package, I will use zod as an example. It works with any dependency found in the previous step.

To deduplicate the package we have to make sure we only have 1 version of zod installed in your workspace. DO NOT use overrides for this. Instead fix the problem by manually updating the dependencies that are forcing the older version of zod in the dependency tree.

to do so we have first to run the command `bun why zod@3.25.76` to see the reason the older zod version is installed. In this case the result is something like this:

```

website /Users/morse/Documents/GitHub/fumabase/website (PRIVATE)

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

Here we can see zod 3 is installed because of @modelcontextprotocol/sdk, @better-auth/stripe and agents packages. To fix the problem we can run

```
bun update --latest @modelcontextprotocol/sdk @better-auth/stripe agents
```

This way if these packages include the newer version of the dependency zod will be deduplicated automatically.

In this case we could have only updated only @better-auth/stripe to fix the issue too, that's becaues @better-auth/stripe is the one that has better-auth as a peer dep. But finding what is the exact problematic package is difficult so it is easier to just update all packages you notice that we depend on directly in our workspace package.json files.

IF after doing this we still have duplicate packages you will have to ask help to the user. You can try deleting the node_modules and restart the approach but it rarely helps.


## running opentui scripts

opentui relies on bun so you will need to use bun to run these scripts instead of node

ALWAYS read termcast/PORTING.md to understand how to port racyast components to opentui
