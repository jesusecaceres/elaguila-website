-- Recursos Build 03C-COMPACT — Certification import preflight (READ-ONLY)
-- Same read-only checks as data/recursos/verified/certification-import/00-preflight.sql.
-- Run this BEFORE any batch file to see current Certification state.
-- Makes no writes. Safe to run any number of times, at any time.

-- 1. Required tables exist
SELECT
  to_regclass('public.community_resources') IS NOT NULL AS community_resources_exists,
  to_regclass('public.community_resource_candidate_reviews') IS NOT NULL AS community_resource_candidate_reviews_exists;

-- 2. Current overall row counts (informational — Certification is NOT assumed empty)
SELECT
  (SELECT count(*) FROM public.community_resources) AS current_resource_count,
  (SELECT count(*) FROM public.community_resource_candidate_reviews) AS current_review_count;

-- 3. Existing state for exactly the 65 READY candidateIds this package will touch
WITH ready_ids AS (
  SELECT unnest(ARRAY[
  '2-1-1-bay-area','asian-americans-for-community-involvement-aaci-aaci-asian-women-s-home','community-solutions-human-trafficking','crisis-text-line','maitri','next-door-solutions','santa-clara-county-behavioral-health-services','santa-clara-county-department-of-family-and-children-s-services-dfcs-child-abuse','santa-clara-county-emergency-psychiatric-services-eps','ywca-golden-gate-silicon-valley-support-services-department','bay-area-legal-aid','bill-wilson-center-the-hub','calworks-child-care-services','court-appointed-special-advocates-casa-of-silicon-valley','first-5-santa-clara-county','go-kids-inc-estrella-family-services','healthier-kids-foundation','inclusion-support-warmline','international-rescue-committee','katharine-and-george-alexander-community-law-center','law-foundation-of-silicon-valley','loaves-and-fishes-family-kitchen','morgan-hill-migrant-educational-program','pars-equality-center','pro-bono-project-silicon-valley','santa-clara-county-housing-authority','scc-public-health-breastfeeding-chestfeeding-support-program','sccoe-migrant-education-program','second-harvest-of-silicon-valley','siren-services-immigrant-rights-education-network','sjb-child-development-centers','sunday-friends','sunnyvale-community-services','asian-american-community-service-agency','california-alternative-rates-for-energy-care','campbell-adult-and-community-education-cace','cancer-carepoint','conxion-to-community','dress-for-success','earned-income-tax-credit-eitc','east-side-adult-education','evergreen-valley-college','fremont-union-high-school-district-adult-school-fuhsd','fresh-success','goodwill-of-silicon-valley','goodwill-of-silicon-valley-school-health-clinics-wellness-center','integrated-psychological-assessment-services-ipas','metropolitan-education-district-metroed','milpitas-adult-education','mission-college-calworks-program','momentum-for-health','mtn-view-los-altos-adult-school-mvla','new-eyes','north-east-medical-services-nems','novaworks','rebekah-children-s-services','rotacare-bay-area','sacred-heart-community-service','san-jose-state-university-career-center','santa-clara-family-health-plan-scfhp','stars-behavioral-health-group-starlight-community-services-in-santa-clara','valley-transportation-authority-vta','work2future','working-partnerships-usa-union-community-resources','youth-space'
  ]) AS candidate_id
)
SELECT
  (SELECT count(*) FROM public.community_resource_candidate_reviews crr JOIN ready_ids ON ready_ids.candidate_id = crr.candidate_id) AS existing_ready_candidate_review_count,
  (SELECT count(*) FROM public.community_resource_candidate_reviews crr JOIN ready_ids ON ready_ids.candidate_id = crr.candidate_id WHERE crr.promoted_resource_id IS NOT NULL) AS existing_promoted_links;

-- 4. Duplicate slugs already present (should be 0 in a healthy table; informational either way)
SELECT slug, count(*) AS n
FROM public.community_resources
GROUP BY slug
HAVING count(*) > 1;

-- 5. Duplicate candidate_id rows already present (should be impossible — candidate_id is UNIQUE —
--    included as a defense-in-depth read, not because it's expected to return rows)
SELECT candidate_id, count(*) AS n
FROM public.community_resource_candidate_reviews
GROUP BY candidate_id
HAVING count(*) > 1;

-- 6. Any resource currently active=true while verification_status='needs_review' (should never
--    happen per the public-query safety gate, but read-checked here before we touch anything)
SELECT id, slug, organization_name, verification_status, active
FROM public.community_resources
WHERE active = true AND verification_status = 'needs_review';

-- 7. Any resource already carrying the stale/unsupported legacy 211 number
SELECT id, slug, organization_name, phone, crisis_phone, sms
FROM public.community_resources
WHERE phone = '800-436-9997' OR crisis_phone = '800-436-9997' OR sms ILIKE '%800-436-9997%';

-- 8. Next Door Solutions domain audit (must never be the unrelated nextdoor.org neighborhood app)
SELECT id, slug, organization_name, website_url, official_source_url
FROM public.community_resources
WHERE slug = 'next-door-solutions-to-domestic-violence' OR slug = 'next-door-solutions' OR organization_name ILIKE '%next door solutions%';

-- 9. Current verified + fresh count (verified status, not yet due for re-verification)
SELECT count(*) AS current_verified_and_fresh_count
FROM public.community_resources
WHERE verification_status = 'verified'
  AND (next_verification_at IS NULL OR next_verification_at > now());
