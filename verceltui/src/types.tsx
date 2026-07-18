// Vercel API types, simplified from vercast's types.d.ts.
// Only includes types needed for the deployments list command.

export type DeploymentState =
  | 'BUILDING'
  | 'ERROR'
  | 'FAILED'
  | 'INITIALIZING'
  | 'READY'
  | 'QUEUED'
  | 'CANCELED'

export interface Deployment {
  uid: string
  id?: string
  name: string
  url: string
  createdAt: number
  readyState?: DeploymentState
  state?: DeploymentState
  target?: ('production' | 'staging') | null
  source?: 'cli' | 'git' | 'import'
  inspectorUrl: string | null
  meta: Record<string, string>
  creator: {
    uid: string
    username?: string
  }
  alias: string[]
  regions: string[]
}

export interface Team {
  id: string
  slug: string
  name: string
}

export interface User {
  id: string
  uid: string
  username: string
  email: string
  name?: string
}

export interface Pagination {
  count: number
  next: number | null
  prev: number | null
}
