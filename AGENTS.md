<!-- VERCEL BEST PRACTICES START -->
## Best practices for developing on Vercel

These defaults are optimized for AI coding agents (and humans) working on apps that deploy to Vercel.

- Treat Vercel Functions as stateless + ephemeral (no durable RAM/FS, no background daemons), use Blob or marketplace integrations for preserving state
- Edge Functions (standalone) are deprecated; prefer Vercel Functions
- Don't start new projects on Vercel KV/Postgres (both discontinued); use Marketplace Redis/Postgres instead
- Store secrets in Vercel Env Variables; not in git or `NEXT_PUBLIC_*`
- Provision Marketplace native integrations with `vercel integration add` (CI/agent-friendly)
- Sync env + project settings with `vercel env pull` / `vercel pull` when you need local/offline parity
- Use `waitUntil` for post-response work; avoid the deprecated Function `context` parameter
- Set Function regions near your primary data source; avoid cross-region DB/service roundtrips
- Tune Fluid Compute knobs (e.g., `maxDuration`, memory/CPU) for long I/O-heavy calls (LLMs, APIs)
- Use Runtime Cache for fast **regional** caching + tag invalidation (don't treat it as global KV)
- Use Cron Jobs for schedules; cron runs in UTC and triggers your production URL via HTTP GET
- Use Vercel Blob for uploads/media; Use Edge Config for small, globally-read config
- **Tienda fulfillment handoff:** set `BLOB_READ_WRITE_TOKEN` so `/api/tienda/assets/upload` and final order verification can `put`/`list` customer artifacts under `tienda/orders/{orderId}/` (see `@vercel/blob`)
- **Tienda admin inbox:** apply Supabase migration `tienda_orders` / `tienda_order_assets`; checkout `POST /api/tienda/orders` persists via service role (`NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`) before email
- If Enable Deployment Protection is enabled, use a bypass secret to directly access them
- Add OpenTelemetry via `@vercel/otel` on Node; don't expect OTEL support on the Edge runtime
- Enable Web Analytics + Speed Insights early
- Use AI Gateway for model routing, set AI_GATEWAY_API_KEY, using a model string (e.g. 'anthropic/claude-sonnet-4.6'), Gateway is already default in AI SDK
  needed. Always curl https://ai-gateway.vercel.sh/v1/models first; never trust model IDs from memory
- For durable agent loops or untrusted code: use Workflow (pause/resume/state) + Sandbox; use Vercel MCP for secure infra access
<!-- VERCEL BEST PRACTICES END -->

## Cursor Cloud specific instructions

Single Next.js 15 (App Router) monolith, package manager **npm** (`package-lock.json`). There is no separate backend — all APIs live under `app/api/`. No Docker/devcontainer; no local Supabase. The `npm install` update script runs automatically on startup; the notes below are the non-obvious gotchas.

- **`.env.local` is required to boot.** `app/lib/supabaseClient.ts` constructs the Supabase browser client at module load, so any page importing it throws if `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are unset. For local/dev work, placeholder values are enough for pages to compile and render (live reads/writes still won't work). `.env*` is gitignored.
- **Unlock the site locally with `PUBLIC_LAUNCH_LOCK=false`.** Otherwise `middleware.ts` redirects every non-allowlisted route to `/coming-soon-v2` (see `app/lib/launchLock/publicLaunchLock.ts`; the lock also auto-enables when `VERCEL_ENV === "production"`).
- **Real data flows need a real Supabase project** (URL + `SUPABASE_SERVICE_ROLE_KEY`) with `supabase/migrations/` applied; without it, classifieds browse/publish, auth, admin, and tienda persistence fail. Do NOT point local dev at the production database.
- **Servicios has a Supabase-free dev fallback:** in `next dev` (or `SERVICIOS_DEV_PUBLISH=1`), `POST /api/clasificados/servicios/publish` persists to a gitignored `.servicios-dev-publishes.json` and renders on the public results/detail pages — useful for exercising the publish→render loop without a database.
- **Run:** `npm run dev` → http://localhost:3000 (dev). `npm run build` then `npm run start` for a prod-like server.
- **Type-check:** `npm run typecheck` (`tsc --noEmit`) covers the whole repo including `e2e/**`. It currently reports **pre-existing** failures in `e2e/community/*.spec.ts` (Playwright arg typing) unrelated to app code; `next build` type-checks app code only and gates on it (`ignoreBuildErrors: false`).
- **Lint:** `npm run lint` is scoped to the `autos` vertical and currently reports **pre-existing** errors; builds ignore ESLint (`eslint.ignoreDuringBuilds: true` in `next.config.ts`). Other verticals have their own `lint:*` scripts.
- **Tests:** Playwright-based. Many category-scoped `verify:*` / `smoke:*` scripts (see `package.json`) require a prior `npm run build` and/or Supabase; running E2E needs browsers via `npx playwright install` first (not part of the update script).
