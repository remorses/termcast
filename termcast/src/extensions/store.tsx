import React, { useState } from 'react'
import fs from 'node:fs'
import path from 'node:path'
import dedent from 'dedent'
import { useQuery } from '@tanstack/react-query'
import { List, Detail, Action, ActionPanel, showToast, Toast, Icon } from '@termcast/api'
import { useNavigation } from '@termcast/api/src/internal/navigation'
import { searchStoreListings } from '../store-api/search'
import { fetchExtension } from '../store-api/extension'
import { downloadExtension } from '../store-api/download'
import { getStoreDirectory } from '../store'
import { buildExtensionCommands } from '../build'
import { logger } from '../logger'

interface StoreListing {
    id: string
    name: string
    author: {
        name: string
        handle: string
    }
    owner: {
        name: string
        handle: string
    }
    title: string
    description: string
    download_count: number
    updated_at: number
    categories: string[]
    commands: Array<{
        title: string
        description: string
        mode: string
    }>
}

function StoreSearch(): any {
    const [searchQuery, setSearchQuery] = useState('')
    const { push } = useNavigation()

    const {
        isLoading,
        data: extensions,
        error,
    } = useQuery({
        queryKey: ['store-search', searchQuery],
        queryFn: async () => {
            // Default to popular/featured extensions if no query
            const query = searchQuery.trim() || 'raycast'
            const response = await searchStoreListings({ query })
            return response.data
        },


        placeholderData: (previousData) => previousData, // Keep previous data while fetching
    })

    // Show error toast if query fails
    React.useEffect(() => {
        if (error) {
            showToast({
                style: Toast.Style.Failure,
                title: 'Search failed',
                message: (error as Error).message,
            })
        }
    }, [error])

    return (
        <List
            navigationTitle="Store - Install Extensions"
            searchBarPlaceholder="Search extensions..."
            onSearchTextChange={setSearchQuery}
            isLoading={isLoading}
        >
            {extensions?.map((ext) => (
                <List.Item
                    key={ext.id}
                    id={ext.id}
                    title={ext.title}
                    subtitle={ext.description}
                    accessories={[
                        { text: `${ext.commands.length} command${ext.commands.length !== 1 ? 's' : ''}` },
                        { text: `${ext.download_count.toLocaleString()} downloads` },
                    ]}
                    keywords={ext.categories}
                    actions={
                        <ActionPanel>
                            <Action
                                title="View Details"
                                onAction={() => {
                                    push(<ExtensionDetails extension={ext} />)
                                }}
                            />
                            <Action.OpenInBrowser
                                url={`https://raycast.com/${ext.owner.handle}/${ext.name}`}
                                title="Open in Raycast Store"
                            />
                        </ActionPanel>
                    }
                />
            ))}
        </List>
    )
}

function ExtensionDetails({ extension }: { extension: StoreListing }): any {
    const [isInstalling, setIsInstalling] = useState(false)
    const { pop } = useNavigation()

    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
    }

    const handleInstall = async () => {
        setIsInstalling(true)
        try {
            await showToast({
                style: Toast.Style.Animated,
                title: 'Downloading extension...',
            })

            const files = await downloadExtension({
                author: extension.owner.handle,
                extension: extension.name,
            })

            const storeDir = getStoreDirectory()
            const extensionDir = path.join(storeDir, extension.name)

            if (fs.existsSync(extensionDir)) {
                fs.rmSync(extensionDir, { recursive: true, force: true })
            }

            fs.mkdirSync(extensionDir, { recursive: true })

            // Write all files to the extension directory
            for (const file of files) {
                const filePath = path.join(extensionDir, file.filename)
                const fileDir = path.dirname(filePath)

                if (!fs.existsSync(fileDir)) {
                    fs.mkdirSync(fileDir, { recursive: true })
                }

                fs.writeFileSync(filePath, file.buffer)
            }

            await showToast({
                style: Toast.Style.Animated,
                title: 'Building extension...',
            })

            // Build the extension commands to create bundles
            try {
                const buildResult = await buildExtensionCommands({
                    extensionPath: extensionDir
                })
                logger.log(`Built ${buildResult.commands.length} commands for ${extension.name}`)
            } catch (buildError: any) {
                // Log build error but don't fail installation
                logger.error(`Failed to build extension commands: ${buildError.message}`)
                await showToast({
                    style: Toast.Style.Animated,
                    title: 'Warning',
                    message: buildError?.message,
                })
                return
            }

            await showToast({
                style: Toast.Style.Success,
                title: 'Extension installed',
                message: `${extension.title} has been installed successfully`,
            })

            logger.log(`Extension '${extension.name}' installed to ${extensionDir}`)
            pop()
        } catch (error: any) {
            await showToast({
                style: Toast.Style.Failure,
                title: 'Installation failed',
                message: error.message,
            })
        } finally {
            setIsInstalling(false)
        }
    }

    const markdownContent = dedent`
        # ${extension.title}

        ${extension.description}

        ## Commands

        ${extension.commands.map(cmd => dedent`
            ### ${cmd.title}
            ${cmd.description || 'No description available'}
            **Mode:** ${cmd.mode}
        `).join('\n\n')}

        ## Information

        - **Author:** ${extension.author.name} (@${extension.author.handle})
        - **Downloads:** ${extension.download_count.toLocaleString()}
        - **Last Updated:** ${formatDate(extension.updated_at)}
        - **Categories:** ${extension.categories.join(', ')}
    `

    return (
        <Detail
            navigationTitle={extension.title}
            markdown={markdownContent}
            metadata={
                <Detail.Metadata>
                    <Detail.Metadata.Label title="Author" text={extension.author.name} />
                    <Detail.Metadata.Label title="Downloads" text={extension.download_count.toLocaleString()} />
                    <Detail.Metadata.Label title="Commands" text={extension.commands.length.toString()} />
                    <Detail.Metadata.Separator />
                    <Detail.Metadata.Label title="Updated" text={formatDate(extension.updated_at)} />
                    <Detail.Metadata.TagList title="Categories">
                        {extension.categories.map((cat, index) => (
                            <Detail.Metadata.TagList.Item text={cat} />
                        ))}
                    </Detail.Metadata.TagList>
                </Detail.Metadata>
            }
            actions={
                <ActionPanel>
                    <Action
                        title={isInstalling ? "Installing..." : "Install Extension"}
                        onAction={handleInstall}
                    />
                    <Action.OpenInBrowser
                        url={`https://raycast.com/${extension.owner.handle}/${extension.name}`}
                        title="View in Raycast Store"
                    />
                </ActionPanel>
            }
        />
    )
}

export default function Store(): any {
    return <StoreSearch />
}
