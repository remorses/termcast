import React from 'react'
import { render } from '@opentui/react'
import List from '@termcast/cli'
import { Action, ActionPanel } from '@termcast/cli'
import { useNavigation } from '@termcast/cli/src/internal/navigation'
import { Providers } from '@termcast/cli/src/internal/providers'

function DetailView({ title }: { title: string }): any {
    const { pop } = useNavigation()

    return (
        <List
            searchBarPlaceholder='Detail view - Press ESC to go back'
            navigationTitle={`Detail: ${title}`}
        >
            <List.Section title='Details'>
                <List.Item
                    id='back'
                    title={`This is the detail view for ${title}`}
                    subtitle='Press Enter to go back or ESC to navigate back'
                    actions={
                        <ActionPanel>
                            <Action title='Go Back' onAction={() => pop()} />
                            <Action.CopyToClipboard
                                content={title}
                                title='Copy Title'
                            />
                        </ActionPanel>
                    }
                />
            </List.Section>
        </List>
    )
}

function MainView(): any {
    const { push } = useNavigation()

    const items = [
        {
            id: 'first',
            title: 'First Item',
            subtitle: 'Navigate to first detail',
        },
        {
            id: 'second',
            title: 'Second Item',
            subtitle: 'Navigate to second detail',
        },
        {
            id: 'third',
            title: 'Third Item',
            subtitle: 'Navigate to third detail',
        },
    ]

    return (
        <List
            searchBarPlaceholder='Main view'
            navigationTitle='Navigation Example'
        >
            <List.Section title='Items'>
                {items.map((item) => (
                    <List.Item
                        id={item.id}
                        title={item.title}
                        subtitle={item.subtitle}
                        actions={
                            <ActionPanel>
                                <Action
                                    title='Open Details'
                                    onAction={() =>
                                        push(<DetailView title={item.title} />)
                                    }
                                />
                                <Action.CopyToClipboard
                                    content={item.title}
                                    title='Copy Title'
                                />
                            </ActionPanel>
                        }
                    />
                ))}
            </List.Section>
        </List>
    )
}

function App(): any {
    return (
        <Providers>
            <MainView />
        </Providers>
    )
}

render(<App />)
