import { assertIncludes, pass, readRepoFile } from "./ofertas-package-10-audit-helpers.mjs";

const app = readRepoFile("app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx");
const preview = readRepoFile("app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewClient.tsx");
const previewCard = readRepoFile("app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewCard.tsx");
const previewCopy = readRepoFile("app/(site)/publicar/ofertas-locales/preview/ofertasLocalesPreviewCopy.ts");
const steps = readRepoFile("app/lib/ofertas-locales/ofertasLocalesWizardSteps.ts");
const publishSubmit = readRepoFile("app/lib/ofertas-locales/ofertasLocalesPublishSubmit.ts");
const owner = readRepoFile("app/(site)/dashboard/ofertas-locales/[id]/page.tsx");

for (const required of [
  "businessFiles",
  "aiItems",
  "leonixRules",
  "OfertasLocalesDraftAssetSection",
  "OfertasLocalesAiScanPanel",
  "OfertasLocalesAiScanReviewWorkspace",
  "OfertasLocalesValidationPanel",
]) {
  assertIncludes("advertiser application", app, required);
}

// Gate F (QA UX batch) relocated the checkout continuation from Step 7 to
// Preview — the final visual inspection point now owns the handoff into the
// existing owner-dashboard checkout, so these live in the preview surface.
for (const required of ["continueToDashboardEs", "/dashboard/ofertas-locales/"]) {
  assertIncludes("preview checkout handoff", previewCard + previewCopy, required);
}

assertIncludes("preview submit", preview, "submitOfertaLocalDraftForReview");

assertIncludes("wizard truthful steps", steps, "OFERTAS_LOCALES_WIZARD_STEPS");
assertIncludes("publish API submitter", publishSubmit, "/api/ofertas-locales/publish");
assertIncludes("owner checkout continuation", owner, "redirectToRevenueCategoryCheckout");

pass("Package 10 advertiser journey connects product, business, upload, scan, review, preview, checkout, submission, and owner continuation");
