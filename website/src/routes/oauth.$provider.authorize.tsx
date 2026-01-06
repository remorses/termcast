/**
 * Generic OAuth Authorization Endpoint
 *
 * Redirects users to the provider's OAuth authorization page.
 * Works for any provider configured in oauth-providers.ts
 *
 * URL: /oauth/:provider/authorize
 *
 * Query params from termcast:
 * - redirect_uri: Where to redirect after auth (localhost callback)
 * - scope: OAuth scopes requested
 * - state: CSRF protection token
 * - code_challenge: PKCE code challenge
 * - code_challenge_method: Should be S256
 */

import type { LoaderFunctionArgs } from 'react-router'
import {
  getProviderConfig,
  getProviderCredentials,
} from '../lib/oauth-providers'

export async function loader({ request, params }: LoaderFunctionArgs) {
  const provider = params.provider
  if (!provider) {
    return new Response('Missing provider', { status: 400 })
  }

  const providerConfig = getProviderConfig(provider)
  if (!providerConfig) {
    return new Response(`Unknown OAuth provider: ${provider}`, { status: 400 })
  }

  const credentials = getProviderCredentials(provider)
  if (!credentials) {
    return new Response(`OAuth not configured for provider: ${provider}`, {
      status: 500,
    })
  }

  const url = new URL(request.url)
  const queryParams = url.searchParams

  const redirectUri = queryParams.get('redirect_uri')
  const scope = queryParams.get('scope') || ''
  const state = queryParams.get('state') || ''
  const codeChallenge = queryParams.get('code_challenge') || ''
  const codeChallengeMethod = queryParams.get('code_challenge_method') || 'S256'

  if (!redirectUri) {
    return new Response('Missing redirect_uri parameter', { status: 400 })
  }

  // Store original redirect_uri in state so callback can use it
  const callbackState = JSON.stringify({
    originalState: state,
    redirectUri: redirectUri,
  })
  const encodedState = Buffer.from(callbackState).toString('base64url')

  // Build provider's authorization URL
  const authUrl = new URL(providerConfig.authorizeUrl)
  authUrl.searchParams.set('client_id', credentials.clientId)
  authUrl.searchParams.set(
    'redirect_uri',
    `${url.origin}/oauth/${provider}/callback`,
  )
  authUrl.searchParams.set('scope', scope)
  authUrl.searchParams.set('state', encodedState)
  authUrl.searchParams.set('response_type', 'code')

  // Add PKCE params if provided
  if (codeChallenge) {
    authUrl.searchParams.set('code_challenge', codeChallenge)
    authUrl.searchParams.set('code_challenge_method', codeChallengeMethod)
  }

  // Add provider-specific extra params
  if (providerConfig.extraAuthorizeParams) {
    for (const [key, value] of Object.entries(
      providerConfig.extraAuthorizeParams,
    )) {
      authUrl.searchParams.set(key, value)
    }
  }

  return Response.redirect(authUrl.toString(), 302)
}

// IMPORTANT! no default export or loaders will return html always
