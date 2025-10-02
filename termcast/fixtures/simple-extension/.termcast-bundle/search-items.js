var __create = Object.create;
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
var __esm = (fn, res) => () => (fn && (res = fn(fn = 0)), res);

// globals:react
var exports_react = {};
__export(exports_react, {
  version: () => version,
  useTransition: () => useTransition,
  useSyncExternalStore: () => useSyncExternalStore,
  useState: () => useState,
  useRef: () => useRef,
  useReducer: () => useReducer,
  useOptimistic: () => useOptimistic,
  useMemo: () => useMemo,
  useLayoutEffect: () => useLayoutEffect,
  useInsertionEffect: () => useInsertionEffect,
  useImperativeHandle: () => useImperativeHandle,
  useId: () => useId2,
  useEffect: () => useEffect,
  useDeferredValue: () => useDeferredValue,
  useDebugValue: () => useDebugValue,
  useContext: () => useContext,
  useCallback: () => useCallback,
  useActionState: () => useActionState,
  use: () => use,
  unstable_useCacheRefresh: () => unstable_useCacheRefresh,
  startTransition: () => startTransition,
  memo: () => memo,
  lazy: () => lazy,
  isValidElement: () => isValidElement,
  forwardRef: () => forwardRef,
  default: () => react_default,
  createRef: () => createRef,
  createElement: () => createElement,
  createContext: () => createContext,
  cloneElement: () => cloneElement,
  captureOwnerStack: () => captureOwnerStack,
  cache: () => cache,
  act: () => act,
  __COMPILER_RUNTIME: () => __COMPILER_RUNTIME,
  __CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE: () => __CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,
  Suspense: () => Suspense,
  StrictMode: () => StrictMode,
  PureComponent: () => PureComponent,
  Profiler: () => Profiler,
  Fragment: () => Fragment,
  Component: () => Component,
  Children: () => Children
});
var Children, Component, Fragment, Profiler, PureComponent, StrictMode, Suspense, __CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, __COMPILER_RUNTIME, act, cache, captureOwnerStack, cloneElement, createContext, createElement, createRef, react_default, forwardRef, isValidElement, lazy, memo, startTransition, unstable_useCacheRefresh, use, useActionState, useCallback, useContext, useDebugValue, useDeferredValue, useEffect, useId2, useImperativeHandle, useInsertionEffect, useLayoutEffect, useMemo, useOptimistic, useReducer, useRef, useState, useSyncExternalStore, useTransition, version;
var init_react = __esm(() => {
  Children = globalThis.react.Children;
  Component = globalThis.react.Component;
  Fragment = globalThis.react.Fragment;
  Profiler = globalThis.react.Profiler;
  PureComponent = globalThis.react.PureComponent;
  StrictMode = globalThis.react.StrictMode;
  Suspense = globalThis.react.Suspense;
  __CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = globalThis.react.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  __COMPILER_RUNTIME = globalThis.react.__COMPILER_RUNTIME;
  act = globalThis.react.act;
  cache = globalThis.react.cache;
  captureOwnerStack = globalThis.react.captureOwnerStack;
  cloneElement = globalThis.react.cloneElement;
  createContext = globalThis.react.createContext;
  createElement = globalThis.react.createElement;
  createRef = globalThis.react.createRef;
  react_default = globalThis.react;
  forwardRef = globalThis.react.forwardRef;
  isValidElement = globalThis.react.isValidElement;
  lazy = globalThis.react.lazy;
  memo = globalThis.react.memo;
  startTransition = globalThis.react.startTransition;
  unstable_useCacheRefresh = globalThis.react.unstable_useCacheRefresh;
  use = globalThis.react.use;
  useActionState = globalThis.react.useActionState;
  useCallback = globalThis.react.useCallback;
  useContext = globalThis.react.useContext;
  useDebugValue = globalThis.react.useDebugValue;
  useDeferredValue = globalThis.react.useDeferredValue;
  useEffect = globalThis.react.useEffect;
  useId2 = globalThis.react.useId;
  useImperativeHandle = globalThis.react.useImperativeHandle;
  useInsertionEffect = globalThis.react.useInsertionEffect;
  useLayoutEffect = globalThis.react.useLayoutEffect;
  useMemo = globalThis.react.useMemo;
  useOptimistic = globalThis.react.useOptimistic;
  useReducer = globalThis.react.useReducer;
  useRef = globalThis.react.useRef;
  useState = globalThis.react.useState;
  useSyncExternalStore = globalThis.react.useSyncExternalStore;
  useTransition = globalThis.react.useTransition;
  version = globalThis.react.version;
});

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
var Grid = globalThis.termcastApi.Grid;
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
var PopToRootType = globalThis.termcastApi.PopToRootType;
var Providers = globalThis.termcastApi.Providers;
var TextArea = globalThis.termcastApi.TextArea;
var TextField = globalThis.termcastApi.TextField;
var Theme = globalThis.termcastApi.Theme;
var Toast = globalThis.termcastApi.Toast;
var captureException = globalThis.termcastApi.captureException;
var clearClipboard = globalThis.termcastApi.clearClipboard;
var closeMainWindow = globalThis.termcastApi.closeMainWindow;
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
var renderWithProviders = globalThis.termcastApi.renderWithProviders;
var showFailureToast = globalThis.termcastApi.showFailureToast;
var showHUD = globalThis.termcastApi.showHUD;
var showInFinder = globalThis.termcastApi.showInFinder;
var showToast = globalThis.termcastApi.showToast;
var trash = globalThis.termcastApi.trash;
var useActionPanel = globalThis.termcastApi.useActionPanel;
var useDialog = globalThis.termcastApi.useDialog;
var useFormContext = globalThis.termcastApi.useFormContext;
var useFormSubmit = globalThis.termcastApi.useFormSubmit;
var useId = globalThis.termcastApi.useId;
var useIsInFocus = globalThis.termcastApi.useIsInFocus;
var useNavigation = globalThis.termcastApi.useNavigation;
var useStore = globalThis.termcastApi.useStore;
var useUnstableAI = globalThis.termcastApi.useUnstableAI;

// fixtures/simple-extension/src/search-items.tsx
init_react();

// globals:react/jsx-runtime
var exports_jsx_runtime = {};
__export(exports_jsx_runtime, {
  jsxs: () => jsxs,
  jsxDEV: () => jsxDEV,
  jsx: () => jsx,
  Fragment: () => Fragment2
});
var Fragment2 = globalThis.reactJsxRuntime.Fragment;
var jsx = globalThis.reactJsxRuntime.jsx;
var jsxs = globalThis.reactJsxRuntime.jsxs;
var jsxDEV = globalThis.reactJsxRuntime.jsxDEV || globalThis.reactJsxRuntime.jsx;

// fixtures/simple-extension/src/search-items.tsx
function SearchItems() {
  const [searchText, setSearchText] = useState("");
  const allItems = [
    {
      id: "1",
      title: "Apple",
      subtitle: "A red fruit",
      category: "Fruits"
    },
    {
      id: "2",
      title: "Banana",
      subtitle: "A yellow fruit",
      category: "Fruits"
    },
    {
      id: "3",
      title: "Carrot",
      subtitle: "An orange vegetable",
      category: "Vegetables"
    },
    {
      id: "4",
      title: "Broccoli",
      subtitle: "A green vegetable",
      category: "Vegetables"
    },
    {
      id: "5",
      title: "Chicken",
      subtitle: "A type of meat",
      category: "Meat"
    },
    {
      id: "6",
      title: "Beef",
      subtitle: "Another type of meat",
      category: "Meat"
    },
    {
      id: "7",
      title: "Orange",
      subtitle: "A citrus fruit",
      category: "Fruits"
    },
    {
      id: "8",
      title: "Lettuce",
      subtitle: "A leafy vegetable",
      category: "Vegetables"
    }
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
