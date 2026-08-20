-- Recursos Build 03C — Certification import batch 6/7 (10 records)
-- Source: data/recursos/verified/scc-community-resource-guide-2023-ready-for-import.json
-- Records 51..60 of 65 (sorted verificationPriority asc, candidateId asc).
--
-- Idempotent: safe to re-run. Resources are upserted by slug (unique); review rows are
-- upserted by candidate_id (unique). A second execution leaves row counts unchanged.
-- No DELETE / TRUNCATE / DROP / ALTER. Current researched facts are authoritative and
-- always overwrite any prior value on conflict (including for rows already promoted
-- during the earlier pilot data load).

BEGIN;

-- ----------------------------------------------------------------
-- candidateId: momentum-for-health  |  priority 3  |  Momentum For Health
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
       WHERE candidate_id = 'momentum-for-health' AND promoted_resource_id IS NOT NULL),
    (SELECT id FROM public.community_resources WHERE slug = 'momentum-for-health'),
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
    resolved.id, 'momentum-for-health', 'Momentum For Health', NULL, 'nonprofit',
    '', '',
    'mental-health-recovery', '[]'::jsonb, 'i-need-help',
    NULL, NULL, '[]'::jsonb,
    '[]'::jsonb, '[]'::jsonb, 'unknown', 'Adults with Medi-Cal', 'Santa Clara County',
    '408-596-7290', '988', NULL, NULL, 'info@momentumforhealth.org', 'https://www.momentumforhealth.org', NULL,
    NULL, NULL, NULL, NULL, NULL, false,
    NULL, NULL, '[]'::jsonb, false,
    'https://www.momentumforhealth.org', now(), now() + interval '90 days', 'verified', true,
    'none', false, false, 'Phone number changed; new TRUST Mobile Response Program confirmed as a new offering not in the 2023 PDF.',
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
  'momentum-for-health', 'promoted', 'certification-import', now(),
  'https://www.momentumforhealth.org', 'official_org_site', true,
  '["phone"]'::jsonb, '[{"field":"phone","pdfValue":"408-260-4040","currentValue":"408-596-7290 (or 988)"}]'::jsonb, false,
  'not_applicable', 'Phone number changed; new TRUST Mobile Response Program confirmed as a new offering not in the 2023 PDF.', resource_upsert.id,
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
-- candidateId: mtn-view-los-altos-adult-school-mvla  |  priority 3  |  Mtn View-Los Altos Adult School (MVLA)
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
       WHERE candidate_id = 'mtn-view-los-altos-adult-school-mvla' AND promoted_resource_id IS NOT NULL),
    (SELECT id FROM public.community_resources WHERE slug = 'mtn-view-los-altos-adult-school-mvla'),
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
    resolved.id, 'mtn-view-los-altos-adult-school-mvla', 'Mtn View-Los Altos Adult School (MVLA)', NULL, 'school-district',
    '', '',
    'jobs-training', '[]'::jsonb, 'want-to-connect',
    NULL, NULL, '[]'::jsonb,
    '[]'::jsonb, '[]'::jsonb, 'unknown', NULL, 'Mountain View / Los Altos',
    '650-940-1333', NULL, NULL, NULL, NULL, 'https://as.mvla.net', NULL,
    '333 Moffett Blvd', NULL, 'Mountain View', 'CA', '94043', false,
    NULL, NULL, '[]'::jsonb, false,
    'https://as.mvla.net', now(), now() + interval '90 days', 'verified', true,
    'none', false, false, 'Exact match to PDF.',
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
  'mtn-view-los-altos-adult-school-mvla', 'promoted', 'certification-import', now(),
  'https://as.mvla.net', 'government', true,
  '["phone","address"]'::jsonb, '[]'::jsonb, false,
  'confirmed', 'Exact match to PDF.', resource_upsert.id,
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
-- candidateId: new-eyes  |  priority 3  |  New Eyes
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
       WHERE candidate_id = 'new-eyes' AND promoted_resource_id IS NOT NULL),
    (SELECT id FROM public.community_resources WHERE slug = 'new-eyes'),
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
    resolved.id, 'new-eyes', 'New Eyes', NULL, 'nonprofit',
    '', '',
    'health-clinics', '[]'::jsonb, 'want-to-connect',
    NULL, NULL, '[]'::jsonb,
    '[]'::jsonb, '[]'::jsonb, 'free', 'Low income individuals', 'United States',
    NULL, NULL, NULL, NULL, NULL, 'https://www.new-eyes.org', NULL,
    NULL, NULL, NULL, NULL, NULL, false,
    NULL, NULL, '[]'::jsonb, false,
    'https://www.new-eyes.org', now(), now() + interval '90 days', 'verified', true,
    'none', false, false, 'No phone in either PDF or current source — national mail-based eyeglasses program.',
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
  'new-eyes', 'promoted', 'certification-import', now(),
  'https://www.new-eyes.org', 'official_org_site', true,
  '["websiteUrl","eligibility"]'::jsonb, '[]'::jsonb, false,
  'not_applicable', 'No phone in either PDF or current source — national mail-based eyeglasses program.', resource_upsert.id,
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
-- candidateId: north-east-medical-services-nems  |  priority 3  |  North East Medical Services (NEMS)
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
       WHERE candidate_id = 'north-east-medical-services-nems' AND promoted_resource_id IS NOT NULL),
    (SELECT id FROM public.community_resources WHERE slug = 'north-east-medical-services-nems'),
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
    resolved.id, 'north-east-medical-services-nems', 'North East Medical Services (NEMS)', NULL, 'community-clinic',
    '', '',
    'health-clinics', '[]'::jsonb, 'i-need-help',
    NULL, NULL, '[]'::jsonb,
    '[]'::jsonb, '[]'::jsonb, 'unknown', NULL, 'San Jose',
    '1-888-500-1886', NULL, NULL, NULL, 'info@nems.org', 'https://www.nems.org', NULL,
    '1870 Lundy Avenue', NULL, 'San Jose', 'CA', '95131', false,
    NULL, 'Mon-Fri 8am-6pm, Sat 8am-12pm & 1-5pm', '[]'::jsonb, false,
    'https://www.nems.org', now(), now() + interval '90 days', 'verified', true,
    'none', false, false, 'Address confirmed unchanged; phone moved to a shared toll-free line. Second SJ location at 939 Story Road also confirmed.',
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
  'north-east-medical-services-nems', 'promoted', 'certification-import', now(),
  'https://www.nems.org', 'official_org_site', true,
  '["address","hours"]'::jsonb, '[{"field":"phone","pdfValue":"408-573-9686","currentValue":"1-888-500-1886 (shared appointment line for both SJ clinics)"}]'::jsonb, false,
  'confirmed', 'Address confirmed unchanged; phone moved to a shared toll-free line. Second SJ location at 939 Story Road also confirmed.', resource_upsert.id,
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
-- candidateId: novaworks  |  priority 3  |  NOVAworks
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
       WHERE candidate_id = 'novaworks' AND promoted_resource_id IS NOT NULL),
    (SELECT id FROM public.community_resources WHERE slug = 'novaworks'),
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
    resolved.id, 'novaworks', 'NOVAworks', NULL, 'government',
    '', '',
    'jobs-training', '[]'::jsonb, 'want-to-connect',
    NULL, NULL, '["youth"]'::jsonb,
    '[]'::jsonb, '[]'::jsonb, 'unknown', NULL, 'Sunnyvale',
    '408-730-7232', NULL, NULL, NULL, 'info@novaworks.org', 'https://novaworks.org', NULL,
    '456 West Olive Ave', NULL, 'Sunnyvale', 'CA', NULL, false,
    NULL, 'Mon-Fri 8am-5pm', '[]'::jsonb, false,
    'https://novaworks.org', now(), now() + interval '90 days', 'verified', true,
    'none', false, false, 'Phone confirmed unchanged; address street number differs — relocated nearby.',
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
  'novaworks', 'promoted', 'certification-import', now(),
  'https://novaworks.org', 'official_org_site', true,
  '["phone","hours"]'::jsonb, '[{"field":"address","pdfValue":"505 W. Olive Ave. Ste 550, Sunnyvale CA 94086","currentValue":"456 West Olive Ave, Sunnyvale (different street number)"}]'::jsonb, false,
  'confirmed', 'Phone confirmed unchanged; address street number differs — relocated nearby.', resource_upsert.id,
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
-- candidateId: rebekah-children-s-services  |  priority 3  |  Rebekah Children's Services
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
       WHERE candidate_id = 'rebekah-children-s-services' AND promoted_resource_id IS NOT NULL),
    (SELECT id FROM public.community_resources WHERE slug = 'rebekah-children-s-services'),
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
    resolved.id, 'rebekah-children-s-services', 'Rebekah Children''s Services', NULL, 'nonprofit',
    '', '',
    'mental-health-recovery', '[]'::jsonb, 'i-need-help',
    NULL, NULL, '[]'::jsonb,
    '[]'::jsonb, '[]'::jsonb, 'unknown', NULL, 'Gilroy, Campbell, Hollister',
    '(408) 846-2100', NULL, NULL, NULL, NULL, 'https://www.rcskids.org', NULL,
    '290 IOOF Ave', NULL, 'Gilroy', 'CA', '95020', false,
    NULL, NULL, '[]'::jsonb, false,
    'https://www.rcskids.org', now(), now() + interval '90 days', 'verified', true,
    'none', false, false, 'Exact match to PDF. Also has Campbell and Hollister locations.',
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
  'rebekah-children-s-services', 'promoted', 'certification-import', now(),
  'https://www.rcskids.org', 'official_org_site', true,
  '["phone","address"]'::jsonb, '[]'::jsonb, false,
  'confirmed', 'Exact match to PDF. Also has Campbell and Hollister locations.', resource_upsert.id,
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
-- candidateId: rotacare-bay-area  |  priority 3  |  RotaCare Bay Area
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
       WHERE candidate_id = 'rotacare-bay-area' AND promoted_resource_id IS NOT NULL),
    (SELECT id FROM public.community_resources WHERE slug = 'rotacare-bay-area'),
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
    resolved.id, 'rotacare-bay-area', 'RotaCare Bay Area', NULL, 'community-clinic',
    '', '',
    'health-clinics', '[]'::jsonb, 'i-need-help',
    NULL, NULL, '[]'::jsonb,
    '[]'::jsonb, '[]'::jsonb, 'free', NULL, 'Greater Bay Area incl. San Jose',
    '408-379-8000', NULL, NULL, NULL, NULL, 'https://www.rotacarebayarea.org', NULL,
    NULL, NULL, NULL, NULL, NULL, false,
    NULL, NULL, '[]'::jsonb, false,
    'https://www.rotacarebayarea.org', now(), now() + interval '90 days', 'verified', true,
    'none', false, false, 'Phone confirmed unchanged. Gilroy clinic not reconfirmed on this specific page — org lists San Jose among 9 regional clinics.',
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
  'rotacare-bay-area', 'promoted', 'certification-import', now(),
  'https://www.rotacarebayarea.org', 'official_org_site', true,
  '["phone"]'::jsonb, '[]'::jsonb, false,
  'not_applicable', 'Phone confirmed unchanged. Gilroy clinic not reconfirmed on this specific page — org lists San Jose among 9 regional clinics.', resource_upsert.id,
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
-- candidateId: sacred-heart-community-service  |  priority 3  |  Sacred Heart Community Service
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
       WHERE candidate_id = 'sacred-heart-community-service' AND promoted_resource_id IS NOT NULL),
    (SELECT id FROM public.community_resources WHERE slug = 'sacred-heart-community-service'),
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
    resolved.id, 'sacred-heart-community-service', 'Sacred Heart Community Service', NULL, 'nonprofit',
    '', '',
    'community-support', '[]'::jsonb, 'i-need-help',
    NULL, NULL, '[]'::jsonb,
    '[]'::jsonb, '[]'::jsonb, 'unknown', NULL, 'San Jose',
    '(408) 278-2160', NULL, NULL, NULL, NULL, 'https://sacredheartcs.org', NULL,
    '1381 South First Street', NULL, 'San Jose', 'CA', '95110', false,
    NULL, NULL, '[]'::jsonb, false,
    'https://sacredheartcs.org', now(), now() + interval '90 days', 'verified', true,
    'none', false, false, 'Exact match to PDF.',
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
  'sacred-heart-community-service', 'promoted', 'certification-import', now(),
  'https://sacredheartcs.org', 'official_org_site', true,
  '["phone","address"]'::jsonb, '[]'::jsonb, false,
  'confirmed', 'Exact match to PDF.', resource_upsert.id,
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
-- candidateId: san-jose-state-university-career-center  |  priority 3  |  San José State University
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
       WHERE candidate_id = 'san-jose-state-university-career-center' AND promoted_resource_id IS NOT NULL),
    (SELECT id FROM public.community_resources WHERE slug = 'san-jose-state-university'),
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
    resolved.id, 'san-jose-state-university', 'San José State University', 'Career Center', 'school-district',
    '', '',
    'jobs-training', '[]'::jsonb, 'want-to-connect',
    NULL, NULL, '[]'::jsonb,
    '[]'::jsonb, '[]'::jsonb, 'unknown', NULL, 'San Jose',
    '(408) 924-6031', NULL, NULL, NULL, NULL, 'https://careercenter.sjsu.edu/', NULL,
    'One Washington Square (Clark Hall, 1st Floor, Room 140)', NULL, 'San Jose', 'CA', '95192', false,
    NULL, NULL, '[]'::jsonb, false,
    'https://careercenter.sjsu.edu/', now(), now() + interval '90 days', 'verified', true,
    'none', false, false, 'Address confirmed unchanged; phone refined to the Career Center''s direct line rather than the university switchboard.',
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
  'san-jose-state-university-career-center', 'promoted', 'certification-import', now(),
  'https://careercenter.sjsu.edu/', 'government', true,
  '["address"]'::jsonb, '[{"field":"phone","pdfValue":"408-924-1000 (general SJSU line)","currentValue":"(408) 924-6031 (Career Center-specific line)"}]'::jsonb, false,
  'confirmed', 'Address confirmed unchanged; phone refined to the Career Center''s direct line rather than the university switchboard.', resource_upsert.id,
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
-- candidateId: santa-clara-family-health-plan-scfhp  |  priority 3  |  Santa Clara Family Health Plan (SCFHP)
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
       WHERE candidate_id = 'santa-clara-family-health-plan-scfhp' AND promoted_resource_id IS NOT NULL),
    (SELECT id FROM public.community_resources WHERE slug = 'santa-clara-family-health-plan-scfhp'),
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
    resolved.id, 'santa-clara-family-health-plan-scfhp', 'Santa Clara Family Health Plan (SCFHP)', NULL, 'healthcare',
    '', '',
    'health-clinics', '[]'::jsonb, 'i-need-help',
    NULL, NULL, '[]'::jsonb,
    '[]'::jsonb, '[]'::jsonb, 'unknown', NULL, 'Santa Clara County',
    '1-800-260-2055', NULL, NULL, NULL, NULL, 'https://www.scfhp.com', NULL,
    '6201 San Ignacio Ave.', NULL, 'San Jose', 'CA', '95119', false,
    NULL, NULL, '[]'::jsonb, false,
    'https://www.scfhp.com', now(), now() + interval '90 days', 'verified', true,
    'none', false, false, 'Address confirmed unchanged. Multiple current phone lines confirmed; Customer Service number (1-800-260-2055) matches what the original source notes already recorded.',
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
  'santa-clara-family-health-plan-scfhp', 'promoted', 'certification-import', now(),
  'https://www.scfhp.com', 'official_org_site', true,
  '["address","phone"]'::jsonb, '[{"field":"phone","pdfValue":"1-888-802-3353","currentValue":"1-408-376-2000 / 1-800-260-2055 (Customer Service, cross-confirmed against original source notes)"}]'::jsonb, false,
  'confirmed', 'Address confirmed unchanged. Multiple current phone lines confirmed; Customer Service number (1-800-260-2055) matches what the original source notes already recorded.', resource_upsert.id,
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
