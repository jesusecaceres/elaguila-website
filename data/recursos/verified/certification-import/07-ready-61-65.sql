-- Recursos Build 03C — Certification import batch 7/7 (5 records)
-- Source: data/recursos/verified/scc-community-resource-guide-2023-ready-for-import.json
-- Records 61..65 of 65 (sorted verificationPriority asc, candidateId asc).
--
-- Idempotent: safe to re-run. Resources are upserted by slug (unique); review rows are
-- upserted by candidate_id (unique). A second execution leaves row counts unchanged.
-- No DELETE / TRUNCATE / DROP / ALTER. Current researched facts are authoritative and
-- always overwrite any prior value on conflict (including for rows already promoted
-- during the earlier pilot data load).

BEGIN;

-- ----------------------------------------------------------------
-- candidateId: stars-behavioral-health-group-starlight-community-services-in-santa-clara  |  priority 3  |  STARS Behavioral Health Group
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
       WHERE candidate_id = 'stars-behavioral-health-group-starlight-community-services-in-santa-clara' AND promoted_resource_id IS NOT NULL),
    (SELECT id FROM public.community_resources WHERE slug = 'stars-behavioral-health-group'),
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
    resolved.id, 'stars-behavioral-health-group', 'STARS Behavioral Health Group', 'Starlight Community Services in Santa Clara', 'healthcare',
    '', '',
    'mental-health-recovery', '[]'::jsonb, 'i-need-help',
    NULL, NULL, '[]'::jsonb,
    '[]'::jsonb, '[]'::jsonb, 'unknown', NULL, 'San Jose',
    '(408) 834-3130', NULL, NULL, NULL, NULL, 'https://www.starsinc.com/santa-clara-county', NULL,
    '1885 Lundy Ave., Ste. 223', NULL, 'San Jose', 'CA', '95131', false,
    NULL, NULL, '[]'::jsonb, false,
    'https://www.starsinc.com/santa-clara-county', now(), now() + interval '90 days', 'verified', true,
    'none', false, false, 'Both addresses confirmed identical to PDF; phone structure changed to per-location numbers.',
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
  'stars-behavioral-health-group-starlight-community-services-in-santa-clara', 'promoted', 'certification-import', now(),
  'https://www.starsinc.com/santa-clara-county', 'official_org_site', true,
  '["address"]'::jsonb, '[{"field":"phone","pdfValue":"408-284-9080 (single number)","currentValue":"Two location-specific numbers now: North (408) 834-3130 at 1885 Lundy Ave; South (669) 220-1905 at 6203 San Ignacio Ave"}]'::jsonb, false,
  'confirmed', 'Both addresses confirmed identical to PDF; phone structure changed to per-location numbers.', resource_upsert.id,
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
-- candidateId: valley-transportation-authority-vta  |  priority 3  |  Valley Transportation Authority (VTA)
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
       WHERE candidate_id = 'valley-transportation-authority-vta' AND promoted_resource_id IS NOT NULL),
    (SELECT id FROM public.community_resources WHERE slug = 'valley-transportation-authority-vta'),
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
    resolved.id, 'valley-transportation-authority-vta', 'Valley Transportation Authority (VTA)', NULL, 'government',
    '', '',
    'transportation-access', '[]'::jsonb, 'want-to-connect',
    NULL, NULL, '[]'::jsonb,
    '[]'::jsonb, '[]'::jsonb, 'unknown', NULL, 'Santa Clara County',
    '408-321-2300', NULL, NULL, NULL, NULL, 'https://www.vta.org/go', NULL,
    NULL, NULL, NULL, NULL, NULL, false,
    NULL, 'Mon-Fri 6am-7pm, Sat 7:30am-4pm', '[]'::jsonb, false,
    'https://www.vta.org/go', now(), now() + interval '90 days', 'verified', true,
    'none', false, false, 'Exact match to PDF. Hours newly confirmed.',
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
  'valley-transportation-authority-vta', 'promoted', 'certification-import', now(),
  'https://www.vta.org/go', 'government', true,
  '["phone","hours"]'::jsonb, '[]'::jsonb, false,
  'not_applicable', 'Exact match to PDF. Hours newly confirmed.', resource_upsert.id,
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
-- candidateId: work2future  |  priority 3  |  Work2Future
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
       WHERE candidate_id = 'work2future' AND promoted_resource_id IS NOT NULL),
    (SELECT id FROM public.community_resources WHERE slug = 'work2future'),
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
    resolved.id, 'work2future', 'Work2Future', NULL, 'government',
    '', '',
    'jobs-training', '[]'::jsonb, 'want-to-connect',
    NULL, NULL, '[]'::jsonb,
    '[]'::jsonb, '[]'::jsonb, 'unknown', NULL, 'San Jose, North San Jose, Gilroy',
    '408.794.1101', NULL, NULL, NULL, NULL, 'https://www.work2future.org', NULL,
    '1608 Las Plumas Ave', NULL, 'San José', 'CA', NULL, false,
    NULL, 'Mon-Fri 8am-5pm, by appointment', '[]'::jsonb, false,
    'https://www.work2future.org', now(), now() + interval '90 days', 'verified', true,
    'none', false, false, 'North San Jose (408-216-6200) and Gilroy (408-758-3477) locations both confirmed unchanged.',
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
  'work2future', 'promoted', 'certification-import', now(),
  'https://www.work2future.org', 'government', true,
  '["phone","hours"]'::jsonb, '[{"field":"phone","pdfValue":"408-794-1100","currentValue":"408.794.1101 (off by one digit)"},{"field":"address","pdfValue":"1601 Foxworthy Ave.","currentValue":"1608 Las Plumas Ave (different street)"}]'::jsonb, false,
  'confirmed', 'North San Jose (408-216-6200) and Gilroy (408-758-3477) locations both confirmed unchanged.', resource_upsert.id,
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
-- candidateId: working-partnerships-usa-union-community-resources  |  priority 3  |  Working Partnerships USA
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
       WHERE candidate_id = 'working-partnerships-usa-union-community-resources' AND promoted_resource_id IS NOT NULL),
    (SELECT id FROM public.community_resources WHERE slug = 'working-partnerships-usa'),
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
    resolved.id, 'working-partnerships-usa', 'Working Partnerships USA', 'Union Community Resources', 'nonprofit',
    '', '',
    'jobs-training', '[]'::jsonb, 'want-to-connect',
    NULL, NULL, '[]'::jsonb,
    '[]'::jsonb, '[]'::jsonb, 'unknown', NULL, 'San Jose',
    '(408) 809-2120', NULL, NULL, NULL, NULL, 'https://www.wpusa.org', NULL,
    '2302 Zanker Road', NULL, 'San Jose', 'CA', '95131', false,
    NULL, NULL, '[]'::jsonb, false,
    'https://www.wpusa.org', now(), now() + interval '90 days', 'verified', true,
    'none', false, false, 'Phone confirmed unchanged; organization relocated.',
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
  'working-partnerships-usa-union-community-resources', 'promoted', 'certification-import', now(),
  'https://www.wpusa.org', 'official_org_site', true,
  '["phone"]'::jsonb, '[{"field":"address","pdfValue":"2102 Almaden Rd, Ste. 112, San Jose, CA 95125","currentValue":"2302 Zanker Road, San Jose, CA 95131 (relocated)"}]'::jsonb, false,
  'confirmed', 'Phone confirmed unchanged; organization relocated.', resource_upsert.id,
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
-- candidateId: youth-space  |  priority 3  |  Youth Space
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
       WHERE candidate_id = 'youth-space' AND promoted_resource_id IS NOT NULL),
    (SELECT id FROM public.community_resources WHERE slug = 'youth-space'),
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
    resolved.id, 'youth-space', 'Youth Space', NULL, 'nonprofit',
    '', '',
    'mental-health-recovery', '[]'::jsonb, 'i-need-help',
    NULL, NULL, '["youth"]'::jsonb,
    '[]'::jsonb, '[]'::jsonb, 'unknown', 'LGBTQ+ youth and young adults, ages 13-25', 'San Jose',
    '(408) 343-7940', NULL, NULL, NULL, NULL, 'https://youthspace.org', NULL,
    '2635 Zanker Rd', NULL, 'San Jose', 'CA', '95134', false,
    NULL, 'Mon-Fri 3-9pm', '[]'::jsonb, false,
    'https://youthspace.org', now(), now() + interval '90 days', 'verified', true,
    'none', false, false, 'Phone confirmed unchanged; org relocated. Eligibility expanded/clarified (ages 13-25, broader LGBTQIA+ language) vs. PDF''s brief description.',
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
  'youth-space', 'promoted', 'certification-import', now(),
  'https://youthspace.org', 'official_org_site', true,
  '["phone","hours","eligibility"]'::jsonb, '[{"field":"address","pdfValue":"452 S. First St., San Jose, CA 95113","currentValue":"2635 Zanker Rd, San Jose, CA 95134 (relocated)"}]'::jsonb, false,
  'confirmed', 'Phone confirmed unchanged; org relocated. Eligibility expanded/clarified (ages 13-25, broader LGBTQIA+ language) vs. PDF''s brief description.', resource_upsert.id,
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
