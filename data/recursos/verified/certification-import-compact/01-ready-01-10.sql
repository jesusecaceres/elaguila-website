-- Recursos Build 03C-COMPACT — Certification import batch 1/7 (10 records)
-- Compact set-based transport for records 1..10 of 65 (sorted verificationPriority asc,
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
  FROM jsonb_to_recordset($JSON$[{"candidateId":"2-1-1-bay-area","verificationPriority":1,"canonicalSlug":"211-bay-area","legacySlug":"2-1-1-bay-area","organizationName":"211 Bay Area","programName":"Program of United Way Bay Area","organizationType":"hotline","shortDescriptionEn":"Free, confidential referral and information helpline connecting people to health and human services. English, Spanish, Vietnamese, and 140+ other languages.","primaryCategory":"community-support","urgencyLevel":"help-now","audienceTags":[],"languages":["English","Spanish","150 languages via phone interpretation"],"costModel":"free","eligibilityEn":null,"serviceArea":"Santa Clara County and Bay Area","phone":"211","crisisPhone":"800-273-6222","sms":"Text your ZIP code to 898211","whatsapp":null,"email":null,"websiteUrl":"https://211bayarea.org/contact/","applicationUrl":null,"addressLine1":null,"addressLine2":null,"addressCity":null,"addressState":null,"addressZip":null,"addressWithheldForSafety":false,"hoursNoteEn":"24 hours a day, 7 days a week","is24Hours":true,"officialSourceUrl":"https://211bayarea.org/contact/","currentSourceUrl":"https://211bayarea.org/contact/","currentSourceType":"official_org_site","organizationConfirmedActive":true,"fieldsConfirmed":["phone","crisisPhone","languages","is24Hours"],"discrepanciesFromPdf":[{"field":"languages","pdfValue":"English, Spanish, Vietnamese, and 140 other languages","currentValue":"150 languages (phone interpretation)"},{"field":"sms","pdfValue":"(not present in PDF)","currentValue":"Text ZIP code to 898211 (English and Spanish only)"}],"addressHandling":"not_applicable","verificationNotes":"Dial 211 confirmed; alternate 800-273-6222 confirmed current on official Contact page (matches PDF). Text service confirmed: ZIP to 898211. Confirmed 24/7. EXPLICITLY DID NOT use an alternate legacy hotline number found in some outdated third-party directories — unsupported by the current official Contact page, excluded from evidence."},{"candidateId":"asian-americans-for-community-involvement-aaci-aaci-asian-women-s-home","verificationPriority":1,"canonicalSlug":"asian-americans-for-community-involvement-aaci","legacySlug":null,"organizationName":"Asian Americans for Community Involvement (AACI)","programName":"Asian Women's Home","organizationType":"nonprofit","shortDescriptionEn":"AACI's Asian Women's Home program. San Jose Family Justice Center at Story Rd. open Thursdays for free walk-in legal consultations for survivors of domestic violence.","primaryCategory":"urgent-safety","urgencyLevel":"help-now","audienceTags":[],"languages":["English","Spanish","Arabic","Armenian","Chinese","Filipino","Hindi","Hmong","Japanese","Khmer","Korean","Lao","Myanmar","Punjabi","Russian","Thai","Vietnamese","and other languages (40+ total)"],"costModel":"free","eligibilityEn":"Serves everyone regardless of race, ethnicity, religion, immigration status, socioeconomic background, or sexual orientation","serviceArea":"Santa Clara County","phone":"(408) 975-2730","crisisPhone":"(408) 975-2739","sms":null,"whatsapp":null,"email":null,"websiteUrl":"https://aaci.org/wellness/womens-home/","applicationUrl":null,"addressLine1":"2400 Moorpark Ave. Suite 300","addressLine2":null,"addressCity":"San Jose","addressState":"CA","addressZip":"95128","addressWithheldForSafety":false,"hoursNoteEn":"24-hour crisis hotline","is24Hours":true,"officialSourceUrl":"https://aaci.org/wellness/womens-home/","currentSourceUrl":"https://aaci.org/wellness/womens-home/","currentSourceType":"official_org_site","organizationConfirmedActive":true,"fieldsConfirmed":["crisisPhone","phone","websiteUrl","address","is24Hours","languages","eligibility"],"discrepanciesFromPdf":[{"field":"address","pdfValue":"749 Story Rd, Ste. 50, San Jose CA 95122 (Family Justice Center)","currentValue":"Family Justice Center relocated to 150 E. San Fernando St, Room 324, San Jose, CA 95112; corporate office 2400 Moorpark Ave. Suite 300"}],"addressHandling":"withheld_for_safety","verificationNotes":"24-hr crisis hotline (408) 975-2739 confirmed identical to PDF. Shelter address explicitly confidential — never publish. Family Justice Center location moved since 2023. Corporate office address is safe public info."},{"candidateId":"community-solutions-human-trafficking","verificationPriority":1,"canonicalSlug":"community-solutions","legacySlug":"community-solutions-human-trafficking","organizationName":"Community Solutions","programName":"Human Trafficking / Sexual Assault / Domestic Violence Crisis Line","organizationType":"nonprofit","shortDescriptionEn":"","primaryCategory":"urgent-safety","urgencyLevel":"help-now","audienceTags":[],"languages":[],"costModel":"free","eligibilityEn":null,"serviceArea":"Santa Clara County and San Benito County","phone":null,"crisisPhone":"1-877-363-7238","sms":null,"whatsapp":null,"email":null,"websiteUrl":"https://communitysolutions.org/","applicationUrl":null,"addressLine1":null,"addressLine2":null,"addressCity":null,"addressState":null,"addressZip":null,"addressWithheldForSafety":false,"hoursNoteEn":"24-Hour Crisis Line","is24Hours":true,"officialSourceUrl":"https://communitysolutions.org/","currentSourceUrl":"https://communitysolutions.org/","currentSourceType":"official_org_site","organizationConfirmedActive":true,"fieldsConfirmed":["crisisPhone","websiteUrl","is24Hours","serviceArea"],"discrepanciesFromPdf":[{"field":"serviceArea","pdfValue":"(not specified)","currentValue":"Santa Clara County and San Benito County"}],"addressHandling":"not_applicable","verificationNotes":"24-Hour Crisis Line 1.877.END.SADV (1.877.363.7238) confirmed — same number as PDF's '1-877-END-SADV', different formatting only. Physical address not reconfirmed this pass — omitted."},{"candidateId":"crisis-text-line","verificationPriority":1,"canonicalSlug":"crisis-text-line","legacySlug":null,"organizationName":"Crisis Text Line","programName":null,"organizationType":"hotline","shortDescriptionEn":"Text-based crisis support line.","primaryCategory":"urgent-safety","urgencyLevel":"help-now","audienceTags":[],"languages":["English","Spanish"],"costModel":"free","eligibilityEn":null,"serviceArea":"United States (incl. Puerto Rico)","phone":null,"crisisPhone":null,"sms":"Text HOME to 741741 (Text HOLA to 741741 en español)","whatsapp":null,"email":null,"websiteUrl":"https://www.crisistextline.org/","applicationUrl":null,"addressLine1":null,"addressLine2":null,"addressCity":null,"addressState":null,"addressZip":null,"addressWithheldForSafety":false,"hoursNoteEn":"24/7 confidential crisis support","is24Hours":true,"officialSourceUrl":"https://www.crisistextline.org/","currentSourceUrl":"https://www.crisistextline.org/","currentSourceType":"official_org_site","organizationConfirmedActive":true,"fieldsConfirmed":["sms","websiteUrl","is24Hours","languages"],"discrepanciesFromPdf":[{"field":"sms","pdfValue":"Text BAY to 741741","currentValue":"Text HOME to 741741 (regional keyword \"BAY\" deprecated in favor of universal \"HOME\"; \"HOLA\" for Spanish)"}],"addressHandling":"not_applicable","verificationNotes":"CRITICAL CORRECTION: the PDF's regional keyword 'BAY' is no longer current — official site confirms the keyword is now 'HOME'. Explicitly confirmed 24/7. Safety-critical: the old keyword may not route correctly."},{"candidateId":"maitri","verificationPriority":1,"canonicalSlug":"maitri","legacySlug":null,"organizationName":"Maitri","programName":null,"organizationType":"nonprofit","shortDescriptionEn":"","primaryCategory":"urgent-safety","urgencyLevel":"help-now","audienceTags":[],"languages":["English","Hindi","Punjabi","Gujarati","Bengali","Telugu","Tamil","Urdu","and other South Asian languages"],"costModel":"free","eligibilityEn":null,"serviceArea":"San Francisco Bay Area (South Asian community)","phone":null,"crisisPhone":"1-888-862-4874","sms":null,"whatsapp":null,"email":"maitri@maitri.org","websiteUrl":"https://maitri.org/","applicationUrl":null,"addressLine1":null,"addressLine2":null,"addressCity":null,"addressState":null,"addressZip":null,"addressWithheldForSafety":false,"hoursNoteEn":null,"is24Hours":false,"officialSourceUrl":"https://maitri.org/","currentSourceUrl":"https://maitri.org/","currentSourceType":"official_org_site","organizationConfirmedActive":true,"fieldsConfirmed":["crisisPhone","websiteUrl","languages"],"discrepanciesFromPdf":[],"addressHandling":"not_applicable","verificationNotes":"Helpline 1-888-862-4874 confirmed identical to PDF. No 24/7 claim found on official site — consistent with PDF; is24Hours correctly stays false. PO Box from PDF not carried forward as a contact point."},{"candidateId":"next-door-solutions","verificationPriority":1,"canonicalSlug":"next-door-solutions-to-domestic-violence","legacySlug":"next-door-solutions","organizationName":"Next Door Solutions to Domestic Violence","programName":null,"organizationType":"nonprofit","shortDescriptionEn":"","primaryCategory":"urgent-safety","urgencyLevel":"help-now","audienceTags":[],"languages":[],"costModel":"free","eligibilityEn":null,"serviceArea":"Santa Clara County","phone":"(408) 501-7550","crisisPhone":"(408) 279-2962","sms":null,"whatsapp":null,"email":null,"websiteUrl":"https://www.nextdoorsolutions.org/","applicationUrl":null,"addressLine1":"234 E. Gish Road","addressLine2":"Suite 200","addressCity":"San Jose","addressState":"CA","addressZip":"95112","addressWithheldForSafety":false,"hoursNoteEn":"24/7 hotline","is24Hours":true,"officialSourceUrl":"https://www.nextdoorsolutions.org/","currentSourceUrl":"https://www.nextdoorsolutions.org/","currentSourceType":"official_org_site","organizationConfirmedActive":true,"fieldsConfirmed":["crisisPhone","phone","websiteUrl","address","is24Hours"],"discrepanciesFromPdf":[{"field":"websiteUrl","pdfValue":"https://www.nextdoor.org","currentValue":"https://www.nextdoorsolutions.org/"},{"field":"address","pdfValue":"234 E Gish Road, San Jose, CA 95112","currentValue":"234 E. Gish Road, Suite 200, San Jose, CA 95112"}],"addressHandling":"confirmed","verificationNotes":"CRITICAL CORRECTION: 2023 candidate website (nextdoor.org) was wrong — that domain belongs to the unrelated 'Nextdoor' neighborhood app. Official domain is nextdoorsolutions.org. 24/7 hotline confirmed unchanged. 234 E. Gish Road, Suite 200 is the community office (not a confidential shelter location) — safe to publish."},{"candidateId":"santa-clara-county-behavioral-health-services","verificationPriority":1,"canonicalSlug":"santa-clara-county-behavioral-health-services","legacySlug":null,"organizationName":"Santa Clara County Behavioral Health Services","programName":null,"organizationType":"government","shortDescriptionEn":"County behavioral health services including the Esperanza and Zephyr Self-Help Centers.","primaryCategory":"mental-health-recovery","urgencyLevel":"help-now","audienceTags":[],"languages":[],"costModel":"free","eligibilityEn":null,"serviceArea":"Santa Clara County","phone":"(800) 704-0900","crisisPhone":"988","sms":null,"whatsapp":null,"email":null,"websiteUrl":"https://bhsd.santaclaracounty.gov/get-help-now","applicationUrl":null,"addressLine1":null,"addressLine2":null,"addressCity":null,"addressState":null,"addressZip":null,"addressWithheldForSafety":false,"hoursNoteEn":"24/7 including holidays","is24Hours":true,"officialSourceUrl":"https://bhsd.santaclaracounty.gov/get-help-now","currentSourceUrl":"https://bhsd.santaclaracounty.gov/get-help-now","currentSourceType":"government","organizationConfirmedActive":true,"fieldsConfirmed":["phone","crisisPhone","websiteUrl","is24Hours"],"discrepanciesFromPdf":[{"field":"websiteUrl","pdfValue":"https://www.sccgov.org/sites/bhd/Pages/home.aspx","currentValue":"https://bhsd.santaclaracounty.gov/get-help-now"},{"field":"crisisPhone","pdfValue":"988","currentValue":"988 (local 408/650/669) or (800) 704-0900 (outside-County) — both reach the Behavioral Health Call Center"}],"addressHandling":"not_applicable","verificationNotes":"Behavioral Health Call Center confirmed 24/7 including holidays via direct fetch. Local (408/650/669) callers dial 988; outside-County callers use (800) 704-0900. Official site migrated from sccgov.org to bhsd.santaclaracounty.gov."},{"candidateId":"santa-clara-county-department-of-family-and-children-s-services-dfcs-child-abuse","verificationPriority":1,"canonicalSlug":"santa-clara-county-department-of-family-and-children-s-services-dfcs","legacySlug":null,"organizationName":"Santa Clara County Department of Family and Children's Services (DFCS)","programName":"Child Abuse & Neglect Call Center","organizationType":"government","shortDescriptionEn":"The Department of Family and Children's Services mission is to protect children from abuse and neglect, promote healthy growth, and strengthen families. Reports of abuse go to the Child Abuse & Neglect Call Center.","primaryCategory":"urgent-safety","urgencyLevel":"help-now","audienceTags":[],"languages":[],"costModel":"free","eligibilityEn":null,"serviceArea":"Santa Clara County","phone":null,"crisisPhone":"(833) 722-5437","sms":null,"whatsapp":null,"email":null,"websiteUrl":"https://ssa.santaclaracounty.gov/protective-services/report-child-abuse-and-neglect","applicationUrl":null,"addressLine1":null,"addressLine2":null,"addressCity":null,"addressState":null,"addressZip":null,"addressWithheldForSafety":false,"hoursNoteEn":"24 hours a day, 7 days a week, 365 days a year","is24Hours":true,"officialSourceUrl":"https://ssa.santaclaracounty.gov/protective-services/report-child-abuse-and-neglect","currentSourceUrl":"https://ssa.santaclaracounty.gov/protective-services/report-child-abuse-and-neglect","currentSourceType":"government","organizationConfirmedActive":true,"fieldsConfirmed":["crisisPhone","hoursNoteEn","is24Hours"],"discrepanciesFromPdf":[{"field":"websiteUrl","pdfValue":"https://socialservices.sccgov.org/about-us/department-family-and-childrens-services","currentValue":"https://ssa.santaclaracounty.gov/protective-services/report-child-abuse-and-neglect"}],"addressHandling":"not_applicable","verificationNotes":"Hotline (833) 722-5437 / (833) SCC-KIDS confirmed identical to PDF. Confirmed 24/7/365. Official URL migrated to ssa.santaclaracounty.gov. Current source states: if life is in immediate danger, call 911 — reference only, not a CTA field."},{"candidateId":"santa-clara-county-emergency-psychiatric-services-eps","verificationPriority":1,"canonicalSlug":"santa-clara-county-emergency-psychiatric-services-eps","legacySlug":null,"organizationName":"Santa Clara County Emergency Psychiatric Services (EPS)","programName":null,"organizationType":"government","shortDescriptionEn":"County emergency psychiatric services for mental health crises.","primaryCategory":"urgent-safety","urgencyLevel":"help-now","audienceTags":[],"languages":[],"costModel":"unknown","eligibilityEn":null,"serviceArea":"Santa Clara County","phone":null,"crisisPhone":"(408) 885-6100","sms":null,"whatsapp":null,"email":null,"websiteUrl":"https://bhsd.santaclaracounty.gov/emergency-psychiatric-services-eps","applicationUrl":null,"addressLine1":"871 Enborg Lane","addressLine2":null,"addressCity":"San Jose","addressState":"CA","addressZip":"95128","addressWithheldForSafety":false,"hoursNoteEn":"24 hours, 7 days a week","is24Hours":true,"officialSourceUrl":"https://bhsd.santaclaracounty.gov/emergency-psychiatric-services-eps","currentSourceUrl":"https://bhsd.santaclaracounty.gov/emergency-psychiatric-services-eps","currentSourceType":"government","organizationConfirmedActive":true,"fieldsConfirmed":["phone","address","hoursNoteEn","is24Hours"],"discrepanciesFromPdf":[{"field":"websiteUrl","pdfValue":"https://www.sccgov.org/sites/bhd/Services/Emergency/EmergencyPsychiatricServices/","currentValue":"https://bhsd.santaclaracounty.gov/emergency-psychiatric-services-eps"}],"addressHandling":"confirmed","verificationNotes":"Phone (408) 885-6100 and address 871 Enborg Lane confirmed identical to PDF. Open 24/7 confirmed explicit. Fax (408) 885-6117 exists but is NOT a public CTA. Official URL migrated to bhsd.santaclaracounty.gov."},{"candidateId":"ywca-golden-gate-silicon-valley-support-services-department","verificationPriority":1,"canonicalSlug":"ywca-golden-gate-silicon-valley","legacySlug":null,"organizationName":"YWCA Golden Gate Silicon Valley","programName":"Support Services Department","organizationType":"nonprofit","shortDescriptionEn":"","primaryCategory":"urgent-safety","urgencyLevel":"help-now","audienceTags":[],"languages":["English","bilingual support"],"costModel":"unknown","eligibilityEn":null,"serviceArea":"Bay Area","phone":null,"crisisPhone":"(800) 572-2782","sms":null,"whatsapp":null,"email":null,"websiteUrl":"https://yourywca.org/","applicationUrl":null,"addressLine1":"375 S. Third St.","addressLine2":null,"addressCity":"San Jose","addressState":"CA","addressZip":"95112","addressWithheldForSafety":false,"hoursNoteEn":"24-hour bilingual support line","is24Hours":true,"officialSourceUrl":"https://yourywca.org/","currentSourceUrl":"https://yourywca.org/","currentSourceType":"official_org_site","organizationConfirmedActive":true,"fieldsConfirmed":["crisisPhone","websiteUrl","address","is24Hours"],"discrepanciesFromPdf":[],"addressHandling":"confirmed","verificationNotes":"24-HOUR BILINGUAL SUPPORT LINE (800) 572-2782 confirmed identical to PDF, explicitly covers Sexual Assault, Domestic Violence, and Human Trafficking. Address confirmed matching PDF."}]$JSON$::jsonb)
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
