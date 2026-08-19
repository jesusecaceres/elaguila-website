# Iglesias BUILD 02 — Prayer Wall audit

Prayer Wall + privacy + AI safety classifier + human moderation. Prayer Network routing is **not** in this build.

## Tables

Migration file (not auto-applied to Production by this build):

`supabase/migrations/20260819185941_iglesias_prayer.sql`

| Table | Public |
|---|---|
| `prayer_requests` | Column-bounded SELECT only for `PUBLIC_NAMED` / `PUBLIC_ANONYMOUS` + `CLEARLY_SAFE` + public lifecycle + `published_at` |
| `prayer_acknowledgements` | None. Counts via service-role API |
| `prayer_updates` | Public-safe columns only when parent prayer is public-approved |
| `prayer_moderation_events` | None |
| `prayer_reports` | None |

Listing likes (`user_liked_listings`) and listing moderation tables are not used.

## RLS

RLS is enabled on all five tables. `anon` / `authenticated` are revoked from broad access. Contact, identity, session hash, IP hash, and AI columns are **not** granted. Private / pending / disallowed / crisis / removed rows fail the public SELECT policy.

Public UI still reads through service-role + `mapPublicPrayer` so private fields cannot leak in JSON even if a future column grant is too wide.

## Public-safe mapping

`app/lib/iglesias/prayerPublicMapper.ts`

Returns only wall-safe fields. Forbidden keys (identity, contact, session, IP, AI, moderation internals) are asserted by the BUILD 02 selftest.

## Privacy modes

- **PUBLIC_NAMED** — display name, optional city, body, category, language, time, real acknowledgement count
- **PUBLIC_ANONYMOUS** — shown as Anónimo / Anonymous; display name is not stored
- **PRIVATE_PRAYER_TEAM** — stored, never on the wall, not in public counts. BUILD 03 will route to churches

Anonymous submissions use httpOnly cookie `lx_iglesias_prayer_owner`. The DB stores `sha256(iglesias-prayer-v1:token)` only. Raw token is never returned. IPs are hashed if present and never returned.

## Moderation flow

1. Server validation (length, visibility, language, category, contact)
2. Rate limit (Iglesias-local sliding window)
3. Conservative duplicate check (same normalized body + same session/user within 6 hours)
4. Deterministic heuristic + Leonix AI Gateway classifier (`AI_GATEWAY_API_KEY`)
5. Route: publish / human review / disallowed hold / crisis hold
6. Human queue at `/admin/workspace/iglesias/prayers` (`can_manage_prayer_wall`)

## AI decisions

Safety classifier only. Not a pastor. Not theology or politics judge.

| Decision | DB |
|---|---|
| CLEARLY_SAFE (public) | `OPEN` + `CLEARLY_SAFE` + `published_at` |
| CLEARLY_SAFE (private) | stored, not published |
| UNCERTAIN | `MODERATION_HOLD` + `HUMAN_REVIEW` |
| CLEARLY_DISALLOWED | hold + `DISALLOWED` |
| HIGH_RISK | hold + `CRISIS_REVIEW` |
| AI failure / timeout / missing key | fail closed → `HUMAN_REVIEW` (prayer is kept) |

AI JSON is stored on the row and in `prayer_moderation_events` (`AI_CLASSIFIED`). Never public.

## Human queue

Permission: `can_manage_prayer_wall` (super_admin inherits when roster enforcement is on; cookie admins inherit when enforcement is off).

Actions (each writes `prayer_moderation_events`): APPROVE, REJECT, REMOVE, REDACT_PII_AND_APPROVE, CLOSE, MARK_REVIEWED.

Redaction keeps original text in `body_original_internal` and publishes the redacted body.

## Crisis flow

Immediate danger copy is generic: contact **local emergency services**. No invented hotline numbers. Prayer support remains available after the safety message.

## Acknowledgements

Table `prayer_acknowledgements`. One per authenticated user **or** anonymous session per prayer. Public wall shows the real count only — never who prayed.

## Updates / close

Original body is not overwritten. Updates go to `prayer_updates`. Ownership: authenticated `submitter_user_id` or hashed anonymous cookie. Insecure public tokens are not used.

## Reports

Reasons: HATE_HARASSMENT, THREAT, PRIVATE_INFORMATION, SPAM, INAPPROPRIATE, OTHER. A report does not auto-remove.

## Rate limits

Iglesias-local in-memory limiter (same V1 pattern as Human Connection): submit 5/hour, acknowledge 40/hour, report 12/hour, update 20/hour, keyed by hashed session + hashed IP.

## ES / EN

Spanish-first copy in `prayerCopy.ts`. User prayer text is never auto-translated.

## Mobile

Full-width cards, stacked privacy radios, large textarea, no wall carousel, primary “Estoy orando” control.

## Deferred to BUILD 03

- Church Prayer Network routing
- Distributing private requests to churches
- Prayer team membership / delivery emails
- Any claim that churches already received a private prayer

## Migration state

File is in the repo. This build does **not** apply it to Production. Apply through the designated Leonix/Supabase migration workflow.

## Known risks

- In-memory rate limits are per instance (Fluid Compute). DB duplicate window is the durable complement.
- If `AI_GATEWAY_API_KEY` is unset, public submissions fail closed to human review (no auto-publish).
- Acknowledgement uniqueness for mixed user+anonymous identities depends on the cookie remaining on the device.
- Live RLS proof against a remote project requires the migration to be applied to that environment.
