# Google OAuth Setup Guide for Termcast

## The Problem

The iOS OAuth client (ID: `561871153864-av1vs99717luugrbiru0qccgodhcj9nm.apps.googleusercontent.com`) **cannot be used with the device flow**. Google returns "invalid_client" because iOS clients are not authorized for device flow endpoints.

## Solution Options

### Option 1: Create a TV/Device OAuth Client (Recommended for CLI)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Click **CREATE CREDENTIALS** > **OAuth client ID**
4. Choose **"TVs and Limited Input devices"** as the application type
5. Give it a name (e.g., "Termcast CLI")
6. Click **Create**
7. You'll receive:
    - Client ID (e.g., `123456-abc.apps.googleusercontent.com`)
    - Client Secret (e.g., `GOCSPX-...`)

Then update your environment variables:

```bash
export GOOGLE_DEVICE_CLIENT_ID="your-new-client-id"
export GOOGLE_DEVICE_CLIENT_SECRET="your-client-secret"
```

And run:

```bash
bun src/examples/oauth-google.tsx
```

### Option 2: Use Desktop App OAuth Client (Alternative)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Click **CREATE CREDENTIALS** > **OAuth client ID**
4. Choose **"Desktop app"** as the application type
5. Give it a name (e.g., "Termcast Desktop")
6. Click **Create**
7. You'll receive:
    - Client ID
    - Client Secret

Desktop clients also support the standard OAuth flow with localhost redirect.

### Option 3: Use Your Existing iOS Client (With Standard Flow)

Your iOS client DOES work, but only with the standard OAuth authorization code flow (not device flow):

```bash
bun src/examples/oauth-google-ios.tsx
```

This will:

- Open your browser
- Redirect to `http://localhost:8989/oauth/callback`
- Exchange the code for tokens

## Client Type Comparison

| Client Type           | Device Flow | Localhost Redirect | Client Secret | Use Case             |
| --------------------- | ----------- | ------------------ | ------------- | -------------------- |
| iOS                   | ❌ No       | ✅ Yes             | ❌ No         | Mobile apps          |
| TVs and Limited Input | ✅ Yes      | ❌ No              | ✅ Yes        | CLI tools, smart TVs |
| Desktop app           | ❌ No       | ✅ Yes             | ✅ Yes        | Desktop applications |
| Web application       | ❌ No       | ✅ Yes\*           | ✅ Yes        | Web servers          |

\*Web applications require specific redirect URIs to be configured

## Why This Happens

Google segregates OAuth clients by type for security:

- **iOS/Android clients**: For mobile apps, use custom URL schemes
- **TV/Device clients**: For devices without keyboards, use device flow
- **Desktop clients**: For desktop apps, use localhost redirects
- **Web clients**: For server-side apps, use configured redirect URIs

Each type has different capabilities and security models.

## Quick Test

Once you have the right credentials:

```typescript
// For TV/Device client (device flow):
const googleOAuth = OAuthService.google({
    clientId: process.env.GOOGLE_DEVICE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_DEVICE_CLIENT_SECRET,
    scope: 'https://www.googleapis.com/auth/userinfo.email',
})

// For iOS client (standard flow):
const googleOAuth = new OAuthService({
    clientId:
        '561871153864-av1vs99717luugrbiru0qccgodhcj9nm.apps.googleusercontent.com',
    clientSecret: undefined,
    useDeviceFlow: false,
    // ... rest of config
})
```

## Recommendation

For a CLI tool like Termcast, use **"TVs and Limited Input devices"** OAuth client. It's specifically designed for terminal/CLI scenarios where:

- You can't easily redirect back to the app
- The user might be in SSH or remote terminal
- You want a simple "go to this URL and enter this code" flow
