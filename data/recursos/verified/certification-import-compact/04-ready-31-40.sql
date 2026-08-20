-- Recursos Build 03C-COMPACT — Certification import batch 4/7 (10 records)
-- Compact set-based transport for records 31..40 of 65 (sorted verificationPriority asc,
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
  FROM jsonb_to_recordset($JSON$[{"candidateId":"sjb-child-development-centers","verificationPriority":2,"canonicalSlug":"sjb-child-development-centers","legacySlug":null,"organizationName":"SJB Child Development Centers","programName":null,"organizationType":"nonprofit","shortDescriptionEn":"","primaryCategory":"babies-kids-parents","urgencyLevel":"want-to-connect","audienceTags":[],"languages":[],"costModel":"unknown","eligibilityEn":null,"serviceArea":"Santa Clara County","phone":"(408) 414-2700","crisisPhone":null,"sms":null,"whatsapp":null,"email":"enrollment@sjbcdc.org","websiteUrl":"https://www.sjbcdc.org","applicationUrl":null,"addressLine1":"1400 Parkmoor Avenue Suite 220","addressLine2":null,"addressCity":"San Jose","addressState":"CA","addressZip":"95126","addressWithheldForSafety":false,"hoursNoteEn":null,"is24Hours":false,"officialSourceUrl":"https://www.sjbcdc.org","currentSourceUrl":"https://www.sjbcdc.org","currentSourceType":"official_org_site","organizationConfirmedActive":true,"fieldsConfirmed":["address"],"discrepanciesFromPdf":[{"field":"phone","pdfValue":"408-414-0242","currentValue":"(408) 414-2700"}],"addressHandling":"confirmed","verificationNotes":"Address confirmed unchanged. Phone number differs from PDF."},{"candidateId":"sunday-friends","verificationPriority":2,"canonicalSlug":"sunday-friends-foundation","legacySlug":"sunday-friends","organizationName":"Sunday Friends Foundation","programName":null,"organizationType":"nonprofit","shortDescriptionEn":"","primaryCategory":"babies-kids-parents","urgencyLevel":"want-to-connect","audienceTags":[],"languages":[],"costModel":"unknown","eligibilityEn":null,"serviceArea":"San Jose","phone":"(408) 217-9587","crisisPhone":null,"sms":null,"whatsapp":null,"email":null,"websiteUrl":"https://www.sundayfriends.org","applicationUrl":null,"addressLine1":"Sobrato Center for Nonprofits, 1400 Parkmoor Avenue, Suite 260","addressLine2":null,"addressCity":"San Jose","addressState":"CA","addressZip":"95126","addressWithheldForSafety":false,"hoursNoteEn":null,"is24Hours":false,"officialSourceUrl":"https://www.sundayfriends.org","currentSourceUrl":"https://www.sundayfriends.org","currentSourceType":"official_org_site","organizationConfirmedActive":true,"fieldsConfirmed":["phone","address"],"discrepanciesFromPdf":[{"field":"phone","pdfValue":"(none listed)","currentValue":"(408) 217-9587 (newly confirmed)"},{"field":"address","pdfValue":"1313 Audubon Drive, San Jose, CA 95122 (Santee distribution site)","currentValue":"1400 Parkmoor Avenue, Suite 260, San Jose, CA 95126 (administrative office)"}],"addressHandling":"confirmed","verificationNotes":"PDF had no phone at all — now confirmed. Address shown is the admin office, not a distribution site."},{"candidateId":"sunnyvale-community-services","verificationPriority":2,"canonicalSlug":"sunnyvale-community-services","legacySlug":null,"organizationName":"Sunnyvale Community Services","programName":null,"organizationType":"nonprofit","shortDescriptionEn":"","primaryCategory":"food-basic-needs","urgencyLevel":"i-need-help","audienceTags":[],"languages":[],"costModel":"unknown","eligibilityEn":null,"serviceArea":"Sunnyvale","phone":"408.738.4321","crisisPhone":null,"sms":null,"whatsapp":null,"email":"info@svcommunityservices.org","websiteUrl":"https://www.svcommunityservices.org","applicationUrl":null,"addressLine1":"1160 Kern Avenue","addressLine2":null,"addressCity":"Sunnyvale","addressState":"CA","addressZip":"94085","addressWithheldForSafety":false,"hoursNoteEn":null,"is24Hours":false,"officialSourceUrl":"https://www.svcommunityservices.org","currentSourceUrl":"https://www.svcommunityservices.org","currentSourceType":"official_org_site","organizationConfirmedActive":true,"fieldsConfirmed":["phone","address"],"discrepanciesFromPdf":[],"addressHandling":"confirmed","verificationNotes":"Exact match to PDF — phone and address unchanged."},{"candidateId":"asian-american-community-service-agency","verificationPriority":3,"canonicalSlug":"african-american-community-service-agency-aacsa","legacySlug":"asian-american-community-service-agency","organizationName":"African American Community Service Agency (AACSA)","programName":null,"organizationType":"nonprofit","shortDescriptionEn":"","primaryCategory":"community-support","urgencyLevel":"want-to-connect","audienceTags":[],"languages":[],"costModel":"unknown","eligibilityEn":null,"serviceArea":"Santa Clara County","phone":"(408) 292-3157","crisisPhone":null,"sms":null,"whatsapp":null,"email":"info@sjaacsa.org","websiteUrl":"https://www.sjaacsa.org","applicationUrl":null,"addressLine1":"304 N. 6th Street","addressLine2":null,"addressCity":"San Jose","addressState":"CA","addressZip":"95112","addressWithheldForSafety":false,"hoursNoteEn":null,"is24Hours":false,"officialSourceUrl":"https://www.sjaacsa.org","currentSourceUrl":"https://www.sjaacsa.org","currentSourceType":"official_org_site","organizationConfirmedActive":true,"fieldsConfirmed":["phone","address"],"discrepanciesFromPdf":[{"field":"organizationName","pdfValue":"Asian American Community Service Agency","currentValue":"CRITICAL: this is actually the African American Community Service Agency (AACSA) — the 2023 PDF misnamed it. Phone and address are correct, the org identity in the PDF was wrong."}],"addressHandling":"confirmed","verificationNotes":"SAFETY-CRITICAL CORRECTION: verified directly on the official site — this organization serves the African American community, not Asian American as the PDF stated. Phone/address unchanged; name must be corrected before publishing to avoid misdirecting users."},{"candidateId":"california-alternative-rates-for-energy-care","verificationPriority":3,"canonicalSlug":"california-alternative-rates-for-energy-care","legacySlug":null,"organizationName":"California Alternative Rates for Energy (CARE)","programName":null,"organizationType":"other","shortDescriptionEn":"","primaryCategory":"community-support","urgencyLevel":"want-to-connect","audienceTags":[],"languages":[],"costModel":"eligibility_based","eligibilityEn":"Income-qualified households","serviceArea":"PG&E service territory","phone":"1-866-743-5832","crisisPhone":null,"sms":null,"whatsapp":null,"email":null,"websiteUrl":"https://www.pge.com/care","applicationUrl":"https://www.pge.com/care","addressLine1":null,"addressLine2":null,"addressCity":null,"addressState":null,"addressZip":null,"addressWithheldForSafety":false,"hoursNoteEn":null,"is24Hours":false,"officialSourceUrl":"https://www.pge.com/care","currentSourceUrl":"https://www.pge.com/care","currentSourceType":"official_org_site","organizationConfirmedActive":true,"fieldsConfirmed":["phone","websiteUrl","eligibility"],"discrepanciesFromPdf":[{"field":"phone","pdfValue":"866-743-2273 (866-PGE-CARE)","currentValue":"1-866-743-5832"}],"addressHandling":"not_applicable","verificationNotes":"Program confirmed active (20%+ gas / 35%+ electric discount). Phone number differs from PDF — updated to confirmed current number."},{"candidateId":"campbell-adult-and-community-education-cace","verificationPriority":3,"canonicalSlug":"campbell-adult-and-community-education-cace","legacySlug":null,"organizationName":"Campbell Adult and Community Education (CACE)","programName":null,"organizationType":"school-district","shortDescriptionEn":"","primaryCategory":"jobs-training","urgencyLevel":"want-to-connect","audienceTags":[],"languages":[],"costModel":"unknown","eligibilityEn":null,"serviceArea":"Campbell area","phone":"(408) 626-3402","crisisPhone":null,"sms":null,"whatsapp":null,"email":null,"websiteUrl":"https://www.cace.cuhsd.org","applicationUrl":null,"addressLine1":"1224 Del Mar Avenue","addressLine2":null,"addressCity":"San Jose","addressState":"CA","addressZip":"95128","addressWithheldForSafety":false,"hoursNoteEn":null,"is24Hours":false,"officialSourceUrl":"https://www.cace.cuhsd.org","currentSourceUrl":"https://www.cace.cuhsd.org","currentSourceType":"government","organizationConfirmedActive":true,"fieldsConfirmed":["phone","address"],"discrepanciesFromPdf":[],"addressHandling":"confirmed","verificationNotes":"Exact match to PDF — phone and address unchanged. ESL, GED/diploma, career, citizenship, and community classes confirmed active."},{"candidateId":"cancer-carepoint","verificationPriority":3,"canonicalSlug":"cancer-carepoint","legacySlug":null,"organizationName":"Cancer CAREpoint","programName":null,"organizationType":"nonprofit","shortDescriptionEn":"","primaryCategory":"health-clinics","urgencyLevel":"i-need-help","audienceTags":[],"languages":["English","Spanish"],"costModel":"free","eligibilityEn":"Cancer patients, families, caregivers","serviceArea":"Silicon Valley","phone":"408.402.6611","crisisPhone":null,"sms":null,"whatsapp":null,"email":"info@cancercarepoint.org","websiteUrl":"https://www.cancercarepoint.org/contact-us/","applicationUrl":null,"addressLine1":"1165 Lincoln Ave. Suite 300","addressLine2":null,"addressCity":"San Jose","addressState":"CA","addressZip":"95125","addressWithheldForSafety":false,"hoursNoteEn":"Monday – Friday 9:00am-5:00pm","is24Hours":false,"officialSourceUrl":"https://www.cancercarepoint.org/contact-us/","currentSourceUrl":"https://www.cancercarepoint.org/contact-us/","currentSourceType":"official_org_site","organizationConfirmedActive":true,"fieldsConfirmed":["phone","address","hours","languages"],"discrepanciesFromPdf":[{"field":"address","pdfValue":"2505 Samaritan Dr, Bldg. 400, Suite 402, San Jose, CA 95124","currentValue":"1165 Lincoln Ave. Suite 300, San Jose, CA 95125 (relocated)"}],"addressHandling":"confirmed","verificationNotes":"Phone confirmed unchanged. Organization has relocated — do not publish the old Samaritan Dr address. Hours and Spanish-language availability newly confirmed."},{"candidateId":"conxion-to-community","verificationPriority":3,"canonicalSlug":"conxion-to-community","legacySlug":null,"organizationName":"ConXión to Community","programName":null,"organizationType":"nonprofit","shortDescriptionEn":"","primaryCategory":"community-support","urgencyLevel":"want-to-connect","audienceTags":[],"languages":[],"costModel":"unknown","eligibilityEn":null,"serviceArea":"San Jose","phone":"(408) 213-0961","crisisPhone":null,"sms":null,"whatsapp":null,"email":null,"websiteUrl":"https://conxion.org","applicationUrl":null,"addressLine1":"749 Story Rd Suite 10","addressLine2":null,"addressCity":"San Jose","addressState":"CA","addressZip":"95122","addressWithheldForSafety":false,"hoursNoteEn":null,"is24Hours":false,"officialSourceUrl":"https://conxion.org","currentSourceUrl":"https://conxion.org","currentSourceType":"official_org_site","organizationConfirmedActive":true,"fieldsConfirmed":["phone","address"],"discrepanciesFromPdf":[],"addressHandling":"confirmed","verificationNotes":"Exact match to PDF — phone and address unchanged. Education, family, youth, and workforce programs confirmed active."},{"candidateId":"dress-for-success","verificationPriority":3,"canonicalSlug":"dress-for-success-san-jose","legacySlug":"dress-for-success","organizationName":"Dress for Success San Jose","programName":null,"organizationType":"nonprofit","shortDescriptionEn":"","primaryCategory":"jobs-training","urgencyLevel":"want-to-connect","audienceTags":[],"languages":[],"costModel":"free","eligibilityEn":"Job-ready women","serviceArea":"San Jose / Silicon Valley","phone":"408-935-8299","crisisPhone":null,"sms":null,"whatsapp":null,"email":"godavari@dfssanjose.org","websiteUrl":"https://www.sjdress.org/","applicationUrl":null,"addressLine1":null,"addressLine2":null,"addressCity":null,"addressState":null,"addressZip":null,"addressWithheldForSafety":false,"hoursNoteEn":null,"is24Hours":false,"officialSourceUrl":"https://www.sjdress.org/","currentSourceUrl":"https://www.sjdress.org/","currentSourceType":"official_org_site","organizationConfirmedActive":true,"fieldsConfirmed":["phone","eligibility"],"discrepanciesFromPdf":[{"field":"websiteUrl","pdfValue":"https://sanjose.dressforsuccess.org","currentValue":"https://www.sjdress.org/ (old URL now returns HTTP 410 Gone — permanently removed)"}],"addressHandling":"not_applicable","verificationNotes":"Phone confirmed unchanged. Old PDF URL is dead (410 Gone); correct current site is sjdress.org. Address not reconfirmed this pass — omitted rather than carried forward."},{"candidateId":"earned-income-tax-credit-eitc","verificationPriority":3,"canonicalSlug":"earned-income-tax-credit-eitc","legacySlug":null,"organizationName":"Earned Income Tax Credit (EITC)","programName":null,"organizationType":"government","shortDescriptionEn":"","primaryCategory":"community-support","urgencyLevel":"want-to-connect","audienceTags":[],"languages":[],"costModel":"free","eligibilityEn":"Low- to moderate-income workers and families","serviceArea":"United States","phone":null,"crisisPhone":null,"sms":null,"whatsapp":null,"email":null,"websiteUrl":"https://www.irs.gov/credits-deductions/individuals/earned-income-tax-credit","applicationUrl":null,"addressLine1":null,"addressLine2":null,"addressCity":null,"addressState":null,"addressZip":null,"addressWithheldForSafety":false,"hoursNoteEn":null,"is24Hours":false,"officialSourceUrl":"https://www.irs.gov/credits-deductions/individuals/earned-income-tax-credit","currentSourceUrl":"https://www.irs.gov/credits-deductions/individuals/earned-income-tax-credit","currentSourceType":"government","organizationConfirmedActive":true,"fieldsConfirmed":["websiteUrl","eligibility"],"discrepanciesFromPdf":[],"addressHandling":"not_applicable","verificationNotes":"Federal IRS page confirmed live (last reviewed March 2026). No phone number was ever provided by the PDF or current source — this is expected for an informational federal tax page."}]$JSON$::jsonb)
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
