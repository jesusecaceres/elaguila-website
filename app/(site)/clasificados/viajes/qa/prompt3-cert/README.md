# Viajes Prompt 3 — Phase A QA evidence

Focused evidence for lifecycle / dashboard / admin certification prep.

Do not fabricate screenshots for paths that were not exercised.

## Expected captures

| Scenario | Evidence file | Status |
| --- | --- | --- |
| Business successful submit → enviado | `business-enviado.png` | pending capture |
| Private successful submit → enviado | `private-enviado.png` | pending capture |
| Enviado success page | `enviado-success.png` | pending capture |
| Dashboard card | `dashboard-card.png` | pending capture |
| Dashboard stagedId edit redirect | `dashboard-stagedId-redirect.png` | pending capture |
| Preview stagedId | `preview-stagedId.png` | pending capture |
| Admin queue | `admin-queue.png` | pending capture |
| Admin detail V1 | `admin-detail-v1.png` | pending capture |
| Admin detail V2 | `admin-detail-v2.png` | pending capture |
| Same-row resubmit | `same-row-resubmit.png` | pending capture |
| Approved public route | `public-offer.png` | pending capture (only if safe test row) |

## Selftests

```bash
npx tsx scripts/viajes-prompt3-lifecycle-selftest.ts
```

Browser base: `http://localhost:3003`
