import React from 'react'
import { List, ActionPanel, Action, showToast, Toast } from 'termcast'
import { useQuery } from '@tanstack/react-query'
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
    refetch,
  } = useQuery({
    queryKey: ['users', searchText],
    queryFn: () => fetchUsers(searchText),
    placeholderData: (previousData) => previousData,
  })

  React.useEffect(() => {
    if (error) {
      showToast({
        style: Toast.Style.Failure,
        title: 'Failed to fetch users',
        message: (error as Error).message,
      })
    }
  }, [error])

  React.useEffect(() => {
    if (users) {
      console.log(`Fetched ${users.length} users`)
    }
  }, [users])

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
                <Action title='Refresh Users' onAction={() => refetch()} />
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

renderWithProviders(<UsePromiseExample />)
