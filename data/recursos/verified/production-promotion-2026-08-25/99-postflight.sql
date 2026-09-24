/*
 * Recursos — 19-resource canonical gap batch (2026-08-25) — postflight (READ-ONLY)
 * Run this AFTER 01-insert-19-approved-resources.sql.
 */

/* 1. Total count - expect 84 (65 original + 19 new) */
SELECT count(*) AS total_count FROM public.community_resources;

/* 2. All 19 target slugs now exist, with the expected safety-doctrine status on each -
 *    expect 19 rows, all TRUE in both boolean columns */
SELECT
  slug,
  organization_name,
  verification_status = 'needs_review' AS status_correct,
  spanish_status = 'not_available' AS spanish_status_correct
FROM public.community_resources
WHERE slug IN (
  'here4you', 'homelessness-prevention-system-scc', 'homefirst', 'lifemoves',
  'city-of-san-jose-housing', 'salvation-army-silicon-valley', '988-suicide-crisis-lifeline',
  'nami-santa-clara', 'medi-cal', 'gardner-health-services', 'better-health-pharmacy',
  'pregnancy-parenting-referral-line', 'office-of-immigrant-relations-scc', 'asian-law-alliance',
  'scc-rapid-response-network', 'debs-county-benefits', 'adult-protective-services-scc',
  'sourcewise', 'parents-helping-parents'
)
ORDER BY organization_name;

/* 3. Count of this batch specifically - expect 19 */
SELECT count(*) AS new_batch_count
FROM public.community_resources
WHERE created_by = 'ai-triage-2026-08-25';

/* 4. Any of the 19 with a wrong status (should be needs_review) - expect 0 rows */
SELECT id, slug, organization_name, verification_status
FROM public.community_resources
WHERE created_by = 'ai-triage-2026-08-25' AND verification_status != 'needs_review';

/*
 * 5. Public-query safety gate - none of the 19 should be publicly visible yet
 *    (communityResourcesPublicQueries.ts requires active=true AND verification_status='verified')
 *    expect 0
 */
SELECT count(*) AS publicly_visible_count
FROM public.community_resources
WHERE created_by = 'ai-triage-2026-08-25'
  AND active = true
  AND verification_status = 'verified';

/* 6. None of the 19 have fabricated Spanish text - expect 0 rows with non-empty short_description_es */
SELECT slug, organization_name
FROM public.community_resources
WHERE created_by = 'ai-triage-2026-08-25' AND coalesce(short_description_es, '') != '';

/* 7. High-risk trio present and correctly flagged - expect exactly 3 rows */
SELECT slug, organization_name, crisis_phone, is_24_hours, verification_status
FROM public.community_resources
WHERE slug IN ('988-suicide-crisis-lifeline', 'scc-rapid-response-network', 'adult-protective-services-scc');

/* 8. Crisis Text Line untouched by this batch (must not have been modified) */
SELECT slug, organization_name, updated_by, updated_at
FROM public.community_resources
WHERE organization_name = 'Crisis Text Line';

/* 9. CET San Jose was NOT added (should return 0 rows) */
SELECT slug, organization_name
FROM public.community_resources
WHERE organization_name ILIKE '%Center for Employment Training%' OR organization_name ILIKE '%CET San Jos%';
