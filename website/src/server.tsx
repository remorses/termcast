/**
 * Spiceflow entry point for the termcast website.
 * Mounts OAuth proxy routes, install script endpoints, and holocron docs.
 */

import { Spiceflow } from 'spiceflow'
import { app as holocronApp } from '@holocron.so/vite/app'
import { generateInstallScript } from 'website/src/lib/generate-install-script'
import {
  getProviderConfig,
  getProviderCredentials,
} from 'website/src/lib/oauth-providers'

// ─── CORS headers helper ────────────────────────────────────────────────────

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// ─── App ────────────────────────────────────────────────────────────────────

export const app = new Spiceflow()
  // ── Install script endpoints ──
  .get('/install', async () => {
    const script = await generateInstallScript('remorses/termcast')
    return new Response(script, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  })
  .get('/:owner/:repo/install', async ({ params }) => {
    const script = await generateInstallScript(
      `${params.owner}/${params.repo}`,
    )
    return new Response(script, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  })
  .get('/r/:repo', async ({ params }) => {
    const script = await generateInstallScript(`remorses/${params.repo}`)
    return new Response(script, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  })

  // ── OAuth authorize ──
  .get('/oauth/:provider/authorize', async ({ request, params }) => {
    const provider = params.provider
    const providerConfig = getProviderConfig(provider)
    if (!providerConfig) {
      return new Response(`Unknown OAuth provider: ${provider}`, {
        status: 400,
      })
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
    const codeChallengeMethod =
      queryParams.get('code_challenge_method') || 'S256'

    if (!redirectUri) {
      return new Response('Missing redirect_uri parameter', { status: 400 })
    }

    const callbackState = JSON.stringify({
      originalState: state,
      redirectUri: redirectUri,
    })
    const encodedState = Buffer.from(callbackState).toString('base64url')

    const authUrl = new URL(providerConfig.authorizeUrl)
    authUrl.searchParams.set('client_id', credentials.clientId)
    authUrl.searchParams.set(
      'redirect_uri',
      `${url.origin}/oauth/${provider}/callback`,
    )
    authUrl.searchParams.set('scope', scope)
    authUrl.searchParams.set('state', encodedState)
    authUrl.searchParams.set('response_type', 'code')

    if (codeChallenge) {
      authUrl.searchParams.set('code_challenge', codeChallenge)
      authUrl.searchParams.set('code_challenge_method', codeChallengeMethod)
    }

    if (providerConfig.extraAuthorizeParams) {
      for (const [key, value] of Object.entries(
        providerConfig.extraAuthorizeParams,
      )) {
        authUrl.searchParams.set(key, value)
      }
    }

    return Response.redirect(authUrl.toString(), 302)
  })

  // ── OAuth callback ──
  .get('/oauth/:provider/callback', async ({ request, params }) => {
    const provider = params.provider
    const providerConfig = getProviderConfig(provider)
    if (!providerConfig) {
      return new Response(`Unknown OAuth provider: ${provider}`, {
        status: 400,
      })
    }

    const url = new URL(request.url)
    const queryParams = url.searchParams
    const code = queryParams.get('code')
    const encodedState = queryParams.get('state')
    const error = queryParams.get('error')
    const errorDescription = queryParams.get('error_description')

    if (error) {
      return new Response(
        `OAuth error: ${error} - ${errorDescription || 'Unknown error'}`,
        { status: 400 },
      )
    }
    if (!code) {
      return new Response('Missing authorization code', { status: 400 })
    }
    if (!encodedState) {
      return new Response('Missing state parameter', { status: 400 })
    }

    let originalState: string
    let redirectUri: string
    try {
      const stateData = JSON.parse(
        Buffer.from(encodedState, 'base64url').toString('utf-8'),
      )
      originalState = stateData.originalState
      redirectUri = stateData.redirectUri
    } catch {
      return new Response('Invalid state parameter', { status: 400 })
    }

    if (!redirectUri) {
      return new Response('Missing redirect URI in state', { status: 400 })
    }

    const callbackUrl = new URL(redirectUri)
    callbackUrl.searchParams.set('code', code)
    callbackUrl.searchParams.set('state', originalState)

    const finalUrl = callbackUrl.toString()
    console.log('OAuth callback redirect:', { redirectUri, finalUrl })

    return Response.redirect(finalUrl, 302)
  })

  // ── OAuth token exchange ──
  .route({
    method: 'OPTIONS',
    path: '/oauth/:provider/token',
    handler: async () => {
      return new Response(null, { headers: CORS_HEADERS })
    },
  })
  .post('/oauth/:provider/token', async ({ request, params }) => {
    const provider = params.provider
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

    let body: Record<string, string>
    const contentType = request.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      body = (await request.json()) as Record<string, string>
    } else {
      const formData = await request.formData()
      body = Object.fromEntries(formData.entries()) as Record<string, string>
    }

    const { code, code_verifier } = body
    if (!code) {
      return Response.json(
        { error: 'Missing code parameter' },
        { status: 400 },
      )
    }

    const url = new URL(request.url)
    const callbackRedirectUri = `${url.origin}/oauth/${provider}/callback`

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

      const responseText = await tokenResponse.text()
      let tokens: Record<string, unknown>
      try {
        tokens = JSON.parse(responseText)
      } catch {
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

      return Response.json(tokens, { headers: CORS_HEADERS })
    } catch (error) {
      console.error('Token exchange error:', error)
      return Response.json(
        { error: 'Internal server error during token exchange' },
        { status: 500 },
      )
    }
  })

  // ── OAuth token refresh ──
  .route({
    method: 'OPTIONS',
    path: '/oauth/:provider/refresh-token',
    handler: async () => {
      return new Response(null, { headers: CORS_HEADERS })
    },
  })
  .post('/oauth/:provider/refresh-token', async ({ request, params }) => {
    const provider = params.provider
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

    let body: Record<string, string>
    const contentType = request.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      body = (await request.json()) as Record<string, string>
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
            error_description:
              tokens.error_description || 'Token refresh failed',
          },
          { status: tokenResponse.ok ? 400 : tokenResponse.status },
        )
      }

      return Response.json(tokens, { headers: CORS_HEADERS })
    } catch (error) {
      console.error('Token refresh error:', error)
      return Response.json(
        { error: 'Internal server error during token refresh' },
        { status: 500 },
      )
    }
  })

  // ── Mount holocron docs (catches all page routes) ──
  .use(holocronApp)

export default {
  async fetch(request: Request): Promise<Response> {
    return app.handle(request)
  },
}
