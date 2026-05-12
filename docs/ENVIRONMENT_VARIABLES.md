## Environment Variables

This project uses two kinds of environment variables:

- Public (browser): variables prefixed with `NEXT_PUBLIC_`. These are bundled into the client and visible in the browser. Firebase client config belongs here.
- Server-only: all others. These are only available to server components and API routes.

### Public (Client) – required

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
- Optional: `NEXT_PUBLIC_FIREBASE_VAPID_KEY` (web push)

These are validated at startup by `lib/env.ts`. Missing any will throw to catch misconfiguration early.

### Server-only – common

- Firebase Admin: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
  - Paste the private key as a single line with literal `\n`; the code converts them to newlines.
- OpenAI: `OPENAI_API_KEY`, optional `OPENAI_PROJECT_ID`, optional `OPENAI_PRIMARY_MODEL`, optional `OPENAI_FALLBACK_MODELS`, optional `OPENAI_REASONING_EFFORT`, optional `OPENAI_IMAGE_DETAIL`, optional `REQUIRE_PREMIUM_FOR_AI` ("true"/"false")
- Gemini fallback (optional): `AI_GEMINI_FALLBACK_ENABLED` ("true"/"false"), `GEMINI_API_KEY`
- Unified chat rate limits: `AI_CHAT_RATELIMIT_LIMIT`, `AI_CHAT_RATELIMIT_WINDOW_MS`
- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`
- MercadoPago: `MERCADOPAGO_ACCESS_TOKEN`
- Base URL: `NEXTAUTH_URL`

### Local vs Vercel

- Local: copy `.env.example` → `.env.local` and fill in values. `.env.local` is gitignored and loaded automatically by Next.js.
- Vercel: set the same variables in Project → Settings → Environment Variables, per environment:
  - Production: live credentials (e.g., `https://cannafriend.app` for `NEXTAUTH_URL`).
  - Preview: typically mirrors production or uses test services.
  - Development: optional; local dev uses `.env.local`.

Exposure rules in Vercel:
- `NEXT_PUBLIC_*` are exposed to the client bundle.
- Everything else remains server-only.

### AI assistant defaults

- `OPENAI_PRIMARY_MODEL` defaults to `gpt-5-mini`.
- `OPENAI_FALLBACK_MODELS` defaults to `gpt-4.1-mini,gpt-4o-mini`.
- `OPENAI_REASONING_EFFORT` defaults to `minimal`.
- `OPENAI_IMAGE_DETAIL` defaults to `high`.
- `OPENAI_PROJECT_ID` is optional and only needed if your key/project setup requires it.
- `AI_GEMINI_FALLBACK_ENABLED` defaults to `false`; `GEMINI_API_KEY` is only used when that flag is enabled.
