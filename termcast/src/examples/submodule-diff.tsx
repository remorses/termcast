import { $ } from 'bun'
import path from 'node:path'
import React from 'react'
import { List, Action, ActionPanel, renderWithProviders } from 'termcast'

interface FileDiff {
  file: string
  additions: number
  deletions: number
}

interface SubmoduleDiff {
  name: string
  path: string
  files: FileDiff[]
}

async function getSubmodules(): Promise<{ name: string; path: string }[]> {
  const result = await $`git submodule status`.text()
  return result
    .trim()
    .split('\n')
    .filter((line) => {
      return line.trim()
    })
    .map((line) => {
      const parts = line.trim().split(/\s+/)
      const submodulePath = parts[1]
      return {
        name: path.basename(submodulePath),
        path: submodulePath,
      }
    })
}

async function getSubmoduleDiff({ submodulePath }: { submodulePath: string }): Promise<FileDiff[]> {
  try {
    const result = await $`git -C ${submodulePath} diff --numstat`.text()
    if (!result.trim()) {
      return []
    }
    return result
      .trim()
      .split('\n')
      .filter((line) => {
        return line.trim()
      })
      .map((line) => {
        const [additions, deletions, file] = line.split('\t')
        return {
          file,
          additions: additions === '-' ? 0 : parseInt(additions, 10),
          deletions: deletions === '-' ? 0 : parseInt(deletions, 10),
        }
      })
  } catch {
    return []
  }
}

async function loadSubmoduleDiffs(): Promise<SubmoduleDiff[]> {
  const submodules = await getSubmodules()
  const allRepos = [{ name: 'root', path: '.' }, ...submodules]
  const diffs = await Promise.all(
    allRepos.map(async (sub) => {
      const files = await getSubmoduleDiff({ submodulePath: sub.path })
      return {
        name: sub.name,
        path: sub.path,
        files,
      }
    }),
  )
  return diffs.filter((d) => {
    return d.files.length > 0
  })
}

const POLL_INTERVAL_MS = 2000

function SubmoduleDiffList(): any {
  const [diffs, setDiffs] = React.useState<SubmoduleDiff[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null)

  React.useEffect(() => {
    let mounted = true

    const refresh = async () => {
      const result = await loadSubmoduleDiffs()
      if (mounted) {
        setDiffs(result)
        setIsLoading(false)
        setLastUpdated(new Date())
      }
    }

    refresh()
    const interval = setInterval(refresh, POLL_INTERVAL_MS)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  const subtitle = lastUpdated ? `Watching · Last checked ${lastUpdated.toLocaleTimeString()}` : undefined

  return (
    <List navigationTitle='Submodule Diffs' isLoading={isLoading} searchBarPlaceholder='Search files...'>
      {diffs.length === 0 && !isLoading ? (
        <List.EmptyView title='No changes' description={`No uncommitted changes in submodules · ${subtitle}`} />
      ) : (
        diffs.map((submodule) => {
          return (
            <List.Section
              key={submodule.name}
              title={submodule.name}
              subtitle={`${submodule.files.length} file${submodule.files.length === 1 ? '' : 's'}`}
            >
              {submodule.files.map((file) => {
                const fullPath = path.join(submodule.path, file.file)
                const stats = `+${file.additions}-${file.deletions}`
                return (
                  <List.Item
                    key={fullPath}
                    id={fullPath}
                    title={file.file}
                    accessories={[{ text: stats }]}
                    actions={
                      <ActionPanel>
                        <Action
                          title='Open in Zed'
                          onAction={async () => {
                            await $`zed ${fullPath}`
                          }}
                        />
                      </ActionPanel>
                    }
                  />
                )
              })}
            </List.Section>
          )
        })
      )}
    </List>
  )
}

await renderWithProviders(<SubmoduleDiffList />)
