/**
 * Google OAuth Example using @raycast/utils
 *
 * This example shows how to authenticate with Google using the OAuthService
 * from @raycast/utils package.
 */

import { List, Action, ActionPanel, showToast, Toast, OAuth } from '@termcast/cli'
import { OAuthService } from '@raycast/utils'
import { useState, useEffect } from 'react'
import { renderWithProviders } from '@termcast/cli/src/utils'
import { logger } from '@termcast/cli/src/logger'

// Your iOS OAuth client ID (no secret needed!)
const googleClientId = '561871153864-i08nqb0tu0rpa5kkd5gpkp3sqspfmdvl.apps.googleusercontent.com'


// Decode JWT token to get user info
function decodeJWT(token: string): any {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      throw new Error('Invalid JWT token')
    }

    // Decode the payload (second part)
    const payload = parts[1]
    // Add padding if necessary
    const padded = payload + '='.repeat((4 - payload.length % 4) % 4)
    const decoded = atob(padded.replace(/-/g, '+').replace(/_/g, '/'))

    return JSON.parse(decoded)
  } catch (error) {
    logger.error('Failed to decode JWT:', error)
    return null
  }
}

// Create OAuth service using @raycast/utils
const google = new OAuthService({
  clientId: googleClientId,
  scope: 'openid email profile',
  authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  bodyEncoding: 'url-encoded',
  // extraParameters: {
  //   prompt: 'select_account'
  // },
  async onAuthorize({ idToken, token }) {
    logger.log('Google OAuth authorized', {
      hasIdToken: !!idToken,
      hasAccessToken: !!token
    })
  },
  client: new OAuth.PKCEClient({
    redirectMethod: OAuth.RedirectMethod.AppURI,
    providerName: 'Google',
    providerId: 'google',
    description: 'Sign in with Google'
  }) as any
})

export default function GoogleImplicitExample(): any {
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [idTokenData, setIdTokenData] = useState<any>(null)
  const [rawIdToken, setRawIdToken] = useState<string | null>(null)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const tokens = await google.client.getTokens()
      if (tokens?.idToken && !tokens.isExpired()) {
        setIsAuthorized(true)
        setRawIdToken(tokens.idToken)
        const decoded = decodeJWT(tokens.idToken)
        setIdTokenData(decoded)
      }
    } catch (error) {
      logger.error('Error checking auth status:', error)
    }
  }

  const handleAuthorize = async () => {
    setIsLoading(true)
    try {
      // Try to authorize, but catch token exchange error since we use implicit flow
      await google.authorize()

      // Get the tokens that were stored by implicit flow
      const tokens = await google.client.getTokens()

      if (!tokens?.idToken) {
        throw new Error('No ID token received')
      }

      setIsAuthorized(true)
      setRawIdToken(tokens.idToken)

      // Decode the ID token to get user info
      const decoded = decodeJWT(tokens.idToken)
      setIdTokenData(decoded)

      logger.log('ID Token decoded:', decoded)

      await showToast({
        style: Toast.Style.Success,
        title: 'Successfully authorized!',
        message: `Welcome, ${decoded?.email || 'User'}`
      })
    } catch (error) {
      logger.error('Authorization error:', error)
      await showToast({
        style: Toast.Style.Failure,
        title: 'Authorization failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await google.client.removeTokens()
      setIsAuthorized(false)
      setIdTokenData(null)
      setRawIdToken(null)

      await showToast({
        style: Toast.Style.Success,
        title: 'Logged out successfully'
      })
    } catch (error) {
      logger.error('Logout error:', error)
    }
  }

  const handleVerifyToken = async () => {
    if (!rawIdToken) {
      await showToast({
        style: Toast.Style.Failure,
        title: 'No ID token available'
      })
      return
    }

    try {
      const { OAuth2Client } = await import('google-auth-library')
      const client = new OAuth2Client(googleClientId)

      const ticket = await client.verifyIdToken({
        idToken: rawIdToken || "",
        audience: googleClientId,
      })

      const payload = ticket.getPayload()

      logger.log('Token verified successfully:', payload)

      await showToast({
        style: Toast.Style.Success,
        title: 'Token Verified',
        message: `Verified for ${payload?.email}`
      })

    } catch (error) {
      logger.error('Token verification error:', error)
      await showToast({
        style: Toast.Style.Failure,
        title: 'Verification Failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  return (
    <List isLoading={isLoading}>
      <List.Section title="Google OAuth Example">
        <List.Item
          title={isAuthorized ? 'Authorized' : 'Not Authorized'}
          subtitle={isAuthorized ? 'Successfully authenticated' : 'Click to sign in with Google'}
          accessories={[
            { text: 'OAuth 2.0' }
          ]}
          actions={
            <ActionPanel>
              {!isAuthorized ? (
                <Action
                  title="Sign in with Google"
                  onAction={handleAuthorize}
                />
              ) : (
                <>
                  <Action
                    title="Verify ID Token"
                    onAction={handleVerifyToken}
                  />
                  <Action
                    title="Logout"
                    onAction={handleLogout}
                  />
                </>
              )}
            </ActionPanel>
          }
        />
      </List.Section>

      {idTokenData && (
        <List.Section title="ID Token Claims (Decoded JWT)">
          <List.Item
            title="Email"
            subtitle={idTokenData.email || 'N/A'}
            accessories={[
              { text: idTokenData.email_verified ? 'Verified' : 'Unverified' }
            ]}
          />
          <List.Item
            title="Name"
            subtitle={idTokenData.name || 'N/A'}
          />
          <List.Item
            title="Subject (User ID)"
            subtitle={idTokenData.sub || 'N/A'}
          />
          <List.Item
            title="Issuer"
            subtitle={idTokenData.iss || 'N/A'}
          />
          <List.Item
            title="Audience (Client ID)"
            subtitle={idTokenData.aud || 'N/A'}
          />
          <List.Item
            title="Issued At"
            subtitle={idTokenData.iat ? new Date(idTokenData.iat * 1000).toLocaleString() : 'N/A'}
          />
          <List.Item
            title="Expires At"
            subtitle={idTokenData.exp ? new Date(idTokenData.exp * 1000).toLocaleString() : 'N/A'}
          />
          {idTokenData.picture && (
            <List.Item
              title="Profile Picture"
              subtitle={idTokenData.picture}
            />
          )}
        </List.Section>
      )}

      <List.Section title="How This Works">
        <List.Item
          title="1. OAuth 2.0 PKCE Flow"
          subtitle="Secure authorization without exposing secrets"
        />
        <List.Item
          title="2. ID Token (JWT)"
          subtitle="Contains user info and can be verified server-side"
        />
        <List.Item
          title="3. Server Verification"
          subtitle="Use google-auth-library to verify: client.verifyIdToken({ idToken, audience })"
        />
      </List.Section>

      <List.Section title="Server-Side Verification Example">
        <List.Item
          title="Node.js with google-auth-library"
          subtitle="const ticket = await client.verifyIdToken({ idToken, audience: clientId })"
        />
        <List.Item
          title="Get User Info"
          subtitle="const payload = ticket.getPayload(); // Contains email, name, sub, etc."
        />
        <List.Item
          title="No Secret Needed"
          subtitle="Verification only requires the client ID, not the secret"
        />
      </List.Section>
    </List>
  )
}
