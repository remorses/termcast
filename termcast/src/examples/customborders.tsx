import { render } from '@opentui/react'
export const WithLeftBorder = (): any => {
    return (
        <box
            border={['left']}
            borderStyle='heavy'

            // customBorderChars={{
            //     topLeft: '+',
            //     topRight: 'è',
            //     bottomLeft: 'x',
            //     bottomRight: 'x',
            //     horizontal: 'x',
            //     vertical: '|',
            //     topT: 'x',
            //     bottomT: '+',
            //     leftT: '+',
            //     rightT: '+',
            //     cross: '+',
            // }}
            title='xxx'
            titleAlignment='left'

            flexDirection='column'
        >
            <box>real</box>
            <box>real</box>
            <box>real</box>
        </box>
    )
}

render(
    <box>
        <WithLeftBorder />
        <WithLeftBorder />
        <WithLeftBorder />
    </box>,
)
