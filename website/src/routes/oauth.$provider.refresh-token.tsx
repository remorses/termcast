/**
 * Generic OAuth Token Refresh Endpoint
 *
 * Refreshes an expired access token using a refresh token.
 * Note: Not all providers support refresh tokens (GitHub OAuth doesn't).
 *
 * URL: /oauth/:provider/refresh-token
 *
 * POST body (JSON or form-urlencoded):
 * - refresh_token: The refresh token to use
 */

import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router'
import {
  getProviderConfig,
  getProviderCredentials,
} from '../lib/oauth-providers'

export async function action({ request, params }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const provider = params.provider
  if (!provider) {
    return Response.json({ error: 'Missing provider' }, { status: 400 })
  }

  const providerConfig = getProviderConfig(provider)
  if (!providerConfig) {
    return Response.json(
      { error: `Unknown OAuth provider: ${provider}` },
      { status: 400 },
    )
  }

  const credentials = getProviderCredentials(provider)
  if (!credentials) {
    return Response.json(
      { error: `OAuth not configured for provider: ${provider}` },
      { status: 500 },
    )
  }

  // Parse request body
  let body: Record<string, string>
  const contentType = request.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    body = await request.json()
  } else {
    const formData = await request.formData()
    body = Object.fromEntries(formData.entries()) as Record<string, string>
  }

  const { refresh_token } = body

  if (!refresh_token) {
    return Response.json(
      { error: 'Missing refresh_token parameter' },
      { status: 400 },
    )
  }

  const refreshParams = new URLSearchParams({
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    grant_type: 'refresh_token',
    refresh_token: refresh_token,
  })

  try {
    const tokenResponse = await fetch(providerConfig.tokenUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: refreshParams.toString(),
    })

    const responseText = await tokenResponse.text()
    let tokens: Record<string, unknown>

    try {
      tokens = JSON.parse(responseText)
    } catch {
      const parsed = new URLSearchParams(responseText)
      tokens = Object.fromEntries(parsed.entries())
    }

    if (!tokenResponse.ok || tokens.error) {
      return Response.json(
        {
          error: tokens.error || 'refresh_failed',
          error_description: tokens.error_description || 'Token refresh failed',
        },
        { status: tokenResponse.ok ? 400 : tokenResponse.status },
      )
    }

    return Response.json(tokens, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error) {
    console.error('Token refresh error:', error)
    return Response.json(
      { error: 'Internal server error during token refresh' },
      { status: 500 },
    )
  }
}

export async function loader({ request }: LoaderFunctionArgs) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  return new Response('Use POST method', { status: 405 })
}

// IMPORTANT! no default export or loaders will return html always
