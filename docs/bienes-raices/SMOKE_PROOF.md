# Bienes Raíces — smoke proof commands & manual runtime

## Repo-level (no Supabase session required)

```bash
npm run verify:br:launch-gate
```

Equivalent expanded:

```bash
npm run typecheck
npm run lint:br
npx tsx scripts/br-launch-selftest.ts
```

**Full production compile (includes TS validation during Next build):**

```bash
npm run build
```

## Browser-level (external; evidence = screenshots + network tab)

**Privado publish**

1. Sign in at `/login` with a real test user on the target Supabase project.
2. Complete `/clasificados/publicar/bienes-raices/privado` (or `/publicar/bienes-raices/privado`) including pets (yes/no) — required gate.
3. Open preview → **Publicar** → expect redirect to `/clasificados/anuncio/{id}?lang=…`.
4. Confirm row in Supabase `listings` (`category=bienes-raices`, `is_published=true`, `status=active`).

**Negocio publish**

1. Same session, complete negocio flow → preview → publish.
2. Same DB checks; `seller_type=business` when applicable.

**Resultados**

1. Visit `/clasificados/bienes-raices/resultados?lang=es` — new row should appear in grid after hard refresh (client fetch).

**Dashboard**

1. `/dashboard/mis-anuncios` — card with branch chip **BR · Privado** / **BR · Negocio** (EN: **RE · …**).

**Admin**

1. `/admin/workspace/clasificados?category=bienes-raices` — row visible; refine with `leonix_branch=bienes_raices_privado` etc.

## External-only blockers

- Any **FALSE** on live publish / admin / moderation in a given environment is **external** if `verify:br:launch-gate` passes but browser steps fail: capture **Supabase error code**, **failing network request URL**, and **RLS/policy** name from logs.
