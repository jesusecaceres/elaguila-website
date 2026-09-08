# SCC Community Resource Guide 2023 — Candidate Extraction Report

**2023 data is NOT production-verified.** Every candidate defaults to `verificationStatus: "needs_review"` with `verifiedAt: null`. Nothing in this extraction may be treated as current truth without a human confirming it against a live official source.

## Counts

- Raw source references processed: 176
- Deduplicated candidate records: 175
- Dedup collapses performed: 1 (repeated cross-listings of the same org/program folded into one record with unioned source pages/sections)
- Organization-only candidates (no distinct program name): 152
- Program-level candidates (distinct program under an org): 23
- Candidates with a phone or crisis phone: 156
- Candidates with a website: 149
- Candidates missing any actionable contact (no phone/email/website/application URL): 3
- Candidates sourced from a known-defective source page (45/50/56 placeholder pages): 0

### By Leonix primary category
- urgent-safety: 35
- jobs-training: 29
- babies-kids-parents: 24
- community-support: 23
- health-clinics: 12
- legal-immigration: 11
- youth-education: 10
- mental-health-recovery: 9
- food-basic-needs: 8
- seniors-disability: 6
- housing-rent: 5
- transportation-access: 3

### By urgency level
- want-to-connect: 79
- i-need-help: 72
- help-now: 24

## Known source defects (not extraction errors)

Pages 45, 50, and 56 of the published 2023 PDF contain unfilled production placeholder text ("NEED TO ATTACH OVERFLOW TEXT") repeated across all four grid columns — the county never replaced this template text before publishing. No candidate records were extractable from these three pages; nothing was fabricated to fill the gap.

## Extraction ambiguities and manual-parsing flags

- Emergency Psychiatric Services (EPS) is listed twice in the source — once under Santa Clara County's own program pages (p.37) and again under the Hospitals sidebar (p.4) at the same address/phone. These were merged into a single candidate rather than duplicated.
- Several organizations act as pure referral/access points for county programs (e.g. CalWORKs liaison sites) with numerous named staff contacts rather than one general line — only the general/departmental contact was retained per candidate; individual staff rosters were treated as verification-phase detail, not candidate-record fields.
- Several nonprofits list multiple physical locations (e.g. Work2Future, Sourcewise, STARS/Starlight) — the primary/headquarters address was used for `address`, with satellite locations preserved in `verificationNotes` rather than fabricating multiple candidate records for the same service.
- "Goodwill Mental Health Clinic" (referenced only in the Healthcare Resources table of contents, p.16) was mapped to the Goodwill of Silicon Valley Wellness Center entry found in the alphabetical directory (p.46) as the most plausible match — flagged for verifier confirmation that this is in fact the same program.

## Likely-stale / high-risk records

This entire dataset is 3 years old relative to today and carries no automatic staleness flags — every record needs a live check, per the source's own disclaimer that "information is only available online" and changes frequently. No individual record was pre-judged as more or less likely to have changed; that judgment belongs to the human verifier in Gate 12's workflow, not to this extraction.

## Obsolete sections

No COVID-era-specific program pages were extracted as standalone candidates (the source's COVID-19 vaccine/testing page, p.22, links only to a general county COVID information hub, not a discrete resource with its own contact/eligibility — excluded as out of scope for a resource candidate record).
