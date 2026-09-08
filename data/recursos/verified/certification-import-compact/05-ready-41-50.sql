-- Recursos Build 03C-COMPACT — Certification import batch 5/7 (10 records)
-- Compact set-based transport for records 41..50 of 65 (sorted verificationPriority asc,
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
  FROM jsonb_to_recordset($JSON$[{"candidateId":"east-side-adult-education","verificationPriority":3,"canonicalSlug":"east-side-adult-education","legacySlug":null,"organizationName":"East Side Adult Education","programName":null,"organizationType":"school-district","shortDescriptionEn":"Includes Independence Adult Center and Overfelt Adult Center sites.","primaryCategory":"jobs-training","urgencyLevel":"want-to-connect","audienceTags":[],"languages":[],"costModel":"unknown","eligibilityEn":null,"serviceArea":"East San Jose","phone":"(408) 928-9300","crisisPhone":null,"sms":null,"whatsapp":null,"email":null,"websiteUrl":"http://adulteducation.esuhsd.org","applicationUrl":null,"addressLine1":"625 Educational Park Drive","addressLine2":null,"addressCity":"San Jose","addressState":"CA","addressZip":"95133","addressWithheldForSafety":false,"hoursNoteEn":null,"is24Hours":false,"officialSourceUrl":"http://adulteducation.esuhsd.org","currentSourceUrl":"http://adulteducation.esuhsd.org","currentSourceType":"government","organizationConfirmedActive":true,"fieldsConfirmed":["phone","address"],"discrepanciesFromPdf":[],"addressHandling":"confirmed","verificationNotes":"Exact match to PDF — phone and address unchanged."},{"candidateId":"evergreen-valley-college","verificationPriority":3,"canonicalSlug":"evergreen-valley-college","legacySlug":null,"organizationName":"Evergreen Valley College","programName":null,"organizationType":"school-district","shortDescriptionEn":"","primaryCategory":"jobs-training","urgencyLevel":"want-to-connect","audienceTags":[],"languages":[],"costModel":"unknown","eligibilityEn":null,"serviceArea":"San Jose","phone":"408-274-7900","crisisPhone":null,"sms":null,"whatsapp":null,"email":null,"websiteUrl":"https://www.evc.edu","applicationUrl":null,"addressLine1":"3095 Yerba Buena Road","addressLine2":null,"addressCity":"San José","addressState":"CA","addressZip":"95135","addressWithheldForSafety":false,"hoursNoteEn":null,"is24Hours":false,"officialSourceUrl":"https://www.evc.edu","currentSourceUrl":"https://www.evc.edu","currentSourceType":"government","organizationConfirmedActive":true,"fieldsConfirmed":["phone","address"],"discrepanciesFromPdf":[],"addressHandling":"confirmed","verificationNotes":"Exact match to PDF — phone and address unchanged."},{"candidateId":"fremont-union-high-school-district-adult-school-fuhsd","verificationPriority":3,"canonicalSlug":"fremont-union-high-school-district-adult-school","legacySlug":"fremont-union-high-school-district-adult-school-fuhsd","organizationName":"Fremont Union High School District Adult School","programName":null,"organizationType":"school-district","shortDescriptionEn":"","primaryCategory":"jobs-training","urgencyLevel":"want-to-connect","audienceTags":[],"languages":[],"costModel":"unknown","eligibilityEn":null,"serviceArea":"Sunnyvale","phone":"408-522-2700","crisisPhone":null,"sms":null,"whatsapp":null,"email":"gilbert.seegmiller@mvla.net","websiteUrl":"https://www.fuhsdadultschool.com","applicationUrl":null,"addressLine1":"589 W. Fremont Ave.","addressLine2":null,"addressCity":"Sunnyvale","addressState":"CA","addressZip":"94087","addressWithheldForSafety":false,"hoursNoteEn":null,"is24Hours":false,"officialSourceUrl":"https://www.fuhsdadultschool.com","currentSourceUrl":"https://www.fuhsdadultschool.com","currentSourceType":"government","organizationConfirmedActive":true,"fieldsConfirmed":["phone","address"],"discrepanciesFromPdf":[],"addressHandling":"confirmed","verificationNotes":"Exact match to PDF — phone and address unchanged."},{"candidateId":"fresh-success","verificationPriority":3,"canonicalSlug":"fresh-success-gavilan-college","legacySlug":"fresh-success","organizationName":"Fresh Success (Gavilan College)","programName":null,"organizationType":"government","shortDescriptionEn":"","primaryCategory":"jobs-training","urgencyLevel":"want-to-connect","audienceTags":[],"languages":[],"costModel":"free","eligibilityEn":"Students receiving or eligible for CalFresh (SNAP)","serviceArea":"Santa Clara and San Benito County","phone":"408.852.2838","crisisPhone":null,"sms":null,"whatsapp":null,"email":null,"websiteUrl":"http://www.gavilan.edu/student/eops/calworks/freshsuccess.php","applicationUrl":null,"addressLine1":"LI 135, 5055 Santa Teresa Blvd","addressLine2":null,"addressCity":"Gilroy","addressState":"CA","addressZip":"95020","addressWithheldForSafety":false,"hoursNoteEn":null,"is24Hours":false,"officialSourceUrl":"http://www.gavilan.edu/student/eops/calworks/freshsuccess.php","currentSourceUrl":"http://www.gavilan.edu/student/eops/calworks/freshsuccess.php","currentSourceType":"government","organizationConfirmedActive":true,"fieldsConfirmed":["phone","address","eligibility","serviceArea"],"discrepanciesFromPdf":[],"addressHandling":"confirmed","verificationNotes":"Exact match to PDF — phone and address unchanged."},{"candidateId":"goodwill-of-silicon-valley","verificationPriority":3,"canonicalSlug":"goodwill-of-silicon-valley","legacySlug":null,"organizationName":"Goodwill of Silicon Valley","programName":null,"organizationType":"nonprofit","shortDescriptionEn":"","primaryCategory":"jobs-training","urgencyLevel":"want-to-connect","audienceTags":[],"languages":[],"costModel":"unknown","eligibilityEn":null,"serviceArea":"San Jose","phone":"(408) 998-5774","crisisPhone":null,"sms":null,"whatsapp":null,"email":null,"websiteUrl":"https://goodwillsv.org/","applicationUrl":null,"addressLine1":"1600 Technology Drive","addressLine2":null,"addressCity":"San Jose","addressState":"CA","addressZip":"95110","addressWithheldForSafety":false,"hoursNoteEn":null,"is24Hours":false,"officialSourceUrl":"https://goodwillsv.org/","currentSourceUrl":"https://goodwillsv.org/","currentSourceType":"official_org_site","organizationConfirmedActive":true,"fieldsConfirmed":["phone","address"],"discrepanciesFromPdf":[{"field":"phone/address","pdfValue":"408-869-9261 / 1080 N. 7th Street","currentValue":"(408) 998-5774 / 1600 Technology Drive (main Opportunity Center HQ); 1080 N. 7th St is now specifically the Recycling & Sustainability Center, a different facility"}],"addressHandling":"confirmed","verificationNotes":"PDF's number/address matched a secondary Recycling Center location, not the main Opportunity Center — corrected to the primary HQ contact."},{"candidateId":"goodwill-of-silicon-valley-school-health-clinics-wellness-center","verificationPriority":3,"canonicalSlug":"school-health-clinics-of-santa-clara-county","legacySlug":"goodwill-of-silicon-valley","organizationName":"School Health Clinics of Santa Clara County","programName":"School Health Clinics / Wellness Center","organizationType":"nonprofit","shortDescriptionEn":"","primaryCategory":"health-clinics","urgencyLevel":"i-need-help","audienceTags":[],"languages":[],"costModel":"low_cost","eligibilityEn":"Low income, medically underserved individuals","serviceArea":"Santa Clara County","phone":"408-284-2280","crisisPhone":null,"sms":null,"whatsapp":null,"email":null,"websiteUrl":"https://www.schoolhealthclinics.org","applicationUrl":null,"addressLine1":"6840 Via Del Oro, #210","addressLine2":null,"addressCity":"San José","addressState":"CA","addressZip":"95119","addressWithheldForSafety":false,"hoursNoteEn":null,"is24Hours":false,"officialSourceUrl":"https://www.schoolhealthclinics.org","currentSourceUrl":"https://www.schoolhealthclinics.org","currentSourceType":"official_org_site","organizationConfirmedActive":true,"fieldsConfirmed":["phone","address","eligibility"],"discrepanciesFromPdf":[{"field":"organizationName","pdfValue":"Goodwill of Silicon Valley (School Health Clinics / Wellness Center)","currentValue":"CORRECTION: this is 'School Health Clinics of Santa Clara County' — an entirely separate, unaffiliated nonprofit from Goodwill of Silicon Valley. This was a mapping error in the original candidate extraction."}],"addressHandling":"confirmed","verificationNotes":"MAJOR CORRECTION: confirmed directly on the official site that this organization is NOT part of Goodwill — it is an independent nonprofit ('School Health Clinics of Santa Clara County') providing primary/preventive care to ~4,500 underserved people/year across five clinics. Phone/address confirmed for this corrected identity."},{"candidateId":"integrated-psychological-assessment-services-ipas","verificationPriority":3,"canonicalSlug":"integrated-psychological-assessment-services-ipas","legacySlug":null,"organizationName":"Integrated Psychological Assessment Services (IPAS)","programName":null,"organizationType":"healthcare","shortDescriptionEn":"","primaryCategory":"mental-health-recovery","urgencyLevel":"want-to-connect","audienceTags":[],"languages":[],"costModel":"unknown","eligibilityEn":null,"serviceArea":"Gilroy","phone":"408-201-9850","crisisPhone":null,"sms":null,"whatsapp":null,"email":"admin@ipasinc.net","websiteUrl":"https://www.ipasinc.net","applicationUrl":null,"addressLine1":"8355 Church Street","addressLine2":null,"addressCity":"Gilroy","addressState":"CA","addressZip":"95020","addressWithheldForSafety":false,"hoursNoteEn":null,"is24Hours":false,"officialSourceUrl":"https://www.ipasinc.net","currentSourceUrl":"https://www.ipasinc.net","currentSourceType":"official_org_site","organizationConfirmedActive":true,"fieldsConfirmed":["address"],"discrepanciesFromPdf":[{"field":"phone","pdfValue":"408-359-6700","currentValue":"408-201-9850 (scheduling line)"}],"addressHandling":"confirmed","verificationNotes":"Address confirmed unchanged. Phone number updated. Fax (408-856-2469) confirmed but explicitly not used as a CTA. Accepts Medi-Cal."},{"candidateId":"metropolitan-education-district-metroed","verificationPriority":3,"canonicalSlug":"metropolitan-education-district-metroed","legacySlug":null,"organizationName":"Metropolitan Education District (MetroED)","programName":null,"organizationType":"school-district","shortDescriptionEn":"","primaryCategory":"jobs-training","urgencyLevel":"want-to-connect","audienceTags":[],"languages":[],"costModel":"unknown","eligibilityEn":null,"serviceArea":"Santa Clara County","phone":"(408) 723-6400","crisisPhone":null,"sms":null,"whatsapp":null,"email":null,"websiteUrl":"https://www.MetroED.net","applicationUrl":null,"addressLine1":"760 Hillsdale Avenue","addressLine2":null,"addressCity":"San Jose","addressState":"CA","addressZip":"95136","addressWithheldForSafety":false,"hoursNoteEn":"Mon-Fri 8am-4:30pm","is24Hours":false,"officialSourceUrl":"https://www.MetroED.net","currentSourceUrl":"https://www.MetroED.net","currentSourceType":"government","organizationConfirmedActive":true,"fieldsConfirmed":["phone","address","hours"],"discrepanciesFromPdf":[],"addressHandling":"confirmed","verificationNotes":"Exact match to PDF."},{"candidateId":"milpitas-adult-education","verificationPriority":3,"canonicalSlug":"milpitas-adult-education","legacySlug":null,"organizationName":"Milpitas Adult Education","programName":null,"organizationType":"school-district","shortDescriptionEn":"","primaryCategory":"jobs-training","urgencyLevel":"want-to-connect","audienceTags":[],"languages":[],"costModel":"unknown","eligibilityEn":null,"serviceArea":"Milpitas","phone":"(408) 635-2692","crisisPhone":null,"sms":null,"whatsapp":null,"email":"mae@musd.org","websiteUrl":"https://adulted.musd.org","applicationUrl":null,"addressLine1":"1331 E. Calaveras Blvd., Building B","addressLine2":null,"addressCity":"Milpitas","addressState":"CA","addressZip":"95035","addressWithheldForSafety":false,"hoursNoteEn":null,"is24Hours":false,"officialSourceUrl":"https://adulted.musd.org","currentSourceUrl":"https://adulted.musd.org","currentSourceType":"government","organizationConfirmedActive":true,"fieldsConfirmed":["phone","address"],"discrepanciesFromPdf":[],"addressHandling":"confirmed","verificationNotes":"Exact match to PDF."},{"candidateId":"mission-college-calworks-program","verificationPriority":3,"canonicalSlug":"mission-college","legacySlug":null,"organizationName":"Mission College","programName":"CalWORKs Program","organizationType":"school-district","shortDescriptionEn":"","primaryCategory":"jobs-training","urgencyLevel":"want-to-connect","audienceTags":[],"languages":[],"costModel":"unknown","eligibilityEn":null,"serviceArea":"Santa Clara","phone":"(408) 855-5228","crisisPhone":null,"sms":null,"whatsapp":null,"email":null,"websiteUrl":"https://missioncollege.edu/student_services/calworks","applicationUrl":null,"addressLine1":"3000 Mission College Blvd, Student Engagement Center Office 148","addressLine2":null,"addressCity":"Santa Clara","addressState":"CA","addressZip":"95054","addressWithheldForSafety":false,"hoursNoteEn":null,"is24Hours":false,"officialSourceUrl":"https://missioncollege.edu/student_services/calworks","currentSourceUrl":"https://missioncollege.edu/student_services/calworks","currentSourceType":"government","organizationConfirmedActive":true,"fieldsConfirmed":["phone","address"],"discrepanciesFromPdf":[],"addressHandling":"confirmed","verificationNotes":"Exact match to PDF."}]$JSON$::jsonb)
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
