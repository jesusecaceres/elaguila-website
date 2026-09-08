-- Recursos Build 03C-COMPACT — Certification import batch 6/7 (10 records)
-- Compact set-based transport for records 51..60 of 65 (sorted verificationPriority asc,
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
  FROM jsonb_to_recordset($JSON$[{"candidateId":"momentum-for-health","verificationPriority":3,"canonicalSlug":"momentum-for-health","legacySlug":null,"organizationName":"Momentum For Health","programName":null,"organizationType":"nonprofit","shortDescriptionEn":"","primaryCategory":"mental-health-recovery","urgencyLevel":"i-need-help","audienceTags":[],"languages":[],"costModel":"unknown","eligibilityEn":"Adults with Medi-Cal","serviceArea":"Santa Clara County","phone":"408-596-7290","crisisPhone":"988","sms":null,"whatsapp":null,"email":"info@momentumforhealth.org","websiteUrl":"https://www.momentumforhealth.org","applicationUrl":null,"addressLine1":null,"addressLine2":null,"addressCity":null,"addressState":null,"addressZip":null,"addressWithheldForSafety":false,"hoursNoteEn":null,"is24Hours":false,"officialSourceUrl":"https://www.momentumforhealth.org","currentSourceUrl":"https://www.momentumforhealth.org","currentSourceType":"official_org_site","organizationConfirmedActive":true,"fieldsConfirmed":["phone"],"discrepanciesFromPdf":[{"field":"phone","pdfValue":"408-260-4040","currentValue":"408-596-7290 (or 988)"}],"addressHandling":"not_applicable","verificationNotes":"Phone number changed; new TRUST Mobile Response Program confirmed as a new offering not in the 2023 PDF."},{"candidateId":"mtn-view-los-altos-adult-school-mvla","verificationPriority":3,"canonicalSlug":"mtn-view-los-altos-adult-school-mvla","legacySlug":null,"organizationName":"Mtn View-Los Altos Adult School (MVLA)","programName":null,"organizationType":"school-district","shortDescriptionEn":"","primaryCategory":"jobs-training","urgencyLevel":"want-to-connect","audienceTags":[],"languages":[],"costModel":"unknown","eligibilityEn":null,"serviceArea":"Mountain View / Los Altos","phone":"650-940-1333","crisisPhone":null,"sms":null,"whatsapp":null,"email":null,"websiteUrl":"https://as.mvla.net","applicationUrl":null,"addressLine1":"333 Moffett Blvd","addressLine2":null,"addressCity":"Mountain View","addressState":"CA","addressZip":"94043","addressWithheldForSafety":false,"hoursNoteEn":null,"is24Hours":false,"officialSourceUrl":"https://as.mvla.net","currentSourceUrl":"https://as.mvla.net","currentSourceType":"government","organizationConfirmedActive":true,"fieldsConfirmed":["phone","address"],"discrepanciesFromPdf":[],"addressHandling":"confirmed","verificationNotes":"Exact match to PDF."},{"candidateId":"new-eyes","verificationPriority":3,"canonicalSlug":"new-eyes","legacySlug":null,"organizationName":"New Eyes","programName":null,"organizationType":"nonprofit","shortDescriptionEn":"","primaryCategory":"health-clinics","urgencyLevel":"want-to-connect","audienceTags":[],"languages":[],"costModel":"free","eligibilityEn":"Low income individuals","serviceArea":"United States","phone":null,"crisisPhone":null,"sms":null,"whatsapp":null,"email":null,"websiteUrl":"https://www.new-eyes.org","applicationUrl":null,"addressLine1":null,"addressLine2":null,"addressCity":null,"addressState":null,"addressZip":null,"addressWithheldForSafety":false,"hoursNoteEn":null,"is24Hours":false,"officialSourceUrl":"https://www.new-eyes.org","currentSourceUrl":"https://www.new-eyes.org","currentSourceType":"official_org_site","organizationConfirmedActive":true,"fieldsConfirmed":["websiteUrl","eligibility"],"discrepanciesFromPdf":[],"addressHandling":"not_applicable","verificationNotes":"No phone in either PDF or current source — national mail-based eyeglasses program."},{"candidateId":"north-east-medical-services-nems","verificationPriority":3,"canonicalSlug":"north-east-medical-services-nems","legacySlug":null,"organizationName":"North East Medical Services (NEMS)","programName":null,"organizationType":"community-clinic","shortDescriptionEn":"","primaryCategory":"health-clinics","urgencyLevel":"i-need-help","audienceTags":[],"languages":[],"costModel":"unknown","eligibilityEn":null,"serviceArea":"San Jose","phone":"1-888-500-1886","crisisPhone":null,"sms":null,"whatsapp":null,"email":"info@nems.org","websiteUrl":"https://www.nems.org","applicationUrl":null,"addressLine1":"1870 Lundy Avenue","addressLine2":null,"addressCity":"San Jose","addressState":"CA","addressZip":"95131","addressWithheldForSafety":false,"hoursNoteEn":"Mon-Fri 8am-6pm, Sat 8am-12pm & 1-5pm","is24Hours":false,"officialSourceUrl":"https://www.nems.org","currentSourceUrl":"https://www.nems.org","currentSourceType":"official_org_site","organizationConfirmedActive":true,"fieldsConfirmed":["address","hours"],"discrepanciesFromPdf":[{"field":"phone","pdfValue":"408-573-9686","currentValue":"1-888-500-1886 (shared appointment line for both SJ clinics)"}],"addressHandling":"confirmed","verificationNotes":"Address confirmed unchanged; phone moved to a shared toll-free line. Second SJ location at 939 Story Road also confirmed."},{"candidateId":"novaworks","verificationPriority":3,"canonicalSlug":"novaworks","legacySlug":null,"organizationName":"NOVAworks","programName":null,"organizationType":"government","shortDescriptionEn":"","primaryCategory":"jobs-training","urgencyLevel":"want-to-connect","audienceTags":["youth"],"languages":[],"costModel":"unknown","eligibilityEn":null,"serviceArea":"Sunnyvale","phone":"408-730-7232","crisisPhone":null,"sms":null,"whatsapp":null,"email":"info@novaworks.org","websiteUrl":"https://novaworks.org","applicationUrl":null,"addressLine1":"456 West Olive Ave","addressLine2":null,"addressCity":"Sunnyvale","addressState":"CA","addressZip":null,"addressWithheldForSafety":false,"hoursNoteEn":"Mon-Fri 8am-5pm","is24Hours":false,"officialSourceUrl":"https://novaworks.org","currentSourceUrl":"https://novaworks.org","currentSourceType":"official_org_site","organizationConfirmedActive":true,"fieldsConfirmed":["phone","hours"],"discrepanciesFromPdf":[{"field":"address","pdfValue":"505 W. Olive Ave. Ste 550, Sunnyvale CA 94086","currentValue":"456 West Olive Ave, Sunnyvale (different street number)"}],"addressHandling":"confirmed","verificationNotes":"Phone confirmed unchanged; address street number differs — relocated nearby."},{"candidateId":"rebekah-children-s-services","verificationPriority":3,"canonicalSlug":"rebekah-children-s-services","legacySlug":null,"organizationName":"Rebekah Children's Services","programName":null,"organizationType":"nonprofit","shortDescriptionEn":"","primaryCategory":"mental-health-recovery","urgencyLevel":"i-need-help","audienceTags":[],"languages":[],"costModel":"unknown","eligibilityEn":null,"serviceArea":"Gilroy, Campbell, Hollister","phone":"(408) 846-2100","crisisPhone":null,"sms":null,"whatsapp":null,"email":null,"websiteUrl":"https://www.rcskids.org","applicationUrl":null,"addressLine1":"290 IOOF Ave","addressLine2":null,"addressCity":"Gilroy","addressState":"CA","addressZip":"95020","addressWithheldForSafety":false,"hoursNoteEn":null,"is24Hours":false,"officialSourceUrl":"https://www.rcskids.org","currentSourceUrl":"https://www.rcskids.org","currentSourceType":"official_org_site","organizationConfirmedActive":true,"fieldsConfirmed":["phone","address"],"discrepanciesFromPdf":[],"addressHandling":"confirmed","verificationNotes":"Exact match to PDF. Also has Campbell and Hollister locations."},{"candidateId":"rotacare-bay-area","verificationPriority":3,"canonicalSlug":"rotacare-bay-area","legacySlug":null,"organizationName":"RotaCare Bay Area","programName":null,"organizationType":"community-clinic","shortDescriptionEn":"","primaryCategory":"health-clinics","urgencyLevel":"i-need-help","audienceTags":[],"languages":[],"costModel":"free","eligibilityEn":null,"serviceArea":"Greater Bay Area incl. San Jose","phone":"408-379-8000","crisisPhone":null,"sms":null,"whatsapp":null,"email":null,"websiteUrl":"https://www.rotacarebayarea.org","applicationUrl":null,"addressLine1":null,"addressLine2":null,"addressCity":null,"addressState":null,"addressZip":null,"addressWithheldForSafety":false,"hoursNoteEn":null,"is24Hours":false,"officialSourceUrl":"https://www.rotacarebayarea.org","currentSourceUrl":"https://www.rotacarebayarea.org","currentSourceType":"official_org_site","organizationConfirmedActive":true,"fieldsConfirmed":["phone"],"discrepanciesFromPdf":[],"addressHandling":"not_applicable","verificationNotes":"Phone confirmed unchanged. Gilroy clinic not reconfirmed on this specific page — org lists San Jose among 9 regional clinics."},{"candidateId":"sacred-heart-community-service","verificationPriority":3,"canonicalSlug":"sacred-heart-community-service","legacySlug":null,"organizationName":"Sacred Heart Community Service","programName":null,"organizationType":"nonprofit","shortDescriptionEn":"","primaryCategory":"community-support","urgencyLevel":"i-need-help","audienceTags":[],"languages":[],"costModel":"unknown","eligibilityEn":null,"serviceArea":"San Jose","phone":"(408) 278-2160","crisisPhone":null,"sms":null,"whatsapp":null,"email":null,"websiteUrl":"https://sacredheartcs.org","applicationUrl":null,"addressLine1":"1381 South First Street","addressLine2":null,"addressCity":"San Jose","addressState":"CA","addressZip":"95110","addressWithheldForSafety":false,"hoursNoteEn":null,"is24Hours":false,"officialSourceUrl":"https://sacredheartcs.org","currentSourceUrl":"https://sacredheartcs.org","currentSourceType":"official_org_site","organizationConfirmedActive":true,"fieldsConfirmed":["phone","address"],"discrepanciesFromPdf":[],"addressHandling":"confirmed","verificationNotes":"Exact match to PDF."},{"candidateId":"san-jose-state-university-career-center","verificationPriority":3,"canonicalSlug":"san-jose-state-university","legacySlug":null,"organizationName":"San José State University","programName":"Career Center","organizationType":"school-district","shortDescriptionEn":"","primaryCategory":"jobs-training","urgencyLevel":"want-to-connect","audienceTags":[],"languages":[],"costModel":"unknown","eligibilityEn":null,"serviceArea":"San Jose","phone":"(408) 924-6031","crisisPhone":null,"sms":null,"whatsapp":null,"email":null,"websiteUrl":"https://careercenter.sjsu.edu/","applicationUrl":null,"addressLine1":"One Washington Square (Clark Hall, 1st Floor, Room 140)","addressLine2":null,"addressCity":"San Jose","addressState":"CA","addressZip":"95192","addressWithheldForSafety":false,"hoursNoteEn":null,"is24Hours":false,"officialSourceUrl":"https://careercenter.sjsu.edu/","currentSourceUrl":"https://careercenter.sjsu.edu/","currentSourceType":"government","organizationConfirmedActive":true,"fieldsConfirmed":["address"],"discrepanciesFromPdf":[{"field":"phone","pdfValue":"408-924-1000 (general SJSU line)","currentValue":"(408) 924-6031 (Career Center-specific line)"}],"addressHandling":"confirmed","verificationNotes":"Address confirmed unchanged; phone refined to the Career Center's direct line rather than the university switchboard."},{"candidateId":"santa-clara-family-health-plan-scfhp","verificationPriority":3,"canonicalSlug":"santa-clara-family-health-plan-scfhp","legacySlug":null,"organizationName":"Santa Clara Family Health Plan (SCFHP)","programName":null,"organizationType":"healthcare","shortDescriptionEn":"","primaryCategory":"health-clinics","urgencyLevel":"i-need-help","audienceTags":[],"languages":[],"costModel":"unknown","eligibilityEn":null,"serviceArea":"Santa Clara County","phone":"1-800-260-2055","crisisPhone":null,"sms":null,"whatsapp":null,"email":null,"websiteUrl":"https://www.scfhp.com","applicationUrl":null,"addressLine1":"6201 San Ignacio Ave.","addressLine2":null,"addressCity":"San Jose","addressState":"CA","addressZip":"95119","addressWithheldForSafety":false,"hoursNoteEn":null,"is24Hours":false,"officialSourceUrl":"https://www.scfhp.com","currentSourceUrl":"https://www.scfhp.com","currentSourceType":"official_org_site","organizationConfirmedActive":true,"fieldsConfirmed":["address","phone"],"discrepanciesFromPdf":[{"field":"phone","pdfValue":"1-888-802-3353","currentValue":"1-408-376-2000 / 1-800-260-2055 (Customer Service, cross-confirmed against original source notes)"}],"addressHandling":"confirmed","verificationNotes":"Address confirmed unchanged. Multiple current phone lines confirmed; Customer Service number (1-800-260-2055) matches what the original source notes already recorded."}]$JSON$::jsonb)
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
