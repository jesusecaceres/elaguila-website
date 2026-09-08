-- Recursos Build 03C — Certification import batch 1/7 (10 records)
-- Source: data/recursos/verified/scc-community-resource-guide-2023-ready-for-import.json
-- Records 1..10 of 65 (sorted verificationPriority asc, candidateId asc).
--
-- Idempotent: safe to re-run. Resources are upserted by slug (unique); review rows are
-- upserted by candidate_id (unique). A second execution leaves row counts unchanged.
-- No DELETE / TRUNCATE / DROP / ALTER. Current researched facts are authoritative and
-- always overwrite any prior value on conflict (including for rows already promoted
-- during the earlier pilot data load).

BEGIN;

-- ----------------------------------------------------------------
-- candidateId: 2-1-1-bay-area  |  priority 1  |  211 Bay Area
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
       WHERE candidate_id = '2-1-1-bay-area' AND promoted_resource_id IS NOT NULL),
    (SELECT id FROM public.community_resources WHERE slug = '211-bay-area'),
    (SELECT id FROM public.community_resources WHERE slug = '2-1-1-bay-area'),
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
    resolved.id, '211-bay-area', '211 Bay Area', 'Program of United Way Bay Area', 'hotline',
    '', 'Free, confidential referral and information helpline connecting people to health and human services. English, Spanish, Vietnamese, and 140+ other languages.',
    'community-support', '[]'::jsonb, 'help-now',
    NULL, NULL, '[]'::jsonb,
    '[]'::jsonb, '["English","Spanish","150 languages via phone interpretation"]'::jsonb, 'free', NULL, 'Santa Clara County and Bay Area',
    '211', '800-273-6222', 'Text your ZIP code to 898211', NULL, NULL, 'https://211bayarea.org/contact/', NULL,
    NULL, NULL, NULL, NULL, NULL, false,
    NULL, '24 hours a day, 7 days a week', '[]'::jsonb, true,
    'https://211bayarea.org/contact/', now(), now() + interval '90 days', 'verified', true,
    'none', false, false, 'Dial 211 confirmed; alternate 800-273-6222 confirmed current on official Contact page (matches PDF). Text service confirmed: ZIP to 898211. Confirmed 24/7. EXPLICITLY DID NOT use an alternate legacy hotline number found in some outdated third-party directories — unsupported by the current official Contact page, excluded from evidence.',
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
  '2-1-1-bay-area', 'promoted', 'certification-import', now(),
  'https://211bayarea.org/contact/', 'official_org_site', true,
  '["phone","crisisPhone","languages","is24Hours"]'::jsonb, '[{"field":"languages","pdfValue":"English, Spanish, Vietnamese, and 140 other languages","currentValue":"150 languages (phone interpretation)"},{"field":"sms","pdfValue":"(not present in PDF)","currentValue":"Text ZIP code to 898211 (English and Spanish only)"}]'::jsonb, true,
  'not_applicable', 'Dial 211 confirmed; alternate 800-273-6222 confirmed current on official Contact page (matches PDF). Text service confirmed: ZIP to 898211. Confirmed 24/7. EXPLICITLY DID NOT use an alternate legacy hotline number found in some outdated third-party directories — unsupported by the current official Contact page, excluded from evidence.', resource_upsert.id,
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
-- candidateId: asian-americans-for-community-involvement-aaci-aaci-asian-women-s-home  |  priority 1  |  Asian Americans for Community Involvement (AACI)
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
       WHERE candidate_id = 'asian-americans-for-community-involvement-aaci-aaci-asian-women-s-home' AND promoted_resource_id IS NOT NULL),
    (SELECT id FROM public.community_resources WHERE slug = 'asian-americans-for-community-involvement-aaci'),
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
    resolved.id, 'asian-americans-for-community-involvement-aaci', 'Asian Americans for Community Involvement (AACI)', 'Asian Women''s Home', 'nonprofit',
    '', 'AACI''s Asian Women''s Home program. San Jose Family Justice Center at Story Rd. open Thursdays for free walk-in legal consultations for survivors of domestic violence.',
    'urgent-safety', '[]'::jsonb, 'help-now',
    NULL, NULL, '[]'::jsonb,
    '[]'::jsonb, '["English","Spanish","Arabic","Armenian","Chinese","Filipino","Hindi","Hmong","Japanese","Khmer","Korean","Lao","Myanmar","Punjabi","Russian","Thai","Vietnamese","and other languages (40+ total)"]'::jsonb, 'free', 'Serves everyone regardless of race, ethnicity, religion, immigration status, socioeconomic background, or sexual orientation', 'Santa Clara County',
    '(408) 975-2730', '(408) 975-2739', NULL, NULL, NULL, 'https://aaci.org/wellness/womens-home/', NULL,
    '2400 Moorpark Ave. Suite 300', NULL, 'San Jose', 'CA', '95128', false,
    NULL, '24-hour crisis hotline', '[]'::jsonb, true,
    'https://aaci.org/wellness/womens-home/', now(), now() + interval '90 days', 'verified', true,
    'none', false, false, '24-hr crisis hotline (408) 975-2739 confirmed identical to PDF. Shelter address explicitly confidential — never publish. Family Justice Center location moved since 2023. Corporate office address is safe public info.',
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
  'asian-americans-for-community-involvement-aaci-aaci-asian-women-s-home', 'promoted', 'certification-import', now(),
  'https://aaci.org/wellness/womens-home/', 'official_org_site', true,
  '["crisisPhone","phone","websiteUrl","address","is24Hours","languages","eligibility"]'::jsonb, '[{"field":"address","pdfValue":"749 Story Rd, Ste. 50, San Jose CA 95122 (Family Justice Center)","currentValue":"Family Justice Center relocated to 150 E. San Fernando St, Room 324, San Jose, CA 95112; corporate office 2400 Moorpark Ave. Suite 300"}]'::jsonb, true,
  'withheld_for_safety', '24-hr crisis hotline (408) 975-2739 confirmed identical to PDF. Shelter address explicitly confidential — never publish. Family Justice Center location moved since 2023. Corporate office address is safe public info.', resource_upsert.id,
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
-- candidateId: community-solutions-human-trafficking  |  priority 1  |  Community Solutions
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
       WHERE candidate_id = 'community-solutions-human-trafficking' AND promoted_resource_id IS NOT NULL),
    (SELECT id FROM public.community_resources WHERE slug = 'community-solutions'),
    (SELECT id FROM public.community_resources WHERE slug = 'community-solutions-human-trafficking'),
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
    resolved.id, 'community-solutions', 'Community Solutions', 'Human Trafficking / Sexual Assault / Domestic Violence Crisis Line', 'nonprofit',
    '', '',
    'urgent-safety', '[]'::jsonb, 'help-now',
    NULL, NULL, '[]'::jsonb,
    '[]'::jsonb, '[]'::jsonb, 'free', NULL, 'Santa Clara County and San Benito County',
    NULL, '1-877-363-7238', NULL, NULL, NULL, 'https://communitysolutions.org/', NULL,
    NULL, NULL, NULL, NULL, NULL, false,
    NULL, '24-Hour Crisis Line', '[]'::jsonb, true,
    'https://communitysolutions.org/', now(), now() + interval '90 days', 'verified', true,
    'none', false, false, '24-Hour Crisis Line 1.877.END.SADV (1.877.363.7238) confirmed — same number as PDF''s ''1-877-END-SADV'', different formatting only. Physical address not reconfirmed this pass — omitted.',
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
  'community-solutions-human-trafficking', 'promoted', 'certification-import', now(),
  'https://communitysolutions.org/', 'official_org_site', true,
  '["crisisPhone","websiteUrl","is24Hours","serviceArea"]'::jsonb, '[{"field":"serviceArea","pdfValue":"(not specified)","currentValue":"Santa Clara County and San Benito County"}]'::jsonb, true,
  'not_applicable', '24-Hour Crisis Line 1.877.END.SADV (1.877.363.7238) confirmed — same number as PDF''s ''1-877-END-SADV'', different formatting only. Physical address not reconfirmed this pass — omitted.', resource_upsert.id,
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
-- candidateId: crisis-text-line  |  priority 1  |  Crisis Text Line
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
       WHERE candidate_id = 'crisis-text-line' AND promoted_resource_id IS NOT NULL),
    (SELECT id FROM public.community_resources WHERE slug = 'crisis-text-line'),
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
    resolved.id, 'crisis-text-line', 'Crisis Text Line', NULL, 'hotline',
    '', 'Text-based crisis support line.',
    'urgent-safety', '[]'::jsonb, 'help-now',
    NULL, NULL, '[]'::jsonb,
    '[]'::jsonb, '["English","Spanish"]'::jsonb, 'free', NULL, 'United States (incl. Puerto Rico)',
    NULL, NULL, 'Text HOME to 741741 (Text HOLA to 741741 en español)', NULL, NULL, 'https://www.crisistextline.org/', NULL,
    NULL, NULL, NULL, NULL, NULL, false,
    NULL, '24/7 confidential crisis support', '[]'::jsonb, true,
    'https://www.crisistextline.org/', now(), now() + interval '90 days', 'verified', true,
    'none', false, false, 'CRITICAL CORRECTION: the PDF''s regional keyword ''BAY'' is no longer current — official site confirms the keyword is now ''HOME''. Explicitly confirmed 24/7. Safety-critical: the old keyword may not route correctly.',
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
  'crisis-text-line', 'promoted', 'certification-import', now(),
  'https://www.crisistextline.org/', 'official_org_site', true,
  '["sms","websiteUrl","is24Hours","languages"]'::jsonb, '[{"field":"sms","pdfValue":"Text BAY to 741741","currentValue":"Text HOME to 741741 (regional keyword \"BAY\" deprecated in favor of universal \"HOME\"; \"HOLA\" for Spanish)"}]'::jsonb, true,
  'not_applicable', 'CRITICAL CORRECTION: the PDF''s regional keyword ''BAY'' is no longer current — official site confirms the keyword is now ''HOME''. Explicitly confirmed 24/7. Safety-critical: the old keyword may not route correctly.', resource_upsert.id,
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
-- candidateId: maitri  |  priority 1  |  Maitri
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
       WHERE candidate_id = 'maitri' AND promoted_resource_id IS NOT NULL),
    (SELECT id FROM public.community_resources WHERE slug = 'maitri'),
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
    resolved.id, 'maitri', 'Maitri', NULL, 'nonprofit',
    '', '',
    'urgent-safety', '[]'::jsonb, 'help-now',
    NULL, NULL, '[]'::jsonb,
    '[]'::jsonb, '["English","Hindi","Punjabi","Gujarati","Bengali","Telugu","Tamil","Urdu","and other South Asian languages"]'::jsonb, 'free', NULL, 'San Francisco Bay Area (South Asian community)',
    NULL, '1-888-862-4874', NULL, NULL, 'maitri@maitri.org', 'https://maitri.org/', NULL,
    NULL, NULL, NULL, NULL, NULL, false,
    NULL, NULL, '[]'::jsonb, false,
    'https://maitri.org/', now(), now() + interval '90 days', 'verified', true,
    'none', false, false, 'Helpline 1-888-862-4874 confirmed identical to PDF. No 24/7 claim found on official site — consistent with PDF; is24Hours correctly stays false. PO Box from PDF not carried forward as a contact point.',
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
  'maitri', 'promoted', 'certification-import', now(),
  'https://maitri.org/', 'official_org_site', true,
  '["crisisPhone","websiteUrl","languages"]'::jsonb, '[]'::jsonb, false,
  'not_applicable', 'Helpline 1-888-862-4874 confirmed identical to PDF. No 24/7 claim found on official site — consistent with PDF; is24Hours correctly stays false. PO Box from PDF not carried forward as a contact point.', resource_upsert.id,
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
-- candidateId: next-door-solutions  |  priority 1  |  Next Door Solutions to Domestic Violence
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
       WHERE candidate_id = 'next-door-solutions' AND promoted_resource_id IS NOT NULL),
    (SELECT id FROM public.community_resources WHERE slug = 'next-door-solutions-to-domestic-violence'),
    (SELECT id FROM public.community_resources WHERE slug = 'next-door-solutions'),
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
    resolved.id, 'next-door-solutions-to-domestic-violence', 'Next Door Solutions to Domestic Violence', NULL, 'nonprofit',
    '', '',
    'urgent-safety', '[]'::jsonb, 'help-now',
    NULL, NULL, '[]'::jsonb,
    '[]'::jsonb, '[]'::jsonb, 'free', NULL, 'Santa Clara County',
    '(408) 501-7550', '(408) 279-2962', NULL, NULL, NULL, 'https://www.nextdoorsolutions.org/', NULL,
    '234 E. Gish Road', 'Suite 200', 'San Jose', 'CA', '95112', false,
    NULL, '24/7 hotline', '[]'::jsonb, true,
    'https://www.nextdoorsolutions.org/', now(), now() + interval '90 days', 'verified', true,
    'none', false, false, 'CRITICAL CORRECTION: 2023 candidate website (nextdoor.org) was wrong — that domain belongs to the unrelated ''Nextdoor'' neighborhood app. Official domain is nextdoorsolutions.org. 24/7 hotline confirmed unchanged. 234 E. Gish Road, Suite 200 is the community office (not a confidential shelter location) — safe to publish.',
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
  'next-door-solutions', 'promoted', 'certification-import', now(),
  'https://www.nextdoorsolutions.org/', 'official_org_site', true,
  '["crisisPhone","phone","websiteUrl","address","is24Hours"]'::jsonb, '[{"field":"websiteUrl","pdfValue":"https://www.nextdoor.org","currentValue":"https://www.nextdoorsolutions.org/"},{"field":"address","pdfValue":"234 E Gish Road, San Jose, CA 95112","currentValue":"234 E. Gish Road, Suite 200, San Jose, CA 95112"}]'::jsonb, true,
  'confirmed', 'CRITICAL CORRECTION: 2023 candidate website (nextdoor.org) was wrong — that domain belongs to the unrelated ''Nextdoor'' neighborhood app. Official domain is nextdoorsolutions.org. 24/7 hotline confirmed unchanged. 234 E. Gish Road, Suite 200 is the community office (not a confidential shelter location) — safe to publish.', resource_upsert.id,
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
-- candidateId: santa-clara-county-behavioral-health-services  |  priority 1  |  Santa Clara County Behavioral Health Services
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
       WHERE candidate_id = 'santa-clara-county-behavioral-health-services' AND promoted_resource_id IS NOT NULL),
    (SELECT id FROM public.community_resources WHERE slug = 'santa-clara-county-behavioral-health-services'),
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
    resolved.id, 'santa-clara-county-behavioral-health-services', 'Santa Clara County Behavioral Health Services', NULL, 'government',
    '', 'County behavioral health services including the Esperanza and Zephyr Self-Help Centers.',
    'mental-health-recovery', '[]'::jsonb, 'help-now',
    NULL, NULL, '[]'::jsonb,
    '[]'::jsonb, '[]'::jsonb, 'free', NULL, 'Santa Clara County',
    '(800) 704-0900', '988', NULL, NULL, NULL, 'https://bhsd.santaclaracounty.gov/get-help-now', NULL,
    NULL, NULL, NULL, NULL, NULL, false,
    NULL, '24/7 including holidays', '[]'::jsonb, true,
    'https://bhsd.santaclaracounty.gov/get-help-now', now(), now() + interval '90 days', 'verified', true,
    'none', false, false, 'Behavioral Health Call Center confirmed 24/7 including holidays via direct fetch. Local (408/650/669) callers dial 988; outside-County callers use (800) 704-0900. Official site migrated from sccgov.org to bhsd.santaclaracounty.gov.',
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
  'santa-clara-county-behavioral-health-services', 'promoted', 'certification-import', now(),
  'https://bhsd.santaclaracounty.gov/get-help-now', 'government', true,
  '["phone","crisisPhone","websiteUrl","is24Hours"]'::jsonb, '[{"field":"websiteUrl","pdfValue":"https://www.sccgov.org/sites/bhd/Pages/home.aspx","currentValue":"https://bhsd.santaclaracounty.gov/get-help-now"},{"field":"crisisPhone","pdfValue":"988","currentValue":"988 (local 408/650/669) or (800) 704-0900 (outside-County) — both reach the Behavioral Health Call Center"}]'::jsonb, true,
  'not_applicable', 'Behavioral Health Call Center confirmed 24/7 including holidays via direct fetch. Local (408/650/669) callers dial 988; outside-County callers use (800) 704-0900. Official site migrated from sccgov.org to bhsd.santaclaracounty.gov.', resource_upsert.id,
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
-- candidateId: santa-clara-county-department-of-family-and-children-s-services-dfcs-child-abuse  |  priority 1  |  Santa Clara County Department of Family and Children's Services (DFCS)
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
       WHERE candidate_id = 'santa-clara-county-department-of-family-and-children-s-services-dfcs-child-abuse' AND promoted_resource_id IS NOT NULL),
    (SELECT id FROM public.community_resources WHERE slug = 'santa-clara-county-department-of-family-and-children-s-services-dfcs'),
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
    resolved.id, 'santa-clara-county-department-of-family-and-children-s-services-dfcs', 'Santa Clara County Department of Family and Children''s Services (DFCS)', 'Child Abuse & Neglect Call Center', 'government',
    '', 'The Department of Family and Children''s Services mission is to protect children from abuse and neglect, promote healthy growth, and strengthen families. Reports of abuse go to the Child Abuse & Neglect Call Center.',
    'urgent-safety', '[]'::jsonb, 'help-now',
    NULL, NULL, '[]'::jsonb,
    '[]'::jsonb, '[]'::jsonb, 'free', NULL, 'Santa Clara County',
    NULL, '(833) 722-5437', NULL, NULL, NULL, 'https://ssa.santaclaracounty.gov/protective-services/report-child-abuse-and-neglect', NULL,
    NULL, NULL, NULL, NULL, NULL, false,
    NULL, '24 hours a day, 7 days a week, 365 days a year', '[]'::jsonb, true,
    'https://ssa.santaclaracounty.gov/protective-services/report-child-abuse-and-neglect', now(), now() + interval '90 days', 'verified', true,
    'none', false, false, 'Hotline (833) 722-5437 / (833) SCC-KIDS confirmed identical to PDF. Confirmed 24/7/365. Official URL migrated to ssa.santaclaracounty.gov. Current source states: if life is in immediate danger, call 911 — reference only, not a CTA field.',
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
  'santa-clara-county-department-of-family-and-children-s-services-dfcs-child-abuse', 'promoted', 'certification-import', now(),
  'https://ssa.santaclaracounty.gov/protective-services/report-child-abuse-and-neglect', 'government', true,
  '["crisisPhone","hoursNoteEn","is24Hours"]'::jsonb, '[{"field":"websiteUrl","pdfValue":"https://socialservices.sccgov.org/about-us/department-family-and-childrens-services","currentValue":"https://ssa.santaclaracounty.gov/protective-services/report-child-abuse-and-neglect"}]'::jsonb, true,
  'not_applicable', 'Hotline (833) 722-5437 / (833) SCC-KIDS confirmed identical to PDF. Confirmed 24/7/365. Official URL migrated to ssa.santaclaracounty.gov. Current source states: if life is in immediate danger, call 911 — reference only, not a CTA field.', resource_upsert.id,
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
-- candidateId: santa-clara-county-emergency-psychiatric-services-eps  |  priority 1  |  Santa Clara County Emergency Psychiatric Services (EPS)
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
       WHERE candidate_id = 'santa-clara-county-emergency-psychiatric-services-eps' AND promoted_resource_id IS NOT NULL),
    (SELECT id FROM public.community_resources WHERE slug = 'santa-clara-county-emergency-psychiatric-services-eps'),
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
    resolved.id, 'santa-clara-county-emergency-psychiatric-services-eps', 'Santa Clara County Emergency Psychiatric Services (EPS)', NULL, 'government',
    '', 'County emergency psychiatric services for mental health crises.',
    'urgent-safety', '[]'::jsonb, 'help-now',
    NULL, NULL, '[]'::jsonb,
    '[]'::jsonb, '[]'::jsonb, 'unknown', NULL, 'Santa Clara County',
    NULL, '(408) 885-6100', NULL, NULL, NULL, 'https://bhsd.santaclaracounty.gov/emergency-psychiatric-services-eps', NULL,
    '871 Enborg Lane', NULL, 'San Jose', 'CA', '95128', false,
    NULL, '24 hours, 7 days a week', '[]'::jsonb, true,
    'https://bhsd.santaclaracounty.gov/emergency-psychiatric-services-eps', now(), now() + interval '90 days', 'verified', true,
    'none', false, false, 'Phone (408) 885-6100 and address 871 Enborg Lane confirmed identical to PDF. Open 24/7 confirmed explicit. Fax (408) 885-6117 exists but is NOT a public CTA. Official URL migrated to bhsd.santaclaracounty.gov.',
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
  'santa-clara-county-emergency-psychiatric-services-eps', 'promoted', 'certification-import', now(),
  'https://bhsd.santaclaracounty.gov/emergency-psychiatric-services-eps', 'government', true,
  '["phone","address","hoursNoteEn","is24Hours"]'::jsonb, '[{"field":"websiteUrl","pdfValue":"https://www.sccgov.org/sites/bhd/Services/Emergency/EmergencyPsychiatricServices/","currentValue":"https://bhsd.santaclaracounty.gov/emergency-psychiatric-services-eps"}]'::jsonb, true,
  'confirmed', 'Phone (408) 885-6100 and address 871 Enborg Lane confirmed identical to PDF. Open 24/7 confirmed explicit. Fax (408) 885-6117 exists but is NOT a public CTA. Official URL migrated to bhsd.santaclaracounty.gov.', resource_upsert.id,
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
-- candidateId: ywca-golden-gate-silicon-valley-support-services-department  |  priority 1  |  YWCA Golden Gate Silicon Valley
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
       WHERE candidate_id = 'ywca-golden-gate-silicon-valley-support-services-department' AND promoted_resource_id IS NOT NULL),
    (SELECT id FROM public.community_resources WHERE slug = 'ywca-golden-gate-silicon-valley'),
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
    resolved.id, 'ywca-golden-gate-silicon-valley', 'YWCA Golden Gate Silicon Valley', 'Support Services Department', 'nonprofit',
    '', '',
    'urgent-safety', '[]'::jsonb, 'help-now',
    NULL, NULL, '[]'::jsonb,
    '[]'::jsonb, '["English","bilingual support"]'::jsonb, 'unknown', NULL, 'Bay Area',
    NULL, '(800) 572-2782', NULL, NULL, NULL, 'https://yourywca.org/', NULL,
    '375 S. Third St.', NULL, 'San Jose', 'CA', '95112', false,
    NULL, '24-hour bilingual support line', '[]'::jsonb, true,
    'https://yourywca.org/', now(), now() + interval '90 days', 'verified', true,
    'none', false, false, '24-HOUR BILINGUAL SUPPORT LINE (800) 572-2782 confirmed identical to PDF, explicitly covers Sexual Assault, Domestic Violence, and Human Trafficking. Address confirmed matching PDF.',
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
  'ywca-golden-gate-silicon-valley-support-services-department', 'promoted', 'certification-import', now(),
  'https://yourywca.org/', 'official_org_site', true,
  '["crisisPhone","websiteUrl","address","is24Hours"]'::jsonb, '[]'::jsonb, true,
  'confirmed', '24-HOUR BILINGUAL SUPPORT LINE (800) 572-2782 confirmed identical to PDF, explicitly covers Sexual Assault, Domestic Violence, and Human Trafficking. Address confirmed matching PDF.', resource_upsert.id,
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
