# Rentas: preference memory, cookies, and consent (architecture)

## What may be stored later (transparent UX)

| Data | Mechanism | Consent |
|------|-----------|---------|
| `lang` (`es` / `en`) | URL + optional `localStorage` mirror | Essential / preference; document in privacy |
| Last `city` / `zip` typed in Rentas browse | `localStorage` key scoped `rentas.browse.` | Preference — show clear “remember” opt-in before persisting |
| Last filter set (non-PII params) | `localStorage` | Preference — same opt-in |
| Recent Rentas activity (counts only) | first-party analytics event | Requires analytics consent when enabled |

## Do not (without explicit product + legal review)

- Auto-store precise geolocation after one-shot “use my location”
- Fingerprinting, cross-site ad IDs, or resale of browse data

## Cookie / consent UI

- Global site banner should gate non-essential cookies
- Rentas-specific “remember my area” should be a **visible toggle** near location fields, not silent

## Minimal implementation policy for this repo

- No new third-party trackers added in Rentas phase
- Geolocation: **click-only** (`RentasLocationButton`); no `watchPosition` on load
- Preference keys reserved in `rentasPreferenceKeys.ts` (string constants only until product enables storage)
