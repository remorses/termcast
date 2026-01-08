/**
 * Descendants V2 - Generic renderable-based descendants pattern
 *
 * This provides a bridge between opentui's lifecycle (onLifecyclePass) and React state.
 * Items self-register when added to the tree, React owns the item list in state.
 *
 * Usage:
 *   const { Root, Item, ItemRenderable } = createDescendantsV2<MyItemProps>('my-list')
 *
 *   <Root ref={rootRefCallback} onRegisterItem={(item) => setItems(prev => [...prev, item])}>
 *     <Item props={{ value: 'foo', title: 'Foo' }}>
 *       {children}
 *     </Item>
 *   </Root>
 *
 * React handles filtering/selection/navigation - renderables just handle registration.
 */

import React, { type ReactNode } from 'react'
import {
  BoxRenderable,
  type BoxOptions,
  type RenderContext,
  type Renderable,
} from '@opentui/core'
import { extend } from '@opentui/react'

// ─────────────────────────────────────────────────────────────────────────────
// Tree traversal helper
// ─────────────────────────────────────────────────────────────────────────────

function findParent<T extends Renderable>(
  node: Renderable,
  ParentClass: new (...args: any[]) => T,
): T | undefined {
  let current: Renderable | undefined = node.parent ?? undefined
  while (current) {
    if (current instanceof ParentClass) {
      return current
    }
    current = current.parent ?? undefined
  }
  return undefined
}

// ─────────────────────────────────────────────────────────────────────────────
// DescendantItemRenderable - thin wrapper, stores generic props, self-registers
// ─────────────────────────────────────────────────────────────────────────────

export interface DescendantItemOptions<T = any> extends BoxOptions {
  props?: T
}

export class DescendantItemRenderable<T = any> extends BoxRenderable {
  props: T = {} as T
  private _parent?: DescendantsRootRenderable<T>
  private _registered = false
  private _RootClass: typeof DescendantsRootRenderable

  constructor(
    ctx: RenderContext,
    options: DescendantItemOptions<T>,
    RootClass: typeof DescendantsRootRenderable,
  ) {
    super(ctx, { ...options, flexDirection: 'row', width: '100%' })
    this._RootClass = RootClass
    if (options.props) {
      this.props = options.props
    }

    this.onLifecyclePass = () => {
      if (!this._registered) {
        this._parent = findParent(this, this._RootClass)
        if (this._parent) {
          this._parent.registerItem(this)
          this._registered = true
        }
      }
    }
  }

  // Called when removed from tree
  override destroy() {
    if (this._registered && this._parent) {
      this._parent.unregisterItem(this)
      this._registered = false
    }
    super.destroy()
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DescendantsRootRenderable - manages registry, notifies React via callbacks
// ─────────────────────────────────────────────────────────────────────────────

export interface DescendantsRootOptions extends BoxOptions {
  onRegisterItem?: (item: DescendantItemRenderable) => void
  onUnregisterItem?: (item: DescendantItemRenderable) => void
}

export class DescendantsRootRenderable<T = any> extends BoxRenderable {
  // Callbacks to notify React state
  onRegisterItem?: (item: DescendantItemRenderable<T>) => void
  onUnregisterItem?: (item: DescendantItemRenderable<T>) => void

  constructor(ctx: RenderContext, options: DescendantsRootOptions) {
    super(ctx, options)
    if (options.onRegisterItem) {
      this.onRegisterItem = options.onRegisterItem
    }
    if (options.onUnregisterItem) {
      this.onUnregisterItem = options.onUnregisterItem
    }
  }

  registerItem(item: DescendantItemRenderable<T>) {
    console.log('[descendants-v2] registerItem', item.props)
    this.onRegisterItem?.(item)
  }

  unregisterItem(item: DescendantItemRenderable<T>) {
    console.log('[descendants-v2] unregisterItem', item.props)
    this.onUnregisterItem?.(item)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory function - creates unique element names and typed React components
// ─────────────────────────────────────────────────────────────────────────────

export interface RootProps<T> {
  ref?: React.Ref<DescendantsRootRenderable<T>>
  onRegisterItem?: (item: DescendantItemRenderable<T>) => void
  onUnregisterItem?: (item: DescendantItemRenderable<T>) => void
  children?: ReactNode
}

export interface ItemProps<T> {
  ref?: React.Ref<DescendantItemRenderable<T>>
  props: T
  children?: ReactNode
  // Allow any additional box props
  [key: string]: any
}

export function createDescendantsV2<T = any>(name: string) {
  const rootElementName = `termcast-${name}-root`
  const itemElementName = `termcast-${name}-item`

  // Create subclass so findParent finds the right root (not another descendants instance)
  class NamedRootRenderable extends DescendantsRootRenderable<T> {}

  class NamedItemRenderable extends BoxRenderable {
    props: T = {} as T
    private _parent?: NamedRootRenderable
    private _registered = false

    constructor(ctx: RenderContext, options: DescendantItemOptions<T>) {
      super(ctx, { ...options, flexDirection: 'row', width: '100%' })
      if (options.props) {
        this.props = options.props
      }

      this.onLifecyclePass = () => {
        if (!this._registered) {
          this._parent = findParent(this, NamedRootRenderable)
          if (this._parent) {
            this._parent.registerItem(this as any)
            this._registered = true
          }
        }
      }
    }

    override destroy() {
      if (this._registered && this._parent) {
        this._parent.unregisterItem(this as any)
        this._registered = false
      }
      super.destroy()
    }
  }

  // Register custom elements with opentui - pass class constructors directly
  extend({
    [rootElementName]: NamedRootRenderable,
    [itemElementName]: NamedItemRenderable,
  } as any)

  // React components with proper types
  const Root = (props: RootProps<T>) => {
    const renderCount = React.useRef(0)
    renderCount.current += 1
    console.log('[descendants-v2] Root render', 'count:', renderCount.current)
    return React.createElement(rootElementName, props)
  }

  const Item = (props: ItemProps<T>) => {
    const renderCount = React.useRef(0)
    renderCount.current += 1
    console.log('[descendants-v2] Item render', 'count:', renderCount.current)
    return React.createElement(itemElementName, props)
  }

  return {
    Root,
    Item,
    ItemRenderable: NamedItemRenderable as unknown as typeof DescendantItemRenderable<T>,
    RootRenderable: NamedRootRenderable as unknown as typeof DescendantsRootRenderable<T>,
  }
}
