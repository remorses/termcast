/**
 * Generic OAuth Token Exchange Endpoint
 *
 * Exchanges an authorization code for access tokens.
 * Holds the client_secret server-side so termcast doesn't need secrets.
 *
 * URL: /oauth/:provider/token
 *
 * POST body (JSON or form-urlencoded):
 * - code: The authorization code from provider
 * - code_verifier: PKCE code verifier (optional)
 * - redirect_uri: The redirect URI used in authorization
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

  // Parse request body (support both JSON and form-urlencoded)
  let body: Record<string, string>
  const contentType = request.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    body = await request.json()
  } else {
    const formData = await request.formData()
    body = Object.fromEntries(formData.entries()) as Record<string, string>
  }

  const { code, code_verifier } = body

  if (!code) {
    return Response.json({ error: 'Missing code parameter' }, { status: 400 })
  }

  // Get the origin from the request URL to build the correct redirect_uri
  const url = new URL(request.url)
  // The redirect_uri must match what was used during authorization (our callback URL)
  const callbackRedirectUri = `${url.origin}/oauth/${provider}/callback`

  // Build token exchange request
  const tokenParams = new URLSearchParams({
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    code: code,
    grant_type: 'authorization_code',
    redirect_uri: callbackRedirectUri,
  })

  if (code_verifier) {
    tokenParams.set('code_verifier', code_verifier)
  }

  try {
    const tokenResponse = await fetch(providerConfig.tokenUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams.toString(),
    })

    // Some providers return non-JSON, try to parse
    const responseText = await tokenResponse.text()
    let tokens: Record<string, unknown>

    try {
      tokens = JSON.parse(responseText)
    } catch {
      // Try parsing as form-urlencoded (some providers do this)
      const parsed = new URLSearchParams(responseText)
      tokens = Object.fromEntries(parsed.entries())
    }

    if (!tokenResponse.ok || tokens.error) {
      console.error('Token exchange failed:', tokens)
      return Response.json(
        {
          error: tokens.error || 'token_exchange_failed',
          error_description:
            tokens.error_description || 'Token exchange failed',
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
    console.error('Token exchange error:', error)
    return Response.json(
      { error: 'Internal server error during token exchange' },
      { status: 500 },
    )
  }
}

export async function loader({ request }: LoaderFunctionArgs) {
  // Handle CORS preflight
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
