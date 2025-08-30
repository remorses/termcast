/**
 * OAuth API - OAuth 2.0 authentication with PKCE support
 *
 * Raycast Docs: https://developers.raycast.com/api-reference/oauth
 *
 * The OAuth namespace provides a PKCE (Proof Key for Code Exchange) client
 * for secure OAuth 2.0 authentication flows. It handles authorization,
 * token exchange, and secure token storage.
 *
 * Key features:
 * - PKCE flow implementation for enhanced security
 * - Support for Web, App, and AppURI redirect methods
 * - Automatic token storage and retrieval
 * - Token expiration checking with buffer
 * - Provider configuration with name and icon
 *
 * Usage:
 * const client = new OAuth.PKCEClient({
 *   redirectMethod: OAuth.RedirectMethod.Web,
 *   providerName: "GitHub",
 *   providerIcon: "github-icon.png"
 * })
 *
 * const authRequest = await client.authorizationRequest({
 *   endpoint: "https://github.com/login/oauth/authorize",
 *   clientId: "your-client-id",
 *   scope: "repo user"
 * })
 *
 * const authResponse = await client.authorize(authRequest)
 * // Exchange authResponse.authorizationCode for tokens via provider's token endpoint
 * await client.setTokens(tokenResponse)
 */

import crypto from 'node:crypto'
import http from 'node:http'
import { ImageLike } from '@termcast/cli/src/components/image'
import { logger } from '@termcast/cli/src/logger'
import { LocalStorage } from '@termcast/cli/src/localstorage'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

export namespace OAuth {
  export enum RedirectMethod {
    Web = "web",
    App = "app",
    AppURI = "appURI",
    Device = "device",
    Implicit = "implicit"
  }

  export interface AuthorizationRequestOptions {
    endpoint: string
    clientId: string
    scope: string
    extraParameters?: { [key: string]: string }
  }

  export interface AuthorizationRequestURLParams {
    codeChallenge: string
    codeVerifier: string
    state: string
    redirectURI: string
  }

  export interface AuthorizationRequest extends AuthorizationRequestURLParams {
    toURL(): string
  }

  export interface AuthorizationOptions {
    url: string
  }

  export interface AuthorizationResponse {
    authorizationCode: string
    state?: string
    idToken?: string
    accessToken?: string
  }

  export interface DeviceCodeRequest {
    deviceCode: string
    userCode: string
    verificationUrl: string
    verificationUrlComplete?: string
    expiresIn: number
    interval: number
  }

  export interface DeviceAuthorizationOptions {
    endpoint: string
    clientId: string
    scope: string
    clientSecret?: string
  }

  export interface TokenSet {
    accessToken: string
    refreshToken?: string
    idToken?: string
    expiresIn?: number
    scope?: string
    updatedAt: Date
    isExpired(): boolean
  }

  export interface TokenSetOptions {
    accessToken: string
    refreshToken?: string
    idToken?: string
    expiresIn?: number
    scope?: string
  }

  export interface TokenResponse {
    access_token: string
    refresh_token?: string
    id_token?: string
    expires_in?: number
    scope?: string
  }

  export namespace PKCEClient {
    export interface Options {
      redirectMethod: RedirectMethod
      providerName: string
      providerIcon?: ImageLike
      providerId?: string
      description?: string
    }
  }

  export class PKCEClient {
    redirectMethod: RedirectMethod
    providerName: string
    providerIcon?: ImageLike
    providerId: string
    description?: string
    private storageKey: string

    constructor(options: PKCEClient.Options) {
      this.redirectMethod = options.redirectMethod
      this.providerName = options.providerName
      this.providerIcon = options.providerIcon
      this.providerId = options.providerId || options.providerName.toLowerCase().replace(/\s+/g, '-')
      this.description = options.description
      this.storageKey = `oauth-${this.providerId}`

      // Bind all methods to this instance
      this.authorizationRequest = this.authorizationRequest.bind(this)
      this.authorize = this.authorize.bind(this)
      this.setTokens = this.setTokens.bind(this)
      this.getTokens = this.getTokens.bind(this)
      this.removeTokens = this.removeTokens.bind(this)
      this.generateCodeVerifier = this.generateCodeVerifier.bind(this)
      this.generateCodeChallenge = this.generateCodeChallenge.bind(this)

      logger.log('PKCEClient initialized', {
        providerName: this.providerName,
        providerId: this.providerId,
        redirectMethod: this.redirectMethod
      })
    }

    async authorizationRequest(options: AuthorizationRequestOptions): Promise<AuthorizationRequest> {
      // Generate PKCE parameters
      const codeVerifier = this.generateCodeVerifier()
      const codeChallenge = this.generateCodeChallenge(codeVerifier)
      const state = crypto.randomBytes(32).toString('hex')

      // Determine redirect URI based on redirect method
      let redirectURI: string
      switch (this.redirectMethod) {
        case RedirectMethod.Web:

          redirectURI = `http://localhost:8989/oauth/callback`
          break
        case RedirectMethod.App:
          // redirectURI = `raycast://oauth?package_name=${encodeURIComponent(this.providerId)}`
          // break
        case RedirectMethod.AppURI:
          // redirectURI = `com.raycast:/oauth?package_name=${encodeURIComponent(this.providerId)}`
          // break
        case RedirectMethod.Device:

          // redirectURI = 'urn:ietf:wg:oauth:2.0:oob'
          // break
        case RedirectMethod.Implicit:
          // Implicit flow uses localhost for redirect
          redirectURI = `http://localhost:8989/oauth/callback`
          break
        default:
          redirectURI = 'http://localhost:8989/oauth/callback'
      }

      const request: AuthorizationRequest = {
        codeChallenge,
        codeVerifier,
        state,
        redirectURI,
        toURL: () => {
          const params = new URLSearchParams({

            response_type: options.extraParameters?.response_type || 'id_token token',
            client_id: options.clientId,
            redirect_uri: redirectURI,
            scope: options.scope,
            state: state,
            ...options.extraParameters
          })

          params.append('nonce', crypto.randomBytes(32).toString('hex'))

          return `${options.endpoint}?${params.toString()}`
        }
      }

      return request
    }

    async authorizeDevice(options: DeviceAuthorizationOptions): Promise<AuthorizationResponse> {
      logger.log('Starting device authorization flow', { endpoint: options.endpoint })

      // Step 1: Request device and user codes
      const deviceResponse = await this.requestDeviceCode(options)

      // Step 2: Open browser with the verification URL
      // Use the complete URL if available (it includes the user code)
      const url = deviceResponse.verificationUrlComplete ||
                  `${deviceResponse.verificationUrl}?user_code=${deviceResponse.userCode}`

      logger.log('Opening browser for device authorization', {
        url: deviceResponse.verificationUrl,
        userCode: deviceResponse.userCode
      })

      try {
        const platform = process.platform
        let command: string

        if (platform === 'darwin') {
          command = `open "${url}"`
        } else if (platform === 'win32') {
          command = `start "" "${url}"`
        } else {
          command = `xdg-open "${url}" || sensible-browser "${url}" || x-www-browser "${url}"`
        }

        await execAsync(command)
        logger.log('Browser opened successfully with device authorization URL')
      } catch (error) {
        logger.error('Failed to open browser automatically:', error)
        logger.log('Please manually open:', url)
      }

      // Step 3: Poll for authorization
      const tokenResponse = await this.pollForToken({
        ...options,
        deviceCode: deviceResponse.deviceCode,
        interval: deviceResponse.interval,
        expiresIn: deviceResponse.expiresIn
      })

      return {
        authorizationCode: tokenResponse.access_token,
        state: undefined
      }
    }

    private async requestDeviceCode(options: DeviceAuthorizationOptions): Promise<DeviceCodeRequest> {
      const params = new URLSearchParams({
        client_id: options.clientId,
        scope: options.scope
      })

      const response = await fetch(options.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      })

      if (!response.ok) {
        const error = await response.text()
        logger.error('Device code request failed:', error)
        throw new Error(`Failed to request device code: ${response.statusText}`)
      }

      const data = await response.json() as {
        device_code: string
        user_code: string
        verification_url?: string
        verification_uri?: string
        verification_url_complete?: string
        verification_uri_complete?: string
        expires_in: number
        interval?: number
      }

      return {
        deviceCode: data.device_code,
        userCode: data.user_code,
        verificationUrl: data.verification_url || data.verification_uri || 'https://www.google.com/device',
        verificationUrlComplete: data.verification_url_complete || data.verification_uri_complete,
        expiresIn: data.expires_in,
        interval: data.interval || 5
      }
    }

    private async pollForToken(options: DeviceAuthorizationOptions & {
      deviceCode: string
      interval: number
      expiresIn: number
    }): Promise<OAuth.TokenResponse> {
      const tokenEndpoint = options.endpoint.replace('/device/code', '/token')
      const startTime = Date.now()
      const expiresAt = startTime + (options.expiresIn * 1000)

      while (Date.now() < expiresAt) {
        // Wait for the specified interval
        await new Promise(resolve => setTimeout(resolve, options.interval * 1000))

        const params = new URLSearchParams({
          client_id: options.clientId,
          device_code: options.deviceCode,
          grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
        })

        // Add client secret if provided (required for Google)
        if (options.clientSecret) {
          params.append('client_secret', options.clientSecret)
        }

        try {
          const response = await fetch(tokenEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params.toString()
          })

          const data = await response.json() as {
            access_token?: string
            token_type?: string
            expires_in?: number
            refresh_token?: string
            scope?: string
            id_token?: string
            error?: string
            error_description?: string
            interval?: number
          }

          if (response.ok && data.access_token) {
            logger.log('Device authorization successful')
            return data as OAuth.TokenResponse
          }

          // Check for specific error codes
          if (data.error === 'authorization_pending') {
            // User hasn't authorized yet, continue polling
            continue
          } else if (data.error === 'slow_down') {
            // Increase interval
            options.interval = (data.interval || options.interval) + 1
            logger.log('Slowing down polling interval to', options.interval)
          } else if (data.error === 'access_denied') {
            throw new Error('User denied access')
          } else if (data.error === 'expired_token') {
            throw new Error('Device code expired')
          } else if (data.error) {
            throw new Error(`OAuth error: ${data.error} - ${data.error_description || ''}`)
          }
        } catch (error) {
          if (error instanceof Error && error.message.includes('denied')) {
            throw error
          }
          logger.error('Error polling for token:', error)
        }
      }

      throw new Error('Device authorization timeout')
    }

    async authorize(options: AuthorizationRequest | AuthorizationOptions): Promise<AuthorizationResponse> {
      const url = 'toURL' in options ? options.toURL() : options.url
      const expectedState = 'toURL' in options ? options.state : undefined

      logger.log('Starting OAuth authorization', { url })

      return new Promise((resolve, reject) => {
        // Create a local server to handle the OAuth callback
        const server = http.createServer((req, res) => {
          const requestUrl = new URL(req.url || '', `http://localhost:${port}`)

          // Check if this is the callback
          if (requestUrl.pathname === '/oauth/callback') {

              res.writeHead(200, { 'Content-Type': 'text/html' })
              res.end(`
                <!DOCTYPE html>
                <html>
                  <head>
                    <title>OAuth Authorization</title>
                    <style>
                      body { font-family: system-ui; padding: 40px; text-align: center; }
                      .success { color: #28a745; }
                    </style>
                  </head>
                  <body>
                    <h1 id="status">Processing...</h1>
                    <p id="message"></p>
                    <script>
                      const hash = window.location.hash.substring(1);
                      const params = new URLSearchParams(hash);
                      const data = {
                        access_token: params.get('access_token'),
                        id_token: params.get('id_token'),
                        expires_in: params.get('expires_in'),
                        state: params.get('state'),
                        error: params.get('error')
                      };

                      fetch('/oauth/implicit-callback', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                      }).then(() => {
                        document.getElementById('status').className = 'success';
                        document.getElementById('status').innerHTML = '&#10003; Authorization Successful';
                        document.getElementById('message').textContent = 'You can close this window and return to the terminal.';
                        setTimeout(() => window.close(), 2000);
                      });
                    </script>
                  </body>
                </html>
              `)
              return

          } else if (requestUrl.pathname === '/oauth/implicit-callback' ) {
            // Handle implicit flow tokens sent from browser
            let body = ''
            req.on('data', chunk => { body += chunk })
            req.on('end', () => {
              try {
                const data = JSON.parse(body)

                if (data.error) {
                  res.writeHead(400)
                  res.end()
                  server.close()
                  reject(new Error(`OAuth error: ${data.error}`))
                  return
                }

                if (data.state !== expectedState) {
                  res.writeHead(400)
                  res.end()
                  server.close()
                  reject(new Error('OAuth state mismatch'))
                  return
                }

                res.writeHead(200)
                res.end()
                server.close()

                // Return tokens for implicit flow
                resolve({
                  authorizationCode: data.access_token || '', // Use access token as code for compatibility
                  accessToken: data.access_token,
                  idToken: data.id_token,
                  state: data.state
                })
              } catch (error) {
                res.writeHead(500)
                res.end()
                server.close()
                reject(error)
              }
            })
          } else {
            // Default response for other paths
            res.writeHead(200, { 'Content-Type': 'text/html' })
            res.end(`
              <!DOCTYPE html>
              <html>
                <head>
                  <title>OAuth Redirect</title>
                  <style>
                    body { font-family: system-ui; padding: 40px; text-align: center; }
                  </style>
                </head>
                <body>
                  <h1>OAuth Authorization</h1>
                  <p>Waiting for authorization callback...</p>
                </body>
              </html>
            `)
          }
        })

        // Find an available port
        const port = 8989

        server.listen(port, async () => {
          logger.log(`OAuth callback server listening on http://localhost:${port}/oauth/callback`)

          // The URL should already have the correct redirect_uri from authorizationRequest
          // Don't override it here as it needs to match what was configured in Google Console
          const finalUrl = url
          logger.log('Opening browser with OAuth URL:', finalUrl)

          // Open the browser
          try {
            const platform = process.platform
            let command: string

            if (platform === 'darwin') {
              command = `open "${finalUrl}"`
            } else if (platform === 'win32') {
              command = `start "" "${finalUrl}"`
            } else {
              // Linux and others
              command = `xdg-open "${finalUrl}" || sensible-browser "${finalUrl}" || x-www-browser "${finalUrl}"`
            }

            await execAsync(command)
            logger.log('Browser opened successfully')
          } catch (error) {
            server.close()
            reject(new Error(`Failed to open browser: ${error}`))
          }
        })

        server.on('error', (error) => {
          logger.error('OAuth server error:', error)
          reject(error)
        })

        // Set a timeout for the authorization
        setTimeout(() => {
          server.close()
          reject(new Error('OAuth authorization timeout'))
        }, 5 * 60 * 1000) // 5 minutes timeout
      })
    }

    async setTokens(options: TokenSetOptions | TokenResponse): Promise<void> {
      // Convert TokenResponse to TokenSetOptions if needed
      const tokenSet: TokenSetOptions = 'access_token' in options ? {
        accessToken: options.access_token,
        refreshToken: options.refresh_token,
        idToken: options.id_token,
        expiresIn: options.expires_in,
        scope: options.scope
      } : options

      const storedTokenSet: TokenSet = {
        ...tokenSet,
        updatedAt: new Date(),
        isExpired: function() {
          if (!this.expiresIn) return false
          const expiresAt = new Date(this.updatedAt.getTime() + (this.expiresIn * 1000))
          // Add 10 seconds buffer
          return new Date().getTime() > (expiresAt.getTime() - 10000)
        }
      }

      const dataToStore = {
        ...storedTokenSet,
        updatedAt: storedTokenSet.updatedAt.toISOString()
      }

      logger.log('Storing tokens for', this.providerId, {
        storageKey: this.storageKey,
        hasAccessToken: !!tokenSet.accessToken,
        hasRefreshToken: !!tokenSet.refreshToken,
        hasIdToken: !!tokenSet.idToken,
        expiresIn: tokenSet.expiresIn
      })

      await LocalStorage.setItem(this.storageKey, JSON.stringify(dataToStore))

      // Verify storage
      const stored = await LocalStorage.getItem(this.storageKey)
      if (stored) {
        logger.log('Tokens successfully stored and verified for', this.providerId)
      } else {
        logger.error('Failed to verify token storage for', this.providerId)
      }
    }

    async getTokens(): Promise<TokenSet | undefined> {
      logger.log('Getting tokens for', this.providerId, { storageKey: this.storageKey })

      const stored = await LocalStorage.getItem(this.storageKey)
      if (!stored) {
        logger.log('No tokens found for', this.providerId)
        return undefined
      }

      const parsed = JSON.parse(stored as string)
      const tokenSet: TokenSet = {
        ...parsed,
        updatedAt: new Date(parsed.updatedAt),
        isExpired: function() {
          if (!this.expiresIn) return false
          const expiresAt = new Date(this.updatedAt.getTime() + (this.expiresIn * 1000))
          // Add 10 seconds buffer
          return new Date().getTime() > (expiresAt.getTime() - 10000)
        }
      }

      logger.log('Retrieved tokens for', this.providerId, {
        hasAccessToken: !!tokenSet.accessToken,
        hasRefreshToken: !!tokenSet.refreshToken,
        isExpired: tokenSet.isExpired()
      })

      return tokenSet
    }

    async removeTokens(): Promise<void> {
      await LocalStorage.removeItem(this.storageKey)
      logger.log('Tokens removed for', this.providerId)
    }

    private generateCodeVerifier(): string {
      return crypto.randomBytes(32).toString('base64url')
    }

    private generateCodeChallenge(verifier: string): string {
      return crypto
        .createHash('sha256')
        .update(verifier)
        .digest('base64url')
    }
  }
}
