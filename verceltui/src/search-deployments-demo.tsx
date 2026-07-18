// Demo version of search-deployments with hardcoded mock data.
// Used for e2e tests so we don't hit the real Vercel API.
// Mirrors the real command's split-pane layout with detail panel.

import { List, ActionPanel, Action, Icon, Color } from 'termcast'
import { renderWithProviders } from 'termcast/src/utils'
import { useEffect, useState } from 'react'
import type { Deployment, DeploymentState } from './types'
import { getCommitMessage, getCommitBranch, formatRelativeTime } from './vercel-api'

const MOCK_DEPLOYMENTS: Deployment[] = [
  {
    uid: 'dpl_1',
    name: 'my-app',
    url: 'my-app-abc123.vercel.app',
    createdAt: Date.now() - 5 * 60 * 1000,
    readyState: 'READY',
    target: 'production',
    source: 'git',
    inspectorUrl: 'https://vercel.com/team/my-app/dpl_1',
    meta: {
      githubCommitMessage: 'feat: add dark mode toggle',
      githubCommitRef: 'main',
    },
    creator: { uid: 'usr_1', username: 'tommy' },
    alias: [],
    regions: ['iad1'],
  },
  {
    uid: 'dpl_2',
    name: 'my-app',
    url: 'my-app-def456.vercel.app',
    createdAt: Date.now() - 30 * 60 * 1000,
    readyState: 'BUILDING',
    target: 'staging',
    source: 'git',
    inspectorUrl: 'https://vercel.com/team/my-app/dpl_2',
    meta: {
      githubCommitMessage: 'fix: resolve login timeout',
      githubCommitRef: 'fix/login-timeout',
    },
    creator: { uid: 'usr_1', username: 'tommy' },
    alias: [],
    regions: ['iad1'],
  },
  {
    uid: 'dpl_3',
    name: 'docs-site',
    url: 'docs-site-ghi789.vercel.app',
    createdAt: Date.now() - 2 * 60 * 60 * 1000,
    readyState: 'FAILED',
    target: null,
    source: 'git',
    inspectorUrl: 'https://vercel.com/team/docs-site/dpl_3',
    meta: {
      githubCommitMessage: 'chore: update dependencies',
      githubCommitRef: 'chore/deps',
    },
    creator: { uid: 'usr_2', username: 'alice' },
    alias: [],
    regions: ['sfo1'],
  },
  {
    uid: 'dpl_4',
    name: 'api-service',
    url: 'api-service-jkl012.vercel.app',
    createdAt: Date.now() - 24 * 60 * 60 * 1000,
    readyState: 'READY',
    target: 'production',
    source: 'git',
    inspectorUrl: 'https://vercel.com/team/api-service/dpl_4',
    meta: {
      githubCommitMessage: 'perf: optimize database queries',
      githubCommitRef: 'main',
    },
    creator: { uid: 'usr_1', username: 'tommy' },
    alias: [],
    regions: ['iad1'],
  },
  {
    uid: 'dpl_5',
    name: 'landing-page',
    url: 'landing-page-mno345.vercel.app',
    createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    readyState: 'CANCELED',
    target: null,
    source: 'cli',
    inspectorUrl: 'https://vercel.com/team/landing-page/dpl_5',
    meta: {},
    creator: { uid: 'usr_3', username: 'bob' },
    alias: [],
    regions: ['cdg1'],
  },
]

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

function SearchDeploymentsDemo() {
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDeployments(MOCK_DEPLOYMENTS)
      setIsLoading(false)
    }, 100)
    return () => {
      clearTimeout(timer)
    }
  }, [])

  return (
    <List
      searchBarPlaceholder="Search Deployments..."
      navigationTitle="Vercel Deployments"
      isLoading={isLoading}
      isShowingDetail={true}
      accessoryTagsLayout={[34, 10, 8]}
    >
      {deployments.map((deployment: Deployment) => {
        const commitMessage = getCommitMessage(deployment)
        const branch = getCommitBranch(deployment)
        const state = deployment.readyState || deployment.state
        const stateInfo = state ? STATE_LABELS[state] : undefined
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
                <Action.OpenInBrowser
                  title="Open on Vercel"
                  url={`https://vercel.com/team/${deployment.name}/${deployment.uid}`}
                />
                <Action.OpenInBrowser
                  title="Open Deployment URL"
                  url={`https://${deployment.url}`}
                />
                <Action.CopyToClipboard
                  title="Copy URL"
                  content={`https://${deployment.url}`}
                />
              </ActionPanel>
            }
          />
        )
      })}
    </List>
  )
}

await renderWithProviders(<SearchDeploymentsDemo />)
