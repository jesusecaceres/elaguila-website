/*
 * Recursos — 19-resource canonical gap batch (2026-08-25) — preflight (READ-ONLY)
 * Run this BEFORE 01-insert-19-approved-resources.sql. Makes no writes.
 */

/* 1. Current production count (expect 65 before this batch runs) */
SELECT count(*) AS current_resource_count FROM public.community_resources;

/* 2. None of the 19 target slugs should already exist */
SELECT slug, organization_name
FROM public.community_resources
WHERE slug IN (
  'here4you',
  'homelessness-prevention-system-scc',
  'homefirst',
  'lifemoves',
  'city-of-san-jose-housing',
  'salvation-army-silicon-valley',
  '988-suicide-crisis-lifeline',
  'nami-santa-clara',
  'medi-cal',
  'gardner-health-services',
  'better-health-pharmacy',
  'pregnancy-parenting-referral-line',
  'office-of-immigrant-relations-scc',
  'asian-law-alliance',
  'scc-rapid-response-network',
  'debs-county-benefits',
  'adult-protective-services-scc',
  'sourcewise',
  'parents-helping-parents'
);

/*
 * 3. None of the 19 target organization names should already exist under a different slug
 *    (informational cross-check - a name match here without a slug match above is worth
 *    reviewing by hand before inserting, in case a resource already exists under a different
 *    slug and this would create a real content duplicate)
 */
SELECT slug, organization_name
FROM public.community_resources
WHERE organization_name IN (
  'Here4You (Bill Wilson Center)',
  'Santa Clara County Homelessness Prevention System',
  'HomeFirst Services of Santa Clara County',
  'LifeMoves',
  'City of San Jose Housing Department',
  'The Salvation Army Silicon Valley',
  '988 Suicide & Crisis Lifeline',
  'NAMI Santa Clara County',
  'Medi-Cal',
  'Gardner Health Services',
  'Better Health Pharmacy',
  'Santa Clara County Public Health Department',
  'Santa Clara County Office of Immigrant Relations',
  'Asian Law Alliance',
  'Santa Clara County Rapid Response Network (SCC RRN)',
  'Santa Clara County Department of Employment and Benefit Services (DEBS)',
  'Santa Clara County Adult Protective Services',
  'Sourcewise',
  'Parents Helping Parents (PHP)'
);

/*
 * 4. Sanity check: no resource should currently be active=true while needs_review (would mean
 *    the public-query safety gate is already broken before this batch touches anything)
 */
SELECT id, slug, organization_name, verification_status, active
FROM public.community_resources
WHERE active = true AND verification_status = 'needs_review';
