-- Recursos Build 03C-COMPACT — Certification import batch 7/7 (5 records)
-- Compact set-based transport for records 61..65 of 65 (sorted verificationPriority asc,
-- candidateId asc). Same 65 records, same idempotency rule, same DB result as
-- data/recursos/verified/certification-import/ — this file only replaces one
-- 100-line-per-record INSERT/UPDATE with one generic, set-based statement driven by an
-- embedded JSON payload, so it stays small enough for Coach's GitHub-to-Supabase transport.
--
-- Idempotent: safe to re-run. Resources resolve in this order: (1) an already-linked
-- promoted_resource_id for the candidate, (2) an existing resource at the canonical
-- (corrected) slug, (3) an existing resource at the legacy/pre-correction slug (covers
-- rows promoted under the candidate's original organization_name — e.g. the earlier pilot
-- data load's "Next Door Solutions" vs the corrected "Next Door Solutions to Domestic
-- Violence"), (4) otherwise a fresh id. The slug is never overwritten on conflict. Reviews
-- upsert on candidate_id. No DELETE / TRUNCATE / DROP / ALTER anywhere in this file.

BEGIN;

WITH payload AS (
  SELECT *
  FROM jsonb_to_recordset($JSON$[{"candidateId":"stars-behavioral-health-group-starlight-community-services-in-santa-clara","verificationPriority":3,"canonicalSlug":"stars-behavioral-health-group","legacySlug":null,"organizationName":"STARS Behavioral Health Group","programName":"Starlight Community Services in Santa Clara","organizationType":"healthcare","shortDescriptionEn":"","primaryCategory":"mental-health-recovery","urgencyLevel":"i-need-help","audienceTags":[],"languages":[],"costModel":"unknown","eligibilityEn":null,"serviceArea":"San Jose","phone":"(408) 834-3130","crisisPhone":null,"sms":null,"whatsapp":null,"email":null,"websiteUrl":"https://www.starsinc.com/santa-clara-county","applicationUrl":null,"addressLine1":"1885 Lundy Ave., Ste. 223","addressLine2":null,"addressCity":"San Jose","addressState":"CA","addressZip":"95131","addressWithheldForSafety":false,"hoursNoteEn":null,"is24Hours":false,"officialSourceUrl":"https://www.starsinc.com/santa-clara-county","currentSourceUrl":"https://www.starsinc.com/santa-clara-county","currentSourceType":"official_org_site","organizationConfirmedActive":true,"fieldsConfirmed":["address"],"discrepanciesFromPdf":[{"field":"phone","pdfValue":"408-284-9080 (single number)","currentValue":"Two location-specific numbers now: North (408) 834-3130 at 1885 Lundy Ave; South (669) 220-1905 at 6203 San Ignacio Ave"}],"addressHandling":"confirmed","verificationNotes":"Both addresses confirmed identical to PDF; phone structure changed to per-location numbers."},{"candidateId":"valley-transportation-authority-vta","verificationPriority":3,"canonicalSlug":"valley-transportation-authority-vta","legacySlug":null,"organizationName":"Valley Transportation Authority (VTA)","programName":null,"organizationType":"government","shortDescriptionEn":"","primaryCategory":"transportation-access","urgencyLevel":"want-to-connect","audienceTags":[],"languages":[],"costModel":"unknown","eligibilityEn":null,"serviceArea":"Santa Clara County","phone":"408-321-2300","crisisPhone":null,"sms":null,"whatsapp":null,"email":null,"websiteUrl":"https://www.vta.org/go","applicationUrl":null,"addressLine1":null,"addressLine2":null,"addressCity":null,"addressState":null,"addressZip":null,"addressWithheldForSafety":false,"hoursNoteEn":"Mon-Fri 6am-7pm, Sat 7:30am-4pm","is24Hours":false,"officialSourceUrl":"https://www.vta.org/go","currentSourceUrl":"https://www.vta.org/go","currentSourceType":"government","organizationConfirmedActive":true,"fieldsConfirmed":["phone","hours"],"discrepanciesFromPdf":[],"addressHandling":"not_applicable","verificationNotes":"Exact match to PDF. Hours newly confirmed."},{"candidateId":"work2future","verificationPriority":3,"canonicalSlug":"work2future","legacySlug":null,"organizationName":"Work2Future","programName":null,"organizationType":"government","shortDescriptionEn":"","primaryCategory":"jobs-training","urgencyLevel":"want-to-connect","audienceTags":[],"languages":[],"costModel":"unknown","eligibilityEn":null,"serviceArea":"San Jose, North San Jose, Gilroy","phone":"408.794.1101","crisisPhone":null,"sms":null,"whatsapp":null,"email":null,"websiteUrl":"https://www.work2future.org","applicationUrl":null,"addressLine1":"1608 Las Plumas Ave","addressLine2":null,"addressCity":"San José","addressState":"CA","addressZip":null,"addressWithheldForSafety":false,"hoursNoteEn":"Mon-Fri 8am-5pm, by appointment","is24Hours":false,"officialSourceUrl":"https://www.work2future.org","currentSourceUrl":"https://www.work2future.org","currentSourceType":"government","organizationConfirmedActive":true,"fieldsConfirmed":["phone","hours"],"discrepanciesFromPdf":[{"field":"phone","pdfValue":"408-794-1100","currentValue":"408.794.1101 (off by one digit)"},{"field":"address","pdfValue":"1601 Foxworthy Ave.","currentValue":"1608 Las Plumas Ave (different street)"}],"addressHandling":"confirmed","verificationNotes":"North San Jose (408-216-6200) and Gilroy (408-758-3477) locations both confirmed unchanged."},{"candidateId":"working-partnerships-usa-union-community-resources","verificationPriority":3,"canonicalSlug":"working-partnerships-usa","legacySlug":null,"organizationName":"Working Partnerships USA","programName":"Union Community Resources","organizationType":"nonprofit","shortDescriptionEn":"","primaryCategory":"jobs-training","urgencyLevel":"want-to-connect","audienceTags":[],"languages":[],"costModel":"unknown","eligibilityEn":null,"serviceArea":"San Jose","phone":"(408) 809-2120","crisisPhone":null,"sms":null,"whatsapp":null,"email":null,"websiteUrl":"https://www.wpusa.org","applicationUrl":null,"addressLine1":"2302 Zanker Road","addressLine2":null,"addressCity":"San Jose","addressState":"CA","addressZip":"95131","addressWithheldForSafety":false,"hoursNoteEn":null,"is24Hours":false,"officialSourceUrl":"https://www.wpusa.org","currentSourceUrl":"https://www.wpusa.org","currentSourceType":"official_org_site","organizationConfirmedActive":true,"fieldsConfirmed":["phone"],"discrepanciesFromPdf":[{"field":"address","pdfValue":"2102 Almaden Rd, Ste. 112, San Jose, CA 95125","currentValue":"2302 Zanker Road, San Jose, CA 95131 (relocated)"}],"addressHandling":"confirmed","verificationNotes":"Phone confirmed unchanged; organization relocated."},{"candidateId":"youth-space","verificationPriority":3,"canonicalSlug":"youth-space","legacySlug":null,"organizationName":"Youth Space","programName":null,"organizationType":"nonprofit","shortDescriptionEn":"","primaryCategory":"mental-health-recovery","urgencyLevel":"i-need-help","audienceTags":["youth"],"languages":[],"costModel":"unknown","eligibilityEn":"LGBTQ+ youth and young adults, ages 13-25","serviceArea":"San Jose","phone":"(408) 343-7940","crisisPhone":null,"sms":null,"whatsapp":null,"email":null,"websiteUrl":"https://youthspace.org","applicationUrl":null,"addressLine1":"2635 Zanker Rd","addressLine2":null,"addressCity":"San Jose","addressState":"CA","addressZip":"95134","addressWithheldForSafety":false,"hoursNoteEn":"Mon-Fri 3-9pm","is24Hours":false,"officialSourceUrl":"https://youthspace.org","currentSourceUrl":"https://youthspace.org","currentSourceType":"official_org_site","organizationConfirmedActive":true,"fieldsConfirmed":["phone","hours","eligibility"],"discrepanciesFromPdf":[{"field":"address","pdfValue":"452 S. First St., San Jose, CA 95113","currentValue":"2635 Zanker Rd, San Jose, CA 95134 (relocated)"}],"addressHandling":"confirmed","verificationNotes":"Phone confirmed unchanged; org relocated. Eligibility expanded/clarified (ages 13-25, broader LGBTQIA+ language) vs. PDF's brief description."}]$JSON$::jsonb)
  AS x(
    "candidateId" text, "verificationPriority" int,
    "canonicalSlug" text, "legacySlug" text,
    "organizationName" text, "programName" text, "organizationType" text,
    "shortDescriptionEn" text, "primaryCategory" text, "urgencyLevel" text,
    "audienceTags" jsonb, "languages" jsonb, "costModel" text, "eligibilityEn" text, "serviceArea" text,
    "phone" text, "crisisPhone" text, "sms" text, "whatsapp" text, "email" text,
    "websiteUrl" text, "applicationUrl" text,
    "addressLine1" text, "addressLine2" text, "addressCity" text, "addressState" text, "addressZip" text,
    "addressWithheldForSafety" boolean,
    "hoursNoteEn" text, "is24Hours" boolean,
    "officialSourceUrl" text, "currentSourceUrl" text, "currentSourceType" text,
    "organizationConfirmedActive" boolean,
    "fieldsConfirmed" jsonb, "discrepanciesFromPdf" jsonb,
    "addressHandling" text, "verificationNotes" text
  )
),
resolved AS (
  SELECT
    p.*,
    COALESCE(
      (SELECT crr.promoted_resource_id FROM public.community_resource_candidate_reviews crr
         WHERE crr.candidate_id = p."candidateId" AND crr.promoted_resource_id IS NOT NULL),
      (SELECT cr.id FROM public.community_resources cr WHERE cr.slug = p."canonicalSlug"),
      (SELECT cr.id FROM public.community_resources cr WHERE p."legacySlug" IS NOT NULL AND cr.slug = p."legacySlug"),
      gen_random_uuid()
    ) AS resolved_id
  FROM payload p
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
    resolved_id, "canonicalSlug", "organizationName", "programName", "organizationType",
    '', "shortDescriptionEn",
    "primaryCategory", '[]'::jsonb, "urgencyLevel",
    NULL, NULL, COALESCE("audienceTags", '[]'::jsonb),
    '[]'::jsonb, COALESCE("languages", '[]'::jsonb), "costModel", "eligibilityEn", "serviceArea",
    "phone", "crisisPhone", "sms", "whatsapp", "email", "websiteUrl", "applicationUrl",
    "addressLine1", "addressLine2", "addressCity", "addressState", "addressZip", COALESCE("addressWithheldForSafety", false),
    NULL, "hoursNoteEn", '[]'::jsonb, COALESCE("is24Hours", false),
    "officialSourceUrl", now(), now() + interval '90 days', 'verified', true,
    'none', false, false, "verificationNotes",
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
    hours_note_en = EXCLUDED.hours_note_en,
    weekly_hours = EXCLUDED.weekly_hours,
    is_24_hours = EXCLUDED.is_24_hours,
    official_source_url = EXCLUDED.official_source_url,
    last_verified_at = now(),
    next_verification_at = now() + interval '90 days',
    verification_status = EXCLUDED.verification_status,
    active = EXCLUDED.active,
    partner_status = EXCLUDED.partner_status,
    featured = EXCLUDED.featured,
    print_eligible = EXCLUDED.print_eligible,
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
  r."candidateId", 'promoted', 'certification-import', now(),
  r."currentSourceUrl", r."currentSourceType", COALESCE(r."organizationConfirmedActive", true),
  COALESCE(r."fieldsConfirmed", '[]'::jsonb), COALESCE(r."discrepanciesFromPdf", '[]'::jsonb), COALESCE(r."is24Hours", false),
  r."addressHandling", r."verificationNotes", ru.id,
  now(), now()
FROM resolved r
JOIN resource_upsert ru ON ru.id = r.resolved_id
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
