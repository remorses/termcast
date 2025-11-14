import React from 'react'
import { List, environment, Toast, showToast } from 'termcast'
import { renderWithProviders } from 'termcast'

function EnvironmentExample(): any {
  const handleShowEnvironment = async () => {
    const envInfo = `
Raycast Version: ${environment.raycastVersion}
Extension: ${environment.extensionName}
Command: ${environment.commandName}
Theme: ${environment.appearance}
Text Size: ${environment.textSize}
Is Development: ${environment.isDevelopment}
Launch Type: ${environment.launchType}
Owner/Author: ${environment.ownerOrAuthorName}
Support Path: ${environment.supportPath}
Assets Path: ${environment.assetsPath}
Command Mode: ${environment.commandMode}
        `.trim()

    await showToast(Toast.Style.Success, 'Environment Info', envInfo)
  }

  return (
    <List>
      <List.Item
        title='Show Environment Info'
        subtitle={`Current theme: ${environment.appearance}`}
        actions={
          <ActionPanel>
            <Action title='Show Details' onAction={handleShowEnvironment} />
          </ActionPanel>
        }
      />
      <List.Item title='Extension Name' subtitle={environment.extensionName} />
      <List.Item
        title='Development Mode'
        subtitle={environment.isDevelopment ? 'Yes' : 'No'}
      />
      <List.Item title='Launch Type' subtitle={environment.launchType} />
    </List>
  )
}

// Import ActionPanel and Action to use them
import { ActionPanel, Action } from 'termcast'

if (require.main === module) {
  await renderWithProviders(<EnvironmentExample />)
}
