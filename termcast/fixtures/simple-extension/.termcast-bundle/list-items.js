var __create = Object.create
var __getProtoOf = Object.getPrototypeOf
var __defProp = Object.defineProperty
var __getOwnPropNames = Object.getOwnPropertyNames
var __getOwnPropDesc = Object.getOwnPropertyDescriptor
var __hasOwnProp = Object.prototype.hasOwnProperty
var __toESM = (mod, isNodeMode, target) => {
  target = mod != null ? __create(__getProtoOf(mod)) : {}
  const to =
    isNodeMode || !mod || !mod.__esModule
      ? __defProp(target, 'default', { value: mod, enumerable: true })
      : target
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: () => mod[key],
        enumerable: true,
      })
  return to
}
var __moduleCache = /* @__PURE__ */ new WeakMap()
var __toCommonJS = (from) => {
  var entry = __moduleCache.get(from),
    desc
  if (entry) return entry
  entry = __defProp({}, '__esModule', { value: true })
  if ((from && typeof from === 'object') || typeof from === 'function')
    __getOwnPropNames(from).map(
      (key) =>
        !__hasOwnProp.call(entry, key) &&
        __defProp(entry, key, {
          get: () => from[key],
          enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
        }),
    )
  __moduleCache.set(from, entry)
  return entry
}
var __commonJS = (cb, mod) => () => (
  mod || cb((mod = { exports: {} }).exports, mod),
  mod.exports
)
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: (newValue) => (all[name] = () => newValue),
    })
}
var __esm = (fn, res) => () => (fn && (res = fn((fn = 0))), res)

// fixtures/simple-extension/src/list-items.tsx
var exports_list_items = {}
__export(exports_list_items, {
  default: () => ListItems,
})
module.exports = __toCommonJS(exports_list_items)

// globals:@termcast/cli
var AI = globalThis.termcastApi.AI
var Action = globalThis.termcastApi.Action
var ActionPanel = globalThis.termcastApi.ActionPanel
var ActionStyle = globalThis.termcastApi.ActionStyle
var Alert = globalThis.termcastApi.Alert
var Cache = globalThis.termcastApi.Cache
var Checkbox = globalThis.termcastApi.Checkbox
var Clipboard = globalThis.termcastApi.Clipboard
var Color = globalThis.termcastApi.Color
var Detail = globalThis.termcastApi.Detail
var Dialog = globalThis.termcastApi.Dialog
var DialogProvider = globalThis.termcastApi.DialogProvider
var Dropdown = globalThis.termcastApi.Dropdown
var Form = globalThis.termcastApi.Form
var FormDropdown = globalThis.termcastApi.FormDropdown
var Grid = globalThis.termcastApi.Grid
var Icon = globalThis.termcastApi.Icon
var IconComponent = globalThis.termcastApi.IconComponent
var Image = globalThis.termcastApi.Image
var ImageMask = globalThis.termcastApi.ImageMask
var InFocus = globalThis.termcastApi.InFocus
var LaunchType = globalThis.termcastApi.LaunchType
var List = globalThis.termcastApi.List
var LocalStorage = globalThis.termcastApi.LocalStorage
var MenuBarExtra = globalThis.termcastApi.MenuBarExtra
var NavigationContainer = globalThis.termcastApi.NavigationContainer
var OAuth = globalThis.termcastApi.OAuth
var PasswordField = globalThis.termcastApi.PasswordField
var PopToRootType = globalThis.termcastApi.PopToRootType
var Providers = globalThis.termcastApi.Providers
var TextArea = globalThis.termcastApi.TextArea
var TextField = globalThis.termcastApi.TextField
var Theme = globalThis.termcastApi.Theme
var Toast = globalThis.termcastApi.Toast
var captureException = globalThis.termcastApi.captureException
var clearClipboard = globalThis.termcastApi.clearClipboard
var closeMainWindow = globalThis.termcastApi.closeMainWindow
var confirmAlert = globalThis.termcastApi.confirmAlert
var copyTextToClipboard = globalThis.termcastApi.copyTextToClipboard
var copyToClipboard = globalThis.termcastApi.copyToClipboard
var cli_default = globalThis.termcastApi.default
var environment = globalThis.termcastApi.environment
var getApplications = globalThis.termcastApi.getApplications
var getDefaultApplication = globalThis.termcastApi.getDefaultApplication
var getFrontmostApplication = globalThis.termcastApi.getFrontmostApplication
var getIconEmoji = globalThis.termcastApi.getIconEmoji
var getPreferenceValues = globalThis.termcastApi.getPreferenceValues
var getSelectedFinderItems = globalThis.termcastApi.getSelectedFinderItems
var getSelectedText = globalThis.termcastApi.getSelectedText
var logger = globalThis.termcastApi.logger
var moveToTrash = globalThis.termcastApi.moveToTrash
var open = globalThis.termcastApi.open
var openCommandPreferences = globalThis.termcastApi.openCommandPreferences
var openExtensionPreferences = globalThis.termcastApi.openExtensionPreferences
var openFile = globalThis.termcastApi.openFile
var openInBrowser = globalThis.termcastApi.openInBrowser
var pasteContent = globalThis.termcastApi.pasteContent
var pasteText = globalThis.termcastApi.pasteText
var renderWithProviders = globalThis.termcastApi.renderWithProviders
var showInFinder = globalThis.termcastApi.showInFinder
var showToast = globalThis.termcastApi.showToast
var trash = globalThis.termcastApi.trash
var useDialog = globalThis.termcastApi.useDialog
var useFormContext = globalThis.termcastApi.useFormContext
var useFormSubmit = globalThis.termcastApi.useFormSubmit
var useIsInFocus = globalThis.termcastApi.useIsInFocus
var useNavigation = globalThis.termcastApi.useNavigation
var useStore = globalThis.termcastApi.useStore

// globals:react/jsx-runtime
var Fragment = globalThis.reactJsxRuntime.Fragment
var jsx = globalThis.reactJsxRuntime.jsx
var jsxs = globalThis.reactJsxRuntime.jsxs
var jsxDEV = globalThis.reactJsxRuntime.jsxDEV || globalThis.reactJsxRuntime.jsx

// fixtures/simple-extension/src/list-items.tsx
function ListItems() {
  const items = [
    { id: '1', title: 'First Item', subtitle: 'This is the first item' },
    { id: '2', title: 'Second Item', subtitle: 'This is the second item' },
    { id: '3', title: 'Third Item', subtitle: 'This is the third item' },
    { id: '4', title: 'Fourth Item', subtitle: 'This is the fourth item' },
    { id: '5', title: 'Fifth Item', subtitle: 'This is the fifth item' },
  ]
  return /* @__PURE__ */ jsxDEV(
    List,
    {
      navigationTitle: 'List Items',
      children: /* @__PURE__ */ jsxDEV(
        List.Section,
        {
          title: 'Items',
          children: items.map((item) =>
            /* @__PURE__ */ jsxDEV(
              List.Item,
              {
                id: item.id,
                title: item.title,
                subtitle: item.subtitle,
                icon: Icon.Circle,
                actions: /* @__PURE__ */ jsxDEV(
                  ActionPanel,
                  {
                    children: [
                      /* @__PURE__ */ jsxDEV(
                        Action.CopyToClipboard,
                        {
                          title: 'Copy Item Title',
                          content: item.title,
                        },
                        undefined,
                        false,
                        undefined,
                        this,
                      ),
                      /* @__PURE__ */ jsxDEV(
                        Action.OpenInBrowser,
                        {
                          title: 'Open Example',
                          url: 'https://example.com',
                        },
                        undefined,
                        false,
                        undefined,
                        this,
                      ),
                    ],
                  },
                  undefined,
                  true,
                  undefined,
                  this,
                ),
              },
              item.id,
              false,
              undefined,
              this,
            ),
          ),
        },
        undefined,
        false,
        undefined,
        this,
      ),
    },
    undefined,
    false,
    undefined,
    this,
  )
}
