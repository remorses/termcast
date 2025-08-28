import { render } from '@opentui/react'
import { TextAttributes } from '@opentui/core'
import { Theme } from '@termcast/api/src/theme'

function TextStackingExample() {
    const sections = [
        {
            title: 'First Section with Really Long Title That Should Wrap First Section with Really Long Title That Should Wrap',
            items: [
                {
                    titleText: 'This is a very long text that should demonstrate how text behaves when it needs to wrap across multiple lines in the terminal interface',
                    subtitleText: 'Subtitle for first item with additional context',
                    accessories: ['⌘K', '✓'],
                },
                {
                    titleText: 'Another extremely verbose piece of text that contains way too many words and will definitely need to wrap to fit within the available space',
                    subtitleText: 'More subtitle text here',
                    accessories: ['Badge'],
                },
                {
                    titleText: 'Short text',
                    subtitleText: null,
                    accessories: [],
                },
                {
                    titleText: 'Yet another ridiculously long string of words that goes on and on without any consideration for the width of the terminal window',
                    subtitleText: 'Final subtitle with some extra information to display',
                    accessories: ['→', 'Tag'],
                },
            ],
        },
        {
            title: 'Second Section Title',
            items: [
                {
                    titleText: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua',
                    subtitleText: 'Classical Latin text used as placeholder',
                    accessories: ['Icon'],
                },
                {
                    titleText: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat',
                    subtitleText: null,
                    accessories: [],
                },
                {
                    titleText: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur',
                    subtitleText: 'End of Lorem Ipsum paragraph',
                    accessories: ['✓', '⚡'],
                },
            ],
        },
    ]

    const activeIndex = 1 // Highlight second item for demo

    return (
        <box style={{ flexDirection: 'column' }}>
            {sections.map((section, groupIndex) => {
                let itemIndex = 0
                return (
                    <group
                        key={`section-${groupIndex}`}
                        style={{ flexShrink: 0 }}
                    >
                        <box
                            border={false}
                            style={{
                                paddingLeft: 1,
                                paddingTop: groupIndex > 0 ? 1 : 0,
                            }}
                        >
                            <text fg={Theme.accent} attributes={TextAttributes.BOLD}>
                                {section.title}
                            </text>
                        </box>
                        {section.items.map((item) => {
                            const currentIndex = itemIndex++
                            const active = currentIndex === activeIndex
                            
                            const accessoryElements = item.accessories.map((acc) => (
                                <text
                                    fg={active ? Theme.background : Theme.textMuted}
                                >
                                    {acc}
                                </text>
                            ))

                            return (
                                <box
                                    key={currentIndex}
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
                                        {item.subtitleText && (
                                            <text fg={active ? Theme.background : Theme.textMuted}>
                                                {' '}
                                                {item.subtitleText}
                                            </text>
                                        )}
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
                    </group>
                )
            })}
        </box>
    )
}

render(<TextStackingExample />)
