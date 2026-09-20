# Prompt 3 Phase A — browser evidence log

Base: `http://localhost:3003`  
Captured: 2026-08-04 (agent session)  
Auth state: **not signed in** (no owner/admin credentials available in this session)

## Exercised

| Route | Result | Same-row / identity | Notes |
| --- | --- | --- | --- |
| `/publicar/viajes/enviado?id&slug&lane` | HTTP 200; UI gated by `PublishAuthGateLayout` → login modal | N/A | Success page HTML serves; browser cannot read success copy without session |
| `/dashboard/viajes` | HTTP 200 then client redirect → `/login?redirect=/dashboard/viajes` | Owner boundary enforced (no rows without auth) | Title “Viajes — tus envíos” briefly visible before redirect |
| `/dashboard/viajes?stagedId=<uuid>` | Same auth gate / login redirect | Redirect helper present in code; ownership check not browser-exercised without login | |
| `/clasificados/viajes/preview/negocios?stagedId=…` | Auth required for staged-owner fetch / login overlay | stagedId retained in URL | |
| `/clasificados/viajes` | HTTP 200, landing renders | Public surface OK | Snapshot confirmed hero + SJC copy |
| `/api/admin/viajes/staged-listings` | `401 Unauthorized` without `leonix_admin` | Auth preserved | |
| `/api/admin/viajes/staged-listings/[id]` | `401` without admin cookie | Auth preserved | |
| `/admin/clasificados/viajes/business-offers` | HTTP 307 (admin login redirect) | Expected | |

## Not captured (auth required — do not fabricate)

- Business/private successful submit → enviado success UI
- Enviado success page with id/slug/lane visible
- Dashboard card with hero / Ad ID
- Dashboard stagedId → editor redirect after ownership prove
- Preview → return-to-edit with stagedId while signed in
- Admin queue UI / admin detail V1/V2
- Same-row resubmit against live UUID
- Approved public offer for a specific staged test row

Logic for those paths is covered by `scripts/viajes-prompt3-lifecycle-selftest.ts` (21 PASS).
