/**
 * Generic OAuth Callback Endpoint
 *
 * Receives the authorization code from the provider and redirects
 * back to the termcast localhost server with the code.
 *
 * URL: /oauth/:provider/callback
 *
 * Query params from provider:
 * - code: The authorization code
 * - state: Our encoded state (contains original redirect_uri)
 * - error: Error code if auth failed
 * - error_description: Error details
 */

import type { LoaderFunctionArgs } from 'react-router'
import { getProviderConfig } from '../lib/oauth-providers'

export async function loader({ request, params }: LoaderFunctionArgs) {
  const provider = params.provider
  if (!provider) {
    return new Response('Missing provider', { status: 400 })
  }

  const providerConfig = getProviderConfig(provider)
  if (!providerConfig) {
    return new Response(`Unknown OAuth provider: ${provider}`, { status: 400 })
  }

  const url = new URL(request.url)
  const queryParams = url.searchParams

  const code = queryParams.get('code')
  const encodedState = queryParams.get('state')
  const error = queryParams.get('error')
  const errorDescription = queryParams.get('error_description')

  // Handle errors from provider
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

  // Decode state to get original redirect_uri
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

  // Redirect back to termcast's localhost server with the code
  const callbackUrl = new URL(redirectUri)
  callbackUrl.searchParams.set('code', code)
  callbackUrl.searchParams.set('state', originalState)
  
  const finalUrl = callbackUrl.toString()
  console.log('OAuth callback redirect:', { redirectUri, finalUrl })

  return Response.redirect(finalUrl, 302)
}

export default function OAuthCallback() {
  return (
    <div className='min-h-screen flex items-center justify-center bg-background'>
      <div className='text-center px-4 max-w-md'>
        <h1 className='text-2xl font-semibold mb-4'>Authorization Complete</h1>
        <p className='text-muted-foreground'>
          You can close this window and return to the terminal.
        </p>
      </div>
    </div>
  )
}
