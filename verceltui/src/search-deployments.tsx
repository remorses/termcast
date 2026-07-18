// Main command: list and search Vercel deployments.
// Split-pane layout with detail panel showing deployment metadata.
// Supports team switching via dropdown and opening deployments in browser.

import { List, ActionPanel, Action, Icon, Color, getPreferenceValues } from 'termcast'
import { useCachedPromise } from '@termcast/utils'
import { useState, useEffect, useRef } from 'react'
import type { Deployment, DeploymentState, Team } from './types'
import {
  fetchDeployments,
  fetchTeams,
  fetchUser,
  getCommitBranch,
  getCommitMessage,
  getDeploymentURL,
  formatRelativeTime,
} from './vercel-api'

const STATE_LABELS: Record<DeploymentState, { label: string; color: string }> = {
  READY: { label: 'Ready', color: Color.Green },
  BUILDING: { label: 'Building', color: Color.Orange },
  INITIALIZING: { label: 'Init', color: Color.Orange },
  FAILED: { label: 'Failed', color: Color.Red },
  ERROR: { label: 'Error', color: Color.Red },
  QUEUED: { label: 'Queued', color: Color.SecondaryText },
  CANCELED: { label: 'Canceled', color: Color.SecondaryText },
}

function stateIcon(state?: DeploymentState) {
  const color = state ? STATE_LABELS[state]?.color : undefined
  return { source: Icon.CircleFilled, tintColor: color || Color.SecondaryText }
}

export default function SearchDeployments() {
  const [selectedTeamId, setSelectedTeamId] = useState<string | undefined>(undefined)
  const [showDetail, setShowDetail] = useState(true)

  const {
    data: user,
    isLoading: userLoading,
  } = useCachedPromise(fetchUser)

  const {
    data: teams,
    isLoading: teamsLoading,
  } = useCachedPromise(fetchTeams)

  const team = teams?.find((t: Team) => t.id === selectedTeamId)

  const {
    data: deployments,
    isLoading: deploymentsLoading,
    revalidate,
  } = useCachedPromise(
    async (teamId?: string, slug?: string) => {
      return fetchDeployments({ teamId, slug })
    },
    [selectedTeamId, team?.slug],
    { execute: Boolean(user) },
  )

  const isLoading = userLoading || teamsLoading || deploymentsLoading

  // Poll deployments every 4 seconds to pick up new builds and status changes
  const revalidateRef = useRef(revalidate)
  revalidateRef.current = revalidate
  useEffect(() => {
    const interval = setInterval(() => {
      revalidateRef.current()
    }, 4000)
    return () => {
      clearInterval(interval)
    }
  }, [])

  return (
    <List
      searchBarPlaceholder="Search Deployments..."
      navigationTitle="Vercel Deployments"
      isLoading={isLoading}
      isShowingDetail={showDetail}
      accessoryTagsLayout={[20, 8, 7]}
      searchBarAccessory={
        teams && teams.length > 0 ? (
          <List.Dropdown
            tooltip="Switch Team"
            value={selectedTeamId || '_personal'}
            onChange={(value) => {
              setSelectedTeamId(value === '_personal' ? undefined : value)
            }}
          >
            <List.Dropdown.Item
              title={user?.username || 'Personal'}
              value="_personal"
            />
            {teams.map((t: Team) => (
              <List.Dropdown.Item
                key={t.id}
                title={t.name}
                value={t.id}
              />
            ))}
          </List.Dropdown>
        ) : undefined
      }
    >
      {(deployments || []).map((deployment: Deployment) => {
        const commitMessage = getCommitMessage(deployment)
        const branch = getCommitBranch(deployment)
        const state = deployment.readyState || deployment.state
        const stateInfo = state ? STATE_LABELS[state] : undefined
        const ownerSlug = team?.slug || user?.username || ''
        const deploymentId = (deployment as { id?: string }).id || deployment.uid
        const target = deployment.target || 'preview'

        return (
          <List.Item
            key={deployment.uid}
            title={commitMessage}
            icon={stateIcon(state)}
            accessories={[
              { tag: { value: deployment.name, color: Color.Blue } },
              stateInfo
                ? { tag: { value: stateInfo.label, color: stateInfo.color } }
                : { tag: null },
              { text: formatRelativeTime(deployment.createdAt) },
            ]}
            keywords={[deployment.name, commitMessage, branch || '']}
            detail={
              <List.Item.Detail
                markdown={`**${deployment.name}**\n\n${commitMessage}`}
                metadata={
                  <List.Item.Detail.Metadata>
                    <List.Item.Detail.Metadata.Label title="Project" text={deployment.name} />
                    <List.Item.Detail.Metadata.Label
                      title="Status"
                      text={stateInfo ? { value: stateInfo.label, color: stateInfo.color } : 'Unknown'}
                    />
                    <List.Item.Detail.Metadata.Label title="Target" text={target} />
                    <List.Item.Detail.Metadata.Separator />
                    {branch ? (
                      <List.Item.Detail.Metadata.Label title="Branch" text={branch} />
                    ) : null}
                    <List.Item.Detail.Metadata.Label
                      title="Created"
                      text={new Date(deployment.createdAt).toLocaleString()}
                    />
                    {deployment.creator?.username ? (
                      <List.Item.Detail.Metadata.Label title="Author" text={deployment.creator.username} />
                    ) : null}
                    <List.Item.Detail.Metadata.Separator />
                    <List.Item.Detail.Metadata.Label title="URL" text={deployment.url} />
                    {deployment.source ? (
                      <List.Item.Detail.Metadata.Label title="Source" text={deployment.source} />
                    ) : null}
                  </List.Item.Detail.Metadata>
                }
              />
            }
            actions={
              <ActionPanel>
                {state === 'READY' ? (
                  <>
                    <Action.OpenInBrowser
                      title="Open Deployment URL"
                      url={`https://${deployment.url}`}
                    />
                    {ownerSlug && (
                      <Action.OpenInBrowser
                        title="Open on Vercel"
                        url={getDeploymentURL(ownerSlug, deployment.name, deploymentId)}
                      />
                    )}
                  </>
                ) : (
                  <>
                    {ownerSlug && (
                      <Action.OpenInBrowser
                        title="Open on Vercel"
                        url={getDeploymentURL(ownerSlug, deployment.name, deploymentId)}
                      />
                    )}
                    <Action.OpenInBrowser
                      title="Open Deployment URL"
                      url={`https://${deployment.url}`}
                    />
                  </>
                )}
                <Action.CopyToClipboard
                  title="Copy URL"
                  content={`https://${deployment.url}`}
                />
                <Action
                  title={showDetail ? 'Hide Detail' : 'Show Detail'}
                  icon={Icon.Sidebar}
                  onAction={() => {
                    setShowDetail(!showDetail)
                  }}
                  shortcut={{ modifiers: ['ctrl'], key: 'd' }}
                />
                <Action
                  title="Refresh"
                  icon={Icon.ArrowClockwise}
                  onAction={() => {
                    revalidate()
                  }}
                  shortcut={{ modifiers: ['ctrl'], key: 'r' }}
                />
              </ActionPanel>
            }
          />
        )
      })}
    </List>
  )
}
