# Stack 5 — Ofertas Locales — Client Upload Shell (No Storage)

## Gate summary

Stack 5 enables local file selection with client-side validation. Files are **not** uploaded, base64-encoded, or persisted in localStorage. Session-only image previews use `URL.createObjectURL` with `revokeObjectURL` cleanup.

- **Gate A:** Client upload validation helpers + size/MIME constants
- **Gate B:** Active file picker on draft asset cards
- **Gate C:** Preview metadata for selected files + audit + build

## What was not implemented

Supabase storage, API routes, DB migrations, real publish, checkout, analytics, header/nav changes.

## TRUE/FALSE checklist

| Requirement | TRUE/FALSE |
|-------------|------------|
| Client validation helper | TRUE |
| Draft file picker | TRUE |
| No base64/localStorage files | TRUE |
| Preview shows metadata only | TRUE |
| Stack audit passes | PENDING |
| Build passes | PENDING |

## Recommended next stack

**Stack 6 — Ofertas Locales — Storage Upload Shell**

Wire validated files to Supabase Storage or API upload endpoint when storage gate is ready.
