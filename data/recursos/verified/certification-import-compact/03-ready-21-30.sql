-- Recursos Build 03C-COMPACT — Certification import batch 3/7 (10 records)
-- Compact set-based transport for records 21..30 of 65 (sorted verificationPriority asc,
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
  FROM jsonb_to_recordset($JSON$[{"candidateId":"law-foundation-of-silicon-valley","verificationPriority":2,"canonicalSlug":"law-foundation-of-silicon-valley","legacySlug":null,"organizationName":"Law Foundation of Silicon Valley","programName":null,"organizationType":"nonprofit","shortDescriptionEn":"Housing Program provides free legal advice and representation on housing-related matters for low-income individuals. Health Program provides free legal advice on public benefits and mental health patient's rights. Children & Youth program advances the legal rights of children and youth.","primaryCategory":"legal-immigration","urgencyLevel":"i-need-help","audienceTags":[],"languages":[],"costModel":"free","eligibilityEn":"Low-income individuals — housing, health, children & youth","serviceArea":"Santa Clara County","phone":"(408) 293-4790","crisisPhone":null,"sms":null,"whatsapp":null,"email":null,"websiteUrl":"https://www.lawfoundation.org","applicationUrl":null,"addressLine1":"4 North Second Street, Suite 1300","addressLine2":null,"addressCity":"San Jose","addressState":"CA","addressZip":"95113","addressWithheldForSafety":false,"hoursNoteEn":null,"is24Hours":false,"officialSourceUrl":"https://www.lawfoundation.org","currentSourceUrl":"https://www.lawfoundation.org","currentSourceType":"official_org_site","organizationConfirmedActive":true,"fieldsConfirmed":["phone","address"],"discrepanciesFromPdf":[{"field":"phone","pdfValue":"408-280-2424 (listed as main)","currentValue":"(408) 293-4790 general line; (408) 280-2424 is specifically Housing"}],"addressHandling":"confirmed","verificationNotes":"General line and three program-specific lines all confirmed directly on official site."},{"candidateId":"loaves-and-fishes-family-kitchen","verificationPriority":2,"canonicalSlug":"loaves-and-fishes-family-kitchen","legacySlug":null,"organizationName":"Loaves and Fishes Family Kitchen","programName":null,"organizationType":"faith-based","shortDescriptionEn":"Free meals at Goodwill Industries (Mon-Fri 3:30-4:30pm) and San Jose Vietnamese Seventh Day Adventist Church (Mon-Fri 3:30-4:30pm) locations.","primaryCategory":"food-basic-needs","urgencyLevel":"i-need-help","audienceTags":[],"languages":[],"costModel":"free","eligibilityEn":"Anyone experiencing food insecurity","serviceArea":"San Jose","phone":"408-922-9085","crisisPhone":null,"sms":null,"whatsapp":null,"email":"david@loavesfishes.org","websiteUrl":"https://www.loavesfishes.org","applicationUrl":null,"addressLine1":"1500 Berger Drive","addressLine2":null,"addressCity":"San Jose","addressState":"CA","addressZip":"95112","addressWithheldForSafety":false,"hoursNoteEn":null,"is24Hours":false,"officialSourceUrl":"https://www.loavesfishes.org","currentSourceUrl":"https://www.loavesfishes.org","currentSourceType":"official_org_site","organizationConfirmedActive":true,"fieldsConfirmed":["phone","address","eligibility"],"discrepanciesFromPdf":[],"addressHandling":"confirmed","verificationNotes":"Exact match to PDF — phone and address unchanged."},{"candidateId":"morgan-hill-migrant-educational-program","verificationPriority":2,"canonicalSlug":"morgan-hill-migrant-education-program","legacySlug":"morgan-hill-migrant-educational-program","organizationName":"Morgan Hill Migrant Education Program","programName":null,"organizationType":"school-district","shortDescriptionEn":"","primaryCategory":"youth-education","urgencyLevel":"want-to-connect","audienceTags":[],"languages":[],"costModel":"free","eligibilityEn":"Migrant students ages 3-21 and out-of-school youth under 22","serviceArea":"Morgan Hill","phone":"(408) 201-6081","crisisPhone":null,"sms":null,"whatsapp":null,"email":null,"websiteUrl":"https://www.mhusd.org/departments/educational-services/migrant-education","applicationUrl":null,"addressLine1":"15600 Concord Circle","addressLine2":null,"addressCity":"Morgan Hill","addressState":"CA","addressZip":"95037","addressWithheldForSafety":false,"hoursNoteEn":null,"is24Hours":false,"officialSourceUrl":"https://www.mhusd.org/departments/educational-services/migrant-education","currentSourceUrl":"https://www.mhusd.org/departments/educational-services/migrant-education","currentSourceType":"government","organizationConfirmedActive":true,"fieldsConfirmed":["phone","address","eligibility"],"discrepanciesFromPdf":[{"field":"websiteUrl","pdfValue":"https://mhusd.org/educational-services/migrant-education","currentValue":"https://www.mhusd.org/departments/educational-services/migrant-education (old URL 404s)"}],"addressHandling":"confirmed","verificationNotes":"Phone and address confirmed unchanged. URL path changed."},{"candidateId":"pars-equality-center","verificationPriority":2,"canonicalSlug":"pars-equality-center","legacySlug":null,"organizationName":"Pars Equality Center","programName":null,"organizationType":"nonprofit","shortDescriptionEn":"","primaryCategory":"legal-immigration","urgencyLevel":"i-need-help","audienceTags":[],"languages":[],"costModel":"unknown","eligibilityEn":null,"serviceArea":"San Jose","phone":"(408) 261-6405","crisisPhone":null,"sms":null,"whatsapp":null,"email":"info@parsequalitycenter.org","websiteUrl":"https://www.parsequalitycenter.org","applicationUrl":null,"addressLine1":"1635 The Alameda","addressLine2":null,"addressCity":"San Jose","addressState":"CA","addressZip":"95126","addressWithheldForSafety":false,"hoursNoteEn":null,"is24Hours":false,"officialSourceUrl":"https://www.parsequalitycenter.org","currentSourceUrl":"https://www.parsequalitycenter.org","currentSourceType":"official_org_site","organizationConfirmedActive":true,"fieldsConfirmed":["address"],"discrepanciesFromPdf":[{"field":"phone","pdfValue":"408-261-6400","currentValue":"(408) 261-6405 (Immigration Legal Services line)"}],"addressHandling":"confirmed","verificationNotes":"Address confirmed unchanged. PDF's general number not directly reconfirmed; using confirmed Immigration Legal Services line instead."},{"candidateId":"pro-bono-project-silicon-valley","verificationPriority":2,"canonicalSlug":"pro-bono-project-silicon-valley","legacySlug":null,"organizationName":"Pro Bono Project Silicon Valley","programName":null,"organizationType":"nonprofit","shortDescriptionEn":"","primaryCategory":"legal-immigration","urgencyLevel":"i-need-help","audienceTags":[],"languages":[],"costModel":"free","eligibilityEn":"Clients of limited means","serviceArea":"Santa Clara County","phone":"(408) 998-5298","crisisPhone":null,"sms":null,"whatsapp":null,"email":null,"websiteUrl":"https://www.probonoproject.org","applicationUrl":null,"addressLine1":"900 E Hamilton Avenue Suite 100","addressLine2":null,"addressCity":"Campbell","addressState":"CA","addressZip":"95008","addressWithheldForSafety":false,"hoursNoteEn":null,"is24Hours":false,"officialSourceUrl":"https://www.probonoproject.org","currentSourceUrl":"https://www.probonoproject.org","currentSourceType":"official_org_site","organizationConfirmedActive":true,"fieldsConfirmed":["phone","address","eligibility"],"discrepanciesFromPdf":[{"field":"address","pdfValue":"25 N 14th St #506, San Jose, CA 95112","currentValue":"900 E Hamilton Avenue Suite 100, Campbell, CA 95008 (relocated to a different city)"}],"addressHandling":"confirmed","verificationNotes":"Phone confirmed unchanged. Organization relocated from San Jose to Campbell since 2023."},{"candidateId":"santa-clara-county-housing-authority","verificationPriority":2,"canonicalSlug":"santa-clara-county-housing-authority","legacySlug":null,"organizationName":"Santa Clara County Housing Authority","programName":null,"organizationType":"government","shortDescriptionEn":"County housing authority administering housing assistance programs.","primaryCategory":"housing-rent","urgencyLevel":"i-need-help","audienceTags":[],"languages":[],"costModel":"unknown","eligibilityEn":"Low-income families and individuals","serviceArea":"Santa Clara County","phone":"(408) 275-8770","crisisPhone":null,"sms":null,"whatsapp":null,"email":null,"websiteUrl":"https://www.scchousingauthority.org","applicationUrl":null,"addressLine1":"505 West Julian Street","addressLine2":null,"addressCity":"San Jose","addressState":"CA","addressZip":"95110","addressWithheldForSafety":false,"hoursNoteEn":"Mon-Thu 7:30am-4:30pm; every other Fri 7:30am-4pm","is24Hours":false,"officialSourceUrl":"https://www.scchousingauthority.org","currentSourceUrl":"https://www.scchousingauthority.org","currentSourceType":"government","organizationConfirmedActive":true,"fieldsConfirmed":["phone","address","hours"],"discrepanciesFromPdf":[],"addressHandling":"confirmed","verificationNotes":"Exact match to PDF. TDD (408) 993-3041 also confirmed."},{"candidateId":"scc-public-health-breastfeeding-chestfeeding-support-program","verificationPriority":2,"canonicalSlug":"nursing-mothers-counsel","legacySlug":"scc-public-health-breastfeeding-chestfeeding-support-program","organizationName":"Nursing Mothers Counsel","programName":"SCC Breastfeeding/Chestfeeding Support","organizationType":"government","shortDescriptionEn":"County program offering counseling, one-on-one support, and support groups for breastfeeding/chestfeeding parents.","primaryCategory":"babies-kids-parents","urgencyLevel":"want-to-connect","audienceTags":[],"languages":[],"costModel":"free","eligibilityEn":null,"serviceArea":"Santa Clara County","phone":"650-327-6455","crisisPhone":null,"sms":null,"whatsapp":null,"email":"priyanka.kundu@phd.sccgov.org","websiteUrl":"https://www.nursingmothers.org","applicationUrl":null,"addressLine1":null,"addressLine2":null,"addressCity":null,"addressState":null,"addressZip":null,"addressWithheldForSafety":false,"hoursNoteEn":"9am-9pm, 7 days a week","is24Hours":false,"officialSourceUrl":"https://www.nursingmothers.org","currentSourceUrl":"https://www.nursingmothers.org","currentSourceType":"official_org_site","organizationConfirmedActive":true,"fieldsConfirmed":["phone","hours"],"discrepanciesFromPdf":[{"field":"hours","pdfValue":"(not specified)","currentValue":"9am-9pm, 7 days a week (not 24/7)"}],"addressHandling":"not_applicable","verificationNotes":"Phone confirmed unchanged. Hours confirmed extended but explicitly NOT 24/7."},{"candidateId":"sccoe-migrant-education-program","verificationPriority":2,"canonicalSlug":"santa-clara-county-office-of-education-migrant-education-program-region-1","legacySlug":"sccoe-migrant-education-program","organizationName":"Santa Clara County Office of Education — Migrant Education Program (Region 1)","programName":null,"organizationType":"government","shortDescriptionEn":"Santa Clara County Office of Education migrant education program.","primaryCategory":"youth-education","urgencyLevel":"want-to-connect","audienceTags":[],"languages":[],"costModel":"free","eligibilityEn":null,"serviceArea":"Santa Clara, San Mateo, San Francisco, Alameda, San Benito, and Santa Cruz counties","phone":"(408) 453-6500","crisisPhone":null,"sms":null,"whatsapp":null,"email":null,"websiteUrl":"https://www.sccoe.org/depts/educational-services/migranted/Pages/about.aspx","applicationUrl":null,"addressLine1":"1290 Ridder Park Drive","addressLine2":null,"addressCity":"San Jose","addressState":"CA","addressZip":"95131","addressWithheldForSafety":false,"hoursNoteEn":null,"is24Hours":false,"officialSourceUrl":"https://www.sccoe.org/depts/educational-services/migranted/Pages/about.aspx","currentSourceUrl":"https://www.sccoe.org/depts/educational-services/migranted/Pages/about.aspx","currentSourceType":"government","organizationConfirmedActive":true,"fieldsConfirmed":["address","serviceArea"],"discrepanciesFromPdf":[{"field":"websiteUrl","pdfValue":"https://www.mepregion1.org","currentValue":"https://www.sccoe.org/depts/educational-services/migranted/Pages/about.aspx (old domain no longer resolves)"},{"field":"phone","pdfValue":"408-453-3630","currentValue":"(408) 453-6500"}],"addressHandling":"confirmed","verificationNotes":"Old domain mepregion1.org no longer resolves (DNS failure). Address confirmed unchanged; phone and website updated."},{"candidateId":"second-harvest-of-silicon-valley","verificationPriority":2,"canonicalSlug":"second-harvest-of-silicon-valley","legacySlug":null,"organizationName":"Second Harvest of Silicon Valley","programName":null,"organizationType":"nonprofit","shortDescriptionEn":"","primaryCategory":"food-basic-needs","urgencyLevel":"i-need-help","audienceTags":[],"languages":[],"costModel":"free","eligibilityEn":null,"serviceArea":"Santa Clara and San Mateo counties","phone":"1-800-984-3663","crisisPhone":null,"sms":null,"whatsapp":null,"email":"getfood@shfb.org","websiteUrl":"https://www.shfb.org/get-food","applicationUrl":null,"addressLine1":null,"addressLine2":null,"addressCity":null,"addressState":null,"addressZip":null,"addressWithheldForSafety":false,"hoursNoteEn":null,"is24Hours":false,"officialSourceUrl":"https://www.shfb.org/get-food","currentSourceUrl":"https://www.shfb.org/get-food","currentSourceType":"official_org_site","organizationConfirmedActive":true,"fieldsConfirmed":["phone","websiteUrl"],"discrepanciesFromPdf":[{"field":"sms","pdfValue":"Text \"FOOD\" to 408-455-5181","currentValue":"not reconfirmed on current page — omitted rather than carried forward unverified"}],"addressHandling":"not_applicable","verificationNotes":"Phone confirmed unchanged. Food Locator tool now the primary access method."},{"candidateId":"siren-services-immigrant-rights-education-network","verificationPriority":2,"canonicalSlug":"siren-services-immigrant-rights-education-network","legacySlug":null,"organizationName":"SIREN (Services, Immigrant Rights & Education Network)","programName":null,"organizationType":"nonprofit","shortDescriptionEn":"","primaryCategory":"legal-immigration","urgencyLevel":"i-need-help","audienceTags":[],"languages":[],"costModel":"unknown","eligibilityEn":"Low-income immigrants and refugees, regardless of legal status","serviceArea":"South Bay","phone":"(408) 453-3003","crisisPhone":null,"sms":null,"whatsapp":null,"email":"info@sirenimmigrantrights.org","websiteUrl":"https://www.sirenimmigrantrights.org","applicationUrl":null,"addressLine1":"1769 Park Ave., Suite 200","addressLine2":null,"addressCity":"San Jose","addressState":"CA","addressZip":"95126","addressWithheldForSafety":false,"hoursNoteEn":null,"is24Hours":false,"officialSourceUrl":"https://www.sirenimmigrantrights.org","currentSourceUrl":"https://www.sirenimmigrantrights.org","currentSourceType":"official_org_site","organizationConfirmedActive":true,"fieldsConfirmed":["phone","eligibility"],"discrepanciesFromPdf":[{"field":"address","pdfValue":"1415 Koll Circle, Ste 108, San Jose CA 95112","currentValue":"1769 Park Ave., Suite 200, San Jose, CA 95126 (relocated)"}],"addressHandling":"confirmed","verificationNotes":"Phone confirmed unchanged. Address relocated."}]$JSON$::jsonb)
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
