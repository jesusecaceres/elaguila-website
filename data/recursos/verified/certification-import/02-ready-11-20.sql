-- Recursos Build 03C — Certification import batch 2/7 (10 records)
-- Source: data/recursos/verified/scc-community-resource-guide-2023-ready-for-import.json
-- Records 11..20 of 65 (sorted verificationPriority asc, candidateId asc).
--
-- Idempotent: safe to re-run. Resources are upserted by slug (unique); review rows are
-- upserted by candidate_id (unique). A second execution leaves row counts unchanged.
-- No DELETE / TRUNCATE / DROP / ALTER. Current researched facts are authoritative and
-- always overwrite any prior value on conflict (including for rows already promoted
-- during the earlier pilot data load).

BEGIN;

-- ----------------------------------------------------------------
-- candidateId: bay-area-legal-aid  |  priority 2  |  Bay Area Legal Aid
-- ----------------------------------------------------------------
-- Idempotency resolution order for the target resource row:
--   1. community_resource_candidate_reviews.promoted_resource_id for this candidate_id, if set.
--   2. an existing community_resources row matching the canonical (corrected) slug below.
--   3. an existing community_resources row matching the legacy/pre-correction slug — covers
--      rows already promoted under the candidate's original organization_name (e.g. via the
--      app's own promoteCandidateAction, or the earlier pilot payloads applied by Coach),
--      where research later corrected the organization_name/slug.
--   4. otherwise a freshly generated id (first-time insert).
-- The slug is NEVER overwritten on conflict, to avoid invalidating an already-published URL.
WITH resolved AS (
  SELECT COALESCE(
    (SELECT promoted_resource_id FROM public.community_resource_candidate_reviews
       WHERE candidate_id = 'bay-area-legal-aid' AND promoted_resource_id IS NOT NULL),
    (SELECT id FROM public.community_resources WHERE slug = 'bay-area-legal-aid'),
    gen_random_uuid()
  ) AS id
),
resource_upsert AS (
  INSERT INTO public.community_resources (
    id, slug, organization_name, program_name, organization_type,
    short_description_es, short_description_en,
    primary_category, secondary_categories, urgency_level,
    age_min, age_max, audience_tags,
    service_tags, languages, cost_model, eligibility_en, service_area,
    phone, crisis_phone, sms, whatsapp, email, website_url, application_url,
    address_line1, address_line2, address_city, address_state, address_zip, address_withheld_for_safety,
    maps_search_href, hours_note_en, weekly_hours, is_24_hours,
    official_source_url, last_verified_at, next_verification_at, verification_status, active,
    partner_status, featured, print_eligible, internal_notes,
    created_at, updated_at, created_by, updated_by
  )
  SELECT
    resolved.id, 'bay-area-legal-aid', 'Bay Area Legal Aid', NULL, 'nonprofit',
    '', '',
    'legal-immigration', '[]'::jsonb, 'i-need-help',
    NULL, NULL, '[]'::jsonb,
    '[]'::jsonb, '["English","Arabic","Chinese (Simplified)","Korean","Russian","Spanish","Tagalog","Vietnamese"]'::jsonb, 'free', 'Free civil legal help to low-income people, regardless of location, language, or disability', 'Alameda, Contra Costa, Marin, Napa, San Francisco, San Mateo, and Santa Clara counties',
    '800-551-5554', NULL, NULL, NULL, NULL, 'https://baylegal.org', NULL,
    '1735 Telegraph Avenue', NULL, 'Oakland', 'CA', '94612', false,
    NULL, NULL, '[]'::jsonb, false,
    'https://baylegal.org', now(), now() + interval '90 days', 'verified', true,
    'none', false, false, 'PDF''s local San Jose number could not be reconfirmed on the current official site; using the confirmed universal Legal Advice Line instead.',
    now(), now(), 'certification-import', 'certification-import'
  FROM resolved
  ON CONFLICT (id) DO UPDATE SET
    organization_name = EXCLUDED.organization_name,
    program_name = EXCLUDED.program_name,
    organization_type = EXCLUDED.organization_type,
    short_description_en = EXCLUDED.short_description_en,
    primary_category = EXCLUDED.primary_category,
    secondary_categories = EXCLUDED.secondary_categories,
    urgency_level = EXCLUDED.urgency_level,
    age_min = EXCLUDED.age_min,
    age_max = EXCLUDED.age_max,
    audience_tags = EXCLUDED.audience_tags,
    service_tags = EXCLUDED.service_tags,
    languages = EXCLUDED.languages,
    cost_model = EXCLUDED.cost_model,
    eligibility_en = EXCLUDED.eligibility_en,
    service_area = EXCLUDED.service_area,
    phone = EXCLUDED.phone,
    crisis_phone = EXCLUDED.crisis_phone,
    sms = EXCLUDED.sms,
    whatsapp = EXCLUDED.whatsapp,
    email = EXCLUDED.email,
    website_url = EXCLUDED.website_url,
    application_url = EXCLUDED.application_url,
    address_line1 = EXCLUDED.address_line1,
    address_line2 = EXCLUDED.address_line2,
    address_city = EXCLUDED.address_city,
    address_state = EXCLUDED.address_state,
    address_zip = EXCLUDED.address_zip,
    address_withheld_for_safety = EXCLUDED.address_withheld_for_safety,
    maps_search_href = EXCLUDED.maps_search_href,
    hours_note_en = EXCLUDED.hours_note_en,
    weekly_hours = EXCLUDED.weekly_hours,
    is_24_hours = EXCLUDED.is_24_hours,
    official_source_url = EXCLUDED.official_source_url,
    last_verified_at = now(),
    next_verification_at = now() + interval '90 days',
    verification_status = EXCLUDED.verification_status,
    active = EXCLUDED.active,
    internal_notes = EXCLUDED.internal_notes,
    updated_at = now(),
    updated_by = 'certification-import'
  RETURNING id
)
INSERT INTO public.community_resource_candidate_reviews (
  candidate_id, disposition, reviewed_by, reviewed_at,
  current_source_url, current_source_type, organization_confirmed_active,
  fields_confirmed, discrepancies_from_pdf, is_24_hours_confirmed_explicit,
  address_handling, verification_notes, promoted_resource_id,
  created_at, updated_at
)
SELECT
  'bay-area-legal-aid', 'promoted', 'certification-import', now(),
  'https://baylegal.org', 'official_org_site', true,
  '["websiteUrl","address","serviceArea","languages","eligibility","costModel"]'::jsonb, '[{"field":"phone","pdfValue":"408-283-3700","currentValue":"800-551-5554 (Legal Advice Line — universal number)"}]'::jsonb, false,
  'confirmed', 'PDF''s local San Jose number could not be reconfirmed on the current official site; using the confirmed universal Legal Advice Line instead.', resource_upsert.id,
  now(), now()
FROM resource_upsert
ON CONFLICT (candidate_id) DO UPDATE SET
  disposition = 'promoted',
  reviewed_by = EXCLUDED.reviewed_by,
  reviewed_at = EXCLUDED.reviewed_at,
  current_source_url = EXCLUDED.current_source_url,
  current_source_type = EXCLUDED.current_source_type,
  organization_confirmed_active = EXCLUDED.organization_confirmed_active,
  fields_confirmed = EXCLUDED.fields_confirmed,
  discrepancies_from_pdf = EXCLUDED.discrepancies_from_pdf,
  is_24_hours_confirmed_explicit = EXCLUDED.is_24_hours_confirmed_explicit,
  address_handling = EXCLUDED.address_handling,
  verification_notes = EXCLUDED.verification_notes,
  promoted_resource_id = EXCLUDED.promoted_resource_id,
  updated_at = now();

-- ----------------------------------------------------------------
-- candidateId: bill-wilson-center-the-hub  |  priority 2  |  Bill Wilson Center
-- ----------------------------------------------------------------
-- Idempotency resolution order for the target resource row:
--   1. community_resource_candidate_reviews.promoted_resource_id for this candidate_id, if set.
--   2. an existing community_resources row matching the canonical (corrected) slug below.
--   3. an existing community_resources row matching the legacy/pre-correction slug — covers
--      rows already promoted under the candidate's original organization_name (e.g. via the
--      app's own promoteCandidateAction, or the earlier pilot payloads applied by Coach),
--      where research later corrected the organization_name/slug.
--   4. otherwise a freshly generated id (first-time insert).
-- The slug is NEVER overwritten on conflict, to avoid invalidating an already-published URL.
WITH resolved AS (
  SELECT COALESCE(
    (SELECT promoted_resource_id FROM public.community_resource_candidate_reviews
       WHERE candidate_id = 'bill-wilson-center-the-hub' AND promoted_resource_id IS NOT NULL),
    (SELECT id FROM public.community_resources WHERE slug = 'bill-wilson-center'),
    gen_random_uuid()
  ) AS id
),
resource_upsert AS (
  INSERT INTO public.community_resources (
    id, slug, organization_name, program_name, organization_type,
    short_description_es, short_description_en,
    primary_category, secondary_categories, urgency_level,
    age_min, age_max, audience_tags,
    service_tags, languages, cost_model, eligibility_en, service_area,
    phone, crisis_phone, sms, whatsapp, email, website_url, application_url,
    address_line1, address_line2, address_city, address_state, address_zip, address_withheld_for_safety,
    maps_search_href, hours_note_en, weekly_hours, is_24_hours,
    official_source_url, last_verified_at, next_verification_at, verification_status, active,
    partner_status, featured, print_eligible, internal_notes,
    created_at, updated_at, created_by, updated_by
  )
  SELECT
    resolved.id, 'bill-wilson-center', 'Bill Wilson Center', 'The HUB', 'nonprofit',
    '', '',
    'youth-education', '[]'::jsonb, 'i-need-help',
    NULL, NULL, '["youth"]'::jsonb,
    '[]'::jsonb, '[]'::jsonb, 'free', 'Current or former foster youth ages 15-24', 'Santa Clara County',
    '(408) 792-1750', NULL, NULL, NULL, NULL, 'https://www.billwilsoncenter.org/services/all/bwc-hub.html', NULL,
    '1510 Parkmoor Ave, Ste 101', NULL, 'San Jose', 'CA', '95126', false,
    NULL, NULL, '[]'::jsonb, false,
    'https://www.billwilsoncenter.org/services/all/bwc-hub.html', now(), now() + interval '90 days', 'verified', true,
    'none', false, false, 'Phone confirmed unchanged. The HUB has relocated since 2023.',
    now(), now(), 'certification-import', 'certification-import'
  FROM resolved
  ON CONFLICT (id) DO UPDATE SET
    organization_name = EXCLUDED.organization_name,
    program_name = EXCLUDED.program_name,
    organization_type = EXCLUDED.organization_type,
    short_description_en = EXCLUDED.short_description_en,
    primary_category = EXCLUDED.primary_category,
    secondary_categories = EXCLUDED.secondary_categories,
    urgency_level = EXCLUDED.urgency_level,
    age_min = EXCLUDED.age_min,
    age_max = EXCLUDED.age_max,
    audience_tags = EXCLUDED.audience_tags,
    service_tags = EXCLUDED.service_tags,
    languages = EXCLUDED.languages,
    cost_model = EXCLUDED.cost_model,
    eligibility_en = EXCLUDED.eligibility_en,
    service_area = EXCLUDED.service_area,
    phone = EXCLUDED.phone,
    crisis_phone = EXCLUDED.crisis_phone,
    sms = EXCLUDED.sms,
    whatsapp = EXCLUDED.whatsapp,
    email = EXCLUDED.email,
    website_url = EXCLUDED.website_url,
    application_url = EXCLUDED.application_url,
    address_line1 = EXCLUDED.address_line1,
    address_line2 = EXCLUDED.address_line2,
    address_city = EXCLUDED.address_city,
    address_state = EXCLUDED.address_state,
    address_zip = EXCLUDED.address_zip,
    address_withheld_for_safety = EXCLUDED.address_withheld_for_safety,
    maps_search_href = EXCLUDED.maps_search_href,
    hours_note_en = EXCLUDED.hours_note_en,
    weekly_hours = EXCLUDED.weekly_hours,
    is_24_hours = EXCLUDED.is_24_hours,
    official_source_url = EXCLUDED.official_source_url,
    last_verified_at = now(),
    next_verification_at = now() + interval '90 days',
    verification_status = EXCLUDED.verification_status,
    active = EXCLUDED.active,
    internal_notes = EXCLUDED.internal_notes,
    updated_at = now(),
    updated_by = 'certification-import'
  RETURNING id
)
INSERT INTO public.community_resource_candidate_reviews (
  candidate_id, disposition, reviewed_by, reviewed_at,
  current_source_url, current_source_type, organization_confirmed_active,
  fields_confirmed, discrepancies_from_pdf, is_24_hours_confirmed_explicit,
  address_handling, verification_notes, promoted_resource_id,
  created_at, updated_at
)
SELECT
  'bill-wilson-center-the-hub', 'promoted', 'certification-import', now(),
  'https://www.billwilsoncenter.org/services/all/bwc-hub.html', 'official_org_site', true,
  '["phone","address","eligibility"]'::jsonb, '[{"field":"address","pdfValue":"591 N. King Rd, Ste 1, San Jose, CA 95133","currentValue":"1510 Parkmoor Ave, Ste 101, San Jose, CA 95126 (relocated)"}]'::jsonb, false,
  'confirmed', 'Phone confirmed unchanged. The HUB has relocated since 2023.', resource_upsert.id,
  now(), now()
FROM resource_upsert
ON CONFLICT (candidate_id) DO UPDATE SET
  disposition = 'promoted',
  reviewed_by = EXCLUDED.reviewed_by,
  reviewed_at = EXCLUDED.reviewed_at,
  current_source_url = EXCLUDED.current_source_url,
  current_source_type = EXCLUDED.current_source_type,
  organization_confirmed_active = EXCLUDED.organization_confirmed_active,
  fields_confirmed = EXCLUDED.fields_confirmed,
  discrepancies_from_pdf = EXCLUDED.discrepancies_from_pdf,
  is_24_hours_confirmed_explicit = EXCLUDED.is_24_hours_confirmed_explicit,
  address_handling = EXCLUDED.address_handling,
  verification_notes = EXCLUDED.verification_notes,
  promoted_resource_id = EXCLUDED.promoted_resource_id,
  updated_at = now();

-- ----------------------------------------------------------------
-- candidateId: calworks-child-care-services  |  priority 2  |  Santa Clara County Office of Education — Childcare Resource & Referral
-- ----------------------------------------------------------------
-- Idempotency resolution order for the target resource row:
--   1. community_resource_candidate_reviews.promoted_resource_id for this candidate_id, if set.
--   2. an existing community_resources row matching the canonical (corrected) slug below.
--   3. an existing community_resources row matching the legacy/pre-correction slug — covers
--      rows already promoted under the candidate's original organization_name (e.g. via the
--      app's own promoteCandidateAction, or the earlier pilot payloads applied by Coach),
--      where research later corrected the organization_name/slug.
--   4. otherwise a freshly generated id (first-time insert).
-- The slug is NEVER overwritten on conflict, to avoid invalidating an already-published URL.
WITH resolved AS (
  SELECT COALESCE(
    (SELECT promoted_resource_id FROM public.community_resource_candidate_reviews
       WHERE candidate_id = 'calworks-child-care-services' AND promoted_resource_id IS NOT NULL),
    (SELECT id FROM public.community_resources WHERE slug = 'santa-clara-county-office-of-education-childcare-resource-referral'),
    (SELECT id FROM public.community_resources WHERE slug = 'calworks-child-care-services'),
    gen_random_uuid()
  ) AS id
),
resource_upsert AS (
  INSERT INTO public.community_resources (
    id, slug, organization_name, program_name, organization_type,
    short_description_es, short_description_en,
    primary_category, secondary_categories, urgency_level,
    age_min, age_max, audience_tags,
    service_tags, languages, cost_model, eligibility_en, service_area,
    phone, crisis_phone, sms, whatsapp, email, website_url, application_url,
    address_line1, address_line2, address_city, address_state, address_zip, address_withheld_for_safety,
    maps_search_href, hours_note_en, weekly_hours, is_24_hours,
    official_source_url, last_verified_at, next_verification_at, verification_status, active,
    partner_status, featured, print_eligible, internal_notes,
    created_at, updated_at, created_by, updated_by
  )
  SELECT
    resolved.id, 'santa-clara-county-office-of-education-childcare-resource-referral', 'Santa Clara County Office of Education — Childcare Resource & Referral', 'CalWORKs Child Care Services', 'government',
    '', 'CalWORKs has contracted with the Santa Clara County Office of Education (SCCOE) to provide child care referrals and help find a child care provider.',
    'babies-kids-parents', '[]'::jsonb, 'i-need-help',
    NULL, NULL, '[]'::jsonb,
    '[]'::jsonb, '[]'::jsonb, 'free', NULL, 'Santa Clara County',
    '(669) 212-5437', NULL, NULL, NULL, 'childcarescc@sccoe.org', 'https://www.childcarescc.org/child-care-application', 'https://www.childcarescc.org/child-care-application',
    '1290 Ridder Park Dr. MC 261', NULL, 'San Jose', 'CA', '95131', false,
    NULL, 'Monday - Friday 8:00 AM - 5:00 PM', '[]'::jsonb, false,
    'https://www.childcarescc.org/child-care-application', now(), now() + interval '90 days', 'verified', true,
    'none', false, false, 'Exact match to PDF — phone, address, and email all confirmed unchanged.',
    now(), now(), 'certification-import', 'certification-import'
  FROM resolved
  ON CONFLICT (id) DO UPDATE SET
    organization_name = EXCLUDED.organization_name,
    program_name = EXCLUDED.program_name,
    organization_type = EXCLUDED.organization_type,
    short_description_en = EXCLUDED.short_description_en,
    primary_category = EXCLUDED.primary_category,
    secondary_categories = EXCLUDED.secondary_categories,
    urgency_level = EXCLUDED.urgency_level,
    age_min = EXCLUDED.age_min,
    age_max = EXCLUDED.age_max,
    audience_tags = EXCLUDED.audience_tags,
    service_tags = EXCLUDED.service_tags,
    languages = EXCLUDED.languages,
    cost_model = EXCLUDED.cost_model,
    eligibility_en = EXCLUDED.eligibility_en,
    service_area = EXCLUDED.service_area,
    phone = EXCLUDED.phone,
    crisis_phone = EXCLUDED.crisis_phone,
    sms = EXCLUDED.sms,
    whatsapp = EXCLUDED.whatsapp,
    email = EXCLUDED.email,
    website_url = EXCLUDED.website_url,
    application_url = EXCLUDED.application_url,
    address_line1 = EXCLUDED.address_line1,
    address_line2 = EXCLUDED.address_line2,
    address_city = EXCLUDED.address_city,
    address_state = EXCLUDED.address_state,
    address_zip = EXCLUDED.address_zip,
    address_withheld_for_safety = EXCLUDED.address_withheld_for_safety,
    maps_search_href = EXCLUDED.maps_search_href,
    hours_note_en = EXCLUDED.hours_note_en,
    weekly_hours = EXCLUDED.weekly_hours,
    is_24_hours = EXCLUDED.is_24_hours,
    official_source_url = EXCLUDED.official_source_url,
    last_verified_at = now(),
    next_verification_at = now() + interval '90 days',
    verification_status = EXCLUDED.verification_status,
    active = EXCLUDED.active,
    internal_notes = EXCLUDED.internal_notes,
    updated_at = now(),
    updated_by = 'certification-import'
  RETURNING id
)
INSERT INTO public.community_resource_candidate_reviews (
  candidate_id, disposition, reviewed_by, reviewed_at,
  current_source_url, current_source_type, organization_confirmed_active,
  fields_confirmed, discrepancies_from_pdf, is_24_hours_confirmed_explicit,
  address_handling, verification_notes, promoted_resource_id,
  created_at, updated_at
)
SELECT
  'calworks-child-care-services', 'promoted', 'certification-import', now(),
  'https://www.childcarescc.org/child-care-application', 'government', true,
  '["phone","address","hours","websiteUrl"]'::jsonb, '[]'::jsonb, false,
  'confirmed', 'Exact match to PDF — phone, address, and email all confirmed unchanged.', resource_upsert.id,
  now(), now()
FROM resource_upsert
ON CONFLICT (candidate_id) DO UPDATE SET
  disposition = 'promoted',
  reviewed_by = EXCLUDED.reviewed_by,
  reviewed_at = EXCLUDED.reviewed_at,
  current_source_url = EXCLUDED.current_source_url,
  current_source_type = EXCLUDED.current_source_type,
  organization_confirmed_active = EXCLUDED.organization_confirmed_active,
  fields_confirmed = EXCLUDED.fields_confirmed,
  discrepancies_from_pdf = EXCLUDED.discrepancies_from_pdf,
  is_24_hours_confirmed_explicit = EXCLUDED.is_24_hours_confirmed_explicit,
  address_handling = EXCLUDED.address_handling,
  verification_notes = EXCLUDED.verification_notes,
  promoted_resource_id = EXCLUDED.promoted_resource_id,
  updated_at = now();

-- ----------------------------------------------------------------
-- candidateId: court-appointed-special-advocates-casa-of-silicon-valley  |  priority 2  |  Child Advocates of Silicon Valley
-- ----------------------------------------------------------------
-- Idempotency resolution order for the target resource row:
--   1. community_resource_candidate_reviews.promoted_resource_id for this candidate_id, if set.
--   2. an existing community_resources row matching the canonical (corrected) slug below.
--   3. an existing community_resources row matching the legacy/pre-correction slug — covers
--      rows already promoted under the candidate's original organization_name (e.g. via the
--      app's own promoteCandidateAction, or the earlier pilot payloads applied by Coach),
--      where research later corrected the organization_name/slug.
--   4. otherwise a freshly generated id (first-time insert).
-- The slug is NEVER overwritten on conflict, to avoid invalidating an already-published URL.
WITH resolved AS (
  SELECT COALESCE(
    (SELECT promoted_resource_id FROM public.community_resource_candidate_reviews
       WHERE candidate_id = 'court-appointed-special-advocates-casa-of-silicon-valley' AND promoted_resource_id IS NOT NULL),
    (SELECT id FROM public.community_resources WHERE slug = 'child-advocates-of-silicon-valley'),
    (SELECT id FROM public.community_resources WHERE slug = 'court-appointed-special-advocates-casa-of-silicon-valley'),
    gen_random_uuid()
  ) AS id
),
resource_upsert AS (
  INSERT INTO public.community_resources (
    id, slug, organization_name, program_name, organization_type,
    short_description_es, short_description_en,
    primary_category, secondary_categories, urgency_level,
    age_min, age_max, audience_tags,
    service_tags, languages, cost_model, eligibility_en, service_area,
    phone, crisis_phone, sms, whatsapp, email, website_url, application_url,
    address_line1, address_line2, address_city, address_state, address_zip, address_withheld_for_safety,
    maps_search_href, hours_note_en, weekly_hours, is_24_hours,
    official_source_url, last_verified_at, next_verification_at, verification_status, active,
    partner_status, featured, print_eligible, internal_notes,
    created_at, updated_at, created_by, updated_by
  )
  SELECT
    resolved.id, 'child-advocates-of-silicon-valley', 'Child Advocates of Silicon Valley', 'CASA (Court Appointed Special Advocates)', 'nonprofit',
    '', '',
    'babies-kids-parents', '[]'::jsonb, 'i-need-help',
    NULL, NULL, '["youth"]'::jsonb,
    '[]'::jsonb, '[]'::jsonb, 'free', 'Volunteers: info session, interview, background check, 30hr training', 'Santa Clara County',
    '(408) 416-0400', NULL, NULL, NULL, NULL, 'https://childadvocatessv.org/casa/', NULL,
    '1800 Hamilton Ave, Suite #200', NULL, 'San Jose', 'CA', '95125', false,
    NULL, NULL, '[]'::jsonb, false,
    'https://childadvocatessv.org/casa/', now(), now() + interval '90 days', 'verified', true,
    'none', false, false, 'CRITICAL: organization renamed and old domain now redirects to an unrelated skate-park site. Phone unchanged. Relocated from Milpitas to San Jose.',
    now(), now(), 'certification-import', 'certification-import'
  FROM resolved
  ON CONFLICT (id) DO UPDATE SET
    organization_name = EXCLUDED.organization_name,
    program_name = EXCLUDED.program_name,
    organization_type = EXCLUDED.organization_type,
    short_description_en = EXCLUDED.short_description_en,
    primary_category = EXCLUDED.primary_category,
    secondary_categories = EXCLUDED.secondary_categories,
    urgency_level = EXCLUDED.urgency_level,
    age_min = EXCLUDED.age_min,
    age_max = EXCLUDED.age_max,
    audience_tags = EXCLUDED.audience_tags,
    service_tags = EXCLUDED.service_tags,
    languages = EXCLUDED.languages,
    cost_model = EXCLUDED.cost_model,
    eligibility_en = EXCLUDED.eligibility_en,
    service_area = EXCLUDED.service_area,
    phone = EXCLUDED.phone,
    crisis_phone = EXCLUDED.crisis_phone,
    sms = EXCLUDED.sms,
    whatsapp = EXCLUDED.whatsapp,
    email = EXCLUDED.email,
    website_url = EXCLUDED.website_url,
    application_url = EXCLUDED.application_url,
    address_line1 = EXCLUDED.address_line1,
    address_line2 = EXCLUDED.address_line2,
    address_city = EXCLUDED.address_city,
    address_state = EXCLUDED.address_state,
    address_zip = EXCLUDED.address_zip,
    address_withheld_for_safety = EXCLUDED.address_withheld_for_safety,
    maps_search_href = EXCLUDED.maps_search_href,
    hours_note_en = EXCLUDED.hours_note_en,
    weekly_hours = EXCLUDED.weekly_hours,
    is_24_hours = EXCLUDED.is_24_hours,
    official_source_url = EXCLUDED.official_source_url,
    last_verified_at = now(),
    next_verification_at = now() + interval '90 days',
    verification_status = EXCLUDED.verification_status,
    active = EXCLUDED.active,
    internal_notes = EXCLUDED.internal_notes,
    updated_at = now(),
    updated_by = 'certification-import'
  RETURNING id
)
INSERT INTO public.community_resource_candidate_reviews (
  candidate_id, disposition, reviewed_by, reviewed_at,
  current_source_url, current_source_type, organization_confirmed_active,
  fields_confirmed, discrepancies_from_pdf, is_24_hours_confirmed_explicit,
  address_handling, verification_notes, promoted_resource_id,
  created_at, updated_at
)
SELECT
  'court-appointed-special-advocates-casa-of-silicon-valley', 'promoted', 'certification-import', now(),
  'https://childadvocatessv.org/casa/', 'official_org_site', true,
  '["phone","address","eligibility"]'::jsonb, '[{"field":"organizationName","pdfValue":"Court Appointed Special Advocates (CASA of Silicon Valley)","currentValue":"Child Advocates of Silicon Valley (CASA is now a program under this renamed org)"},{"field":"websiteUrl","pdfValue":"https://www.bemyadvocate.org","currentValue":"https://childadvocatessv.org/casa/ (old domain now 301-redirects to an unrelated third-party site)"},{"field":"address","pdfValue":"509 Valley Way, Bldg 2, Milpitas, CA 95035","currentValue":"1800 Hamilton Ave, Suite #200, San Jose, CA 95125"}]'::jsonb, false,
  'confirmed', 'CRITICAL: organization renamed and old domain now redirects to an unrelated skate-park site. Phone unchanged. Relocated from Milpitas to San Jose.', resource_upsert.id,
  now(), now()
FROM resource_upsert
ON CONFLICT (candidate_id) DO UPDATE SET
  disposition = 'promoted',
  reviewed_by = EXCLUDED.reviewed_by,
  reviewed_at = EXCLUDED.reviewed_at,
  current_source_url = EXCLUDED.current_source_url,
  current_source_type = EXCLUDED.current_source_type,
  organization_confirmed_active = EXCLUDED.organization_confirmed_active,
  fields_confirmed = EXCLUDED.fields_confirmed,
  discrepancies_from_pdf = EXCLUDED.discrepancies_from_pdf,
  is_24_hours_confirmed_explicit = EXCLUDED.is_24_hours_confirmed_explicit,
  address_handling = EXCLUDED.address_handling,
  verification_notes = EXCLUDED.verification_notes,
  promoted_resource_id = EXCLUDED.promoted_resource_id,
  updated_at = now();

-- ----------------------------------------------------------------
-- candidateId: first-5-santa-clara-county  |  priority 2  |  First 5 Santa Clara County
-- ----------------------------------------------------------------
-- Idempotency resolution order for the target resource row:
--   1. community_resource_candidate_reviews.promoted_resource_id for this candidate_id, if set.
--   2. an existing community_resources row matching the canonical (corrected) slug below.
--   3. an existing community_resources row matching the legacy/pre-correction slug — covers
--      rows already promoted under the candidate's original organization_name (e.g. via the
--      app's own promoteCandidateAction, or the earlier pilot payloads applied by Coach),
--      where research later corrected the organization_name/slug.
--   4. otherwise a freshly generated id (first-time insert).
-- The slug is NEVER overwritten on conflict, to avoid invalidating an already-published URL.
WITH resolved AS (
  SELECT COALESCE(
    (SELECT promoted_resource_id FROM public.community_resource_candidate_reviews
       WHERE candidate_id = 'first-5-santa-clara-county' AND promoted_resource_id IS NOT NULL),
    (SELECT id FROM public.community_resources WHERE slug = 'first-5-santa-clara-county'),
    gen_random_uuid()
  ) AS id
),
resource_upsert AS (
  INSERT INTO public.community_resources (
    id, slug, organization_name, program_name, organization_type,
    short_description_es, short_description_en,
    primary_category, secondary_categories, urgency_level,
    age_min, age_max, audience_tags,
    service_tags, languages, cost_model, eligibility_en, service_area,
    phone, crisis_phone, sms, whatsapp, email, website_url, application_url,
    address_line1, address_line2, address_city, address_state, address_zip, address_withheld_for_safety,
    maps_search_href, hours_note_en, weekly_hours, is_24_hours,
    official_source_url, last_verified_at, next_verification_at, verification_status, active,
    partner_status, featured, print_eligible, internal_notes,
    created_at, updated_at, created_by, updated_by
  )
  SELECT
    resolved.id, 'first-5-santa-clara-county', 'First 5 Santa Clara County', NULL, 'government',
    '', '',
    'babies-kids-parents', '[]'::jsonb, 'i-need-help',
    NULL, NULL, '[]'::jsonb,
    '[]'::jsonb, '[]'::jsonb, 'unknown', NULL, 'Santa Clara County',
    '(408) 260-3700', NULL, NULL, NULL, 'info@first5kids.org', 'https://www.first5kids.org', NULL,
    '4000 Moorpark Ave #200', NULL, 'San Jose', 'CA', '95117', false,
    NULL, NULL, '[]'::jsonb, false,
    'https://www.first5kids.org', now(), now() + interval '90 days', 'verified', true,
    'none', false, false, 'Exact match to PDF — phone and address unchanged.',
    now(), now(), 'certification-import', 'certification-import'
  FROM resolved
  ON CONFLICT (id) DO UPDATE SET
    organization_name = EXCLUDED.organization_name,
    program_name = EXCLUDED.program_name,
    organization_type = EXCLUDED.organization_type,
    short_description_en = EXCLUDED.short_description_en,
    primary_category = EXCLUDED.primary_category,
    secondary_categories = EXCLUDED.secondary_categories,
    urgency_level = EXCLUDED.urgency_level,
    age_min = EXCLUDED.age_min,
    age_max = EXCLUDED.age_max,
    audience_tags = EXCLUDED.audience_tags,
    service_tags = EXCLUDED.service_tags,
    languages = EXCLUDED.languages,
    cost_model = EXCLUDED.cost_model,
    eligibility_en = EXCLUDED.eligibility_en,
    service_area = EXCLUDED.service_area,
    phone = EXCLUDED.phone,
    crisis_phone = EXCLUDED.crisis_phone,
    sms = EXCLUDED.sms,
    whatsapp = EXCLUDED.whatsapp,
    email = EXCLUDED.email,
    website_url = EXCLUDED.website_url,
    application_url = EXCLUDED.application_url,
    address_line1 = EXCLUDED.address_line1,
    address_line2 = EXCLUDED.address_line2,
    address_city = EXCLUDED.address_city,
    address_state = EXCLUDED.address_state,
    address_zip = EXCLUDED.address_zip,
    address_withheld_for_safety = EXCLUDED.address_withheld_for_safety,
    maps_search_href = EXCLUDED.maps_search_href,
    hours_note_en = EXCLUDED.hours_note_en,
    weekly_hours = EXCLUDED.weekly_hours,
    is_24_hours = EXCLUDED.is_24_hours,
    official_source_url = EXCLUDED.official_source_url,
    last_verified_at = now(),
    next_verification_at = now() + interval '90 days',
    verification_status = EXCLUDED.verification_status,
    active = EXCLUDED.active,
    internal_notes = EXCLUDED.internal_notes,
    updated_at = now(),
    updated_by = 'certification-import'
  RETURNING id
)
INSERT INTO public.community_resource_candidate_reviews (
  candidate_id, disposition, reviewed_by, reviewed_at,
  current_source_url, current_source_type, organization_confirmed_active,
  fields_confirmed, discrepancies_from_pdf, is_24_hours_confirmed_explicit,
  address_handling, verification_notes, promoted_resource_id,
  created_at, updated_at
)
SELECT
  'first-5-santa-clara-county', 'promoted', 'certification-import', now(),
  'https://www.first5kids.org', 'official_org_site', true,
  '["phone","address","websiteUrl"]'::jsonb, '[]'::jsonb, false,
  'confirmed', 'Exact match to PDF — phone and address unchanged.', resource_upsert.id,
  now(), now()
FROM resource_upsert
ON CONFLICT (candidate_id) DO UPDATE SET
  disposition = 'promoted',
  reviewed_by = EXCLUDED.reviewed_by,
  reviewed_at = EXCLUDED.reviewed_at,
  current_source_url = EXCLUDED.current_source_url,
  current_source_type = EXCLUDED.current_source_type,
  organization_confirmed_active = EXCLUDED.organization_confirmed_active,
  fields_confirmed = EXCLUDED.fields_confirmed,
  discrepancies_from_pdf = EXCLUDED.discrepancies_from_pdf,
  is_24_hours_confirmed_explicit = EXCLUDED.is_24_hours_confirmed_explicit,
  address_handling = EXCLUDED.address_handling,
  verification_notes = EXCLUDED.verification_notes,
  promoted_resource_id = EXCLUDED.promoted_resource_id,
  updated_at = now();

-- ----------------------------------------------------------------
-- candidateId: go-kids-inc-estrella-family-services  |  priority 2  |  Go Kids, Inc.
-- ----------------------------------------------------------------
-- Idempotency resolution order for the target resource row:
--   1. community_resource_candidate_reviews.promoted_resource_id for this candidate_id, if set.
--   2. an existing community_resources row matching the canonical (corrected) slug below.
--   3. an existing community_resources row matching the legacy/pre-correction slug — covers
--      rows already promoted under the candidate's original organization_name (e.g. via the
--      app's own promoteCandidateAction, or the earlier pilot payloads applied by Coach),
--      where research later corrected the organization_name/slug.
--   4. otherwise a freshly generated id (first-time insert).
-- The slug is NEVER overwritten on conflict, to avoid invalidating an already-published URL.
WITH resolved AS (
  SELECT COALESCE(
    (SELECT promoted_resource_id FROM public.community_resource_candidate_reviews
       WHERE candidate_id = 'go-kids-inc-estrella-family-services' AND promoted_resource_id IS NOT NULL),
    (SELECT id FROM public.community_resources WHERE slug = 'go-kids-inc'),
    gen_random_uuid()
  ) AS id
),
resource_upsert AS (
  INSERT INTO public.community_resources (
    id, slug, organization_name, program_name, organization_type,
    short_description_es, short_description_en,
    primary_category, secondary_categories, urgency_level,
    age_min, age_max, audience_tags,
    service_tags, languages, cost_model, eligibility_en, service_area,
    phone, crisis_phone, sms, whatsapp, email, website_url, application_url,
    address_line1, address_line2, address_city, address_state, address_zip, address_withheld_for_safety,
    maps_search_href, hours_note_en, weekly_hours, is_24_hours,
    official_source_url, last_verified_at, next_verification_at, verification_status, active,
    partner_status, featured, print_eligible, internal_notes,
    created_at, updated_at, created_by, updated_by
  )
  SELECT
    resolved.id, 'go-kids-inc', 'Go Kids, Inc.', 'Estrella Family Services', 'nonprofit',
    '', '',
    'babies-kids-parents', '[]'::jsonb, 'i-need-help',
    NULL, NULL, '[]'::jsonb,
    '[]'::jsonb, '[]'::jsonb, 'unknown', NULL, 'Santa Clara, Santa Cruz, San Benito, and Monterey counties',
    '(408) 843-9000', NULL, NULL, NULL, NULL, 'https://www.gokids.org', NULL,
    '885 Moro Drive', NULL, 'Gilroy', 'CA', '95023', false,
    NULL, NULL, '[]'::jsonb, false,
    'https://www.gokids.org', now(), now() + interval '90 days', 'verified', true,
    'none', false, false, 'Phone confirmed unchanged; zip code corrected.',
    now(), now(), 'certification-import', 'certification-import'
  FROM resolved
  ON CONFLICT (id) DO UPDATE SET
    organization_name = EXCLUDED.organization_name,
    program_name = EXCLUDED.program_name,
    organization_type = EXCLUDED.organization_type,
    short_description_en = EXCLUDED.short_description_en,
    primary_category = EXCLUDED.primary_category,
    secondary_categories = EXCLUDED.secondary_categories,
    urgency_level = EXCLUDED.urgency_level,
    age_min = EXCLUDED.age_min,
    age_max = EXCLUDED.age_max,
    audience_tags = EXCLUDED.audience_tags,
    service_tags = EXCLUDED.service_tags,
    languages = EXCLUDED.languages,
    cost_model = EXCLUDED.cost_model,
    eligibility_en = EXCLUDED.eligibility_en,
    service_area = EXCLUDED.service_area,
    phone = EXCLUDED.phone,
    crisis_phone = EXCLUDED.crisis_phone,
    sms = EXCLUDED.sms,
    whatsapp = EXCLUDED.whatsapp,
    email = EXCLUDED.email,
    website_url = EXCLUDED.website_url,
    application_url = EXCLUDED.application_url,
    address_line1 = EXCLUDED.address_line1,
    address_line2 = EXCLUDED.address_line2,
    address_city = EXCLUDED.address_city,
    address_state = EXCLUDED.address_state,
    address_zip = EXCLUDED.address_zip,
    address_withheld_for_safety = EXCLUDED.address_withheld_for_safety,
    maps_search_href = EXCLUDED.maps_search_href,
    hours_note_en = EXCLUDED.hours_note_en,
    weekly_hours = EXCLUDED.weekly_hours,
    is_24_hours = EXCLUDED.is_24_hours,
    official_source_url = EXCLUDED.official_source_url,
    last_verified_at = now(),
    next_verification_at = now() + interval '90 days',
    verification_status = EXCLUDED.verification_status,
    active = EXCLUDED.active,
    internal_notes = EXCLUDED.internal_notes,
    updated_at = now(),
    updated_by = 'certification-import'
  RETURNING id
)
INSERT INTO public.community_resource_candidate_reviews (
  candidate_id, disposition, reviewed_by, reviewed_at,
  current_source_url, current_source_type, organization_confirmed_active,
  fields_confirmed, discrepancies_from_pdf, is_24_hours_confirmed_explicit,
  address_handling, verification_notes, promoted_resource_id,
  created_at, updated_at
)
SELECT
  'go-kids-inc-estrella-family-services', 'promoted', 'certification-import', now(),
  'https://www.gokids.org', 'official_org_site', true,
  '["phone","address","serviceArea"]'::jsonb, '[{"field":"address","pdfValue":"885 Moro Drive, Gilroy, CA 95020","currentValue":"885 Moro Drive, Gilroy, CA 95023 (zip corrected)"},{"field":"serviceArea","pdfValue":"(not specified)","currentValue":"Santa Clara, Santa Cruz, San Benito, and Monterey counties"}]'::jsonb, false,
  'confirmed', 'Phone confirmed unchanged; zip code corrected.', resource_upsert.id,
  now(), now()
FROM resource_upsert
ON CONFLICT (candidate_id) DO UPDATE SET
  disposition = 'promoted',
  reviewed_by = EXCLUDED.reviewed_by,
  reviewed_at = EXCLUDED.reviewed_at,
  current_source_url = EXCLUDED.current_source_url,
  current_source_type = EXCLUDED.current_source_type,
  organization_confirmed_active = EXCLUDED.organization_confirmed_active,
  fields_confirmed = EXCLUDED.fields_confirmed,
  discrepancies_from_pdf = EXCLUDED.discrepancies_from_pdf,
  is_24_hours_confirmed_explicit = EXCLUDED.is_24_hours_confirmed_explicit,
  address_handling = EXCLUDED.address_handling,
  verification_notes = EXCLUDED.verification_notes,
  promoted_resource_id = EXCLUDED.promoted_resource_id,
  updated_at = now();

-- ----------------------------------------------------------------
-- candidateId: healthier-kids-foundation  |  priority 2  |  Healthier Kids Foundation
-- ----------------------------------------------------------------
-- Idempotency resolution order for the target resource row:
--   1. community_resource_candidate_reviews.promoted_resource_id for this candidate_id, if set.
--   2. an existing community_resources row matching the canonical (corrected) slug below.
--   3. an existing community_resources row matching the legacy/pre-correction slug — covers
--      rows already promoted under the candidate's original organization_name (e.g. via the
--      app's own promoteCandidateAction, or the earlier pilot payloads applied by Coach),
--      where research later corrected the organization_name/slug.
--   4. otherwise a freshly generated id (first-time insert).
-- The slug is NEVER overwritten on conflict, to avoid invalidating an already-published URL.
WITH resolved AS (
  SELECT COALESCE(
    (SELECT promoted_resource_id FROM public.community_resource_candidate_reviews
       WHERE candidate_id = 'healthier-kids-foundation' AND promoted_resource_id IS NOT NULL),
    (SELECT id FROM public.community_resources WHERE slug = 'healthier-kids-foundation'),
    gen_random_uuid()
  ) AS id
),
resource_upsert AS (
  INSERT INTO public.community_resources (
    id, slug, organization_name, program_name, organization_type,
    short_description_es, short_description_en,
    primary_category, secondary_categories, urgency_level,
    age_min, age_max, audience_tags,
    service_tags, languages, cost_model, eligibility_en, service_area,
    phone, crisis_phone, sms, whatsapp, email, website_url, application_url,
    address_line1, address_line2, address_city, address_state, address_zip, address_withheld_for_safety,
    maps_search_href, hours_note_en, weekly_hours, is_24_hours,
    official_source_url, last_verified_at, next_verification_at, verification_status, active,
    partner_status, featured, print_eligible, internal_notes,
    created_at, updated_at, created_by, updated_by
  )
  SELECT
    resolved.id, 'healthier-kids-foundation', 'Healthier Kids Foundation', NULL, 'nonprofit',
    '', '',
    'babies-kids-parents', '[]'::jsonb, 'i-need-help',
    NULL, NULL, '[]'::jsonb,
    '[]'::jsonb, '[]'::jsonb, 'unknown', NULL, 'Silicon Valley',
    '(408) 564-5114', NULL, NULL, NULL, NULL, 'https://www.hkidsf.org', NULL,
    'Sobrato Center for Nonprofits, 1400 Parkmoor Avenue, Suite 210', NULL, 'San Jose', 'CA', '95126', false,
    NULL, NULL, '[]'::jsonb, false,
    'https://www.hkidsf.org', now(), now() + interval '90 days', 'verified', true,
    'none', false, false, 'Phone confirmed unchanged. Address has materially changed since 2023.',
    now(), now(), 'certification-import', 'certification-import'
  FROM resolved
  ON CONFLICT (id) DO UPDATE SET
    organization_name = EXCLUDED.organization_name,
    program_name = EXCLUDED.program_name,
    organization_type = EXCLUDED.organization_type,
    short_description_en = EXCLUDED.short_description_en,
    primary_category = EXCLUDED.primary_category,
    secondary_categories = EXCLUDED.secondary_categories,
    urgency_level = EXCLUDED.urgency_level,
    age_min = EXCLUDED.age_min,
    age_max = EXCLUDED.age_max,
    audience_tags = EXCLUDED.audience_tags,
    service_tags = EXCLUDED.service_tags,
    languages = EXCLUDED.languages,
    cost_model = EXCLUDED.cost_model,
    eligibility_en = EXCLUDED.eligibility_en,
    service_area = EXCLUDED.service_area,
    phone = EXCLUDED.phone,
    crisis_phone = EXCLUDED.crisis_phone,
    sms = EXCLUDED.sms,
    whatsapp = EXCLUDED.whatsapp,
    email = EXCLUDED.email,
    website_url = EXCLUDED.website_url,
    application_url = EXCLUDED.application_url,
    address_line1 = EXCLUDED.address_line1,
    address_line2 = EXCLUDED.address_line2,
    address_city = EXCLUDED.address_city,
    address_state = EXCLUDED.address_state,
    address_zip = EXCLUDED.address_zip,
    address_withheld_for_safety = EXCLUDED.address_withheld_for_safety,
    maps_search_href = EXCLUDED.maps_search_href,
    hours_note_en = EXCLUDED.hours_note_en,
    weekly_hours = EXCLUDED.weekly_hours,
    is_24_hours = EXCLUDED.is_24_hours,
    official_source_url = EXCLUDED.official_source_url,
    last_verified_at = now(),
    next_verification_at = now() + interval '90 days',
    verification_status = EXCLUDED.verification_status,
    active = EXCLUDED.active,
    internal_notes = EXCLUDED.internal_notes,
    updated_at = now(),
    updated_by = 'certification-import'
  RETURNING id
)
INSERT INTO public.community_resource_candidate_reviews (
  candidate_id, disposition, reviewed_by, reviewed_at,
  current_source_url, current_source_type, organization_confirmed_active,
  fields_confirmed, discrepancies_from_pdf, is_24_hours_confirmed_explicit,
  address_handling, verification_notes, promoted_resource_id,
  created_at, updated_at
)
SELECT
  'healthier-kids-foundation', 'promoted', 'certification-import', now(),
  'https://www.hkidsf.org', 'official_org_site', true,
  '["phone","address"]'::jsonb, '[{"field":"address","pdfValue":"4040 Moorpark Ave, Ste. 100, San Jose, CA 95117","currentValue":"1400 Parkmoor Avenue, Suite 210, San Jose, CA 95126 (different street — relocated)"}]'::jsonb, false,
  'confirmed', 'Phone confirmed unchanged. Address has materially changed since 2023.', resource_upsert.id,
  now(), now()
FROM resource_upsert
ON CONFLICT (candidate_id) DO UPDATE SET
  disposition = 'promoted',
  reviewed_by = EXCLUDED.reviewed_by,
  reviewed_at = EXCLUDED.reviewed_at,
  current_source_url = EXCLUDED.current_source_url,
  current_source_type = EXCLUDED.current_source_type,
  organization_confirmed_active = EXCLUDED.organization_confirmed_active,
  fields_confirmed = EXCLUDED.fields_confirmed,
  discrepancies_from_pdf = EXCLUDED.discrepancies_from_pdf,
  is_24_hours_confirmed_explicit = EXCLUDED.is_24_hours_confirmed_explicit,
  address_handling = EXCLUDED.address_handling,
  verification_notes = EXCLUDED.verification_notes,
  promoted_resource_id = EXCLUDED.promoted_resource_id,
  updated_at = now();

-- ----------------------------------------------------------------
-- candidateId: inclusion-support-warmline  |  priority 2  |  Innovations Collaborative (Santa Clara County Office of Education)
-- ----------------------------------------------------------------
-- Idempotency resolution order for the target resource row:
--   1. community_resource_candidate_reviews.promoted_resource_id for this candidate_id, if set.
--   2. an existing community_resources row matching the canonical (corrected) slug below.
--   3. an existing community_resources row matching the legacy/pre-correction slug — covers
--      rows already promoted under the candidate's original organization_name (e.g. via the
--      app's own promoteCandidateAction, or the earlier pilot payloads applied by Coach),
--      where research later corrected the organization_name/slug.
--   4. otherwise a freshly generated id (first-time insert).
-- The slug is NEVER overwritten on conflict, to avoid invalidating an already-published URL.
WITH resolved AS (
  SELECT COALESCE(
    (SELECT promoted_resource_id FROM public.community_resource_candidate_reviews
       WHERE candidate_id = 'inclusion-support-warmline' AND promoted_resource_id IS NOT NULL),
    (SELECT id FROM public.community_resources WHERE slug = 'innovations-collaborative-santa-clara-county-office-of-education'),
    (SELECT id FROM public.community_resources WHERE slug = 'inclusion-support-warmline'),
    gen_random_uuid()
  ) AS id
),
resource_upsert AS (
  INSERT INTO public.community_resources (
    id, slug, organization_name, program_name, organization_type,
    short_description_es, short_description_en,
    primary_category, secondary_categories, urgency_level,
    age_min, age_max, audience_tags,
    service_tags, languages, cost_model, eligibility_en, service_area,
    phone, crisis_phone, sms, whatsapp, email, website_url, application_url,
    address_line1, address_line2, address_city, address_state, address_zip, address_withheld_for_safety,
    maps_search_href, hours_note_en, weekly_hours, is_24_hours,
    official_source_url, last_verified_at, next_verification_at, verification_status, active,
    partner_status, featured, print_eligible, internal_notes,
    created_at, updated_at, created_by, updated_by
  )
  SELECT
    resolved.id, 'innovations-collaborative-santa-clara-county-office-of-education', 'Innovations Collaborative (Santa Clara County Office of Education)', 'Warmline', 'government',
    '', '',
    'babies-kids-parents', '[]'::jsonb, 'i-need-help',
    NULL, NULL, '[]'::jsonb,
    '[]'::jsonb, '["English","Spanish","Vietnamese","additional languages upon request"]'::jsonb, 'free', 'Parents, teachers, and community members working with children who have disabilities and other needs', 'Santa Clara County',
    '(408) 453-6651', NULL, NULL, NULL, 'inclusion@sccoe.org', 'https://www.innovationscollaborative.org/warmline.aspx', NULL,
    '1290 Ridder Park Drive, MC 227', NULL, 'San Jose', 'CA', '95131', false,
    NULL, NULL, '[]'::jsonb, false,
    'https://www.innovationscollaborative.org/warmline.aspx', now(), now() + interval '90 days', 'verified', true,
    'none', false, false, 'Phone confirmed identical to PDF via the specific /warmline.aspx page.',
    now(), now(), 'certification-import', 'certification-import'
  FROM resolved
  ON CONFLICT (id) DO UPDATE SET
    organization_name = EXCLUDED.organization_name,
    program_name = EXCLUDED.program_name,
    organization_type = EXCLUDED.organization_type,
    short_description_en = EXCLUDED.short_description_en,
    primary_category = EXCLUDED.primary_category,
    secondary_categories = EXCLUDED.secondary_categories,
    urgency_level = EXCLUDED.urgency_level,
    age_min = EXCLUDED.age_min,
    age_max = EXCLUDED.age_max,
    audience_tags = EXCLUDED.audience_tags,
    service_tags = EXCLUDED.service_tags,
    languages = EXCLUDED.languages,
    cost_model = EXCLUDED.cost_model,
    eligibility_en = EXCLUDED.eligibility_en,
    service_area = EXCLUDED.service_area,
    phone = EXCLUDED.phone,
    crisis_phone = EXCLUDED.crisis_phone,
    sms = EXCLUDED.sms,
    whatsapp = EXCLUDED.whatsapp,
    email = EXCLUDED.email,
    website_url = EXCLUDED.website_url,
    application_url = EXCLUDED.application_url,
    address_line1 = EXCLUDED.address_line1,
    address_line2 = EXCLUDED.address_line2,
    address_city = EXCLUDED.address_city,
    address_state = EXCLUDED.address_state,
    address_zip = EXCLUDED.address_zip,
    address_withheld_for_safety = EXCLUDED.address_withheld_for_safety,
    maps_search_href = EXCLUDED.maps_search_href,
    hours_note_en = EXCLUDED.hours_note_en,
    weekly_hours = EXCLUDED.weekly_hours,
    is_24_hours = EXCLUDED.is_24_hours,
    official_source_url = EXCLUDED.official_source_url,
    last_verified_at = now(),
    next_verification_at = now() + interval '90 days',
    verification_status = EXCLUDED.verification_status,
    active = EXCLUDED.active,
    internal_notes = EXCLUDED.internal_notes,
    updated_at = now(),
    updated_by = 'certification-import'
  RETURNING id
)
INSERT INTO public.community_resource_candidate_reviews (
  candidate_id, disposition, reviewed_by, reviewed_at,
  current_source_url, current_source_type, organization_confirmed_active,
  fields_confirmed, discrepancies_from_pdf, is_24_hours_confirmed_explicit,
  address_handling, verification_notes, promoted_resource_id,
  created_at, updated_at
)
SELECT
  'inclusion-support-warmline', 'promoted', 'certification-import', now(),
  'https://www.innovationscollaborative.org/warmline.aspx', 'official_org_site', true,
  '["phone","languages","eligibility","costModel"]'::jsonb, '[{"field":"organizationName","pdfValue":"Inclusion Collaborative","currentValue":"Renamed to Innovations Collaborative (same SCCOE program)"},{"field":"email","pdfValue":"inclusion@sccoe.org","currentValue":"warmline@sccoe.org"}]'::jsonb, false,
  'confirmed', 'Phone confirmed identical to PDF via the specific /warmline.aspx page.', resource_upsert.id,
  now(), now()
FROM resource_upsert
ON CONFLICT (candidate_id) DO UPDATE SET
  disposition = 'promoted',
  reviewed_by = EXCLUDED.reviewed_by,
  reviewed_at = EXCLUDED.reviewed_at,
  current_source_url = EXCLUDED.current_source_url,
  current_source_type = EXCLUDED.current_source_type,
  organization_confirmed_active = EXCLUDED.organization_confirmed_active,
  fields_confirmed = EXCLUDED.fields_confirmed,
  discrepancies_from_pdf = EXCLUDED.discrepancies_from_pdf,
  is_24_hours_confirmed_explicit = EXCLUDED.is_24_hours_confirmed_explicit,
  address_handling = EXCLUDED.address_handling,
  verification_notes = EXCLUDED.verification_notes,
  promoted_resource_id = EXCLUDED.promoted_resource_id,
  updated_at = now();

-- ----------------------------------------------------------------
-- candidateId: international-rescue-committee  |  priority 2  |  International Rescue Committee
-- ----------------------------------------------------------------
-- Idempotency resolution order for the target resource row:
--   1. community_resource_candidate_reviews.promoted_resource_id for this candidate_id, if set.
--   2. an existing community_resources row matching the canonical (corrected) slug below.
--   3. an existing community_resources row matching the legacy/pre-correction slug — covers
--      rows already promoted under the candidate's original organization_name (e.g. via the
--      app's own promoteCandidateAction, or the earlier pilot payloads applied by Coach),
--      where research later corrected the organization_name/slug.
--   4. otherwise a freshly generated id (first-time insert).
-- The slug is NEVER overwritten on conflict, to avoid invalidating an already-published URL.
WITH resolved AS (
  SELECT COALESCE(
    (SELECT promoted_resource_id FROM public.community_resource_candidate_reviews
       WHERE candidate_id = 'international-rescue-committee' AND promoted_resource_id IS NOT NULL),
    (SELECT id FROM public.community_resources WHERE slug = 'international-rescue-committee'),
    gen_random_uuid()
  ) AS id
),
resource_upsert AS (
  INSERT INTO public.community_resources (
    id, slug, organization_name, program_name, organization_type,
    short_description_es, short_description_en,
    primary_category, secondary_categories, urgency_level,
    age_min, age_max, audience_tags,
    service_tags, languages, cost_model, eligibility_en, service_area,
    phone, crisis_phone, sms, whatsapp, email, website_url, application_url,
    address_line1, address_line2, address_city, address_state, address_zip, address_withheld_for_safety,
    maps_search_href, hours_note_en, weekly_hours, is_24_hours,
    official_source_url, last_verified_at, next_verification_at, verification_status, active,
    partner_status, featured, print_eligible, internal_notes,
    created_at, updated_at, created_by, updated_by
  )
  SELECT
    resolved.id, 'international-rescue-committee', 'International Rescue Committee', 'San Jose Office', 'nonprofit',
    '', '',
    'legal-immigration', '[]'::jsonb, 'i-need-help',
    NULL, NULL, '[]'::jsonb,
    '[]'::jsonb, '[]'::jsonb, 'unknown', 'Refugees, asylees, trafficking victims, and immigrants', 'San Jose area',
    '(408) 277-0255', NULL, NULL, NULL, NULL, 'https://www.rescue.org/SanJose', NULL,
    '1210 South Bascom Ave., Suite 227', NULL, 'San Jose', 'CA', '95128', false,
    NULL, NULL, '[]'::jsonb, false,
    'https://www.rescue.org/SanJose', now(), now() + interval '90 days', 'verified', true,
    'none', false, false, 'Exact match to PDF — phone and address unchanged.',
    now(), now(), 'certification-import', 'certification-import'
  FROM resolved
  ON CONFLICT (id) DO UPDATE SET
    organization_name = EXCLUDED.organization_name,
    program_name = EXCLUDED.program_name,
    organization_type = EXCLUDED.organization_type,
    short_description_en = EXCLUDED.short_description_en,
    primary_category = EXCLUDED.primary_category,
    secondary_categories = EXCLUDED.secondary_categories,
    urgency_level = EXCLUDED.urgency_level,
    age_min = EXCLUDED.age_min,
    age_max = EXCLUDED.age_max,
    audience_tags = EXCLUDED.audience_tags,
    service_tags = EXCLUDED.service_tags,
    languages = EXCLUDED.languages,
    cost_model = EXCLUDED.cost_model,
    eligibility_en = EXCLUDED.eligibility_en,
    service_area = EXCLUDED.service_area,
    phone = EXCLUDED.phone,
    crisis_phone = EXCLUDED.crisis_phone,
    sms = EXCLUDED.sms,
    whatsapp = EXCLUDED.whatsapp,
    email = EXCLUDED.email,
    website_url = EXCLUDED.website_url,
    application_url = EXCLUDED.application_url,
    address_line1 = EXCLUDED.address_line1,
    address_line2 = EXCLUDED.address_line2,
    address_city = EXCLUDED.address_city,
    address_state = EXCLUDED.address_state,
    address_zip = EXCLUDED.address_zip,
    address_withheld_for_safety = EXCLUDED.address_withheld_for_safety,
    maps_search_href = EXCLUDED.maps_search_href,
    hours_note_en = EXCLUDED.hours_note_en,
    weekly_hours = EXCLUDED.weekly_hours,
    is_24_hours = EXCLUDED.is_24_hours,
    official_source_url = EXCLUDED.official_source_url,
    last_verified_at = now(),
    next_verification_at = now() + interval '90 days',
    verification_status = EXCLUDED.verification_status,
    active = EXCLUDED.active,
    internal_notes = EXCLUDED.internal_notes,
    updated_at = now(),
    updated_by = 'certification-import'
  RETURNING id
)
INSERT INTO public.community_resource_candidate_reviews (
  candidate_id, disposition, reviewed_by, reviewed_at,
  current_source_url, current_source_type, organization_confirmed_active,
  fields_confirmed, discrepancies_from_pdf, is_24_hours_confirmed_explicit,
  address_handling, verification_notes, promoted_resource_id,
  created_at, updated_at
)
SELECT
  'international-rescue-committee', 'promoted', 'certification-import', now(),
  'https://www.rescue.org/SanJose', 'official_org_site', true,
  '["phone","address","eligibility"]'::jsonb, '[]'::jsonb, false,
  'confirmed', 'Exact match to PDF — phone and address unchanged.', resource_upsert.id,
  now(), now()
FROM resource_upsert
ON CONFLICT (candidate_id) DO UPDATE SET
  disposition = 'promoted',
  reviewed_by = EXCLUDED.reviewed_by,
  reviewed_at = EXCLUDED.reviewed_at,
  current_source_url = EXCLUDED.current_source_url,
  current_source_type = EXCLUDED.current_source_type,
  organization_confirmed_active = EXCLUDED.organization_confirmed_active,
  fields_confirmed = EXCLUDED.fields_confirmed,
  discrepancies_from_pdf = EXCLUDED.discrepancies_from_pdf,
  is_24_hours_confirmed_explicit = EXCLUDED.is_24_hours_confirmed_explicit,
  address_handling = EXCLUDED.address_handling,
  verification_notes = EXCLUDED.verification_notes,
  promoted_resource_id = EXCLUDED.promoted_resource_id,
  updated_at = now();

-- ----------------------------------------------------------------
-- candidateId: katharine-and-george-alexander-community-law-center  |  priority 2  |  Katharine & George Alexander Community Law Center
-- ----------------------------------------------------------------
-- Idempotency resolution order for the target resource row:
--   1. community_resource_candidate_reviews.promoted_resource_id for this candidate_id, if set.
--   2. an existing community_resources row matching the canonical (corrected) slug below.
--   3. an existing community_resources row matching the legacy/pre-correction slug — covers
--      rows already promoted under the candidate's original organization_name (e.g. via the
--      app's own promoteCandidateAction, or the earlier pilot payloads applied by Coach),
--      where research later corrected the organization_name/slug.
--   4. otherwise a freshly generated id (first-time insert).
-- The slug is NEVER overwritten on conflict, to avoid invalidating an already-published URL.
WITH resolved AS (
  SELECT COALESCE(
    (SELECT promoted_resource_id FROM public.community_resource_candidate_reviews
       WHERE candidate_id = 'katharine-and-george-alexander-community-law-center' AND promoted_resource_id IS NOT NULL),
    (SELECT id FROM public.community_resources WHERE slug = 'katharine-george-alexander-community-law-center'),
    (SELECT id FROM public.community_resources WHERE slug = 'katharine-and-george-alexander-community-law-center'),
    gen_random_uuid()
  ) AS id
),
resource_upsert AS (
  INSERT INTO public.community_resources (
    id, slug, organization_name, program_name, organization_type,
    short_description_es, short_description_en,
    primary_category, secondary_categories, urgency_level,
    age_min, age_max, audience_tags,
    service_tags, languages, cost_model, eligibility_en, service_area,
    phone, crisis_phone, sms, whatsapp, email, website_url, application_url,
    address_line1, address_line2, address_city, address_state, address_zip, address_withheld_for_safety,
    maps_search_href, hours_note_en, weekly_hours, is_24_hours,
    official_source_url, last_verified_at, next_verification_at, verification_status, active,
    partner_status, featured, print_eligible, internal_notes,
    created_at, updated_at, created_by, updated_by
  )
  SELECT
    resolved.id, 'katharine-george-alexander-community-law-center', 'Katharine & George Alexander Community Law Center', NULL, 'nonprofit',
    '', '',
    'legal-immigration', '[]'::jsonb, 'i-need-help',
    NULL, NULL, '[]'::jsonb,
    '[]'::jsonb, '[]'::jsonb, 'free', 'Individuals and communities in need — Consumer Law, Immigration, Workers'' Rights, Unhoused Advocacy', 'Santa Clara County',
    '(408) 288-7030', NULL, NULL, NULL, NULL, 'https://law.scu.edu/centers/kgaclc/', NULL,
    '1030 The Alameda', NULL, 'San Jose', 'CA', '95126', false,
    NULL, NULL, '[]'::jsonb, false,
    'https://law.scu.edu/centers/kgaclc/', now(), now() + interval '90 days', 'verified', true,
    'none', false, false, 'Phone and address confirmed unchanged.',
    now(), now(), 'certification-import', 'certification-import'
  FROM resolved
  ON CONFLICT (id) DO UPDATE SET
    organization_name = EXCLUDED.organization_name,
    program_name = EXCLUDED.program_name,
    organization_type = EXCLUDED.organization_type,
    short_description_en = EXCLUDED.short_description_en,
    primary_category = EXCLUDED.primary_category,
    secondary_categories = EXCLUDED.secondary_categories,
    urgency_level = EXCLUDED.urgency_level,
    age_min = EXCLUDED.age_min,
    age_max = EXCLUDED.age_max,
    audience_tags = EXCLUDED.audience_tags,
    service_tags = EXCLUDED.service_tags,
    languages = EXCLUDED.languages,
    cost_model = EXCLUDED.cost_model,
    eligibility_en = EXCLUDED.eligibility_en,
    service_area = EXCLUDED.service_area,
    phone = EXCLUDED.phone,
    crisis_phone = EXCLUDED.crisis_phone,
    sms = EXCLUDED.sms,
    whatsapp = EXCLUDED.whatsapp,
    email = EXCLUDED.email,
    website_url = EXCLUDED.website_url,
    application_url = EXCLUDED.application_url,
    address_line1 = EXCLUDED.address_line1,
    address_line2 = EXCLUDED.address_line2,
    address_city = EXCLUDED.address_city,
    address_state = EXCLUDED.address_state,
    address_zip = EXCLUDED.address_zip,
    address_withheld_for_safety = EXCLUDED.address_withheld_for_safety,
    maps_search_href = EXCLUDED.maps_search_href,
    hours_note_en = EXCLUDED.hours_note_en,
    weekly_hours = EXCLUDED.weekly_hours,
    is_24_hours = EXCLUDED.is_24_hours,
    official_source_url = EXCLUDED.official_source_url,
    last_verified_at = now(),
    next_verification_at = now() + interval '90 days',
    verification_status = EXCLUDED.verification_status,
    active = EXCLUDED.active,
    internal_notes = EXCLUDED.internal_notes,
    updated_at = now(),
    updated_by = 'certification-import'
  RETURNING id
)
INSERT INTO public.community_resource_candidate_reviews (
  candidate_id, disposition, reviewed_by, reviewed_at,
  current_source_url, current_source_type, organization_confirmed_active,
  fields_confirmed, discrepancies_from_pdf, is_24_hours_confirmed_explicit,
  address_handling, verification_notes, promoted_resource_id,
  created_at, updated_at
)
SELECT
  'katharine-and-george-alexander-community-law-center', 'promoted', 'certification-import', now(),
  'https://law.scu.edu/centers/kgaclc/', 'official_org_site', true,
  '["phone","address","eligibility","costModel"]'::jsonb, '[{"field":"websiteUrl","pdfValue":"http://law.scu.edu/kgaclc","currentValue":"https://law.scu.edu/centers/kgaclc/ (URL path changed)"}]'::jsonb, false,
  'confirmed', 'Phone and address confirmed unchanged.', resource_upsert.id,
  now(), now()
FROM resource_upsert
ON CONFLICT (candidate_id) DO UPDATE SET
  disposition = 'promoted',
  reviewed_by = EXCLUDED.reviewed_by,
  reviewed_at = EXCLUDED.reviewed_at,
  current_source_url = EXCLUDED.current_source_url,
  current_source_type = EXCLUDED.current_source_type,
  organization_confirmed_active = EXCLUDED.organization_confirmed_active,
  fields_confirmed = EXCLUDED.fields_confirmed,
  discrepancies_from_pdf = EXCLUDED.discrepancies_from_pdf,
  is_24_hours_confirmed_explicit = EXCLUDED.is_24_hours_confirmed_explicit,
  address_handling = EXCLUDED.address_handling,
  verification_notes = EXCLUDED.verification_notes,
  promoted_resource_id = EXCLUDED.promoted_resource_id,
  updated_at = now();

COMMIT;
