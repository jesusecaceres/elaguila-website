# OFERTAS AI SCANNER — SEALED

CERTIFIED: TRUE

KNOWN-GOOD RESULT: 127 products / 8 pages (Cardenas flyer, production, 8/8 pages completed, editable review workflow confirmed working)

SCANNER CORE: LOCKED
UI REVIEW LAYOUT: NOT LOCKED

Full contract detail: `app/lib/ofertas-locales/OFERTAS_AI_SCANNER_CERTIFIED_REPAIR_MANUAL.md`
Protected file list: `app/lib/ofertas-locales/ofertasAiScannerProtectedPaths.ts`
Regression guard: `npm run ofertas:ai-scanner-certified-baseline-audit`

## ALLOWED WITHOUT REOPENING SCANNER
- layout changes
- CTA labels/styles
- dedicated review workspace
- sticky panels
- bilingual category labels
- page navigation UX
- final review arrangement

## NOT ALLOWED WITHOUT EXPLICIT SCANNER REOPEN
- readiness logic
- scan-prep payload/response contract
- canonical parent persistence
- scan route
- provider invocation
- provider fallback
- normalization
- item persistence
- scanner DB schema
- owner/RLS scanner rules

## REOPEN PROCEDURE
1. State the exact scanner defect.
2. Reproduce it.
3. Identify the first-zero boundary.
4. Read the repair manual.
5. Modify the smallest responsible core file.
6. Run all scanner audits.
7. Perform real production QA.
8. Reseal (update this file's known-good result if it changed).
