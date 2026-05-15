# CTA global contract (Gate CTA-1)

## 1. Source of truth (shared only)

| Area | Path |
|------|------|
| Sheet UI + launch order | `app/components/cta/CtaActionSheet.tsx` |
| Intent unions + analytics hook types | `app/components/cta/types.ts` |
| External launchers (`tel:`, `mailto:`, maps, wa.me, etc.) | `app/components/cta/ctaLaunchers.ts` |
| `navigator.share` wrapper | `app/components/cta/ctaLaunchers.ts` → `tryWebShare` |
| URL/phone helpers, share text builders | `app/components/cta/ctaDataHelpers.ts` |
| Intent builders for categories | `app/components/cta/ctaIntentBuilders.ts` |
| Public barrel exports | `app/components/cta/index.ts` |
| Share entry control (opens hub on first tap) | `app/components/clasificados/analytics/LeonixShareButton.tsx` |

Category-specific helpers (e.g. Servicios) may wrap these; new work should move toward `ctaIntentBuilders` patterns.

## 2. Product rules

1. **Sheet first** — The first user tap on a CTA control opens `CtaActionSheet` with a typed `CtaSheetIntent`. No `mailto:`, `tel:`, `wa.me`, or `window.open` on that first tap.
2. **Show sensitive info in the sheet** — Phone, email, message body, URL, and address appear inside the sheet before launch.
3. **Copy first-class** — Every relevant intent exposes copy rows where data exists.
4. **Native device share** — Where useful, the **primary** row under “This device” is **Share with other apps** (`navigator.share`). Unsupported → copy fallback + status line (no scary error on user cancel).
5. **Final direct launch** — `tel:`, `sms:`, `mailto:`, maps, WhatsApp web, and external `https:` opens only from explicit secondary buttons after the user has seen the sheet.
6. **Email** — Not the primary path: native share + copy rows precede “Open email app” / Gmail links in `send_email`.

## 3. Share Ad (`share_ad`)

- **First tap** on the listing share control opens the Leonix hub only (`LeonixShareButton` → `share_ad` intent).
- **Primary hub action**: ES *Compartir con otras apps* / EN *Share with other apps*, with supporting hint text. Calls `tryWebShare({ title, text, url })` with a safe public URL from `getSafePublicAdUrl`.
- **OG / previews**: Social apps resolve previews from the **public** listing URL’s Open Graph metadata (see in-sheet hint).
- **Secondary**: copy link, copy share text, copy full message, WhatsApp, SMS, Facebook, X, email (secondary), Instagram-safe copy, Messenger note (use native share).

## 4. Contact intents

| Intent | Native share | Copy / share | Final launch |
|--------|--------------|--------------|--------------|
| `call` | Primary | Number, contact block | Call |
| `send_message` | Primary | Message, number, contact block | WhatsApp, SMS |
| `get_quote` | Primary | Quote, contact block | WhatsApp, SMS, Email |
| `send_email` | Primary | Email, full draft, contact block | Open email app, Gmail link |
| `website` / `booking` / `menu` / `order` / `social_link` / `other` | Primary | Copy link | Open link |
| `directions` | Primary | Copy address | Open maps |

## 5. Category migration recipe

1. Inventory local CTAs (anchors, `window.open`, raw `href` to `tel:`/`mailto:`/`wa.me`).
2. Replace with: `useState<CtaSheetIntent | null>` + `<CtaActionSheet … />` + `setIntent(build…Intent(...))` from `ctaIntentBuilders` where possible.
3. Pass `getSafePublicAdUrl` inputs for any listing URL; use `CtaContactShareExtras` for listing/email/web context on contact sheets.
4. Preserve existing analytics by keeping `onAction` handlers and extending maps for **new** `actionId` values when needed (optional in this gate).
5. Run `npm run build` from a clean tree after the category change only.

## 6. Per-category prompt template

Use a dedicated prompt per vertical. Scope: **only** files under that category (or a single shared component). Do not mix unrelated categories in one PR.

**Audit (TRUE/FALSE)**

| Check | |
|-------|---|
| Preflight `git status --short` clean before edits | |
| No `tel:`/`mailto:`/`wa.me` on first tap | |
| Intents built with shared helpers or documented shapes | |
| `npm run build` passed | |
| No Supabase migrations in CTA-only work | |

## 7. CTA type → intent kind map

| User CTA | `CtaSheetIntent.kind` | Builder (preferred) |
|----------|----------------------|---------------------|
| Share listing | `share_ad` | `buildShareAdIntent` |
| Call | `call` | `buildCallIntent` |
| SMS / text | `send_message` | `buildSendMessageIntent`, `buildSmsMessageIntent` |
| WhatsApp message | `send_message` | `buildWhatsAppMessageIntent` |
| Quote | `get_quote` | `buildGetQuoteIntent` |
| Email | `send_email` | `buildSendEmailIntent` |
| Website / booking / menu / order | `website` / … | `buildWebsiteIntent` |
| Social profile link | `social_link` | `buildSocialLinkIntent` |
| Maps / address | `directions` | `buildDirectionsIntent` |
| Copy public URL only | `copy_link` | (inline `{ kind: "copy_link", publicUrl }`) |
| Confirmed network share | `share_social` | `buildShareSocialIntent` |

## 8. Guardrails

- User reviews, commits, and pushes manually unless told otherwise.
- Full-app `npm run build` validates types; if Windows `.next` rename errors appear, delete `.next` once and rebuild—do not patch unrelated code for artifact glitches.
