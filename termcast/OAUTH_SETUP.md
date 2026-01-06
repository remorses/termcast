# OAuth Setup for Termcast

Termcast uses an OAuth proxy hosted on `termcast.app` to handle OAuth authentication for Raycast extensions. This allows extensions to authenticate with providers like GitHub, Linear, Slack, etc. without embedding client secrets.

## How It Works

```
1. Extension calls OAuthService.github() (or other provider)
2. Browser opens: https://termcast.app/oauth/github/authorize
3. termcast.app redirects to GitHub's OAuth page
4. User authenticates on GitHub
5. GitHub redirects to: https://termcast.app/oauth/github/callback
6. termcast.app redirects to: http://localhost:8989/oauth/callback?code=XXX
7. Termcast CLI exchanges code via: POST https://termcast.app/oauth/github/token
8. termcast.app exchanges code for token (client_secret stored server-side)
9. Termcast CLI receives and stores access_token
```

## Supported Providers

| Provider | Status | Notes |
|----------|--------|-------|
| GitHub | Ready | Needs OAuth app registered |
| Linear | Ready | Needs OAuth app registered |
| Slack | Ready | Needs OAuth app registered |
| Asana | Ready | Needs OAuth app registered |
| Google | Config only | Uses direct URLs, needs user client ID |
| Jira | Config only | Uses direct URLs, needs user client ID |
| Zoom | Config only | Uses direct URLs, needs user client ID |
| Notion | Config only | Needs OAuth app registered |
| Spotify | Config only | Needs OAuth app registered |
| Dropbox | Config only | Needs OAuth app registered |

## Setting Up a New Provider (for termcast maintainers)

### 1. Register OAuth App with Provider

Go to the provider's developer console and create an OAuth app:

- **GitHub**: https://github.com/settings/developers
- **Linear**: https://linear.app/settings/api
- **Slack**: https://api.slack.com/apps
- etc.

Set the callback URL to:
```
https://termcast.app/oauth/{provider}/callback
```

### 2. Add Environment Variables

Add to your website deployment (e.g., Vercel):

```bash
GITHUB_OAUTH_CLIENT_ID=your_client_id
GITHUB_OAUTH_CLIENT_SECRET=your_client_secret
```

Pattern: `{PROVIDER}_OAUTH_CLIENT_ID` and `{PROVIDER}_OAUTH_CLIENT_SECRET`

### 3. Add Provider Config (if not already present)

Edit `website/src/lib/oauth-providers.ts`:

```typescript
export const OAUTH_PROVIDERS = {
  // ...
  newprovider: {
    authorizeUrl: 'https://newprovider.com/oauth/authorize',
    tokenUrl: 'https://newprovider.com/oauth/token',
    // Optional: extra params for authorization URL
    extraAuthorizeParams: {
      access_type: 'offline',
    },
  },
}
```

### 4. Update raycast-utils Fork (if needed)

If the provider has a static method in OAuthService (like `OAuthService.github()`), update `raycast-utils/src/oauth/OAuthService.ts` to use termcast.app URLs:

```typescript
static newprovider(options) {
  return new OAuthService({
    authorizeUrl: options.authorizeUrl ?? "https://termcast.app/oauth/newprovider/authorize",
    tokenUrl: options.tokenUrl ?? "https://termcast.app/oauth/newprovider/token",
    refreshTokenUrl: options.refreshTokenUrl ?? "https://termcast.app/oauth/newprovider/refresh-token",
    // ...
  })
}
```

## Architecture

### Website OAuth Routes

Generic routes that work for any provider:

- `GET /oauth/:provider/authorize` - Redirects to provider's OAuth page
- `GET /oauth/:provider/callback` - Receives code, redirects to localhost
- `POST /oauth/:provider/token` - Exchanges code for tokens (holds client_secret)
- `POST /oauth/:provider/refresh-token` - Refreshes expired tokens

### Termcast CLI

- `src/apis/oauth.tsx` - PKCEClient handles authorization code flow
- `src/preload.tsx` - Redirects `@raycast/utils` imports to our fork

### Forked raycast-utils

The `raycast-utils/` submodule (branch: `termcast-oauth-proxy`) contains a fork of `@raycast/utils` with OAuth URLs changed from `{provider}.oauth.raycast.com` to `termcast.app/oauth/{provider}`.

## Troubleshooting

### "OAuth not configured for provider"

The website doesn't have the environment variables set. Add `{PROVIDER}_OAUTH_CLIENT_ID` and `{PROVIDER}_OAUTH_CLIENT_SECRET`.

### "Unknown OAuth provider"

The provider isn't in `oauth-providers.ts`. Add the provider configuration.

### Callback shows "Not Found"

The callback URL might be misconfigured. Ensure the OAuth app's callback URL is exactly:
```
https://termcast.app/oauth/{provider}/callback
```

### Token exchange fails

Check that:
1. Client ID and secret are correct
2. The authorization code hasn't expired (they're usually short-lived)
3. The redirect_uri matches what was used in authorization

## Local Development

For testing OAuth locally, the flow still works because:
1. Authorization goes through termcast.app (production)
2. Callback redirects to `http://localhost:8989/oauth/callback`
3. Token exchange goes through termcast.app (production)

You need the production OAuth apps configured on termcast.app for this to work.
