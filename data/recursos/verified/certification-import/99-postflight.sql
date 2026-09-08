-- Recursos Build 03C — Certification import postflight (READ-ONLY)
-- Run this AFTER all 7 batch files complete. Makes no writes.
-- One combined result set proving every required post-condition.

WITH ready_ids AS (
  SELECT unnest(ARRAY[
  '2-1-1-bay-area',
  'asian-americans-for-community-involvement-aaci-aaci-asian-women-s-home',
  'community-solutions-human-trafficking',
  'crisis-text-line',
  'maitri',
  'next-door-solutions',
  'santa-clara-county-behavioral-health-services',
  'santa-clara-county-department-of-family-and-children-s-services-dfcs-child-abuse',
  'santa-clara-county-emergency-psychiatric-services-eps',
  'ywca-golden-gate-silicon-valley-support-services-department',
  'bay-area-legal-aid',
  'bill-wilson-center-the-hub',
  'calworks-child-care-services',
  'court-appointed-special-advocates-casa-of-silicon-valley',
  'first-5-santa-clara-county',
  'go-kids-inc-estrella-family-services',
  'healthier-kids-foundation',
  'inclusion-support-warmline',
  'international-rescue-committee',
  'katharine-and-george-alexander-community-law-center',
  'law-foundation-of-silicon-valley',
  'loaves-and-fishes-family-kitchen',
  'morgan-hill-migrant-educational-program',
  'pars-equality-center',
  'pro-bono-project-silicon-valley',
  'santa-clara-county-housing-authority',
  'scc-public-health-breastfeeding-chestfeeding-support-program',
  'sccoe-migrant-education-program',
  'second-harvest-of-silicon-valley',
  'siren-services-immigrant-rights-education-network',
  'sjb-child-development-centers',
  'sunday-friends',
  'sunnyvale-community-services',
  'asian-american-community-service-agency',
  'california-alternative-rates-for-energy-care',
  'campbell-adult-and-community-education-cace',
  'cancer-carepoint',
  'conxion-to-community',
  'dress-for-success',
  'earned-income-tax-credit-eitc',
  'east-side-adult-education',
  'evergreen-valley-college',
  'fremont-union-high-school-district-adult-school-fuhsd',
  'fresh-success',
  'goodwill-of-silicon-valley',
  'goodwill-of-silicon-valley-school-health-clinics-wellness-center',
  'integrated-psychological-assessment-services-ipas',
  'metropolitan-education-district-metroed',
  'milpitas-adult-education',
  'mission-college-calworks-program',
  'momentum-for-health',
  'mtn-view-los-altos-adult-school-mvla',
  'new-eyes',
  'north-east-medical-services-nems',
  'novaworks',
  'rebekah-children-s-services',
  'rotacare-bay-area',
  'sacred-heart-community-service',
  'san-jose-state-university-career-center',
  'santa-clara-family-health-plan-scfhp',
  'stars-behavioral-health-group-starlight-community-services-in-santa-clara',
  'valley-transportation-authority-vta',
  'work2future',
  'working-partnerships-usa-union-community-resources',
  'youth-space'
  ]) AS candidate_id
),
reviews AS (
  SELECT r.*
  FROM public.community_resource_candidate_reviews r
  JOIN ready_ids ON ready_ids.candidate_id = r.candidate_id
),
linked_resources AS (
  SELECT DISTINCT res.*
  FROM public.community_resources res
  JOIN reviews ON reviews.promoted_resource_id = res.id
),
crisis_text_line AS (
  SELECT res.*
  FROM public.community_resources res
  JOIN reviews ON reviews.promoted_resource_id = res.id
  WHERE reviews.candidate_id = 'crisis-text-line'
),
next_door AS (
  SELECT res.*
  FROM public.community_resources res
  JOIN reviews ON reviews.promoted_resource_id = res.id
  WHERE reviews.candidate_id = 'next-door-solutions'
),
duplicate_candidate_links AS (
  SELECT promoted_resource_id
  FROM reviews
  WHERE promoted_resource_id IS NOT NULL
  GROUP BY promoted_resource_id
  HAVING count(DISTINCT candidate_id) > 1
),
duplicate_target_slugs AS (
  SELECT slug FROM linked_resources GROUP BY slug HAVING count(*) > 1
)
SELECT 'ready_manifest_target' AS check_name, '65' AS expected, '65' AS actual
UNION ALL
SELECT 'review_rows_for_ready_candidateIds', '65', (SELECT count(*)::text FROM reviews)
UNION ALL
SELECT 'promoted_ready_review_rows', '65', (SELECT count(*)::text FROM reviews WHERE disposition = 'promoted' AND promoted_resource_id IS NOT NULL)
UNION ALL
SELECT 'distinct_promoted_resource_id', '65', (SELECT count(DISTINCT promoted_resource_id)::text FROM reviews WHERE promoted_resource_id IS NOT NULL)
UNION ALL
SELECT 'canonical_resources_for_ready_candidates', '65', (SELECT count(*)::text FROM linked_resources)
UNION ALL
SELECT 'active', '65', (SELECT count(*)::text FROM linked_resources WHERE active = true)
UNION ALL
SELECT 'verified', '65', (SELECT count(*)::text FROM linked_resources WHERE verification_status = 'verified')
UNION ALL
SELECT 'fresh', '65', (SELECT count(*)::text FROM linked_resources WHERE next_verification_at IS NOT NULL AND next_verification_at > now())
UNION ALL
SELECT 'active_needs_review', '0', (SELECT count(*)::text FROM linked_resources WHERE active = true AND verification_status = 'needs_review')
UNION ALL
SELECT 'duplicate_candidate_links', '0', (SELECT count(*)::text FROM duplicate_candidate_links)
UNION ALL
SELECT 'duplicate_target_slugs', '0', (SELECT count(*)::text FROM duplicate_target_slugs)
UNION ALL
SELECT 'unsupported_legacy_211_number', '0', (SELECT count(*)::text FROM linked_resources WHERE phone = '800-436-9997' OR crisis_phone = '800-436-9997' OR sms ILIKE '%800-436-9997%')
UNION ALL
SELECT 'next_door_bad_domain', '0', (SELECT count(*)::text FROM next_door WHERE website_url IS NULL OR website_url NOT ILIKE '%nextdoorsolutions.org%')
UNION ALL
SELECT 'crisis_text_line_contains_741741', 'true', (SELECT (count(*) > 0)::text FROM crisis_text_line WHERE sms ILIKE '%741741%')
UNION ALL
SELECT 'crisis_text_line_contains_HOME', 'true', (SELECT (count(*) > 0)::text FROM crisis_text_line WHERE sms ILIKE '%HOME%')
UNION ALL
SELECT 'crisis_text_line_does_not_expose_BAY', 'true', (SELECT (count(*) = 0)::text FROM crisis_text_line WHERE sms ILIKE '%BAY%')
UNION ALL
SELECT 'every_linked_resource_has_official_source_url', 'true', (SELECT (count(*) = 0)::text FROM linked_resources WHERE official_source_url IS NULL OR official_source_url = '')
UNION ALL
SELECT 'every_linked_resource_has_last_verified_at', 'true', (SELECT (count(*) = 0)::text FROM linked_resources WHERE last_verified_at IS NULL)
UNION ALL
SELECT 'every_linked_resource_next_after_last', 'true', (SELECT (count(*) = 0)::text FROM linked_resources WHERE next_verification_at IS NULL OR last_verified_at IS NULL OR next_verification_at <= last_verified_at)
ORDER BY 1;
