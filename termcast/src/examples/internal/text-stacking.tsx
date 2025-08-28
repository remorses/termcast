import { render } from '@opentui/react'

function TextStackingExample() {
    const items = [
        {
            titleText: 'This is a very long text that should demonstrate how text behaves when it needs to wrap across multiple lines in the terminal interface',
            accessories: ['⌘K', 'Active Status with Long Description', 'Last modified 2 hours and 30 minutes ago', 'Priority: Extremely High', 'Production Environment'],
        },
        {
            titleText: 'Another extremely verbose piece of text that contains way too many words and will definitely need to wrap to fit within the available space',
            accessories: ['Development Badge', 'Status: Currently Pending Approval', 'Version 2.3.4-beta.15', 'Navigation Arrow →', 'Requires Administrator Review'],
        },
        {
            titleText: 'Short text',
            accessories: ['Very Long Accessory Text That Should Push Content', 'Another Extremely Long Tag Name Here', 'Additional Information'],
        },
        {
            titleText: 'Yet another ridiculously long string of words that goes on and on without any consideration for the width of the terminal window',
            accessories: ['Multiple Different Tags', 'All Tags Listed Here', '✓ Successfully Completed', 'Performance Metrics: 98.5%', 'Response Time: 250ms average'],
        },
        {
            titleText: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua',
            accessories: ['Latin Placeholder Text', 'Documentation Example Reference', 'Standard Lorem Ipsum Text', 'Classic Typography Example', 'Used Since 1500s'],
        },
        {
            titleText: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat',
            accessories: ['⚡ Lightning Fast Performance', 'Heavily Optimized Build Process', 'Webpack Bundle Size: 245KB', 'Code Splitting Enabled', 'Tree Shaking Active'],
        },
        {
            titleText: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur',
            accessories: ['End of Section Marker', '✓ All Tests Passing Successfully', 'Code Coverage: 100%', 'Final Review Complete', 'Ready for Production Deployment'],
        },
        {
            titleText: 'A medium length text that still wraps but not as much as the really long ones above',
            accessories: ['Medium Priority Task', 'Estimated Time: 3-4 hours', 'Dependencies: External API Integration', 'Assigned to Development Team'],
        },
    ]

    return (
        <box style={{ flexDirection: 'column' }}>
            {items.map((item, index) => {
                const accessoryElements = item.accessories.map((acc) => (
                    <text fg="blue">
                        {acc}
                    </text>
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
                        <group style={{ flexDirection: 'row', flexGrow: 1, flexShrink: 1 }}>
                            <text>
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