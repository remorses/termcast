import { measureText } from '@opentui/core'
import { render } from '@opentui/react'
import { useState } from 'react'

export const App = () => {
    const text = 'ASCII'
    const [font, setFont] = useState<'block' | 'shade' | 'slick' | 'tiny'>(
        'tiny',
    )

    const { width, height } = measureText({
        text,
        font,
    })

    return (
        <select
            focused
            onChange={(_, option) => setFont(option?.value)}
            showScrollIndicator
            options={[
                {
                    name: 'First Item',
                    description: 'This is a subtitle  Badge',
                    value: 'First Item',
                },
                {
                    name: 'Second Item',
                    description: 'Another subtitle  Important',
                    value: 'Second Item',
                },
                {
                    name: 'Third Item',
                    description: 'Starred  Multiple accessories',
                    value: 'Third Item',
                },
                {
                    name: 'Fourth Item',
                    description: 'This item is searchable',
                    value: 'Fourth Item',
                },
                {
                    name: 'Simple Item',
                    description: '',
                    value: 'Simple Item',
                },
            ]}
            style={{ flexGrow: 1 }}
        />
    )
}

render(<App />)
