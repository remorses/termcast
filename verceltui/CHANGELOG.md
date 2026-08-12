# Changelog

## 0.0.4

1. **Fix interactive token setup** — pasting a Vercel token on first launch now initializes Termcast storage before saving the token, so `npx verceltui` opens the deployments browser instead of failing with `extensionPath not set`.

2. **Use one React runtime with Termcast** — Verceltui now accepts compatible React 19 patch releases instead of pinning React 19.2.6, preventing hook dispatcher crashes when Termcast uses a newer React patch.
