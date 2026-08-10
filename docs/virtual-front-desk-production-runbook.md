# Leonix Virtual Front Desk — Production Runbook (Build 07)

Operational guide for **FREE/NATIVE V1** launch. Optional managed video remains dormant. **No secrets.**

---

## LAUNCH READINESS (Build 07)

| Flag | Meaning | Current |
|---|---|---|
| **NATIVE_V1_READY** | QR → /visitanos → Call/SMS/WhatsApp/Email + staff ECP | **TRUE** |
| **MANAGED_VIDEO_READY** | Daily + Resend + presence/session DB | **FALSE** |
| **FULL_HUMAN_CONNECTION_READY** | Native + managed video live | **FALSE** |

Code contract: `app/lib/digitalContact/humanConnection/launchReadiness.ts`

Native contact does **not** require Daily, Resend, FaceTime, Google Meet, or managed-video migrations.

---

## HUMAN CONNECTION ROUTER

Leonix owns the router. External apps own transport.

See: `docs/human-connection-router-architecture.md`

### Free/Native V1 channels (always available when ECP has public data)

- Phone / SMS / WhatsApp / Email

### Follow-up

- **/contacto** — public launch-locked fallback (no Resend required for visitor mailto path on native CTAs)
- **Schedule request** — shown only when Resend notify path is configured; otherwise hidden (no fake success)

### Optional / dormant

- FaceTime — only with approved ECP destination
- Google Meet — adapter unconfigured
- Browser Video → Daily — fail-closed until ops activation

---

## CURRENT STATE

| Area | Status |
|---|---|
| Native V1 (Call/WA/SMS/Email + VFD) | READY |
| Chuy / Isaias ECP public contact | CONFIGURED (no invented FaceTime/Meet) |
| Schedule CTA | HIDDEN until Resend ready |
| Daily / Resend / migrations | OWNER — optional |
| Device QA | OWNER — `docs/virtual-front-desk-device-qa.md` |

---

## HOW WINDOW QR WORKS

Encoded destination (verified):

`https://leonixmedia.com/visitanos?source=office-window`

Asset: `public/qr/visitanos-office-window.png`

Provider-independent. Do not reprint for Daily/Meet/FaceTime changes.

---

## DAILY SETUP (optional — not a Native V1 blocker)

1. `DAILY_API_KEY` (server-only)
2. `HUMAN_CONNECTION_VIDEO_PROVIDER=daily`
3. Resend for host notify
4. Apply migrations `120000` then `130000` on verified Leonix Supabase only
5. Kill switch: `HUMAN_CONNECTION_VIDEO_ENABLED`

## RESEND SETUP

Required for: managed video host notify + schedule request email.

**Not** required for visitor `mailto:` / tel / SMS / WhatsApp.

## SCHEDULE POLICY (Build 07)

If Resend is missing: Schedule channel is **hidden**. Visitor uses Call/WhatsApp/SMS/Email or `/contacto`.

API returns `notification_unavailable` if neither email notify nor DB store succeeded — never fake success.

## VIDEO KILL SWITCH

Disables browser video only. Native channels remain.

## CHUY ECP

- Phone `(669) 366-4300` / `16693664300`
- Email `chuy@leonixmedia.com`
- WhatsApp via phone digits fallback
- Mon–Fri 9–5 America/Los_Angeles (office/executive hours config)
- No FaceTime / Meet / backup invented

## HOW TO TEST

1. Asserts 03–07
2. Scan QR / open `/visitanos?source=office-window`
3. Confirm Call/WhatsApp/SMS/Email without Daily
4. Confirm Schedule absent without Resend
5. Device QA card before print/physical go-live

## CLIENT CLONE

Configure ECP per executive/client. Router reacts. No new router code per Executive #500.
