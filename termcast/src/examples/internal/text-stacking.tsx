import { render } from '@opentui/react'
import { TextAttributes } from '@opentui/core'
import { Theme } from '@termcast/api/src/theme'

function TextStackingExample() {
    const items = [
        {
            titleText: 'This is a very long text that should demonstrate how text behaves when it needs to wrap across multiple lines in the terminal interface',
            accessories: ['⌘K', 'Active', '2 hours ago', 'Priority: High'],
        },
        {
            titleText: 'Another extremely verbose piece of text that contains way too many words and will definitely need to wrap to fit within the available space',
            accessories: ['Badge', 'Status: Pending', 'v2.3.4', '→'],
        },
        {
            titleText: 'Short text',
            accessories: ['Simple', 'Tag'],
        },
        {
            titleText: 'Yet another ridiculously long string of words that goes on and on without any consideration for the width of the terminal window',
            accessories: ['Multiple', 'Tags', 'Here', '✓', 'Completed'],
        },
        {
            titleText: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua',
            accessories: ['Latin', 'Placeholder', 'Text', 'Example'],
        },
        {
            titleText: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat',
            accessories: ['⚡', 'Fast', 'Performance', 'Optimized', 'Build'],
        },
        {
            titleText: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur',
            accessories: ['End', '✓', 'Success', 'Final', 'Item', '100%'],
        },
        {
            titleText: 'A medium length text that still wraps but not as much as the really long ones above',
            accessories: ['Medium', 'Length', 'Example'],
        },
    ]

    const activeIndex = 1 // Highlight second item for demo

    return (
        <box style={{ flexDirection: 'column' }}>
            {items.map((item, index) => {
                const active = index === activeIndex
                
                const accessoryElements = item.accessories.map((acc) => (
                    <text
                        fg={active ? Theme.background : Theme.textMuted}
                    >
                        {acc}
                    </text>
                ))

                return (
                    <box
                        key={index}
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            backgroundColor: active ? Theme.primary : undefined,
                            paddingLeft: 1,
                            paddingRight: 1,
                        }}
                        border={false}
                    >
                        <group style={{ flexDirection: 'row', flexGrow: 1, flexShrink: 1 }}>
                            <text
                                fg={active ? Theme.background : Theme.text}
                                attributes={active ? TextAttributes.BOLD : undefined}
                            >
                                {item.titleText}
                            </text>
                        </group>
                        {accessoryElements.length > 0 && (
                            <group style={{ flexDirection: 'row' }}>
                                {accessoryElements.map((elem, i) => (
                                    <group key={i} style={{ flexDirection: 'row' }}>
                                        {i > 0 && <text> </text>}
                                        {elem}
                                    </group>
                                ))}
                            </group>
                        )}
                    </box>
                )
            })}
        </box>
    )
}

render(<TextStackingExample />)