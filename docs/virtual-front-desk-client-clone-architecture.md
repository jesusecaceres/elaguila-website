# Virtual Front Desk — Client-Clone Architecture (Build 10)

## Purpose

Leonix Virtual Front Desk is a **digital doorbell**, not a generic Contact Us page.

Visitors scan a **business-owned QR** that opens the front desk. The front desk then offers **approved connection platforms** configured for that business’s people — without reprinting the QR when providers change.

## Ownership boundaries

| Layer | Owns | Does not own |
| --- | --- | --- |
| **Executive Contact Platform (ECP)** | People / executives, phone, email, WhatsApp digits, `connectionDestinations` | Page layout, QR destination |
| **Business Hub** | Business identity / storefront (future multi-tenant) | Per-executive messaging URLs |
| **Virtual Front Desk** | Orchestration UX (`/visitanos`), hierarchy, copy, analytics beacons | Hardcoded Meet/WhatsApp/Messenger destinations |

Correct flow:

```
ECP PROFILE
  → connectionDestinations (+ phone / WhatsApp digits)
  → Human Connection Router
  → Virtual Front Desk UI
  → External platform (Meet / Teams / WhatsApp / …)
```

Wrong flow: hardcoding platform URLs inside `VisitanosPageClient`.

## Connection destinations (ECP)

Optional, validated, fail-closed:

- `googleMeetUrl` — **video room** (not a guaranteed ringing call)
- `microsoftTeamsUrl` — **video room**
- `messengerUrl` — messaging / DM
- `instagramUrl` — messaging / profile open
- `facetimeUrl` — optional future **direct video** (Apple-heavy clients)

WhatsApp uses existing `whatsappDigits` / `phoneDigits` — do **not** duplicate WhatsApp truth in `connectionDestinations`.

Missing or invalid destination ⇒ channel is **hidden**.

## Capability honesty

| Channel | Capability | UI claim |
| --- | --- | --- |
| Google Meet / Teams | `video_room` | Open room; may need admit |
| FaceTime (if configured) | `direct_video` | Opens FaceTime |
| WhatsApp / Messenger / Instagram | `messaging` | Send message / open app — **not** “video call” unless proven |
| Phone / SMS / Email | phone / messaging / email | Normal contact fallbacks |
| Daily / managed browser video | `managed_video` | Dormant unless eligibility is true |

Never claim: ringing, answered, connected, or notified unless a future integration can prove it.

## Cloning for a future client business

```
CLIENT BUSINESS
  → BUSINESS PROFILE (Business Hub)
  → EXECUTIVE / STAFF PROFILES (ECP)
  → CONNECTION DESTINATIONS (per person)
  → HUMAN CONNECTION ROUTER (shared)
  → CLIENT QR → CLIENT VIRTUAL FRONT DESK
```

Examples (configuration only — no router rewrite):

- Restaurant: WhatsApp + Instagram
- Realtor: Google Meet + WhatsApp + phone
- Attorney: Teams + phone + email
- Contractor: WhatsApp + Messenger
- Apple-heavy shop: FaceTime + phone

**Executive #500** requires a new ECP profile (data), not new Virtual Front Desk code, as long as channels are already supported.

## Doorbell notifications (Build 12)

```
VISITOR video request
  → Daily ephemeral room
  → dispatchDigitalContactDoorbell(executiveSlug)
      → Web Push to that executive’s enrolled devices (PRIMARY)
      → Resend email (SECONDARY)
      → SMS seam reserved (NOT implemented / no paid provider)
  → visitor joins visitor-safe Daily URL
STAFF taps notification
  → /admin/digital-contact/video/{sessionId}
  → admin auth
  → host Daily credential resolved server-side
```

Enrollment is authenticated at `/admin/digital-contact/doorbell`.

Subscriptions are scoped by `executive_slug` — Executive #500 adds profile data + enrolls devices; no router rewrite.

## QR contract

Leonix office QR stays:

`https://leonixmedia.com/visitanos?source=office-window`

The QR must **not** encode Meet, WhatsApp, Teams, Messenger, Instagram, Daily, or FaceTime.

Provider changes ⇒ update ECP destinations. **No QR reprint.**

## Cost doctrine

Prefer free / already-used apps and reusable meeting rooms. Do not require a paid push vendor for the doorbell. SMS remains a future optional escalation (not required for V1).

