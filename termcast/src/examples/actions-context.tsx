/**
 * Example validating that ActionPanel preserves React context through portals.
 *
 * A custom React context (CounterContext) provides a counter value. The
 * CounterAction component reads from this context at render time and closes
 * over it in its onAction callback. If the portal preserves context correctly,
 * the toast will show the matching prop and context values.
 */
import React, { createContext, useContext, useState } from 'react'
import { List, ActionPanel, Action, showToast, Toast, renderWithProviders } from 'termcast'

const CounterContext = createContext(0)

// Action component that reads from context at render time
function CounterAction({ counter }: { counter: number }) {
  // Read from context - this works because the portal preserves the
  // React tree context from the source component
  const contextValue = useContext(CounterContext)

  return (
    <Action
      title="Show Counter"
      onAction={() => {
        // Both the prop and context value should match
        showToast({
          title: `prop=${counter} ctx=${contextValue}`,
          style: Toast.Style.Success,
        })
      }}
    />
  )
}

function ActionsContextExample() {
  const [counter, setCounter] = useState(42)

  return (
    <CounterContext.Provider value={counter}>
      <List
        navigationTitle="Context Test"
        searchBarPlaceholder="Search..."
      >
        <List.Item
          title={`Counter: ${counter}`}
          subtitle="Press enter to show counter via action"
          actions={
            <ActionPanel>
              <CounterAction counter={counter} />
              <Action
                title="Increment"
                onAction={() => {
                  setCounter((c) => c + 1)
                }}
              />
            </ActionPanel>
          }
        />
      </List>
    </CounterContext.Provider>
  )
}

await renderWithProviders(<ActionsContextExample />)
