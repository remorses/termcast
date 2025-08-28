import { useMemo } from 'react'
import { createRegistry } from '../../registry'
import { renderWithProviders } from '../../utils'

const { RegistryProvider, useRegistration, useRegistrySnapshot } =
    createRegistry<{ label: string }>()

function ExampleItemChild({ label }: { label: string }) {
    const obj = useMemo(() => {
        return { label }
    }, [label])
    useRegistration(obj, { id: label })
    return null
}

function ExampleListParent() {
    const items = useRegistrySnapshot()
    return (
        <box>
            {items.map(({ id, meta }) => (
                <text key={id}>{meta.label}</text>
            ))}
        </box>
    )
}

function App() {
    return (
        <RegistryProvider>
            <ExampleListParent>
                <ExampleItemChild label='Apple' />
                <ExampleItemChild label='Banana' />
                <ExampleItemChild label='Cherry' />
            </ExampleListParent>
        </RegistryProvider>
    )
}
renderWithProviders(<App />)
