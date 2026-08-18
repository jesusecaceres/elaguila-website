# Human Connection Router Architecture (Build 06–07)

Leonix does **not** own FaceTime, WhatsApp, Google Meet, Zoom, or Daily transport.

Leonix owns the **Human Connection Router**: truthful discovery, eligibility, presentation, fallback, and analytics.

```
Visitor → /visitanos or /contact/{slug}
       → Human Connection Router
       → ordered truthful channels from ECP
       → direct launchers OR managed session APIs
```

## Launch readiness (Build 07)

| Flag | When TRUE |
|---|---|
| `NATIVE_V1_READY` | Call/SMS/WhatsApp/Email + VFD + ECP work without paid video |
| `MANAGED_VIDEO_READY` | Daily + Resend + presence/session storage live |
| `FULL_HUMAN_CONNECTION_READY` | Native + managed video |

Module: `launchReadiness.ts`

**Schedule request** is capability + **backend gate** (`managed.scheduleRequest` / Resend notify). Capability alone must not show a broken CTA.

## Channel classes

### CLASS A — Direct / app channels
Phone, SMS, WhatsApp, FaceTime (if configured), Email, Schedule request (when notify ready).

These use existing public ECP destinations and `ctaLaunchers` / `nativeChannelHrefs`.  
**They do not require Daily or any paid video provider.**

### CLASS B — Managed session channels
Browser Video (Daily adapter today), Google Meet (seam unconfigured), future Zoom/Teams.

These require server session creation, credentials, host notification, and (for live video) Build 04/05 eligibility (presence, hours, provider, notify, kill switch).

## Domain concept

Primary domain concept: **CONNECTION CHANNEL** (`HumanConnectionChannelType`).

Video provider is a transport behind `browser_video`, not the router itself.

## ECP truth

Channels **reference** existing profile fields:

| Channel | Source |
|---|---|
| phone / sms | `phoneDigits` |
| whatsapp | `whatsappDigits` \|\| `phoneDigits` |
| email | `email` |
| facetime | `connectionDestinations.facetimeUrl` (validated) |
| browser_video | eligibility inject (`managed.browserVideo`) |
| google_meet | managed flag only when adapter ready |
| schedule_request | capability + `managed.scheduleRequest` |

Do not duplicate destinations outside ECP.

## Ordering (physical office visitor)

When live face-to-face exists: that channel first, then WhatsApp → Call → SMS → Email → Schedule.

Otherwise: **Call primary**, WhatsApp secondary, SMS, Email, Schedule (if ready).

Unavailable channels are **omitted** (never disabled graveyard).

## Cost policy

Direct channels must not require a paid Leonix transport provider when a safe user-owned app/channel can do the job.

## Permanent QR

Always `https://leonixmedia.com/visitanos?source=office-window` — provider-independent.
