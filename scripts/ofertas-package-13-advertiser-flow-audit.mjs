import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(path.join(repoRoot, p), "utf8");
const scenario = read("tests/ofertas-locales/scenarios/ofertasPackage13Scenarios.ts");
const app = read("app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx");
const publish = read("app/api/ofertas-locales/publish/route.ts");
const preview = read("app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewCard.tsx");

for (const key of [
  "FLYER_DRAFT", "FLYER_READY_FOR_PREVIEW", "FLYER_PAYMENT_REQUIRED", "FLYER_READY_TO_SUBMIT",
  "FLYER_CHANGES_REQUESTED", "COUPON_READY_FOR_PREVIEW", "COUPON_CHANGES_REQUESTED",
]) {
  if (!scenario.includes(key)) throw new Error(`Advertiser scenario missing ${key}`);
}

for (const marker of ["requestedProduct", "draft.offerType", "effectiveOfertaLocalId", "OfertasLocalesAiScanPanel", "OfertaLocalAiReviewGateState"]) {
  if (!app.includes(marker)) throw new Error(`Advertiser application missing ${marker}`);
}

for (const marker of ["parentMatchesDraftLane", "validateOfertaLocalSubmissionEntitlement", "getAiReviewCounts", "validateAiReviewScanJob", "pending_review"]) {
  if (!publish.includes(marker)) throw new Error(`Publish flow missing ${marker}`);
}

if (!preview.includes("Vista previa") && !preview.includes("Preview")) throw new Error("Preview truth copy missing.");
if (scenario.includes("optional AI") || scenario.includes("$598")) throw new Error("Stale advertiser contract leaked into scenarios.");

console.log("PASS: Package 13 advertiser flyer/coupon deterministic flow is certified.");
