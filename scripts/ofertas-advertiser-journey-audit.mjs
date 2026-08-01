import { assertIncludes, pass, readRepoFile } from "./ofertas-package-10-audit-helpers.mjs";

const app = readRepoFile("app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx");
const steps = readRepoFile("app/lib/ofertas-locales/ofertasLocalesWizardSteps.ts");
const publishSubmit = readRepoFile("app/lib/ofertas-locales/ofertasLocalesPublishSubmit.ts");
const owner = readRepoFile("app/(site)/dashboard/ofertas-locales/[id]/page.tsx");

for (const required of [
  "businessInfo",
  "filesDates",
  "aiItems",
  "leonixRules",
  "OfertasLocalesDraftAssetSection",
  "OfertasLocalesAiScanPanel",
  "OfertasLocalesAiScanReviewWorkspace",
  "OfertasLocalesValidationPanel",
  "continueSecureCheckout",
  "/dashboard/ofertas-locales/",
  "submitOfertaLocalDraftForReview",
]) {
  assertIncludes("advertiser application", app, required);
}

assertIncludes("wizard truthful steps", steps, "OFERTAS_LOCALES_WIZARD_STEPS");
assertIncludes("publish API submitter", publishSubmit, "/api/ofertas-locales/publish");
assertIncludes("owner checkout continuation", owner, "redirectToRevenueCategoryCheckout");

pass("Package 10 advertiser journey connects product, business, upload, scan, review, preview, checkout, submission, and owner continuation");
