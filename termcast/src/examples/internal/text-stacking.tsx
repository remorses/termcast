import { render } from '@opentui/react'

function TextStackingExample() {
    const items = [
        {
            titleText:
                'This is a very long text that should demonstrate how text behaves when it needs to wrap across multiple lines in the terminal interface',
            accessories: ['⌘K', '␣'],
        },
        {
            titleText:
                'Another extremely verbose piece of text that contains way too many words and will definitely need to wrap to fit within the available space',
            accessories: ['Development Badge', '🚀'],
        },
        {
            titleText: 'Short text',
            accessories: [
                'Very Long Accessory Text That Should Push Content',
                'S',
            ],
        },
        {
            titleText:
                'Yet another ridiculously long string of words that goes on and on without any consideration for the width of the terminal window',
            accessories: ['Multiple Different Tags', 'Tag'],
        },
        {
            titleText:
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua',
            accessories: ['Latin Placeholder Text', 'L'],
        },
        {
            titleText:
                'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat',
            accessories: ['⚡ Lightning Fast Performance', '⚡'],
        },
        {
            titleText:
                'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur',
            accessories: ['End of Section Marker', 'E'],
        },
        {
            titleText:
                'A medium length text that still wraps but not as much as the really long ones above',
            accessories: ['Medium Priority Task', 'M'],
        },
    ]

    return (
        <box style={{ flexDirection: 'column' }}>
            {items.map((item, index) => {
                const accessoryElements = item.accessories.map((acc) => (
                    <text fg='blue'>{acc}</text>
                ))

                return (
                    <box
                        key={index}
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            paddingLeft: 1,
                            paddingRight: 1,
                        }}
                        border={false}
                    >
                        <box
                            style={{
                                flexDirection: 'row',
                                flexGrow: 1,
                                flexShrink: 1,
                            }}
                        >
                            <text>{item.titleText}</text>
                        </box>
                        {accessoryElements.length > 0 && (
                            <box style={{ flexDirection: 'row' }}>
                                {accessoryElements.map((elem, i) => (
                                    <box
                                        key={i}
                                        style={{ flexDirection: 'row' }}
                                    >
                                        {i > 0 && <text> </text>}
                                        {elem}
                                    </box>
                                ))}
                            </box>
                        )}
                    </box>
                )
            })}
        </box>
    )
}

render(<TextStackingExample />)
