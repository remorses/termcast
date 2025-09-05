import React from 'react'
import { List, Action, ActionPanel } from '@termcast/cli'
import { renderWithProviders } from '@termcast/cli'
import { homedir } from 'os'
import path from 'node:path'

function ShowInFinderExample(): any {
    const DOWNLOADS_DIR = path.join(homedir(), 'Downloads')

    return (
        <List>
            <List.Section title='Action.ShowInFinder Examples'>
                <List.Item
                    title='Show Downloads Folder'
                    subtitle='Reveal your Downloads folder in Finder'
                    actions={
                        <ActionPanel>
                            <Action.ShowInFinder
                                path={DOWNLOADS_DIR}
                                title='Show Downloads'
                                icon='📁'
                                shortcut={{ modifiers: ['cmd'], key: 'd' }}
                            />
                        </ActionPanel>
                    }
                />

                <List.Item
                    title='Show Home Directory'
                    subtitle='Reveal your home directory'
                    actions={
                        <ActionPanel>
                            <Action.ShowInFinder
                                path={homedir()}
                                title='Show Home'
                                icon='🏠'
                                shortcut={{ modifiers: ['cmd'], key: 'h' }}
                            />
                        </ActionPanel>
                    }
                />

                <List.Item
                    title='Show Package.json'
                    subtitle='Reveal the package.json file'
                    actions={
                        <ActionPanel>
                            <Action.ShowInFinder
                                path='package.json'
                                title='Show package.json'
                                icon='📦'
                                shortcut={{ modifiers: ['cmd'], key: 'p' }}
                                onShow={(path) => {
                                    console.log(`Revealed: ${path}`)
                                }}
                            />
                        </ActionPanel>
                    }
                />

                <List.Item
                    title='Show Current Directory'
                    subtitle='Reveal the current working directory'
                    actions={
                        <ActionPanel>
                            <Action.ShowInFinder
                                path={process.cwd()}
                                title='Show Current Dir'
                                icon='📂'
                                shortcut={{ modifiers: ['cmd'], key: '.' }}
                            />
                        </ActionPanel>
                    }
                />
            </List.Section>
        </List>
    )
}

renderWithProviders(<ShowInFinderExample />)
