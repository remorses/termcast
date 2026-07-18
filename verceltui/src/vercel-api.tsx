// Vercel REST API client.
// Ported from vercast (raycast/extensions) with simplifications for termcast.
// API docs: https://vercel.com/docs/rest-api

import { getPreferenceValues, showToast, Toast } from 'termcast'
import type { Deployment, Pagination, Team, User } from './types'

const API_URL = 'https://api.vercel.com/'

function getHeaders() {
  const { accessToken } = getPreferenceValues<{ accessToken: string }>()
  return {
    Authorization: `Bearer ${accessToken}`,
  }
}

export async function fetchUser(): Promise<User> {
  const response = await fetch(API_URL + 'www/user', {
    method: 'get',
    headers: getHeaders(),
  })
  if (!response.ok) {
    throw new Error(`Failed to fetch user: ${response.statusText}`)
  }
  const json = (await response.json()) as { user: User }
  return json.user
}

export async function fetchTeams(): Promise<Team[]> {
  const response = await fetch(API_URL + 'v1/teams', {
    method: 'get',
    headers: getHeaders(),
  })
  if (!response.ok) {
    throw new Error(`Failed to fetch teams: ${response.statusText}`)
  }
  const json = (await response.json()) as { teams: Team[] }
  return json.teams
}

export async function fetchDeployments({
  teamId,
  projectId,
  limit = 50,
  slug,
}: {
  teamId?: string
  projectId?: string
  limit?: number
  slug?: string
} = {}): Promise<Deployment[]> {
  const params = new URLSearchParams({ limit: limit.toString() })
  if (teamId) {
    params.set('teamId', teamId)
  }
  if (slug) {
    params.set('slug', slug)
  }
  if (projectId) {
    params.set('projectId', projectId)
  }

  const url = API_URL + `v6/deployments?${params.toString()}`
  const response = await fetch(url, {
    method: 'get',
    headers: getHeaders(),
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: { message?: string } }
    throw new Error(body?.error?.message || `Failed to fetch deployments: ${response.statusText}`)
  }
  const json = (await response.json()) as {
    deployments: Deployment[]
    pagination: Pagination
  }
  return json.deployments
}

// Extract commit message from deployment metadata (GitHub, GitLab, Bitbucket).
// Newlines are replaced with spaces so list items stay single-line.
export function getCommitMessage(deployment: Deployment): string {
  const msg =
    deployment.meta?.githubCommitMessage ||
    deployment.meta?.gitlabCommitMessage ||
    deployment.meta?.bitbucketCommitMessage ||
    'No commit message'
  return msg.replace(/[\r\n]+/g, ' ').trim()
}

// Extract git branch from deployment metadata
export function getCommitBranch(deployment: Deployment): string | null {
  return (
    deployment.meta?.githubCommitRef ||
    deployment.meta?.gitlabCommitRef ||
    deployment.meta?.bitbucketCommitRef ||
    null
  )
}

// Build the Vercel dashboard URL for a deployment
export function getDeploymentURL(
  ownerSlug: string,
  projectName: string,
  deploymentId: string,
): string {
  const id = deploymentId.startsWith('dpl_')
    ? deploymentId.substring(4)
    : deploymentId
  return `https://vercel.com/${ownerSlug}/${projectName}/${id}`
}

// Format a timestamp as relative time (e.g. "5m ago", "2h ago", "3d ago")
export function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  const seconds = Math.floor(diff / 1000)

  if (seconds < 60) {
    return 'just now'
  }
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) {
    return `${minutes}m ago`
  }
  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours}h ago`
  }
  const days = Math.floor(hours / 24)
  if (days < 30) {
    return `${days}d ago`
  }
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

export function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s
}
