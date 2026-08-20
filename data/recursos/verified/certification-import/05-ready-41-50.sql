-- Recursos Build 03C — Certification import batch 5/7 (10 records)
-- Source: data/recursos/verified/scc-community-resource-guide-2023-ready-for-import.json
-- Records 41..50 of 65 (sorted verificationPriority asc, candidateId asc).
--
-- Idempotent: safe to re-run. Resources are upserted by slug (unique); review rows are
-- upserted by candidate_id (unique). A second execution leaves row counts unchanged.
-- No DELETE / TRUNCATE / DROP / ALTER. Current researched facts are authoritative and
-- always overwrite any prior value on conflict (including for rows already promoted
-- during the earlier pilot data load).

BEGIN;

-- ----------------------------------------------------------------
-- candidateId: east-side-adult-education  |  priority 3  |  East Side Adult Education
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
       WHERE candidate_id = 'east-side-adult-education' AND promoted_resource_id IS NOT NULL),
    (SELECT id FROM public.community_resources WHERE slug = 'east-side-adult-education'),
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
    resolved.id, 'east-side-adult-education', 'East Side Adult Education', NULL, 'school-district',
    '', 'Includes Independence Adult Center and Overfelt Adult Center sites.',
    'jobs-training', '[]'::jsonb, 'want-to-connect',
    NULL, NULL, '[]'::jsonb,
    '[]'::jsonb, '[]'::jsonb, 'unknown', NULL, 'East San Jose',
    '(408) 928-9300', NULL, NULL, NULL, NULL, 'http://adulteducation.esuhsd.org', NULL,
    '625 Educational Park Drive', NULL, 'San Jose', 'CA', '95133', false,
    NULL, NULL, '[]'::jsonb, false,
    'http://adulteducation.esuhsd.org', now(), now() + interval '90 days', 'verified', true,
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
  'east-side-adult-education', 'promoted', 'certification-import', now(),
  'http://adulteducation.esuhsd.org', 'government', true,
  '["phone","address"]'::jsonb, '[]'::jsonb, false,
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
-- candidateId: evergreen-valley-college  |  priority 3  |  Evergreen Valley College
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
       WHERE candidate_id = 'evergreen-valley-college' AND promoted_resource_id IS NOT NULL),
    (SELECT id FROM public.community_resources WHERE slug = 'evergreen-valley-college'),
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
    resolved.id, 'evergreen-valley-college', 'Evergreen Valley College', NULL, 'school-district',
    '', '',
    'jobs-training', '[]'::jsonb, 'want-to-connect',
    NULL, NULL, '[]'::jsonb,
    '[]'::jsonb, '[]'::jsonb, 'unknown', NULL, 'San Jose',
    '408-274-7900', NULL, NULL, NULL, NULL, 'https://www.evc.edu', NULL,
    '3095 Yerba Buena Road', NULL, 'San José', 'CA', '95135', false,
    NULL, NULL, '[]'::jsonb, false,
    'https://www.evc.edu', now(), now() + interval '90 days', 'verified', true,
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
  'evergreen-valley-college', 'promoted', 'certification-import', now(),
  'https://www.evc.edu', 'government', true,
  '["phone","address"]'::jsonb, '[]'::jsonb, false,
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
-- candidateId: fremont-union-high-school-district-adult-school-fuhsd  |  priority 3  |  Fremont Union High School District Adult School
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
       WHERE candidate_id = 'fremont-union-high-school-district-adult-school-fuhsd' AND promoted_resource_id IS NOT NULL),
    (SELECT id FROM public.community_resources WHERE slug = 'fremont-union-high-school-district-adult-school'),
    (SELECT id FROM public.community_resources WHERE slug = 'fremont-union-high-school-district-adult-school-fuhsd'),
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
    resolved.id, 'fremont-union-high-school-district-adult-school', 'Fremont Union High School District Adult School', NULL, 'school-district',
    '', '',
    'jobs-training', '[]'::jsonb, 'want-to-connect',
    NULL, NULL, '[]'::jsonb,
    '[]'::jsonb, '[]'::jsonb, 'unknown', NULL, 'Sunnyvale',
    '408-522-2700', NULL, NULL, NULL, 'gilbert.seegmiller@mvla.net', 'https://www.fuhsdadultschool.com', NULL,
    '589 W. Fremont Ave.', NULL, 'Sunnyvale', 'CA', '94087', false,
    NULL, NULL, '[]'::jsonb, false,
    'https://www.fuhsdadultschool.com', now(), now() + interval '90 days', 'verified', true,
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
  'fremont-union-high-school-district-adult-school-fuhsd', 'promoted', 'certification-import', now(),
  'https://www.fuhsdadultschool.com', 'government', true,
  '["phone","address"]'::jsonb, '[]'::jsonb, false,
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
-- candidateId: fresh-success  |  priority 3  |  Fresh Success (Gavilan College)
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
       WHERE candidate_id = 'fresh-success' AND promoted_resource_id IS NOT NULL),
    (SELECT id FROM public.community_resources WHERE slug = 'fresh-success-gavilan-college'),
    (SELECT id FROM public.community_resources WHERE slug = 'fresh-success'),
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
    resolved.id, 'fresh-success-gavilan-college', 'Fresh Success (Gavilan College)', NULL, 'government',
    '', '',
    'jobs-training', '[]'::jsonb, 'want-to-connect',
    NULL, NULL, '[]'::jsonb,
    '[]'::jsonb, '[]'::jsonb, 'free', 'Students receiving or eligible for CalFresh (SNAP)', 'Santa Clara and San Benito County',
    '408.852.2838', NULL, NULL, NULL, NULL, 'http://www.gavilan.edu/student/eops/calworks/freshsuccess.php', NULL,
    'LI 135, 5055 Santa Teresa Blvd', NULL, 'Gilroy', 'CA', '95020', false,
    NULL, NULL, '[]'::jsonb, false,
    'http://www.gavilan.edu/student/eops/calworks/freshsuccess.php', now(), now() + interval '90 days', 'verified', true,
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
  'fresh-success', 'promoted', 'certification-import', now(),
  'http://www.gavilan.edu/student/eops/calworks/freshsuccess.php', 'government', true,
  '["phone","address","eligibility","serviceArea"]'::jsonb, '[]'::jsonb, false,
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
-- candidateId: goodwill-of-silicon-valley  |  priority 3  |  Goodwill of Silicon Valley
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
       WHERE candidate_id = 'goodwill-of-silicon-valley' AND promoted_resource_id IS NOT NULL),
    (SELECT id FROM public.community_resources WHERE slug = 'goodwill-of-silicon-valley'),
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
    resolved.id, 'goodwill-of-silicon-valley', 'Goodwill of Silicon Valley', NULL, 'nonprofit',
    '', '',
    'jobs-training', '[]'::jsonb, 'want-to-connect',
    NULL, NULL, '[]'::jsonb,
    '[]'::jsonb, '[]'::jsonb, 'unknown', NULL, 'San Jose',
    '(408) 998-5774', NULL, NULL, NULL, NULL, 'https://goodwillsv.org/', NULL,
    '1600 Technology Drive', NULL, 'San Jose', 'CA', '95110', false,
    NULL, NULL, '[]'::jsonb, false,
    'https://goodwillsv.org/', now(), now() + interval '90 days', 'verified', true,
    'none', false, false, 'PDF''s number/address matched a secondary Recycling Center location, not the main Opportunity Center — corrected to the primary HQ contact.',
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
  'goodwill-of-silicon-valley', 'promoted', 'certification-import', now(),
  'https://goodwillsv.org/', 'official_org_site', true,
  '["phone","address"]'::jsonb, '[{"field":"phone/address","pdfValue":"408-869-9261 / 1080 N. 7th Street","currentValue":"(408) 998-5774 / 1600 Technology Drive (main Opportunity Center HQ); 1080 N. 7th St is now specifically the Recycling & Sustainability Center, a different facility"}]'::jsonb, false,
  'confirmed', 'PDF''s number/address matched a secondary Recycling Center location, not the main Opportunity Center — corrected to the primary HQ contact.', resource_upsert.id,
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
-- candidateId: goodwill-of-silicon-valley-school-health-clinics-wellness-center  |  priority 3  |  School Health Clinics of Santa Clara County
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
       WHERE candidate_id = 'goodwill-of-silicon-valley-school-health-clinics-wellness-center' AND promoted_resource_id IS NOT NULL),
    (SELECT id FROM public.community_resources WHERE slug = 'school-health-clinics-of-santa-clara-county'),
    (SELECT id FROM public.community_resources WHERE slug = 'goodwill-of-silicon-valley'),
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
    resolved.id, 'school-health-clinics-of-santa-clara-county', 'School Health Clinics of Santa Clara County', 'School Health Clinics / Wellness Center', 'nonprofit',
    '', '',
    'health-clinics', '[]'::jsonb, 'i-need-help',
    NULL, NULL, '[]'::jsonb,
    '[]'::jsonb, '[]'::jsonb, 'low_cost', 'Low income, medically underserved individuals', 'Santa Clara County',
    '408-284-2280', NULL, NULL, NULL, NULL, 'https://www.schoolhealthclinics.org', NULL,
    '6840 Via Del Oro, #210', NULL, 'San José', 'CA', '95119', false,
    NULL, NULL, '[]'::jsonb, false,
    'https://www.schoolhealthclinics.org', now(), now() + interval '90 days', 'verified', true,
    'none', false, false, 'MAJOR CORRECTION: confirmed directly on the official site that this organization is NOT part of Goodwill — it is an independent nonprofit (''School Health Clinics of Santa Clara County'') providing primary/preventive care to ~4,500 underserved people/year across five clinics. Phone/address confirmed for this corrected identity.',
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
  'goodwill-of-silicon-valley-school-health-clinics-wellness-center', 'promoted', 'certification-import', now(),
  'https://www.schoolhealthclinics.org', 'official_org_site', true,
  '["phone","address","eligibility"]'::jsonb, '[{"field":"organizationName","pdfValue":"Goodwill of Silicon Valley (School Health Clinics / Wellness Center)","currentValue":"CORRECTION: this is ''School Health Clinics of Santa Clara County'' — an entirely separate, unaffiliated nonprofit from Goodwill of Silicon Valley. This was a mapping error in the original candidate extraction."}]'::jsonb, false,
  'confirmed', 'MAJOR CORRECTION: confirmed directly on the official site that this organization is NOT part of Goodwill — it is an independent nonprofit (''School Health Clinics of Santa Clara County'') providing primary/preventive care to ~4,500 underserved people/year across five clinics. Phone/address confirmed for this corrected identity.', resource_upsert.id,
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
-- candidateId: integrated-psychological-assessment-services-ipas  |  priority 3  |  Integrated Psychological Assessment Services (IPAS)
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
       WHERE candidate_id = 'integrated-psychological-assessment-services-ipas' AND promoted_resource_id IS NOT NULL),
    (SELECT id FROM public.community_resources WHERE slug = 'integrated-psychological-assessment-services-ipas'),
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
    resolved.id, 'integrated-psychological-assessment-services-ipas', 'Integrated Psychological Assessment Services (IPAS)', NULL, 'healthcare',
    '', '',
    'mental-health-recovery', '[]'::jsonb, 'want-to-connect',
    NULL, NULL, '[]'::jsonb,
    '[]'::jsonb, '[]'::jsonb, 'unknown', NULL, 'Gilroy',
    '408-201-9850', NULL, NULL, NULL, 'admin@ipasinc.net', 'https://www.ipasinc.net', NULL,
    '8355 Church Street', NULL, 'Gilroy', 'CA', '95020', false,
    NULL, NULL, '[]'::jsonb, false,
    'https://www.ipasinc.net', now(), now() + interval '90 days', 'verified', true,
    'none', false, false, 'Address confirmed unchanged. Phone number updated. Fax (408-856-2469) confirmed but explicitly not used as a CTA. Accepts Medi-Cal.',
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
  'integrated-psychological-assessment-services-ipas', 'promoted', 'certification-import', now(),
  'https://www.ipasinc.net', 'official_org_site', true,
  '["address"]'::jsonb, '[{"field":"phone","pdfValue":"408-359-6700","currentValue":"408-201-9850 (scheduling line)"}]'::jsonb, false,
  'confirmed', 'Address confirmed unchanged. Phone number updated. Fax (408-856-2469) confirmed but explicitly not used as a CTA. Accepts Medi-Cal.', resource_upsert.id,
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
-- candidateId: metropolitan-education-district-metroed  |  priority 3  |  Metropolitan Education District (MetroED)
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
       WHERE candidate_id = 'metropolitan-education-district-metroed' AND promoted_resource_id IS NOT NULL),
    (SELECT id FROM public.community_resources WHERE slug = 'metropolitan-education-district-metroed'),
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
    resolved.id, 'metropolitan-education-district-metroed', 'Metropolitan Education District (MetroED)', NULL, 'school-district',
    '', '',
    'jobs-training', '[]'::jsonb, 'want-to-connect',
    NULL, NULL, '[]'::jsonb,
    '[]'::jsonb, '[]'::jsonb, 'unknown', NULL, 'Santa Clara County',
    '(408) 723-6400', NULL, NULL, NULL, NULL, 'https://www.MetroED.net', NULL,
    '760 Hillsdale Avenue', NULL, 'San Jose', 'CA', '95136', false,
    NULL, 'Mon-Fri 8am-4:30pm', '[]'::jsonb, false,
    'https://www.MetroED.net', now(), now() + interval '90 days', 'verified', true,
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
  'metropolitan-education-district-metroed', 'promoted', 'certification-import', now(),
  'https://www.MetroED.net', 'government', true,
  '["phone","address","hours"]'::jsonb, '[]'::jsonb, false,
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
-- candidateId: milpitas-adult-education  |  priority 3  |  Milpitas Adult Education
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
       WHERE candidate_id = 'milpitas-adult-education' AND promoted_resource_id IS NOT NULL),
    (SELECT id FROM public.community_resources WHERE slug = 'milpitas-adult-education'),
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
    resolved.id, 'milpitas-adult-education', 'Milpitas Adult Education', NULL, 'school-district',
    '', '',
    'jobs-training', '[]'::jsonb, 'want-to-connect',
    NULL, NULL, '[]'::jsonb,
    '[]'::jsonb, '[]'::jsonb, 'unknown', NULL, 'Milpitas',
    '(408) 635-2692', NULL, NULL, NULL, 'mae@musd.org', 'https://adulted.musd.org', NULL,
    '1331 E. Calaveras Blvd., Building B', NULL, 'Milpitas', 'CA', '95035', false,
    NULL, NULL, '[]'::jsonb, false,
    'https://adulted.musd.org', now(), now() + interval '90 days', 'verified', true,
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
  'milpitas-adult-education', 'promoted', 'certification-import', now(),
  'https://adulted.musd.org', 'government', true,
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
-- candidateId: mission-college-calworks-program  |  priority 3  |  Mission College
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
       WHERE candidate_id = 'mission-college-calworks-program' AND promoted_resource_id IS NOT NULL),
    (SELECT id FROM public.community_resources WHERE slug = 'mission-college'),
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
    resolved.id, 'mission-college', 'Mission College', 'CalWORKs Program', 'school-district',
    '', '',
    'jobs-training', '[]'::jsonb, 'want-to-connect',
    NULL, NULL, '[]'::jsonb,
    '[]'::jsonb, '[]'::jsonb, 'unknown', NULL, 'Santa Clara',
    '(408) 855-5228', NULL, NULL, NULL, NULL, 'https://missioncollege.edu/student_services/calworks', NULL,
    '3000 Mission College Blvd, Student Engagement Center Office 148', NULL, 'Santa Clara', 'CA', '95054', false,
    NULL, NULL, '[]'::jsonb, false,
    'https://missioncollege.edu/student_services/calworks', now(), now() + interval '90 days', 'verified', true,
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
  'mission-college-calworks-program', 'promoted', 'certification-import', now(),
  'https://missioncollege.edu/student_services/calworks', 'government', true,
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

COMMIT;
