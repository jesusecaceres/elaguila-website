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

## FACE-TO-FACE DOORBELL (Build 09)

Primary product intent: scan QR → attempt face-to-face video via an owner-approved
**external** destination (Google Meet preferred).

### Owner configuration (ONE field)

In `app/lib/digitalContact/digitalContactRegistry.ts` on the executive profile:

```ts
connectionDestinations: {
  googleMeetUrl: "https://meet.google.com/xxx-yyyy-zzz", // owner-approved only
}
```

Optional FaceTime:

```ts
connectionDestinations: {
  facetimeUrl: "facetime:…", // or https://facetime.apple.com/…
}
```

Do **not** invent URLs. Without a valid destination, the video CTA stays hidden and
native Call/WhatsApp/SMS/Email remain available.

Daily / Resend / DB are **not** required for this external video path.


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

## SCHEDULE POLICY (Build 07–08)

Native V1 default: Schedule is **hidden**.

Requires all of:

1. Executive/capability allows scheduling
2. `RESEND_API_KEY` configured
3. Explicit `HUMAN_CONNECTION_SCHEDULE_ENABLED=true`

Resend alone (used elsewhere at Leonix) does **not** activate Schedule.

API returns `schedule_disabled` / `notification_unavailable` when not production-ready — never fake success.

Visitor follow-up without Schedule: Call / WhatsApp / SMS / Email / `/contacto`.

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
