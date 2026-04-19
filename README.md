# Dala

Freight forwarding workspace: shipment intelligence, Outlook-powered email, and an AI copilot. Built with **Next.js 15**, **Supabase**, and optional **OpenAI** / **Anthropic** / **Microsoft Graph**.

## Quick start

```bash
npm install
cp .env.example .env.local
# Fill NEXT_PUBLIC_SUPABASE_* and optional keys — see below
npm run dev
```

- **Health check:** `GET /api/health` (for load balancers; no auth)
- **Public config (no secrets):** `GET /api/config` — booleans for Outlook / AI / cron so the UI can guide onboarding
- **SEO:** `robots.txt` and `sitemap.xml` (marketing routes; `/dashboard` not indexed)
- **Dashboard UX:** route-level `loading.tsx`, `error.tsx` with retry, and a **Get started** panel when there are no shipments yet
- **Build:** `npm run build`

## Environment

Copy from [`.env.example`](./.env.example). Minimum for auth + data: **Supabase URL + anon key**. Apply SQL under `supabase/migrations/` to your project.

## Deploying for companies

1. **Supabase:** Production project, migrations applied, Auth redirect URLs set to your domain, RLS verified.
2. **App URL:** Set `NEXT_PUBLIC_APP_URL` (or `NEXTAUTH_URL`) so Microsoft OAuth redirect matches Azure exactly.
3. **Secrets:** Store keys in your host’s env (e.g. Vercel), never in the client bundle except `NEXT_PUBLIC_*`.
4. **Demo endpoints:** Do not enable `ENABLE_DEMO_AUTH` or `NEXT_PUBLIC_ENABLE_DEMO_BOOTSTRAP` in production.
5. **Outlook sync:** Configure `CRON_SECRET` and schedule `GET /api/cron/sync-outlook` with `Authorization: Bearer <CRON_SECRET>`.

## Security

Response headers (frame options, nosniff, referrer policy) are set in `next.config.ts`. Tighten further with your host (WAF, rate limits) and review Supabase RLS for every table.

## License / usage

Private; terms for your customers belong in your legal pages (`/privacy`, `/terms`).
