# Iglesias BUILD 01 audit

Canonical church model + premium landing + real discovery. Prayer Wall is not in this gate.

## Architecture

Iglesias is a dedicated public pillar at `/iglesias`, not a classifieds category. The previous `CategoryCompactHero` / `CategoryStandardLandingPageShell` stub was removed from the public route. Viajes discipline (experience first, truthful inventory, image fallbacks, zero-inventory completeness) is reused; Viajes visuals are not.

## Schema

Migration: `supabase/migrations/20260819120000_iglesias_churches.sql`

| Table | Public SELECT |
|---|---|
| `churches` | approved + active + `published_at` not null |
| `church_services` | active + parent public |
| `church_ministries` | active + parent public |
| `church_media` | active + parent public |
| `church_submissions` | none (service-role / admin) |

No prayer tables.

States remain distinct: `approval_status`, `is_active`, `verification_status`, `prayer_network_enrolled`. Only approved+active+published is public. Verified and Prayer Network badges are not displayed.

## Need taxonomy

`PRAYER SPANISH_SERVICE BILINGUAL_SERVICE CHILDREN YOUTH FAMILIES MARRIAGE GRIEF FOOD_SUPPORT COMMUNITY_SUPPORT BIBLE_STUDY RECOVERY SENIORS DISABILITY_ACCESS LIVESTREAM SMALL_GROUPS`

Landing shortcuts and `?need=` share this contract. `lang` remains UI language; church language filter is `language`.

## Routes

- `/iglesias` landing + query-state results
- `/iglesias/registrar` application (pending review)
- `/iglesias/[slug]` public profile
- `/admin/workspace/iglesias` queue
- `/admin/workspace/iglesias/[id]` review
- `POST /api/iglesias/applications`

## Images

Editorial category photography in `public/iglesias/editorial/`. Neutral fallback in `public/iglesias/fallbacks/`. Hero/tiles are navigation/editorial, never a listed congregation. Church cards use real media or a cream/gold surface (not a fake church photo).

## Zero inventory

Hero, search, Find by Need, prayer coming-next (no form), trust, and church CTA remain. Church card rails hide when there are zero published churches and no filters.

## SEO

Landing metadata no longer claims a populated directory. `/iglesias/[slug]` is omitted from the static sitemap (same DB-backed deferral as classifieds listings). `/iglesias/registrar` is listed.

## TRUE/FALSE

| Item | Result |
|---|---|
| Dedicated feature branch | TRUE (created in this gate) |
| Iglesias no longer uses classifieds public shell | TRUE |
| Church canonical database exists | TRUE (migration) |
| RLS safe | TRUE |
| Need taxonomy canonical | TRUE |
| Landing search functional | TRUE |
| Find by Need functional | TRUE |
| Premium cinematic hero | TRUE |
| True editorial imagery | TRUE |
| Safe image fallback | TRUE |
| Zero churches looks complete | TRUE |
| No fake church inventory | TRUE |
| Church cards real-only | TRUE |
| Church profile real-only | TRUE |
| Service schedule real-only | TRUE |
| Contact CTAs real-only | TRUE |
| Church application truthful | TRUE |
| Admin review required | TRUE |
| No auto-publication | TRUE |
| No fake Verified badge | TRUE |
| Misleading CTAs removed | TRUE |
| SEO no longer overclaims directory | TRUE |
| ES complete | TRUE |
| EN complete | TRUE |
| Prayer Wall NOT built | TRUE |
| Navbar/Footer/Recursos/Viajes/Noticias untouched as product surfaces | TRUE |


Prayer submit, acknowledgements, updates, AI/human moderation, crisis pathway, Prayer Network routing.
