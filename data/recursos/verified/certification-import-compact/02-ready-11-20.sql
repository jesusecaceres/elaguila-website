-- Recursos Build 03C-COMPACT — Certification import batch 2/7 (10 records)
-- Compact set-based transport for records 11..20 of 65 (sorted verificationPriority asc,
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
  FROM jsonb_to_recordset($JSON$[{"candidateId":"bay-area-legal-aid","verificationPriority":2,"canonicalSlug":"bay-area-legal-aid","legacySlug":null,"organizationName":"Bay Area Legal Aid","programName":null,"organizationType":"nonprofit","shortDescriptionEn":"","primaryCategory":"legal-immigration","urgencyLevel":"i-need-help","audienceTags":[],"languages":["English","Arabic","Chinese (Simplified)","Korean","Russian","Spanish","Tagalog","Vietnamese"],"costModel":"free","eligibilityEn":"Free civil legal help to low-income people, regardless of location, language, or disability","serviceArea":"Alameda, Contra Costa, Marin, Napa, San Francisco, San Mateo, and Santa Clara counties","phone":"800-551-5554","crisisPhone":null,"sms":null,"whatsapp":null,"email":null,"websiteUrl":"https://baylegal.org","applicationUrl":null,"addressLine1":"1735 Telegraph Avenue","addressLine2":null,"addressCity":"Oakland","addressState":"CA","addressZip":"94612","addressWithheldForSafety":false,"hoursNoteEn":null,"is24Hours":false,"officialSourceUrl":"https://baylegal.org","currentSourceUrl":"https://baylegal.org","currentSourceType":"official_org_site","organizationConfirmedActive":true,"fieldsConfirmed":["websiteUrl","address","serviceArea","languages","eligibility","costModel"],"discrepanciesFromPdf":[{"field":"phone","pdfValue":"408-283-3700","currentValue":"800-551-5554 (Legal Advice Line — universal number)"}],"addressHandling":"confirmed","verificationNotes":"PDF's local San Jose number could not be reconfirmed on the current official site; using the confirmed universal Legal Advice Line instead."},{"candidateId":"bill-wilson-center-the-hub","verificationPriority":2,"canonicalSlug":"bill-wilson-center","legacySlug":null,"organizationName":"Bill Wilson Center","programName":"The HUB","organizationType":"nonprofit","shortDescriptionEn":"","primaryCategory":"youth-education","urgencyLevel":"i-need-help","audienceTags":["youth"],"languages":[],"costModel":"free","eligibilityEn":"Current or former foster youth ages 15-24","serviceArea":"Santa Clara County","phone":"(408) 792-1750","crisisPhone":null,"sms":null,"whatsapp":null,"email":null,"websiteUrl":"https://www.billwilsoncenter.org/services/all/bwc-hub.html","applicationUrl":null,"addressLine1":"1510 Parkmoor Ave, Ste 101","addressLine2":null,"addressCity":"San Jose","addressState":"CA","addressZip":"95126","addressWithheldForSafety":false,"hoursNoteEn":null,"is24Hours":false,"officialSourceUrl":"https://www.billwilsoncenter.org/services/all/bwc-hub.html","currentSourceUrl":"https://www.billwilsoncenter.org/services/all/bwc-hub.html","currentSourceType":"official_org_site","organizationConfirmedActive":true,"fieldsConfirmed":["phone","address","eligibility"],"discrepanciesFromPdf":[{"field":"address","pdfValue":"591 N. King Rd, Ste 1, San Jose, CA 95133","currentValue":"1510 Parkmoor Ave, Ste 101, San Jose, CA 95126 (relocated)"}],"addressHandling":"confirmed","verificationNotes":"Phone confirmed unchanged. The HUB has relocated since 2023."},{"candidateId":"calworks-child-care-services","verificationPriority":2,"canonicalSlug":"santa-clara-county-office-of-education-childcare-resource-referral","legacySlug":"calworks-child-care-services","organizationName":"Santa Clara County Office of Education — Childcare Resource & Referral","programName":"CalWORKs Child Care Services","organizationType":"government","shortDescriptionEn":"CalWORKs has contracted with the Santa Clara County Office of Education (SCCOE) to provide child care referrals and help find a child care provider.","primaryCategory":"babies-kids-parents","urgencyLevel":"i-need-help","audienceTags":[],"languages":[],"costModel":"free","eligibilityEn":null,"serviceArea":"Santa Clara County","phone":"(669) 212-5437","crisisPhone":null,"sms":null,"whatsapp":null,"email":"childcarescc@sccoe.org","websiteUrl":"https://www.childcarescc.org/child-care-application","applicationUrl":"https://www.childcarescc.org/child-care-application","addressLine1":"1290 Ridder Park Dr. MC 261","addressLine2":null,"addressCity":"San Jose","addressState":"CA","addressZip":"95131","addressWithheldForSafety":false,"hoursNoteEn":"Monday - Friday 8:00 AM - 5:00 PM","is24Hours":false,"officialSourceUrl":"https://www.childcarescc.org/child-care-application","currentSourceUrl":"https://www.childcarescc.org/child-care-application","currentSourceType":"government","organizationConfirmedActive":true,"fieldsConfirmed":["phone","address","hours","websiteUrl"],"discrepanciesFromPdf":[],"addressHandling":"confirmed","verificationNotes":"Exact match to PDF — phone, address, and email all confirmed unchanged."},{"candidateId":"court-appointed-special-advocates-casa-of-silicon-valley","verificationPriority":2,"canonicalSlug":"child-advocates-of-silicon-valley","legacySlug":"court-appointed-special-advocates-casa-of-silicon-valley","organizationName":"Child Advocates of Silicon Valley","programName":"CASA (Court Appointed Special Advocates)","organizationType":"nonprofit","shortDescriptionEn":"","primaryCategory":"babies-kids-parents","urgencyLevel":"i-need-help","audienceTags":["youth"],"languages":[],"costModel":"free","eligibilityEn":"Volunteers: info session, interview, background check, 30hr training","serviceArea":"Santa Clara County","phone":"(408) 416-0400","crisisPhone":null,"sms":null,"whatsapp":null,"email":null,"websiteUrl":"https://childadvocatessv.org/casa/","applicationUrl":null,"addressLine1":"1800 Hamilton Ave, Suite #200","addressLine2":null,"addressCity":"San Jose","addressState":"CA","addressZip":"95125","addressWithheldForSafety":false,"hoursNoteEn":null,"is24Hours":false,"officialSourceUrl":"https://childadvocatessv.org/casa/","currentSourceUrl":"https://childadvocatessv.org/casa/","currentSourceType":"official_org_site","organizationConfirmedActive":true,"fieldsConfirmed":["phone","address","eligibility"],"discrepanciesFromPdf":[{"field":"organizationName","pdfValue":"Court Appointed Special Advocates (CASA of Silicon Valley)","currentValue":"Child Advocates of Silicon Valley (CASA is now a program under this renamed org)"},{"field":"websiteUrl","pdfValue":"https://www.bemyadvocate.org","currentValue":"https://childadvocatessv.org/casa/ (old domain now 301-redirects to an unrelated third-party site)"},{"field":"address","pdfValue":"509 Valley Way, Bldg 2, Milpitas, CA 95035","currentValue":"1800 Hamilton Ave, Suite #200, San Jose, CA 95125"}],"addressHandling":"confirmed","verificationNotes":"CRITICAL: organization renamed and old domain now redirects to an unrelated skate-park site. Phone unchanged. Relocated from Milpitas to San Jose."},{"candidateId":"first-5-santa-clara-county","verificationPriority":2,"canonicalSlug":"first-5-santa-clara-county","legacySlug":null,"organizationName":"First 5 Santa Clara County","programName":null,"organizationType":"government","shortDescriptionEn":"","primaryCategory":"babies-kids-parents","urgencyLevel":"i-need-help","audienceTags":[],"languages":[],"costModel":"unknown","eligibilityEn":null,"serviceArea":"Santa Clara County","phone":"(408) 260-3700","crisisPhone":null,"sms":null,"whatsapp":null,"email":"info@first5kids.org","websiteUrl":"https://www.first5kids.org","applicationUrl":null,"addressLine1":"4000 Moorpark Ave #200","addressLine2":null,"addressCity":"San Jose","addressState":"CA","addressZip":"95117","addressWithheldForSafety":false,"hoursNoteEn":null,"is24Hours":false,"officialSourceUrl":"https://www.first5kids.org","currentSourceUrl":"https://www.first5kids.org","currentSourceType":"official_org_site","organizationConfirmedActive":true,"fieldsConfirmed":["phone","address","websiteUrl"],"discrepanciesFromPdf":[],"addressHandling":"confirmed","verificationNotes":"Exact match to PDF — phone and address unchanged."},{"candidateId":"go-kids-inc-estrella-family-services","verificationPriority":2,"canonicalSlug":"go-kids-inc","legacySlug":null,"organizationName":"Go Kids, Inc.","programName":"Estrella Family Services","organizationType":"nonprofit","shortDescriptionEn":"","primaryCategory":"babies-kids-parents","urgencyLevel":"i-need-help","audienceTags":[],"languages":[],"costModel":"unknown","eligibilityEn":null,"serviceArea":"Santa Clara, Santa Cruz, San Benito, and Monterey counties","phone":"(408) 843-9000","crisisPhone":null,"sms":null,"whatsapp":null,"email":null,"websiteUrl":"https://www.gokids.org","applicationUrl":null,"addressLine1":"885 Moro Drive","addressLine2":null,"addressCity":"Gilroy","addressState":"CA","addressZip":"95023","addressWithheldForSafety":false,"hoursNoteEn":null,"is24Hours":false,"officialSourceUrl":"https://www.gokids.org","currentSourceUrl":"https://www.gokids.org","currentSourceType":"official_org_site","organizationConfirmedActive":true,"fieldsConfirmed":["phone","address","serviceArea"],"discrepanciesFromPdf":[{"field":"address","pdfValue":"885 Moro Drive, Gilroy, CA 95020","currentValue":"885 Moro Drive, Gilroy, CA 95023 (zip corrected)"},{"field":"serviceArea","pdfValue":"(not specified)","currentValue":"Santa Clara, Santa Cruz, San Benito, and Monterey counties"}],"addressHandling":"confirmed","verificationNotes":"Phone confirmed unchanged; zip code corrected."},{"candidateId":"healthier-kids-foundation","verificationPriority":2,"canonicalSlug":"healthier-kids-foundation","legacySlug":null,"organizationName":"Healthier Kids Foundation","programName":null,"organizationType":"nonprofit","shortDescriptionEn":"","primaryCategory":"babies-kids-parents","urgencyLevel":"i-need-help","audienceTags":[],"languages":[],"costModel":"unknown","eligibilityEn":null,"serviceArea":"Silicon Valley","phone":"(408) 564-5114","crisisPhone":null,"sms":null,"whatsapp":null,"email":null,"websiteUrl":"https://www.hkidsf.org","applicationUrl":null,"addressLine1":"Sobrato Center for Nonprofits, 1400 Parkmoor Avenue, Suite 210","addressLine2":null,"addressCity":"San Jose","addressState":"CA","addressZip":"95126","addressWithheldForSafety":false,"hoursNoteEn":null,"is24Hours":false,"officialSourceUrl":"https://www.hkidsf.org","currentSourceUrl":"https://www.hkidsf.org","currentSourceType":"official_org_site","organizationConfirmedActive":true,"fieldsConfirmed":["phone","address"],"discrepanciesFromPdf":[{"field":"address","pdfValue":"4040 Moorpark Ave, Ste. 100, San Jose, CA 95117","currentValue":"1400 Parkmoor Avenue, Suite 210, San Jose, CA 95126 (different street — relocated)"}],"addressHandling":"confirmed","verificationNotes":"Phone confirmed unchanged. Address has materially changed since 2023."},{"candidateId":"inclusion-support-warmline","verificationPriority":2,"canonicalSlug":"innovations-collaborative-santa-clara-county-office-of-education","legacySlug":"inclusion-support-warmline","organizationName":"Innovations Collaborative (Santa Clara County Office of Education)","programName":"Warmline","organizationType":"government","shortDescriptionEn":"","primaryCategory":"babies-kids-parents","urgencyLevel":"i-need-help","audienceTags":[],"languages":["English","Spanish","Vietnamese","additional languages upon request"],"costModel":"free","eligibilityEn":"Parents, teachers, and community members working with children who have disabilities and other needs","serviceArea":"Santa Clara County","phone":"(408) 453-6651","crisisPhone":null,"sms":null,"whatsapp":null,"email":"inclusion@sccoe.org","websiteUrl":"https://www.innovationscollaborative.org/warmline.aspx","applicationUrl":null,"addressLine1":"1290 Ridder Park Drive, MC 227","addressLine2":null,"addressCity":"San Jose","addressState":"CA","addressZip":"95131","addressWithheldForSafety":false,"hoursNoteEn":null,"is24Hours":false,"officialSourceUrl":"https://www.innovationscollaborative.org/warmline.aspx","currentSourceUrl":"https://www.innovationscollaborative.org/warmline.aspx","currentSourceType":"official_org_site","organizationConfirmedActive":true,"fieldsConfirmed":["phone","languages","eligibility","costModel"],"discrepanciesFromPdf":[{"field":"organizationName","pdfValue":"Inclusion Collaborative","currentValue":"Renamed to Innovations Collaborative (same SCCOE program)"},{"field":"email","pdfValue":"inclusion@sccoe.org","currentValue":"warmline@sccoe.org"}],"addressHandling":"confirmed","verificationNotes":"Phone confirmed identical to PDF via the specific /warmline.aspx page."},{"candidateId":"international-rescue-committee","verificationPriority":2,"canonicalSlug":"international-rescue-committee","legacySlug":null,"organizationName":"International Rescue Committee","programName":"San Jose Office","organizationType":"nonprofit","shortDescriptionEn":"","primaryCategory":"legal-immigration","urgencyLevel":"i-need-help","audienceTags":[],"languages":[],"costModel":"unknown","eligibilityEn":"Refugees, asylees, trafficking victims, and immigrants","serviceArea":"San Jose area","phone":"(408) 277-0255","crisisPhone":null,"sms":null,"whatsapp":null,"email":null,"websiteUrl":"https://www.rescue.org/SanJose","applicationUrl":null,"addressLine1":"1210 South Bascom Ave., Suite 227","addressLine2":null,"addressCity":"San Jose","addressState":"CA","addressZip":"95128","addressWithheldForSafety":false,"hoursNoteEn":null,"is24Hours":false,"officialSourceUrl":"https://www.rescue.org/SanJose","currentSourceUrl":"https://www.rescue.org/SanJose","currentSourceType":"official_org_site","organizationConfirmedActive":true,"fieldsConfirmed":["phone","address","eligibility"],"discrepanciesFromPdf":[],"addressHandling":"confirmed","verificationNotes":"Exact match to PDF — phone and address unchanged."},{"candidateId":"katharine-and-george-alexander-community-law-center","verificationPriority":2,"canonicalSlug":"katharine-george-alexander-community-law-center","legacySlug":"katharine-and-george-alexander-community-law-center","organizationName":"Katharine & George Alexander Community Law Center","programName":null,"organizationType":"nonprofit","shortDescriptionEn":"","primaryCategory":"legal-immigration","urgencyLevel":"i-need-help","audienceTags":[],"languages":[],"costModel":"free","eligibilityEn":"Individuals and communities in need — Consumer Law, Immigration, Workers' Rights, Unhoused Advocacy","serviceArea":"Santa Clara County","phone":"(408) 288-7030","crisisPhone":null,"sms":null,"whatsapp":null,"email":null,"websiteUrl":"https://law.scu.edu/centers/kgaclc/","applicationUrl":null,"addressLine1":"1030 The Alameda","addressLine2":null,"addressCity":"San Jose","addressState":"CA","addressZip":"95126","addressWithheldForSafety":false,"hoursNoteEn":null,"is24Hours":false,"officialSourceUrl":"https://law.scu.edu/centers/kgaclc/","currentSourceUrl":"https://law.scu.edu/centers/kgaclc/","currentSourceType":"official_org_site","organizationConfirmedActive":true,"fieldsConfirmed":["phone","address","eligibility","costModel"],"discrepanciesFromPdf":[{"field":"websiteUrl","pdfValue":"http://law.scu.edu/kgaclc","currentValue":"https://law.scu.edu/centers/kgaclc/ (URL path changed)"}],"addressHandling":"confirmed","verificationNotes":"Phone and address confirmed unchanged."}]$JSON$::jsonb)
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
