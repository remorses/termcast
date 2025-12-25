// Test useDescendantsRerender() behavior in different component positions
// This example tracks render counts to verify:
// 1. Hook in parent of descendants
// 2. Hook in independent child component
// 3. Hook in a descendant item component
//
import { createDescendants } from 'termcast/src/descendants'
import { createContext, useContext, useState, useRef } from 'react'
import { renderWithProviders } from '../../utils'
import { useKeyboard } from '@opentui/react'
import { useIsInFocus } from 'termcast/src/internal/focus-context'

// Create descendants with the new useDescendantsRerender hook
const {
  DescendantsProvider,
  useDescendants,
  useDescendant,
  useDescendantsRerender,
} = createDescendants<{
  title: string
}>()

// Global render counters for testing
const renderCounts = {
  parent: 0,
  parentWithHook: 0,
  independentChild: 0,
  independentChildWithHook: 0,
  descendantItem: 0,
  descendantItemWithHook: 0,
}

// Reset counters - call between test scenarios
export function resetRenderCounts() {
  renderCounts.parent = 0
  renderCounts.parentWithHook = 0
  renderCounts.independentChild = 0
  renderCounts.independentChildWithHook = 0
  renderCounts.descendantItem = 0
  renderCounts.descendantItemWithHook = 0
}

// Get current render counts
export function getRenderCounts() {
  return { ...renderCounts }
}

// Context to share item count for display
const ItemCountContext = createContext<number>(0)

// ============================================
// SCENARIO 1: Hook in parent of descendants
// The hook must be called INSIDE the provider, so we need a wrapper
// ============================================
function ParentWithHookInner({ children }: { children: React.ReactNode }) {
  renderCounts.parentWithHook++

  // Using the hook inside provider - will this cause infinite loop?
  const descendants = useDescendantsRerender()
  const itemCount = Object.keys(descendants).length

  return (
    <ItemCountContext.Provider value={itemCount}>
      <box flexDirection="column">
        <text>Parent with hook - renders: {renderCounts.parentWithHook}</text>
        <text>Item count (from hook): {itemCount}</text>
        {children}
      </box>
    </ItemCountContext.Provider>
  )
}

function ParentWithHook({ children }: { children: React.ReactNode }) {
  const descendantsContext = useDescendants()

  return (
    <DescendantsProvider value={descendantsContext}>
      <ParentWithHookInner>{children}</ParentWithHookInner>
    </DescendantsProvider>
  )
}

// ============================================
// SCENARIO 2: Parent without hook (baseline)
// ============================================
function ParentWithoutHook({ children }: { children: React.ReactNode }) {
  renderCounts.parent++
  const descendantsContext = useDescendants()

  return (
    <DescendantsProvider value={descendantsContext}>
      <box flexDirection="column">
        <text>Parent without hook - renders: {renderCounts.parent}</text>
        {children}
      </box>
    </DescendantsProvider>
  )
}

// ============================================
// SCENARIO 3: Independent child with hook
// ============================================
function IndependentChildWithHook() {
  renderCounts.independentChildWithHook++
  const descendants = useDescendantsRerender()
  const itemCount = Object.keys(descendants).length

  return (
    <box flexShrink={0}>
      <text>
        Independent child with hook - renders:{' '}
        {renderCounts.independentChildWithHook}, items: {itemCount}
      </text>
    </box>
  )
}

// ============================================
// SCENARIO 4: Independent child without hook
// ============================================
function IndependentChildWithoutHook() {
  renderCounts.independentChild++

  return (
    <box flexShrink={0}>
      <text>
        Independent child without hook - renders:{' '}
        {renderCounts.independentChild}
      </text>
    </box>
  )
}

// ============================================
// SCENARIO 5: Descendant item with hook
// ============================================
function DescendantItemWithHook({ title }: { title: string }) {
  renderCounts.descendantItemWithHook++
  const { index } = useDescendant({ title })
  const descendants = useDescendantsRerender()
  const totalItems = Object.keys(descendants).length

  return (
    <text>
      [{index}] {title} (with hook, renders: {renderCounts.descendantItemWithHook}, total: {totalItems})
    </text>
  )
}

// ============================================
// SCENARIO 6: Descendant item without hook
// ============================================
function DescendantItemWithoutHook({ title }: { title: string }) {
  renderCounts.descendantItem++
  const { index } = useDescendant({ title })

  return (
    <text>
      [{index}] {title} (without hook, renders: {renderCounts.descendantItem})
    </text>
  )
}

// ============================================
// Main example component
// ============================================
type Scenario =
  | 'parent-with-hook'
  | 'parent-without-hook'
  | 'independent-child-with-hook'
  | 'descendant-item-with-hook'

function Example({ scenario }: { scenario: Scenario }) {
  const [items, setItems] = useState(['Apple', 'Banana', 'Cherry'])
  const inFocus = useIsInFocus()

  useKeyboard((evt) => {
    if (!inFocus) return

    if (evt.name === 'a') {
      // Add item with stable key
      setItems((prev) => [...prev, `Item ${prev.length + 1}`])
    } else if (evt.name === 'd' && items.length > 0) {
      // Delete last item
      setItems((prev) => prev.slice(0, -1))
    } else if (evt.name === 'r') {
      // Reset counts
      resetRenderCounts()
    }
  })

  const renderScenario = () => {
    switch (scenario) {
      case 'parent-with-hook':
        return (
          <ParentWithHook>
            {items.map((item) => (
              <DescendantItemWithoutHook key={item} title={item} />
            ))}
          </ParentWithHook>
        )

      case 'parent-without-hook':
        return (
          <ParentWithoutHook>
            {items.map((item) => (
              <DescendantItemWithoutHook key={item} title={item} />
            ))}
          </ParentWithoutHook>
        )

      case 'independent-child-with-hook':
        return (
          <ParentWithoutHook>
            <IndependentChildWithHook />
            <IndependentChildWithoutHook />
            {items.map((item) => (
              <DescendantItemWithoutHook key={item} title={item} />
            ))}
          </ParentWithoutHook>
        )

      case 'descendant-item-with-hook':
        return (
          <ParentWithoutHook>
            {items.map((item) => (
              <DescendantItemWithHook key={item} title={item} />
            ))}
          </ParentWithoutHook>
        )
    }
  }

  return (
    <box flexDirection="column">
      <text>Scenario: {scenario}</text>
      <text>Items: {items.length} | [a] add | [d] delete | [r] reset counts</text>
      <box marginTop={1}>{renderScenario()}</box>
      <box marginTop={1} borderStyle="single" padding={1}>
        <box flexDirection="column">
          <text>Render Counts:</text>
          <text>  parent: {renderCounts.parent}</text>
          <text>  parentWithHook: {renderCounts.parentWithHook}</text>
          <text>  independentChild: {renderCounts.independentChild}</text>
          <text>  independentChildWithHook: {renderCounts.independentChildWithHook}</text>
          <text>  descendantItem: {renderCounts.descendantItem}</text>
          <text>  descendantItemWithHook: {renderCounts.descendantItemWithHook}</text>
        </box>
      </box>
    </box>
  )
}

// Export for different scenarios
export function ParentWithHookExample() {
  return <Example scenario="parent-with-hook" />
}

export function ParentWithoutHookExample() {
  return <Example scenario="parent-without-hook" />
}

export function IndependentChildWithHookExample() {
  return <Example scenario="independent-child-with-hook" />
}

export function DescendantItemWithHookExample() {
  return <Example scenario="descendant-item-with-hook" />
}

// Default export runs parent-with-hook scenario
const scenario = (process.argv[2] as Scenario) || 'parent-with-hook'
await renderWithProviders(<Example scenario={scenario} />)
