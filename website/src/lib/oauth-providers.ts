/**
 * OAuth Provider Configuration
 *
 * Each provider needs:
 * - authorizeUrl: Where to send users to authenticate
 * - tokenUrl: Where to exchange codes for tokens
 * - Environment variables: {PROVIDER}_OAUTH_CLIENT_ID and {PROVIDER}_OAUTH_CLIENT_SECRET
 *
 * To add a new provider:
 * 1. Add config here
 * 2. Set env vars: PROVIDERNAME_OAUTH_CLIENT_ID, PROVIDERNAME_OAUTH_CLIENT_SECRET
 * 3. Register OAuth app with provider, set callback to: https://termcast.io/oauth/{provider}/callback
 */

export interface OAuthProviderConfig {
  authorizeUrl: string
  tokenUrl: string
  // Some providers need special handling
  tokenResponseFormat?: 'json' | 'form'
  // Extra params to add to authorize URL
  extraAuthorizeParams?: Record<string, string>
}

export const OAUTH_PROVIDERS: Record<string, OAuthProviderConfig> = {
  github: {
    authorizeUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
  },
  linear: {
    authorizeUrl: 'https://linear.app/oauth/authorize',
    tokenUrl: 'https://api.linear.app/oauth/token',
    extraAuthorizeParams: {
      actor: 'user',
    },
  },
  slack: {
    authorizeUrl: 'https://slack.com/oauth/v2/authorize',
    tokenUrl: 'https://slack.com/api/oauth.v2.access',
  },
  asana: {
    authorizeUrl: 'https://app.asana.com/-/oauth_authorize',
    tokenUrl: 'https://app.asana.com/-/oauth_token',
  },
  google: {
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    extraAuthorizeParams: {
      access_type: 'offline',
      prompt: 'consent',
    },
  },
  jira: {
    authorizeUrl: 'https://auth.atlassian.com/authorize',
    tokenUrl: 'https://auth.atlassian.com/oauth/token',
    extraAuthorizeParams: {
      audience: 'api.atlassian.com',
      prompt: 'consent',
    },
  },
  zoom: {
    authorizeUrl: 'https://zoom.us/oauth/authorize',
    tokenUrl: 'https://zoom.us/oauth/token',
  },
  notion: {
    authorizeUrl: 'https://api.notion.com/v1/oauth/authorize',
    tokenUrl: 'https://api.notion.com/v1/oauth/token',
  },
  spotify: {
    authorizeUrl: 'https://accounts.spotify.com/authorize',
    tokenUrl: 'https://accounts.spotify.com/api/token',
  },
  dropbox: {
    authorizeUrl: 'https://www.dropbox.com/oauth2/authorize',
    tokenUrl: 'https://api.dropboxapi.com/oauth2/token',
  },
}

/**
 * Get OAuth credentials from environment variables
 */
export function getProviderCredentials(provider: string): {
  clientId: string
  clientSecret: string
} | null {
  const envPrefix = provider.toUpperCase()
  const clientId = process.env[`${envPrefix}_OAUTH_CLIENT_ID`]
  const clientSecret = process.env[`${envPrefix}_OAUTH_CLIENT_SECRET`]

  if (!clientId || !clientSecret) {
    return null
  }

  return { clientId, clientSecret }
}

export function getProviderConfig(
  provider: string,
): OAuthProviderConfig | null {
  return OAUTH_PROVIDERS[provider.toLowerCase()] || null
}
