import { useState, useRef } from 'react'
import type { CustomList, CustomListItem } from './custom-elements.ts'

const ITEMS = [
  { title: 'Apple', subtitle: 'A red fruit', keywords: ['red', 'fruit'] },
  { title: 'Banana', subtitle: 'A yellow fruit', keywords: ['yellow', 'fruit'] },
  { title: 'Cherry', subtitle: 'A small red fruit', keywords: ['red', 'small'] },
  { title: 'Date', subtitle: 'A sweet dried fruit', keywords: ['sweet', 'dried'] },
  { title: 'Elderberry', subtitle: 'A dark purple berry', keywords: ['purple', 'berry'] },
]

export function App() {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [lastAction, setLastAction] = useState<string | null>(null)
  const listRef = useRef<CustomList>(null)

  return (
    <div style={{ maxWidth: 500, margin: '0 auto' }}>
      <h1>Custom Elements + React 19</h1>
      <p style={{ color: '#888' }}>
        Arrow keys or j/k to navigate, Enter to select. Click items to activate.
      </p>

      <div style={{ marginBottom: 16, padding: 12, background: '#2a2a4e', borderRadius: 8 }}>
        <div><strong>Selected:</strong> {ITEMS[selectedIndex]?.title ?? 'None'}</div>
        <div><strong>Last action:</strong> {lastAction ?? 'None'}</div>
      </div>

      <div style={{ marginBottom: 8, display: 'flex', gap: 8 }}>
        <button onClick={() => listRef.current?.moveSelection(-1)}>↑ Prev</button>
        <button onClick={() => listRef.current?.moveSelection(1)}>↓ Next</button>
        <button onClick={() => listRef.current?.getSelectedItem()?.actionCallback?.()}>Activate</button>
      </div>

      {/* @ts-expect-error - React 19 custom element support */}
      <custom-list ref={listRef} selectionCallback={(i: number) => setSelectedIndex(i)}>
        {ITEMS.map((item) => (
          // @ts-expect-error - React 19 custom element support
          <custom-list-item
            key={item.title}
            title={item.title}
            subtitle={item.subtitle}
            keywords={item.keywords}
            actionCallback={() => setLastAction(item.title)}
          >
            <div style={{ fontWeight: 500 }}>{item.title}</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>{item.subtitle}</div>
          </custom-list-item>
        ))}
      </custom-list>

      <div style={{ marginTop: 24, padding: 16, background: '#1e1e3e', borderRadius: 8, fontSize: 14 }}>
        <strong>How it works:</strong>
        <ol style={{ margin: '8px 0 0 0', paddingLeft: 20, lineHeight: 1.8 }}>
          <li>Items dispatch <code>item:register</code> event on connect</li>
          <li>Event bubbles to parent (like opentui's <code>findParent()</code>)</li>
          <li>Parent catches and registers items in Map</li>
          <li>React 19 passes <code>actionCallback</code> as property, not attribute</li>
        </ol>
      </div>
    </div>
  )
}
