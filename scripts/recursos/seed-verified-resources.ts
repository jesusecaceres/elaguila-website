/**
 * Recursos Data OS — verified resource seed path (Build 02, Gate 10).
 *
 * SEEDING POLICY — READ BEFORE EDITING:
 *   - Do NOT add guessed/invented organizations, phone numbers, URLs, or hours here.
 *   - Only add records here once Coach (or another authoritative source) has supplied verified,
 *     official-source-backed data for each entry.
 *   - `VERIFIED_RESOURCES` below is intentionally EMPTY. Leave it empty until real data exists.
 *
 * USAGE (not run automatically by any build/deploy step):
 *   npx tsx scripts/recursos/seed-verified-resources.ts --confirm
 *
 * Without `--confirm`, or with an empty `VERIFIED_RESOURCES` array, this script does nothing and
 * prints a message — it will never silently write placeholder rows.
 *
 * 2026-08-25 batch — canonical gap triage (Recursos magazine prep):
 *   19 resources compiled via live official-source web verification this session (see chat
 *   transcript for full sourcing). NOT run through Leonix's own human field-verification —
 *   verificationStatus is deliberately left "needs_review" (the DB default) so these stay off the
 *   public surface (communityResourcesPublicQueries.ts requires verification_status='verified')
 *   until a human confirms and promotes them. No Spanish text is included — shortDescriptionEs is
 *   left blank per the no-Spanish-fabrication rule; spanishStatus defaults to 'not_available'.
 *   lastVerifiedAt is intentionally left unset per this file's own policy above.
 */
import { dbCreateCommunityResource, type CommunityResourceInput } from "@/app/lib/recursos/server/communityResourcesDb";

/**
 * Add ONLY verified, official-source-backed records here. Each entry must include
 * `verification.officialSourceUrl` and should leave `verification.lastVerifiedAt` unset unless a
 * human has actually confirmed the information on that date.
 */
export const VERIFIED_RESOURCES: CommunityResourceInput[] = [
  {
    slug: "here4you",
    organizationName: "Here4You (Bill Wilson Center)",
    programName: "Shelter Hotline",
    organizationType: "nonprofit",
    shortDescriptionEs: "",
    shortDescriptionEn:
      "Santa Clara County's shelter-placement hotline — call to be connected with available emergency shelter and temporary housing.",
    primaryCategory: "housing-rent",
    urgencyLevel: "help-now",
    costModel: "free",
    serviceArea: "Santa Clara County",
    contact: {
      phone: "(408) 385-2400",
      websiteUrl: "https://www.billwilsoncenter.org/services/all/here4you.html",
      hoursNoteEn: "9:00 AM – 7:00 PM daily",
      is24Hours: false,
    },
    verification: {
      officialSourceUrl: "https://www.billwilsoncenter.org/services/all/here4you.html",
      verificationStatus: "needs_review",
      active: true,
    },
    internal: {
      partnerStatus: "none",
      featured: false,
      printEligible: false,
      internalNotes:
        "Added via AI-assisted canonical gap triage (2026-08-25), sourced from official/org pages via live web verification. Pending Leonix human field verification before promoting to 'verified'.",
    },
  },
  {
    slug: "homelessness-prevention-system-scc",
    organizationName: "Santa Clara County Homelessness Prevention System",
    organizationType: "government",
    shortDescriptionEs: "",
    shortDescriptionEn:
      "Santa Clara County's homelessness prevention line — call for a pre-screening appointment to see if you qualify for rental assistance before losing housing.",
    primaryCategory: "housing-rent",
    urgencyLevel: "i-need-help",
    costModel: "free",
    serviceArea: "Santa Clara County",
    contact: {
      phone: "(408) 516-5100",
      websiteUrl: "https://www.preventhomelessness.org",
      is24Hours: false,
    },
    verification: {
      officialSourceUrl: "https://www.preventhomelessness.org",
      verificationStatus: "needs_review",
      active: true,
    },
    internal: {
      partnerStatus: "none",
      featured: false,
      printEligible: false,
      internalNotes:
        "Added via AI-assisted canonical gap triage (2026-08-25), sourced from official/org pages via live web verification. Pending Leonix human field verification before promoting to 'verified'.",
    },
  },
  {
    slug: "homefirst",
    organizationName: "HomeFirst Services of Santa Clara County",
    organizationType: "nonprofit",
    shortDescriptionEs: "",
    shortDescriptionEn:
      "Santa Clara County's largest homeless services provider, offering emergency shelter, transitional housing, and housing problem-solving support.",
    primaryCategory: "housing-rent",
    urgencyLevel: "i-need-help",
    costModel: "free",
    serviceArea: "Santa Clara County",
    contact: {
      phone: "(408) 510-7600",
      websiteUrl: "https://www.homefirstscc.org/",
      address: { line1: "2011 Little Orchard Blvd.", city: "San José", state: "CA" },
      is24Hours: false,
    },
    verification: {
      officialSourceUrl: "https://www.homefirstscc.org/santa-clara-county",
      verificationStatus: "needs_review",
      active: true,
    },
    internal: {
      partnerStatus: "none",
      featured: false,
      printEligible: false,
      internalNotes:
        "Added via AI-assisted canonical gap triage (2026-08-25), sourced from official/org pages via live web verification. Pending Leonix human field verification before promoting to 'verified'.",
    },
  },
  {
    slug: "lifemoves",
    organizationName: "LifeMoves",
    organizationType: "nonprofit",
    shortDescriptionEs: "",
    shortDescriptionEn:
      "Regional shelter and interim housing provider serving Santa Clara and San Mateo counties; eligibility is screened through the county's coordinated entry system.",
    primaryCategory: "housing-rent",
    urgencyLevel: "i-need-help",
    costModel: "free",
    serviceArea: "Santa Clara and San Mateo counties",
    contact: {
      phone: "(408) 271-0820",
      websiteUrl: "https://lifemoves.org/get-help/",
      hoursNoteEn: "Eligibility/intake is screened through the county's coordinated entry line, (408) 516-5100 (see Homelessness Prevention System). Direct line shown is a LifeMoves site number.",
      is24Hours: false,
    },
    verification: {
      officialSourceUrl: "https://lifemoves.org/get-help/",
      verificationStatus: "needs_review",
      active: true,
    },
    internal: {
      partnerStatus: "none",
      featured: false,
      printEligible: false,
      internalNotes:
        "Added via AI-assisted canonical gap triage (2026-08-25), sourced from official/org pages via live web verification. Pending Leonix human field verification before promoting to 'verified'.",
    },
  },
  {
    slug: "city-of-san-jose-housing",
    organizationName: "City of San José Housing Department",
    programName: "Eviction Help Center",
    organizationType: "government",
    shortDescriptionEs: "",
    shortDescriptionEn:
      "City of San José's Eviction Help Center and Housing Department — rental assistance and tenant support for San José residents.",
    primaryCategory: "housing-rent",
    urgencyLevel: "i-need-help",
    costModel: "free",
    serviceArea: "City of San José",
    contact: {
      phone: "(408) 975-4444",
      email: "evictionhelp@sanjoseca.gov",
      websiteUrl: "https://housing.sanjoseca.gov/get-assistance",
      is24Hours: false,
    },
    verification: {
      officialSourceUrl: "https://www.sanjoseca.gov/your-government/departments-offices/housing/eviction-help-center/rental-assistance",
      verificationStatus: "needs_review",
      active: true,
    },
    internal: {
      partnerStatus: "none",
      featured: false,
      printEligible: false,
      internalNotes:
        "Added via AI-assisted canonical gap triage (2026-08-25), sourced from official/org pages via live web verification. Pending Leonix human field verification before promoting to 'verified'.",
    },
  },
  {
    slug: "salvation-army-silicon-valley",
    organizationName: "The Salvation Army Silicon Valley",
    programName: "Family Services",
    organizationType: "faith-based",
    shortDescriptionEs: "",
    shortDescriptionEn:
      "Emergency assistance with rent, utilities, and basic needs for Santa Clara County residents through the Salvation Army Silicon Valley.",
    primaryCategory: "housing-rent",
    urgencyLevel: "i-need-help",
    costModel: "free",
    serviceArea: "Santa Clara County",
    contact: {
      phone: "(408) 998-2064",
      websiteUrl: "https://siliconvalley.salvationarmy.org/silicon_valley/family-services/",
      address: { line1: "359 N. 4th Street", city: "San José", state: "CA" },
      is24Hours: false,
    },
    verification: {
      officialSourceUrl: "https://siliconvalley.salvationarmy.org/silicon_valley/family-services/",
      verificationStatus: "needs_review",
      active: true,
    },
    internal: {
      partnerStatus: "none",
      featured: false,
      printEligible: false,
      internalNotes:
        "Added via AI-assisted canonical gap triage (2026-08-25), sourced from official/org pages via live web verification. Pending Leonix human field verification before promoting to 'verified'. Named program-staff phone numbers found in research were deliberately not used (staff turnover risk) — general/family-services line used instead.",
    },
  },
  {
    slug: "988-suicide-crisis-lifeline",
    organizationName: "988 Suicide & Crisis Lifeline",
    organizationType: "hotline",
    shortDescriptionEs: "",
    shortDescriptionEn:
      "National suicide and mental health crisis line. Call or text 988, or chat online — free, confidential, available 24/7/365.",
    primaryCategory: "urgent-safety",
    urgencyLevel: "help-now",
    costModel: "free",
    serviceArea: "United States (national)",
    contact: {
      crisisPhone: "988",
      sms: "988",
      websiteUrl: "https://988lifeline.org/",
      is24Hours: true,
    },
    verification: {
      officialSourceUrl: "https://988lifeline.org/",
      verificationStatus: "needs_review",
      active: true,
    },
    internal: {
      partnerStatus: "none",
      featured: false,
      printEligible: false,
      internalNotes:
        "Added via AI-assisted canonical gap triage (2026-08-25). Cross-verified against 988lifeline.org and 988lifeline.org/es/inicio/ directly. Spanish text/chat access exists but a specific SMS keyword is NOT asserted here (live official Spanish page confirms texting 988 directly works, no keyword required). Pending Leonix human field verification before promoting to 'verified'. Must remain its own distinct row — do not merge with SCC Behavioral Health Services, EPS, or Crisis Text Line.",
    },
  },
  {
    slug: "nami-santa-clara",
    organizationName: "NAMI Santa Clara County",
    programName: "HelpLine / Warmline",
    organizationType: "nonprofit",
    shortDescriptionEs: "",
    shortDescriptionEn:
      "Peer support warmline and family/mental-health support groups from the National Alliance on Mental Illness, Santa Clara County chapter. Not for emergencies — call or text 988 for crisis support.",
    primaryCategory: "mental-health-recovery",
    urgencyLevel: "want-to-connect",
    costModel: "free",
    serviceArea: "Santa Clara County",
    contact: {
      phone: "(408) 453-0400 x1",
      sms: "62640",
      websiteUrl: "https://namisantaclara.org/classes/warmline/",
      hoursNoteEn: "Monday–Friday, 10:00 AM – 6:00 PM",
      is24Hours: false,
    },
    verification: {
      officialSourceUrl: "https://namisantaclara.org/classes/warmline/",
      verificationStatus: "needs_review",
      active: true,
    },
    internal: {
      partnerStatus: "none",
      featured: false,
      printEligible: false,
      internalNotes:
        "Added via AI-assisted canonical gap triage (2026-08-25), sourced from official/org pages via live web verification. NAMI Español support groups exist per org site but were not independently verified for specific hours/contact — not included as a structured field. Pending Leonix human field verification before promoting to 'verified'.",
    },
  },
  {
    slug: "medi-cal",
    organizationName: "Medi-Cal",
    programName: "Santa Clara County application assistance",
    organizationType: "government",
    shortDescriptionEs: "",
    shortDescriptionEn:
      "California's public health insurance program for eligible low-income residents. Eligibility, immigration-status provisions, and renewal rules are changing between 2026 and 2028 — confirm current status with the county before publishing specifics.",
    primaryCategory: "health-clinics",
    urgencyLevel: "i-need-help",
    costModel: "eligibility_based",
    eligibilityEn:
      "Income-based eligibility; rules are changing 2026-2028 (immigration-status provisions, work requirements, more frequent renewals per DHCS). Do not print specific thresholds without a current DHCS/county confirmation at time of publication.",
    serviceArea: "California (Santa Clara County application assistance)",
    contact: {
      phone: "(408) 758-3800",
      websiteUrl: "https://ssa.santaclaracounty.gov/get-health-coverage-medi-cal",
      is24Hours: false,
    },
    verification: {
      officialSourceUrl: "https://www.scfhp.com/healthcare-plans/medi-cal/frequently-asked-questions/medi-cal-changes-2026-2028/",
      verificationStatus: "needs_review",
      active: true,
    },
    internal: {
      partnerStatus: "none",
      featured: false,
      printEligible: false,
      internalNotes:
        "Added via AI-assisted canonical gap triage (2026-08-25). 2026-2028 policy-change language confirmed via SCFHP FAQ and DHCS; exact thresholds/rules were NOT sourced and must not be printed without a fresh confirmation close to print date. Pending Leonix human field verification before promoting to 'verified'.",
    },
  },
  {
    slug: "gardner-health-services",
    organizationName: "Gardner Health Services",
    organizationType: "community-clinic",
    shortDescriptionEs: "",
    shortDescriptionEn:
      "Federally Qualified Health Center offering sliding-scale primary care, regardless of insurance or immigration status.",
    primaryCategory: "health-clinics",
    urgencyLevel: "i-need-help",
    costModel: "eligibility_based",
    serviceArea: "San José / Santa Clara County",
    contact: {
      phone: "(408) 457-7100",
      websiteUrl: "https://gardnerhealthservices.org/",
      address: { line1: "195 E Virginia St", city: "San José", state: "CA", zip: "95112" },
      hoursNoteEn: "Monday–Friday, 8:00 AM – 5:00 PM",
      is24Hours: false,
    },
    verification: {
      officialSourceUrl: "https://gardnerhealthservices.org/",
      verificationStatus: "needs_review",
      active: true,
    },
    internal: {
      partnerStatus: "none",
      featured: false,
      printEligible: false,
      internalNotes:
        "Added via AI-assisted canonical gap triage (2026-08-25), sourced from official/org pages via live web verification. Functional overlap noted with existing RotaCare/NEMS canonical rows — classified STRONG not ESSENTIAL in the prior triage for this reason. Pending Leonix human field verification before promoting to 'verified'.",
    },
  },
  {
    slug: "better-health-pharmacy",
    organizationName: "Better Health Pharmacy",
    programName: "County of Santa Clara Public Health Department",
    organizationType: "government",
    shortDescriptionEs: "",
    shortDescriptionEn:
      "Santa Clara County's free pharmacy — dispenses donated, unopened medications at no cost with a valid prescription, regardless of immigration or insurance status. Does not carry controlled substances/opioids.",
    primaryCategory: "health-clinics",
    urgencyLevel: "i-need-help",
    costModel: "free",
    serviceArea: "Santa Clara County",
    contact: {
      phone: "(408) 794-0564",
      websiteUrl: "https://publichealth.santaclaracounty.gov/programs-and-services/pharmacy-and-vaccination-services/better-health-pharmacy",
      address: { line1: "725 E Santa Clara St, Ste 202", city: "San José", state: "CA", zip: "95112" },
      hoursNoteEn: "Tue–Fri 10:30 AM–7:00 PM; Sat 8:30 AM–12:30 PM & 1:00–5:00 PM; closed Sun/Mon",
      is24Hours: false,
    },
    verification: {
      officialSourceUrl: "https://publichealth.santaclaracounty.gov/programs-and-services/pharmacy-and-vaccination-services/better-health-pharmacy",
      verificationStatus: "needs_review",
      active: true,
    },
    internal: {
      partnerStatus: "none",
      featured: false,
      printEligible: false,
      internalNotes:
        "Added via AI-assisted canonical gap triage (2026-08-25), sourced from official county page via live web verification. Pending Leonix human field verification before promoting to 'verified'.",
    },
  },
  {
    slug: "pregnancy-parenting-referral-line",
    organizationName: "Santa Clara County Public Health Department",
    programName: "Pregnancy and Parenting Referral Line",
    organizationType: "government",
    shortDescriptionEs: "",
    shortDescriptionEn:
      "Santa Clara County Public Health's referral line for pregnancy care, family planning, food/nutrition resources, and parenting support.",
    primaryCategory: "health-clinics",
    urgencyLevel: "i-need-help",
    costModel: "free",
    serviceArea: "Santa Clara County",
    contact: {
      phone: "1 (800) 310-2332",
      websiteUrl: "https://publichealth.santaclaracounty.gov/programs-and-services/call-pregnancy-and-parenting-referral-line",
      is24Hours: false,
    },
    verification: {
      officialSourceUrl: "https://publichealth.santaclaracounty.gov/programs-and-services/call-pregnancy-and-parenting-referral-line",
      verificationStatus: "needs_review",
      active: true,
    },
    internal: {
      partnerStatus: "none",
      featured: false,
      printEligible: false,
      internalNotes:
        "Added via AI-assisted canonical gap triage (2026-08-25), sourced from official county page via live web verification. Pending Leonix human field verification before promoting to 'verified'.",
    },
  },
  {
    slug: "office-of-immigrant-relations-scc",
    organizationName: "Santa Clara County Office of Immigrant Relations",
    organizationType: "government",
    shortDescriptionEs: "",
    shortDescriptionEn:
      "Santa Clara County office coordinating immigrant-serving programs, including the Citizenship Collaborative and official Know-Your-Rights resources.",
    primaryCategory: "legal-immigration",
    urgencyLevel: "want-to-connect",
    costModel: "free",
    serviceArea: "Santa Clara County",
    contact: {
      websiteUrl: "https://desj.santaclaracounty.gov/oir",
      address: { line1: "2460 N 1st Street, Suite 220", city: "San José", state: "CA", zip: "95131" },
      is24Hours: false,
    },
    verification: {
      officialSourceUrl: "https://desj.santaclaracounty.gov/oir",
      verificationStatus: "needs_review",
      active: true,
    },
    internal: {
      partnerStatus: "none",
      featured: false,
      printEligible: false,
      internalNotes:
        "Added via AI-assisted canonical gap triage (2026-08-25). No distinct public phone line was confirmed for OIR itself — its own site directs callers to the Rapid Response Network (408-290-1144) for hotline needs, so no phone field is set here to avoid implying a separate line. Classified digital/website-discoverable, not a print candidate. Pending Leonix human field verification before promoting to 'verified'.",
    },
  },
  {
    slug: "asian-law-alliance",
    organizationName: "Asian Law Alliance",
    organizationType: "nonprofit",
    shortDescriptionEs: "",
    shortDescriptionEn:
      "Free legal aid for low-income Santa Clara County residents, covering immigration, family law, housing, domestic violence, and public benefits, in multiple languages including Spanish.",
    primaryCategory: "legal-immigration",
    urgencyLevel: "i-need-help",
    costModel: "free",
    languages: ["English", "Spanish", "Mandarin", "Cantonese", "Vietnamese", "Tagalog", "Korean"],
    serviceArea: "Santa Clara County",
    contact: {
      phone: "(408) 287-9710",
      websiteUrl: "https://asianlawalliance.org/",
      address: { line1: "991 West Hedding Street, Suite 202", city: "San José", state: "CA", zip: "95126" },
      hoursNoteEn: "Free legal consultation Wednesdays 1:00–3:00 PM by pre-registration",
      is24Hours: false,
    },
    verification: {
      officialSourceUrl: "https://asianlawalliance.org/contact",
      verificationStatus: "needs_review",
      active: true,
    },
    internal: {
      partnerStatus: "none",
      featured: false,
      printEligible: false,
      internalNotes:
        "Added via AI-assisted canonical gap triage (2026-08-25), sourced from official org pages via live web verification. Pending Leonix human field verification before promoting to 'verified'.",
    },
  },
  {
    slug: "scc-rapid-response-network",
    organizationName: "Santa Clara County Rapid Response Network (SCC RRN)",
    organizationType: "hotline",
    shortDescriptionEs: "",
    shortDescriptionEn:
      "24/7 confidential hotline to report ICE activity or get emergency legal support if ICE comes to your home, workplace, or neighborhood in Santa Clara County.",
    primaryCategory: "legal-immigration",
    urgencyLevel: "help-now",
    costModel: "free",
    serviceArea: "Santa Clara County",
    contact: {
      crisisPhone: "(408) 290-1144",
      websiteUrl: "https://www.sccrrn.org/",
      is24Hours: true,
    },
    verification: {
      officialSourceUrl: "https://www.sccrrn.org/",
      verificationStatus: "needs_review",
      active: true,
    },
    internal: {
      partnerStatus: "none",
      featured: false,
      printEligible: false,
      internalNotes:
        "Added via AI-assisted canonical gap triage (2026-08-25). Cross-verified against sccrrn.org directly (phone, 24/7, confidentiality all confirmed on the official site, no conflicts found). Pending Leonix human field verification before promoting to 'verified'.",
    },
  },
  {
    slug: "debs-county-benefits",
    organizationName: "Santa Clara County Department of Employment and Benefit Services (DEBS)",
    programName: "County Benefits (CalWORKs, General Assistance, CalFresh)",
    organizationType: "government",
    shortDescriptionEs: "",
    shortDescriptionEn:
      "Santa Clara County's Department of Employment and Benefit Services — apply for or get help with CalWORKs, General Assistance, CalFresh, and other public benefits. One office/phone line serves all of these programs.",
    primaryCategory: "community-support",
    urgencyLevel: "i-need-help",
    costModel: "eligibility_based",
    serviceArea: "Santa Clara County",
    contact: {
      phone: "(408) 758-3800",
      applicationUrl: "https://ssa.santaclaracounty.gov/apply-public-benefits",
      websiteUrl: "https://ssa.santaclaracounty.gov/departments/department-employment-and-benefit-services",
      address: { line1: "1867 Senter Road", city: "San José", state: "CA", zip: "95112" },
      hoursNoteEn: "Monday–Friday, 8:00 AM – 5:00 PM (closed county holidays)",
      is24Hours: false,
    },
    verification: {
      officialSourceUrl: "https://ssa.santaclaracounty.gov/departments/department-employment-and-benefit-services/contact-department-employment-and-benefit",
      verificationStatus: "needs_review",
      active: true,
    },
    internal: {
      partnerStatus: "none",
      featured: false,
      printEligible: false,
      internalNotes:
        "Added via AI-assisted canonical gap triage (2026-08-25) as the single umbrella row per the county-benefits consolidation decision — CalWORKs and General Assistance confirmed to share this same office/phone (Senter Road complex), so no separate rows were created for them. Pending Leonix human field verification before promoting to 'verified'.",
    },
  },
  {
    slug: "adult-protective-services-scc",
    organizationName: "Santa Clara County Adult Protective Services",
    organizationType: "government",
    shortDescriptionEs: "",
    shortDescriptionEn:
      "Santa Clara County's hotline to report suspected abuse, neglect, or financial exploitation of adults 60+ or dependent adults 18–59. Reporting is confidential under California law (Welfare & Institutions Code §15633).",
    primaryCategory: "seniors-disability",
    urgencyLevel: "help-now",
    costModel: "free",
    eligibilityEn: "Anyone may report; APS serves adults age 60+ and dependent adults age 18–59.",
    serviceArea: "Santa Clara County",
    contact: {
      phone: "(408) 975-4900",
      crisisPhone: "(800) 414-2002",
      address: { line1: "353 W. Julian St.", city: "San José", state: "CA", zip: "95110" },
      is24Hours: true,
    },
    verification: {
      officialSourceUrl: "https://ssa.santaclaracounty.gov/departments/department-aging-and-adult-services/adult-protective-services/report-elder-and-dependent-adult-abuse",
      verificationStatus: "needs_review",
      active: true,
    },
    internal: {
      partnerStatus: "none",
      featured: false,
      printEligible: false,
      internalNotes:
        "Added via AI-assisted canonical gap triage (2026-08-25). Toll-free (800) 414-2002 confirmed 24/7 across 2 independent sources. Address 353 W. Julian St confirmed by 2 independent sources (a third listing showed '333', treated as an error). Confidentiality confirmed via CA WIC §15633 (statutory, not org policy). Reporter-confidentiality wording has NOT been separately confirmed by phone with DAAS — recommend a routine pre-print confirmation call. Pending Leonix human field verification before promoting to 'verified'.",
    },
  },
  {
    slug: "sourcewise",
    organizationName: "Sourcewise",
    programName: "Area Agency on Aging — Information & Awareness",
    organizationType: "nonprofit",
    shortDescriptionEs: "",
    shortDescriptionEn:
      "Santa Clara County's designated Area Agency on Aging — the central access point for senior services including Meals on Wheels, caregiver support, Medicare/HICAP counseling, and more.",
    primaryCategory: "seniors-disability",
    urgencyLevel: "i-need-help",
    costModel: "eligibility_based",
    serviceArea: "Santa Clara County",
    contact: {
      phone: "(408) 350-3200",
      websiteUrl: "https://mysourcewise.com/",
      hoursNoteEn: "Information & Awareness line, option 1",
      is24Hours: false,
    },
    verification: {
      officialSourceUrl: "https://mysourcewise.com/programs-services/information/",
      verificationStatus: "needs_review",
      active: true,
    },
    internal: {
      partnerStatus: "none",
      featured: false,
      printEligible: false,
      internalNotes:
        "Added via AI-assisted canonical gap triage (2026-08-25), sourced from official org pages via live web verification. Main organizational line (408) 727-4756 also found in research; Information & Awareness line used as the primary public-facing contact per org site structure. Pending Leonix human field verification before promoting to 'verified'.",
    },
  },
  {
    slug: "parents-helping-parents",
    organizationName: "Parents Helping Parents (PHP)",
    organizationType: "nonprofit",
    shortDescriptionEs: "",
    shortDescriptionEn:
      "Free support, training, and resources for families and caregivers of individuals with any disability, from birth through adulthood.",
    primaryCategory: "seniors-disability",
    urgencyLevel: "i-need-help",
    costModel: "free",
    serviceArea: "San José and Santa Clara County (and beyond)",
    contact: {
      phone: "(408) 727-5775",
      email: "info@php.com",
      websiteUrl: "https://www.php.com/",
      is24Hours: false,
    },
    verification: {
      officialSourceUrl: "https://www.php.com/mission-vision/",
      verificationStatus: "needs_review",
      active: true,
    },
    internal: {
      partnerStatus: "none",
      featured: false,
      printEligible: false,
      internalNotes:
        "Added via AI-assisted canonical gap triage (2026-08-25). Scope corrected from an earlier draft's 'ages 0-5' framing — PHP's own mission/homepage copy is explicit that it serves caregivers 'of any age' with 'any disability', birth through adulthood. Pending Leonix human field verification before promoting to 'verified'.",
    },
  },
];

async function main() {
  const confirmed = process.argv.includes("--confirm");

  if (VERIFIED_RESOURCES.length === 0) {
    console.log("[seed-verified-resources] VERIFIED_RESOURCES is empty — nothing to seed. This is expected until verified source data is supplied.");
    return;
  }

  if (!confirmed) {
    console.log(
      `[seed-verified-resources] ${VERIFIED_RESOURCES.length} record(s) staged but --confirm was not passed. Re-run with --confirm to write them.`,
    );
    return;
  }

  for (const input of VERIFIED_RESOURCES) {
    const result = await dbCreateCommunityResource(input, "seed-script");
    if (result.ok) {
      console.log(`[seed-verified-resources] created: ${result.slug} (${result.id})`);
    } else {
      console.error(`[seed-verified-resources] FAILED for slug "${input.slug}": ${result.error}`);
    }
  }
}

main().catch((e) => {
  console.error("[seed-verified-resources] fatal error:", e);
  process.exitCode = 1;
});
