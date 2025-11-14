import React from 'react'
import { List, ActionPanel, Action, showToast, Toast } from 'termcast'
import { useCachedPromise } from '@raycast/utils'
import { renderWithProviders } from 'termcast'

interface User {
  id: number
  name: string
  email: string
  username: string
  website: string
  company: {
    name: string
  }
}

async function fetchUsers(searchText?: string): Promise<User[]> {
  await new Promise((resolve) => {
    setTimeout(resolve, 800)
  })

  const response = await fetch('https://jsonplaceholder.typicode.com/users')
  const users = (await response.json()) as User[]

  if (searchText) {
    return users.filter((user) => {
      return user.name.toLowerCase().includes(searchText.toLowerCase())
    })
  }

  return users
}

function UsePromiseExample() {
  const [searchText, setSearchText] = React.useState('')

  const {
    isLoading,
    data: users,
    error,
    revalidate,
  } = useCachedPromise(fetchUsers, [searchText], {
    onError: (error) => {
      showToast({
        style: Toast.Style.Failure,
        title: 'Failed to fetch users',
        message: error.message,
      })
    },
    onData: (data) => {
      console.log(`Fetched ${data.length} users`)
    },
    keepPreviousData: true,
  })

  return (
    <List
      isLoading={isLoading}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder='Search users by name...'
      navigationTitle='usePromise Demo'
    >
      {users?.map((user) => {
        return (
          <List.Item
            id={user.id.toString()}
            title={user.name}
            subtitle={user.email}
            accessories={[{ text: user.company.name }]}
            actions={
              <ActionPanel>
                <Action
                  title='Copy Email'
                  onAction={() => {
                    showToast({
                      style: Toast.Style.Success,
                      title: 'Copied to clipboard',
                      message: user.email,
                    })
                  }}
                />
                <Action title='Refresh Users' onAction={revalidate} />
                <Action.OpenInBrowser
                  title='Open Website'
                  url={`https://${user.website}`}
                />
              </ActionPanel>
            }
          />
        )
      })}
    </List>
  )
}

await renderWithProviders(<UsePromiseExample />)
