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
import { ImageLike } from '@termcast/api/src/components/image'
import { logger } from '@termcast/api/src/logger'
import { LocalStorage } from '@termcast/api/src/localstorage'

export namespace OAuth {
  export enum RedirectMethod {
    Web = "web",
    App = "app",
    AppURI = "appURI"
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
          redirectURI = `https://raycast.com/redirect?packageName=${encodeURIComponent(this.providerId)}`
          break
        case RedirectMethod.App:
          redirectURI = `raycast://oauth?package_name=${encodeURIComponent(this.providerId)}`
          break
        case RedirectMethod.AppURI:
          redirectURI = `com.raycast:/oauth?package_name=${encodeURIComponent(this.providerId)}`
          break
        default:
          redirectURI = ''
      }

      const request: AuthorizationRequest = {
        codeChallenge,
        codeVerifier,
        state,
        redirectURI,
        toURL: () => {
          const params = new URLSearchParams({
            response_type: 'code',
            client_id: options.clientId,
            redirect_uri: redirectURI,
            scope: options.scope,
            state: state,
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
            ...options.extraParameters
          })
          
          return `${options.endpoint}?${params.toString()}`
        }
      }
      
      return request
    }

    async authorize(options: AuthorizationRequest | AuthorizationOptions): Promise<AuthorizationResponse> {
      const url = 'toURL' in options ? options.toURL() : options.url
      
      logger.log('Starting OAuth authorization', { url })
      
      // TODO: Implement real OAuth authorization flow
      // This should:
      // 1. Open the authorization URL in the user's browser
      // 2. Set up a local server or handler to receive the redirect
      // 3. Extract the authorization code from the redirect callback
      // 4. Return the real authorization code
      // For now, we'll simulate the response
      logger.log('OAuth authorization would open:', url)
      
      // TODO: Replace with real authorization code from OAuth provider
      // Simulate authorization code
      const authorizationCode = crypto.randomBytes(32).toString('hex')
      
      return { authorizationCode }
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

      await LocalStorage.setItem(this.storageKey, JSON.stringify({
        ...storedTokenSet,
        updatedAt: storedTokenSet.updatedAt.toISOString()
      }))
      
      logger.log('Tokens stored for', this.providerId)
    }

    async getTokens(): Promise<TokenSet | undefined> {
      const stored = await LocalStorage.getItem(this.storageKey)
      if (!stored) return undefined

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