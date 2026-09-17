# Business Learning Center — Content Batch 02

**Status:** Not started. This document is the locked record of what TODAY-1 deliberately left as
`planned` (unpublished) curriculum, per the owner's correction: *"For the initial seed, require 8
fully written bilingual lessons... Represent the remaining required learning domains as planned
unpublished curriculum records... Do not lower the quality of the published lessons to reach a
larger count."*

TODAY-1 shipped 8 fully written, bilingual, >1,200-character lessons covering all seven Health Map
dimensions. The 8 lessons below exist today as real, queryable rows in
`business_learning_lessons` with `status = 'planned'` — title, summary, category, `capability_key`,
and `related_dimension_keys` are already seeded and correct. They carry no `body_es` / `body_en`
and are never returned by a public route (enforced by the
`business_learning_lessons_published_body_chk` database constraint, not just application logic).

## What batch 02 must do

For each lesson below: write a genuinely practical, plain-language, bilingual body (Spanish and
English) of at least 1,200 characters each, following the exact structure proven in TODAY-1's 8
published lessons — why it matters, 4–6 numbered practical steps, and a closing note that avoids
any unsupported promise (no guaranteed leads, revenue, ranking, or success). Then flip `status`
from `planned` to `published` and set `published_at`.

## The 8 lessons

| # | `lesson_key` | Title (EN) | Category | `capability_key` | `related_dimension_keys` |
|---|---|---|---|---|---|
| 1 | `branding_basics` | Branding basics | Business foundation | `branding_basics` | `business_foundation`, `offer_and_value` |
| 2 | `referrals_basics` | Referrals basics | Customers and demand | `referral_program_basics` | `customer_clarity`, `communication_and_follow_up` |
| 3 | `profitable_service_basics` | Profitable-service basics | Money and capacity | `profitable_service_basics` | `offer_and_value` |
| 4 | `simple_analytics` | Simple analytics | Money and capacity | `simple_analytics_basics` | `operations_and_capacity` |
| 5 | `local_seo_basics` | Local SEO basics | Visibility and advertising | `local_seo_basics` | `visibility_and_discovery` |
| 6 | `product_photography_basics` | Product photography basics | Visibility and advertising | `product_photography_basics` | `visibility_and_discovery` |
| 7 | `short_video_basics` | Short video basics | Visibility and advertising | `short_video_basics` | `visibility_and_discovery` |
| 8 | `customer_data_protection` | Customer-data protection | Data protection | `customer_data_protection` | `operations_and_capacity` |

## How to publish a lesson in batch 02

1. Write `body_es` and `body_en` (each ≥1,200 characters, matching the tone and structure of the 8
   published TODAY-1 lessons).
2. `UPDATE public.business_learning_lessons SET body_es = $1, body_en = $2, status = 'published',
   published_at = now() WHERE lesson_key = $3;` — the CHECK constraint rejects the update if either
   body is missing or empty, so a partial write cannot silently publish a bodyless lesson.
3. Re-run `npm run verify:business-learning-center` — the published/planned count assertions will
   need updating to reflect the new totals once batch 02 ships.
4. Consider whether any `business_action_catalog` row (TODAY-2) should have its
   `related_lesson_key` updated from `NULL` to the newly published lesson.

## Also deferred to a later batch (not modeled as rows yet)

- Additional glossary terms and checklists/templates beyond the 18 terms / 7 checklists-templates
  seeded in TODAY-1.
- Any lesson content beyond these 8 domains (the required-domain list in the controlling plan is
  fully covered between TODAY-1's 8 published lessons and this batch's 8 planned lessons).
