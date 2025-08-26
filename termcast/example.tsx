import { render } from '@opentui/react'
import { bold, fg, t } from '@opentui/core'
import { useState, useEffect } from 'react'

function Counter() {
    const [count, setCount] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            setCount((prev) => prev + 1)
        }, 1000)

        return () => clearInterval(interval)
    }, [])

    return (
        <group style={{ flexDirection: 'column', padding: 2 }}>
            <text>{bold(fg('#00FF00')('Termcast Demo'))}</text>
            <box title='Counter' style={{ padding: 2, marginTop: 1 }}>
                <text fg='#FFFF00'>{`Count: ${count}`}</text>
            </box>
            <box title='Welcome' style={{ padding: 2, marginTop: 1 }}>
                <text>{t`${bold('Welcome')} to ${fg('#0080FF')('OpenTUI')} with React!`}</text>
            </box>
        </group>
    )
}

render(<Counter />)
