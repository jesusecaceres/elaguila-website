/*
 * Recursos — 19-resource canonical gap batch (2026-08-25)
 * Source: scripts/recursos/seed-verified-resources.ts (same 19 records, same values, no changes)
 *
 * Idempotent: ON CONFLICT (slug) DO NOTHING — if a row with that slug already exists (e.g. this
 * file is run twice, or a human already created one via the admin UI), it is left untouched.
 * Re-running this file is always safe. No DELETE / TRUNCATE / DROP / ALTER.
 *
 * All 19 rows: verification_status = 'needs_review' (never 'verified' — no human field
 * verification has happened), spanish_status left at its column default ('not_available'),
 * last_verified_at = NULL, short_description_es = '' (no fabricated Spanish translation),
 * print_eligible = false. created_by/updated_by = 'ai-triage-2026-08-25' so this batch is easy
 * to find and distinguish from other sources.
 */

BEGIN;

/* 1/19 — Here4You (Bill Wilson Center) — housing-rent */
INSERT INTO public.community_resources (
  slug, organization_name, program_name, organization_type,
  short_description_es, short_description_en,
  primary_category, urgency_level, cost_model, service_area,
  phone, website_url, hours_note_en, is_24_hours,
  official_source_url, verification_status, active,
  partner_status, featured, print_eligible, internal_notes,
  created_by, updated_by
) VALUES (
  'here4you', 'Here4You (Bill Wilson Center)', 'Shelter Hotline', 'nonprofit',
  '', 'Santa Clara County''s shelter-placement hotline - call to be connected with available emergency shelter and temporary housing.',
  'housing-rent', 'help-now', 'free', 'Santa Clara County',
  '(408) 385-2400', 'https://www.billwilsoncenter.org/services/all/here4you.html', '9:00 AM - 7:00 PM daily', false,
  'https://www.billwilsoncenter.org/services/all/here4you.html', 'needs_review', true,
  'none', false, false,
  'Added via AI-assisted canonical gap triage (2026-08-25), sourced from official/org pages via live web verification. Pending Leonix human field verification before promoting to ''verified''.',
  'ai-triage-2026-08-25', 'ai-triage-2026-08-25'
)
ON CONFLICT (slug) DO NOTHING;

/* 2/19 — Santa Clara County Homelessness Prevention System — housing-rent */
INSERT INTO public.community_resources (
  slug, organization_name, organization_type,
  short_description_es, short_description_en,
  primary_category, urgency_level, cost_model, service_area,
  phone, website_url, is_24_hours,
  official_source_url, verification_status, active,
  partner_status, featured, print_eligible, internal_notes,
  created_by, updated_by
) VALUES (
  'homelessness-prevention-system-scc', 'Santa Clara County Homelessness Prevention System', 'government',
  '', 'Santa Clara County''s homelessness prevention line - call for a pre-screening appointment to see if you qualify for rental assistance before losing housing.',
  'housing-rent', 'i-need-help', 'free', 'Santa Clara County',
  '(408) 516-5100', 'https://www.preventhomelessness.org', false,
  'https://www.preventhomelessness.org', 'needs_review', true,
  'none', false, false,
  'Added via AI-assisted canonical gap triage (2026-08-25), sourced from official/org pages via live web verification. Pending Leonix human field verification before promoting to ''verified''.',
  'ai-triage-2026-08-25', 'ai-triage-2026-08-25'
)
ON CONFLICT (slug) DO NOTHING;

/* 3/19 — HomeFirst Services of Santa Clara County — housing-rent */
INSERT INTO public.community_resources (
  slug, organization_name, organization_type,
  short_description_es, short_description_en,
  primary_category, urgency_level, cost_model, service_area,
  phone, website_url, address_line1, address_city, address_state, is_24_hours,
  official_source_url, verification_status, active,
  partner_status, featured, print_eligible, internal_notes,
  created_by, updated_by
) VALUES (
  'homefirst', 'HomeFirst Services of Santa Clara County', 'nonprofit',
  '', 'Santa Clara County''s largest homeless services provider, offering emergency shelter, transitional housing, and housing problem-solving support.',
  'housing-rent', 'i-need-help', 'free', 'Santa Clara County',
  '(408) 510-7600', 'https://www.homefirstscc.org/', '2011 Little Orchard Blvd.', 'San Jose', 'CA', false,
  'https://www.homefirstscc.org/santa-clara-county', 'needs_review', true,
  'none', false, false,
  'Added via AI-assisted canonical gap triage (2026-08-25), sourced from official/org pages via live web verification. Pending Leonix human field verification before promoting to ''verified''.',
  'ai-triage-2026-08-25', 'ai-triage-2026-08-25'
)
ON CONFLICT (slug) DO NOTHING;

/* 4/19 — LifeMoves — housing-rent */
INSERT INTO public.community_resources (
  slug, organization_name, organization_type,
  short_description_es, short_description_en,
  primary_category, urgency_level, cost_model, service_area,
  phone, website_url, hours_note_en, is_24_hours,
  official_source_url, verification_status, active,
  partner_status, featured, print_eligible, internal_notes,
  created_by, updated_by
) VALUES (
  'lifemoves', 'LifeMoves', 'nonprofit',
  '', 'Regional shelter and interim housing provider serving Santa Clara and San Mateo counties; eligibility is screened through the county''s coordinated entry system.',
  'housing-rent', 'i-need-help', 'free', 'Santa Clara and San Mateo counties',
  '(408) 271-0820', 'https://lifemoves.org/get-help/', 'Eligibility/intake is screened through the county''s coordinated entry line, (408) 516-5100 (see Homelessness Prevention System). Direct line shown is a LifeMoves site number.', false,
  'https://lifemoves.org/get-help/', 'needs_review', true,
  'none', false, false,
  'Added via AI-assisted canonical gap triage (2026-08-25), sourced from official/org pages via live web verification. Pending Leonix human field verification before promoting to ''verified''.',
  'ai-triage-2026-08-25', 'ai-triage-2026-08-25'
)
ON CONFLICT (slug) DO NOTHING;

/* 5/19 — City of San Jose Housing Department — housing-rent */
INSERT INTO public.community_resources (
  slug, organization_name, program_name, organization_type,
  short_description_es, short_description_en,
  primary_category, urgency_level, cost_model, service_area,
  phone, email, website_url, is_24_hours,
  official_source_url, verification_status, active,
  partner_status, featured, print_eligible, internal_notes,
  created_by, updated_by
) VALUES (
  'city-of-san-jose-housing', 'City of San Jose Housing Department', 'Eviction Help Center', 'government',
  '', 'City of San Jose''s Eviction Help Center and Housing Department - rental assistance and tenant support for San Jose residents.',
  'housing-rent', 'i-need-help', 'free', 'City of San Jose',
  '(408) 975-4444', 'evictionhelp@sanjoseca.gov', 'https://housing.sanjoseca.gov/get-assistance', false,
  'https://www.sanjoseca.gov/your-government/departments-offices/housing/eviction-help-center/rental-assistance', 'needs_review', true,
  'none', false, false,
  'Added via AI-assisted canonical gap triage (2026-08-25), sourced from official/org pages via live web verification. Pending Leonix human field verification before promoting to ''verified''.',
  'ai-triage-2026-08-25', 'ai-triage-2026-08-25'
)
ON CONFLICT (slug) DO NOTHING;

/* 6/19 — The Salvation Army Silicon Valley — housing-rent */
INSERT INTO public.community_resources (
  slug, organization_name, program_name, organization_type,
  short_description_es, short_description_en,
  primary_category, urgency_level, cost_model, service_area,
  phone, website_url, address_line1, address_city, address_state, is_24_hours,
  official_source_url, verification_status, active,
  partner_status, featured, print_eligible, internal_notes,
  created_by, updated_by
) VALUES (
  'salvation-army-silicon-valley', 'The Salvation Army Silicon Valley', 'Family Services', 'faith-based',
  '', 'Emergency assistance with rent, utilities, and basic needs for Santa Clara County residents through the Salvation Army Silicon Valley.',
  'housing-rent', 'i-need-help', 'free', 'Santa Clara County',
  '(408) 998-2064', 'https://siliconvalley.salvationarmy.org/silicon_valley/family-services/', '359 N. 4th Street', 'San Jose', 'CA', false,
  'https://siliconvalley.salvationarmy.org/silicon_valley/family-services/', 'needs_review', true,
  'none', false, false,
  'Added via AI-assisted canonical gap triage (2026-08-25), sourced from official/org pages via live web verification. Pending Leonix human field verification before promoting to ''verified''. Named program-staff phone numbers found in research were deliberately not used (staff turnover risk) - general/family-services line used instead.',
  'ai-triage-2026-08-25', 'ai-triage-2026-08-25'
)
ON CONFLICT (slug) DO NOTHING;

/* 7/19 — 988 Suicide & Crisis Lifeline — urgent-safety — HIGH-RISK */
INSERT INTO public.community_resources (
  slug, organization_name, organization_type,
  short_description_es, short_description_en,
  primary_category, urgency_level, cost_model, service_area,
  crisis_phone, sms, website_url, is_24_hours,
  official_source_url, verification_status, active,
  partner_status, featured, print_eligible, internal_notes,
  created_by, updated_by
) VALUES (
  '988-suicide-crisis-lifeline', '988 Suicide & Crisis Lifeline', 'hotline',
  '', 'National suicide and mental health crisis line. Call or text 988, or chat online - free, confidential, available 24/7/365.',
  'urgent-safety', 'help-now', 'free', 'United States (national)',
  '988', '988', 'https://988lifeline.org/', true,
  'https://988lifeline.org/', 'needs_review', true,
  'none', false, false,
  'Added via AI-assisted canonical gap triage (2026-08-25). Cross-verified against 988lifeline.org and 988lifeline.org/es/inicio/ directly. Spanish text/chat access exists but a specific SMS keyword is NOT asserted here (live official Spanish page confirms texting 988 directly works, no keyword required). Pending Leonix human field verification before promoting to ''verified''. Must remain its own distinct row - do not merge with SCC Behavioral Health Services, EPS, or Crisis Text Line.',
  'ai-triage-2026-08-25', 'ai-triage-2026-08-25'
)
ON CONFLICT (slug) DO NOTHING;

/* 8/19 — NAMI Santa Clara County — mental-health-recovery */
INSERT INTO public.community_resources (
  slug, organization_name, program_name, organization_type,
  short_description_es, short_description_en,
  primary_category, urgency_level, cost_model, service_area,
  phone, sms, website_url, hours_note_en, is_24_hours,
  official_source_url, verification_status, active,
  partner_status, featured, print_eligible, internal_notes,
  created_by, updated_by
) VALUES (
  'nami-santa-clara', 'NAMI Santa Clara County', 'HelpLine / Warmline', 'nonprofit',
  '', 'Peer support warmline and family/mental-health support groups from the National Alliance on Mental Illness, Santa Clara County chapter. Not for emergencies - call or text 988 for crisis support.',
  'mental-health-recovery', 'want-to-connect', 'free', 'Santa Clara County',
  '(408) 453-0400 x1', '62640', 'https://namisantaclara.org/classes/warmline/', 'Monday-Friday, 10:00 AM - 6:00 PM', false,
  'https://namisantaclara.org/classes/warmline/', 'needs_review', true,
  'none', false, false,
  'Added via AI-assisted canonical gap triage (2026-08-25), sourced from official/org pages via live web verification. NAMI Espanol support groups exist per org site but were not independently verified for specific hours/contact - not included as a structured field. Pending Leonix human field verification before promoting to ''verified''.',
  'ai-triage-2026-08-25', 'ai-triage-2026-08-25'
)
ON CONFLICT (slug) DO NOTHING;

/* 9/19 — Medi-Cal — health-clinics */
INSERT INTO public.community_resources (
  slug, organization_name, program_name, organization_type,
  short_description_es, short_description_en,
  primary_category, urgency_level, cost_model, eligibility_en, service_area,
  phone, website_url, is_24_hours,
  official_source_url, verification_status, active,
  partner_status, featured, print_eligible, internal_notes,
  created_by, updated_by
) VALUES (
  'medi-cal', 'Medi-Cal', 'Santa Clara County application assistance', 'government',
  '', 'California''s public health insurance program for eligible low-income residents. Eligibility, immigration-status provisions, and renewal rules are changing between 2026 and 2028 - confirm current status with the county before publishing specifics.',
  'health-clinics', 'i-need-help', 'eligibility_based', 'Income-based eligibility; rules are changing 2026-2028 (immigration-status provisions, work requirements, more frequent renewals per DHCS). Do not print specific thresholds without a current DHCS/county confirmation at time of publication.', 'California (Santa Clara County application assistance)',
  '(408) 758-3800', 'https://ssa.santaclaracounty.gov/get-health-coverage-medi-cal', false,
  'https://www.scfhp.com/healthcare-plans/medi-cal/frequently-asked-questions/medi-cal-changes-2026-2028/', 'needs_review', true,
  'none', false, false,
  'Added via AI-assisted canonical gap triage (2026-08-25). 2026-2028 policy-change language confirmed via SCFHP FAQ and DHCS; exact thresholds/rules were NOT sourced and must not be printed without a fresh confirmation close to print date. Pending Leonix human field verification before promoting to ''verified''.',
  'ai-triage-2026-08-25', 'ai-triage-2026-08-25'
)
ON CONFLICT (slug) DO NOTHING;

/* 10/19 — Gardner Health Services — health-clinics */
INSERT INTO public.community_resources (
  slug, organization_name, organization_type,
  short_description_es, short_description_en,
  primary_category, urgency_level, cost_model, service_area,
  phone, website_url, address_line1, address_city, address_state, address_zip, hours_note_en, is_24_hours,
  official_source_url, verification_status, active,
  partner_status, featured, print_eligible, internal_notes,
  created_by, updated_by
) VALUES (
  'gardner-health-services', 'Gardner Health Services', 'community-clinic',
  '', 'Federally Qualified Health Center offering sliding-scale primary care, regardless of insurance or immigration status.',
  'health-clinics', 'i-need-help', 'eligibility_based', 'San Jose / Santa Clara County',
  '(408) 457-7100', 'https://gardnerhealthservices.org/', '195 E Virginia St', 'San Jose', 'CA', '95112', 'Monday-Friday, 8:00 AM - 5:00 PM', false,
  'https://gardnerhealthservices.org/', 'needs_review', true,
  'none', false, false,
  'Added via AI-assisted canonical gap triage (2026-08-25), sourced from official/org pages via live web verification. Functional overlap noted with existing RotaCare/NEMS canonical rows - classified STRONG not ESSENTIAL in the prior triage for this reason. Pending Leonix human field verification before promoting to ''verified''.',
  'ai-triage-2026-08-25', 'ai-triage-2026-08-25'
)
ON CONFLICT (slug) DO NOTHING;

/* 11/19 — Better Health Pharmacy — health-clinics */
INSERT INTO public.community_resources (
  slug, organization_name, program_name, organization_type,
  short_description_es, short_description_en,
  primary_category, urgency_level, cost_model, service_area,
  phone, website_url, address_line1, address_city, address_state, address_zip, hours_note_en, is_24_hours,
  official_source_url, verification_status, active,
  partner_status, featured, print_eligible, internal_notes,
  created_by, updated_by
) VALUES (
  'better-health-pharmacy', 'Better Health Pharmacy', 'County of Santa Clara Public Health Department', 'government',
  '', 'Santa Clara County''s free pharmacy - dispenses donated, unopened medications at no cost with a valid prescription, regardless of immigration or insurance status. Does not carry controlled substances/opioids.',
  'health-clinics', 'i-need-help', 'free', 'Santa Clara County',
  '(408) 794-0564', 'https://publichealth.santaclaracounty.gov/programs-and-services/pharmacy-and-vaccination-services/better-health-pharmacy', '725 E Santa Clara St, Ste 202', 'San Jose', 'CA', '95112', 'Tue-Fri 10:30 AM-7:00 PM; Sat 8:30 AM-12:30 PM & 1:00-5:00 PM; closed Sun/Mon', false,
  'https://publichealth.santaclaracounty.gov/programs-and-services/pharmacy-and-vaccination-services/better-health-pharmacy', 'needs_review', true,
  'none', false, false,
  'Added via AI-assisted canonical gap triage (2026-08-25), sourced from official county page via live web verification. Pending Leonix human field verification before promoting to ''verified''.',
  'ai-triage-2026-08-25', 'ai-triage-2026-08-25'
)
ON CONFLICT (slug) DO NOTHING;

/* 12/19 — Santa Clara County Public Health Department (Pregnancy and Parenting Referral Line) — health-clinics */
INSERT INTO public.community_resources (
  slug, organization_name, program_name, organization_type,
  short_description_es, short_description_en,
  primary_category, urgency_level, cost_model, service_area,
  phone, website_url, is_24_hours,
  official_source_url, verification_status, active,
  partner_status, featured, print_eligible, internal_notes,
  created_by, updated_by
) VALUES (
  'pregnancy-parenting-referral-line', 'Santa Clara County Public Health Department', 'Pregnancy and Parenting Referral Line', 'government',
  '', 'Santa Clara County Public Health''s referral line for pregnancy care, family planning, food/nutrition resources, and parenting support.',
  'health-clinics', 'i-need-help', 'free', 'Santa Clara County',
  '1 (800) 310-2332', 'https://publichealth.santaclaracounty.gov/programs-and-services/call-pregnancy-and-parenting-referral-line', false,
  'https://publichealth.santaclaracounty.gov/programs-and-services/call-pregnancy-and-parenting-referral-line', 'needs_review', true,
  'none', false, false,
  'Added via AI-assisted canonical gap triage (2026-08-25), sourced from official county page via live web verification. Pending Leonix human field verification before promoting to ''verified''.',
  'ai-triage-2026-08-25', 'ai-triage-2026-08-25'
)
ON CONFLICT (slug) DO NOTHING;

/* 13/19 — Santa Clara County Office of Immigrant Relations — legal-immigration */
INSERT INTO public.community_resources (
  slug, organization_name, organization_type,
  short_description_es, short_description_en,
  primary_category, urgency_level, cost_model, service_area,
  website_url, address_line1, address_city, address_state, address_zip, is_24_hours,
  official_source_url, verification_status, active,
  partner_status, featured, print_eligible, internal_notes,
  created_by, updated_by
) VALUES (
  'office-of-immigrant-relations-scc', 'Santa Clara County Office of Immigrant Relations', 'government',
  '', 'Santa Clara County office coordinating immigrant-serving programs, including the Citizenship Collaborative and official Know-Your-Rights resources.',
  'legal-immigration', 'want-to-connect', 'free', 'Santa Clara County',
  'https://desj.santaclaracounty.gov/oir', '2460 N 1st Street, Suite 220', 'San Jose', 'CA', '95131', false,
  'https://desj.santaclaracounty.gov/oir', 'needs_review', true,
  'none', false, false,
  'Added via AI-assisted canonical gap triage (2026-08-25). No distinct public phone line was confirmed for OIR itself - its own site directs callers to the Rapid Response Network (408-290-1144) for hotline needs, so no phone field is set here to avoid implying a separate line. Classified digital/website-discoverable, not a print candidate. Pending Leonix human field verification before promoting to ''verified''.',
  'ai-triage-2026-08-25', 'ai-triage-2026-08-25'
)
ON CONFLICT (slug) DO NOTHING;

/* 14/19 — Asian Law Alliance — legal-immigration */
INSERT INTO public.community_resources (
  slug, organization_name, organization_type,
  short_description_es, short_description_en,
  primary_category, urgency_level, cost_model, languages, service_area,
  phone, website_url, address_line1, address_city, address_state, address_zip, hours_note_en, is_24_hours,
  official_source_url, verification_status, active,
  partner_status, featured, print_eligible, internal_notes,
  created_by, updated_by
) VALUES (
  'asian-law-alliance', 'Asian Law Alliance', 'nonprofit',
  '', 'Free legal aid for low-income Santa Clara County residents, covering immigration, family law, housing, domestic violence, and public benefits, in multiple languages including Spanish.',
  'legal-immigration', 'i-need-help', 'free', '["English","Spanish","Mandarin","Cantonese","Vietnamese","Tagalog","Korean"]'::jsonb, 'Santa Clara County',
  '(408) 287-9710', 'https://asianlawalliance.org/', '991 West Hedding Street, Suite 202', 'San Jose', 'CA', '95126', 'Free legal consultation Wednesdays 1:00-3:00 PM by pre-registration', false,
  'https://asianlawalliance.org/contact', 'needs_review', true,
  'none', false, false,
  'Added via AI-assisted canonical gap triage (2026-08-25), sourced from official org pages via live web verification. Pending Leonix human field verification before promoting to ''verified''.',
  'ai-triage-2026-08-25', 'ai-triage-2026-08-25'
)
ON CONFLICT (slug) DO NOTHING;

/* 15/19 — Santa Clara County Rapid Response Network (SCC RRN) — legal-immigration — HIGH-RISK */
INSERT INTO public.community_resources (
  slug, organization_name, organization_type,
  short_description_es, short_description_en,
  primary_category, urgency_level, cost_model, service_area,
  crisis_phone, website_url, is_24_hours,
  official_source_url, verification_status, active,
  partner_status, featured, print_eligible, internal_notes,
  created_by, updated_by
) VALUES (
  'scc-rapid-response-network', 'Santa Clara County Rapid Response Network (SCC RRN)', 'hotline',
  '', '24/7 confidential hotline to report ICE activity or get emergency legal support if ICE comes to your home, workplace, or neighborhood in Santa Clara County.',
  'legal-immigration', 'help-now', 'free', 'Santa Clara County',
  '(408) 290-1144', 'https://www.sccrrn.org/', true,
  'https://www.sccrrn.org/', 'needs_review', true,
  'none', false, false,
  'Added via AI-assisted canonical gap triage (2026-08-25). Cross-verified against sccrrn.org directly (phone, 24/7, confidentiality all confirmed on the official site, no conflicts found). Pending Leonix human field verification before promoting to ''verified''.',
  'ai-triage-2026-08-25', 'ai-triage-2026-08-25'
)
ON CONFLICT (slug) DO NOTHING;

/*
 * 16/19 — Santa Clara County Department of Employment and Benefit Services (DEBS) — community-support
 * Umbrella row for CalWORKs / General Assistance / CalFresh — confirmed same office/phone, no
 * separate rows created for those programs (see decision rationale in chat transcript).
 */
INSERT INTO public.community_resources (
  slug, organization_name, program_name, organization_type,
  short_description_es, short_description_en,
  primary_category, urgency_level, cost_model, service_area,
  phone, application_url, website_url, address_line1, address_city, address_state, address_zip, hours_note_en, is_24_hours,
  official_source_url, verification_status, active,
  partner_status, featured, print_eligible, internal_notes,
  created_by, updated_by
) VALUES (
  'debs-county-benefits', 'Santa Clara County Department of Employment and Benefit Services (DEBS)', 'County Benefits (CalWORKs, General Assistance, CalFresh)', 'government',
  '', 'Santa Clara County''s Department of Employment and Benefit Services - apply for or get help with CalWORKs, General Assistance, CalFresh, and other public benefits. One office/phone line serves all of these programs.',
  'community-support', 'i-need-help', 'eligibility_based', 'Santa Clara County',
  '(408) 758-3800', 'https://ssa.santaclaracounty.gov/apply-public-benefits', 'https://ssa.santaclaracounty.gov/departments/department-employment-and-benefit-services', '1867 Senter Road', 'San Jose', 'CA', '95112', 'Monday-Friday, 8:00 AM - 5:00 PM (closed county holidays)', false,
  'https://ssa.santaclaracounty.gov/departments/department-employment-and-benefit-services/contact-department-employment-and-benefit', 'needs_review', true,
  'none', false, false,
  'Added via AI-assisted canonical gap triage (2026-08-25) as the single umbrella row per the county-benefits consolidation decision - CalWORKs and General Assistance confirmed to share this same office/phone (Senter Road complex), so no separate rows were created for them. Shares its phone number with the Medi-Cal row in this same batch (both route through the same SSA benefits intake line) - this is a confirmed fact, not a duplication error. Pending Leonix human field verification before promoting to ''verified''.',
  'ai-triage-2026-08-25', 'ai-triage-2026-08-25'
)
ON CONFLICT (slug) DO NOTHING;

/* 17/19 — Santa Clara County Adult Protective Services — seniors-disability — HIGH-RISK */
INSERT INTO public.community_resources (
  slug, organization_name, organization_type,
  short_description_es, short_description_en,
  primary_category, urgency_level, cost_model, eligibility_en, service_area,
  phone, crisis_phone, address_line1, address_city, address_state, address_zip, is_24_hours,
  official_source_url, verification_status, active,
  partner_status, featured, print_eligible, internal_notes,
  created_by, updated_by
) VALUES (
  'adult-protective-services-scc', 'Santa Clara County Adult Protective Services', 'government',
  '', 'Santa Clara County''s hotline to report suspected abuse, neglect, or financial exploitation of adults 60+ or dependent adults 18-59. Reporting is confidential under California law (Welfare and Institutions Code section 15633).',
  'seniors-disability', 'help-now', 'free', 'Anyone may report; APS serves adults age 60+ and dependent adults age 18-59.', 'Santa Clara County',
  '(408) 975-4900', '(800) 414-2002', '353 W. Julian St.', 'San Jose', 'CA', '95110', true,
  'https://ssa.santaclaracounty.gov/departments/department-aging-and-adult-services/adult-protective-services/report-elder-and-dependent-adult-abuse', 'needs_review', true,
  'none', false, false,
  'Added via AI-assisted canonical gap triage (2026-08-25). Toll-free (800) 414-2002 confirmed 24/7 across 2 independent sources. Address 353 W. Julian St confirmed by 2 independent sources (a third listing showed ''333'', treated as an error). Confidentiality confirmed via CA Welfare and Institutions Code section 15633 (statutory, not org policy). Reporter-confidentiality wording has NOT been separately confirmed by phone with DAAS - recommend a routine pre-print confirmation call. Pending Leonix human field verification before promoting to ''verified''.',
  'ai-triage-2026-08-25', 'ai-triage-2026-08-25'
)
ON CONFLICT (slug) DO NOTHING;

/* 18/19 — Sourcewise — seniors-disability */
INSERT INTO public.community_resources (
  slug, organization_name, program_name, organization_type,
  short_description_es, short_description_en,
  primary_category, urgency_level, cost_model, service_area,
  phone, website_url, hours_note_en, is_24_hours,
  official_source_url, verification_status, active,
  partner_status, featured, print_eligible, internal_notes,
  created_by, updated_by
) VALUES (
  'sourcewise', 'Sourcewise', 'Area Agency on Aging - Information & Awareness', 'nonprofit',
  '', 'Santa Clara County''s designated Area Agency on Aging - the central access point for senior services including Meals on Wheels, caregiver support, Medicare/HICAP counseling, and more.',
  'seniors-disability', 'i-need-help', 'eligibility_based', 'Santa Clara County',
  '(408) 350-3200', 'https://mysourcewise.com/', 'Information & Awareness line, option 1', false,
  'https://mysourcewise.com/programs-services/information/', 'needs_review', true,
  'none', false, false,
  'Added via AI-assisted canonical gap triage (2026-08-25), sourced from official org pages via live web verification. Main organizational line (408) 727-4756 also found in research; Information & Awareness line used as the primary public-facing contact per org site structure. Pending Leonix human field verification before promoting to ''verified''.',
  'ai-triage-2026-08-25', 'ai-triage-2026-08-25'
)
ON CONFLICT (slug) DO NOTHING;

/* 19/19 — Parents Helping Parents (PHP) — seniors-disability */
INSERT INTO public.community_resources (
  slug, organization_name, organization_type,
  short_description_es, short_description_en,
  primary_category, urgency_level, cost_model, service_area,
  phone, email, website_url, is_24_hours,
  official_source_url, verification_status, active,
  partner_status, featured, print_eligible, internal_notes,
  created_by, updated_by
) VALUES (
  'parents-helping-parents', 'Parents Helping Parents (PHP)', 'nonprofit',
  '', 'Free support, training, and resources for families and caregivers of individuals with any disability, from birth through adulthood.',
  'seniors-disability', 'i-need-help', 'free', 'San Jose and Santa Clara County (and beyond)',
  '(408) 727-5775', 'info@php.com', 'https://www.php.com/', false,
  'https://www.php.com/mission-vision/', 'needs_review', true,
  'none', false, false,
  'Added via AI-assisted canonical gap triage (2026-08-25). Scope corrected from an earlier draft''s "ages 0-5" framing - PHP''s own mission/homepage copy is explicit that it serves caregivers "of any age" with "any disability", birth through adulthood. Pending Leonix human field verification before promoting to ''verified''.',
  'ai-triage-2026-08-25', 'ai-triage-2026-08-25'
)
ON CONFLICT (slug) DO NOTHING;

COMMIT;
