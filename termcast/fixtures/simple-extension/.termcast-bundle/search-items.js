// @bun @bun-cjs
(function(exports, require, module, __filename, __dirname) {var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __toESM = (mod, isNodeMode, target) => {
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: () => mod[key],
        enumerable: true
      });
  return to;
};
var __moduleCache = /* @__PURE__ */ new WeakMap;
var __toCommonJS = (from) => {
  var entry = __moduleCache.get(from), desc;
  if (entry)
    return entry;
  entry = __defProp({}, "__esModule", { value: true });
  if (from && typeof from === "object" || typeof from === "function")
    __getOwnPropNames(from).map((key) => !__hasOwnProp.call(entry, key) && __defProp(entry, key, {
      get: () => from[key],
      enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
    }));
  __moduleCache.set(from, entry);
  return entry;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: (newValue) => all[name] = () => newValue
    });
};

// fixtures/simple-extension/src/search-items.tsx
var exports_search_items = {};
__export(exports_search_items, {
  default: () => SearchItems
});
module.exports = __toCommonJS(exports_search_items);

// globals:@termcast/cli
var AI = globalThis.termcastApi.AI;
var Action = globalThis.termcastApi.Action;
var ActionPanel = globalThis.termcastApi.ActionPanel;
var ActionStyle = globalThis.termcastApi.ActionStyle;
var Alert = globalThis.termcastApi.Alert;
var Cache = globalThis.termcastApi.Cache;
var Checkbox = globalThis.termcastApi.Checkbox;
var Clipboard = globalThis.termcastApi.Clipboard;
var Color = globalThis.termcastApi.Color;
var Detail = globalThis.termcastApi.Detail;
var Dialog = globalThis.termcastApi.Dialog;
var DialogProvider = globalThis.termcastApi.DialogProvider;
var Dropdown = globalThis.termcastApi.Dropdown;
var Form = globalThis.termcastApi.Form;
var FormDropdown = globalThis.termcastApi.FormDropdown;
var Icon = globalThis.termcastApi.Icon;
var IconComponent = globalThis.termcastApi.IconComponent;
var Image = globalThis.termcastApi.Image;
var ImageMask = globalThis.termcastApi.ImageMask;
var InFocus = globalThis.termcastApi.InFocus;
var LaunchType = globalThis.termcastApi.LaunchType;
var List = globalThis.termcastApi.List;
var LocalStorage = globalThis.termcastApi.LocalStorage;
var MenuBarExtra = globalThis.termcastApi.MenuBarExtra;
var NavigationContainer = globalThis.termcastApi.NavigationContainer;
var OAuth = globalThis.termcastApi.OAuth;
var PasswordField = globalThis.termcastApi.PasswordField;
var Providers = globalThis.termcastApi.Providers;
var TextArea = globalThis.termcastApi.TextArea;
var TextField = globalThis.termcastApi.TextField;
var Theme = globalThis.termcastApi.Theme;
var Toast = globalThis.termcastApi.Toast;
var captureException = globalThis.termcastApi.captureException;
var clearClipboard = globalThis.termcastApi.clearClipboard;
var confirmAlert = globalThis.termcastApi.confirmAlert;
var copyTextToClipboard = globalThis.termcastApi.copyTextToClipboard;
var copyToClipboard = globalThis.termcastApi.copyToClipboard;
var cli_default = globalThis.termcastApi.default;
var environment = globalThis.termcastApi.environment;
var getApplications = globalThis.termcastApi.getApplications;
var getDefaultApplication = globalThis.termcastApi.getDefaultApplication;
var getFrontmostApplication = globalThis.termcastApi.getFrontmostApplication;
var getIconEmoji = globalThis.termcastApi.getIconEmoji;
var getPreferenceValues = globalThis.termcastApi.getPreferenceValues;
var getSelectedFinderItems = globalThis.termcastApi.getSelectedFinderItems;
var getSelectedText = globalThis.termcastApi.getSelectedText;
var logger = globalThis.termcastApi.logger;
var moveToTrash = globalThis.termcastApi.moveToTrash;
var open = globalThis.termcastApi.open;
var openCommandPreferences = globalThis.termcastApi.openCommandPreferences;
var openExtensionPreferences = globalThis.termcastApi.openExtensionPreferences;
var openFile = globalThis.termcastApi.openFile;
var openInBrowser = globalThis.termcastApi.openInBrowser;
var pasteContent = globalThis.termcastApi.pasteContent;
var pasteText = globalThis.termcastApi.pasteText;
var renderExample = globalThis.termcastApi.renderExample;
var renderWithProviders = globalThis.termcastApi.renderWithProviders;
var showInFinder = globalThis.termcastApi.showInFinder;
var showToast = globalThis.termcastApi.showToast;
var trash = globalThis.termcastApi.trash;
var useDialog = globalThis.termcastApi.useDialog;
var useFormContext = globalThis.termcastApi.useFormContext;
var useFormSubmit = globalThis.termcastApi.useFormSubmit;
var useIsInFocus = globalThis.termcastApi.useIsInFocus;
var useNavigation = globalThis.termcastApi.useNavigation;
var useStore = globalThis.termcastApi.useStore;

// globals:react
var Children = globalThis.react.Children;
var Component = globalThis.react.Component;
var Fragment = globalThis.react.Fragment;
var Profiler = globalThis.react.Profiler;
var PureComponent = globalThis.react.PureComponent;
var StrictMode = globalThis.react.StrictMode;
var Suspense = globalThis.react.Suspense;
var __CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = globalThis.react.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
var __COMPILER_RUNTIME = globalThis.react.__COMPILER_RUNTIME;
var act = globalThis.react.act;
var cache = globalThis.react.cache;
var captureOwnerStack = globalThis.react.captureOwnerStack;
var cloneElement = globalThis.react.cloneElement;
var createContext = globalThis.react.createContext;
var createElement = globalThis.react.createElement;
var createRef = globalThis.react.createRef;
var react_default = globalThis.react;
var forwardRef = globalThis.react.forwardRef;
var isValidElement = globalThis.react.isValidElement;
var lazy = globalThis.react.lazy;
var memo = globalThis.react.memo;
var startTransition = globalThis.react.startTransition;
var unstable_useCacheRefresh = globalThis.react.unstable_useCacheRefresh;
var use = globalThis.react.use;
var useActionState = globalThis.react.useActionState;
var useCallback = globalThis.react.useCallback;
var useContext = globalThis.react.useContext;
var useDebugValue = globalThis.react.useDebugValue;
var useDeferredValue = globalThis.react.useDeferredValue;
var useEffect = globalThis.react.useEffect;
var useId = globalThis.react.useId;
var useImperativeHandle = globalThis.react.useImperativeHandle;
var useInsertionEffect = globalThis.react.useInsertionEffect;
var useLayoutEffect = globalThis.react.useLayoutEffect;
var useMemo = globalThis.react.useMemo;
var useOptimistic = globalThis.react.useOptimistic;
var useReducer = globalThis.react.useReducer;
var useRef = globalThis.react.useRef;
var useState = globalThis.react.useState;
var useSyncExternalStore = globalThis.react.useSyncExternalStore;
var useTransition = globalThis.react.useTransition;
var version = globalThis.react.version;

// globals:react/jsx-runtime
var Fragment2 = globalThis.reactJsxRuntime.Fragment;
var jsx = globalThis.reactJsxRuntime.jsx;
var jsxs = globalThis.reactJsxRuntime.jsxs;
var jsxDEV = globalThis.reactJsxRuntime.jsxDEV || globalThis.reactJsxRuntime.jsx;

// fixtures/simple-extension/src/search-items.tsx
function SearchItems() {
  const [searchText, setSearchText] = useState("");
  const allItems = [
    { id: "1", title: "Apple", subtitle: "A red fruit", category: "Fruits" },
    { id: "2", title: "Banana", subtitle: "A yellow fruit", category: "Fruits" },
    { id: "3", title: "Carrot", subtitle: "An orange vegetable", category: "Vegetables" },
    { id: "4", title: "Broccoli", subtitle: "A green vegetable", category: "Vegetables" },
    { id: "5", title: "Chicken", subtitle: "A type of meat", category: "Meat" },
    { id: "6", title: "Beef", subtitle: "Another type of meat", category: "Meat" },
    { id: "7", title: "Orange", subtitle: "A citrus fruit", category: "Fruits" },
    { id: "8", title: "Lettuce", subtitle: "A leafy vegetable", category: "Vegetables" }
  ];
  const filteredItems = searchText ? allItems.filter((item) => item.title.toLowerCase().includes(searchText.toLowerCase()) || item.subtitle.toLowerCase().includes(searchText.toLowerCase()) || item.category.toLowerCase().includes(searchText.toLowerCase())) : allItems;
  const categories = Array.from(new Set(filteredItems.map((item) => item.category)));
  return /* @__PURE__ */ jsxDEV(List, {
    navigationTitle: "Search Items",
    searchBarPlaceholder: "Search for items...",
    onSearchTextChange: setSearchText,
    throttle: true,
    children: [
      categories.map((category) => /* @__PURE__ */ jsxDEV(List.Section, {
        title: category,
        children: filteredItems.filter((item) => item.category === category).map((item) => /* @__PURE__ */ jsxDEV(List.Item, {
          id: item.id,
          title: item.title,
          subtitle: item.subtitle,
          icon: Icon.Star,
          accessories: [{ text: item.category }],
          actions: /* @__PURE__ */ jsxDEV(ActionPanel, {
            children: [
              /* @__PURE__ */ jsxDEV(Action.CopyToClipboard, {
                title: "Copy Item Details",
                content: `${item.title} - ${item.subtitle}`
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV(Action.ShowInFinder, {
                title: "Show Example",
                path: "/tmp"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        }, item.id, false, undefined, this))
      }, category, false, undefined, this)),
      filteredItems.length === 0 && /* @__PURE__ */ jsxDEV(List.EmptyView, {
        title: "No items found",
        description: "Try adjusting your search query",
        icon: Icon.MagnifyingGlass
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
})
