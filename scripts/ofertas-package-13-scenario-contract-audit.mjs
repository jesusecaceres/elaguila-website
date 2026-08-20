import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scenarioFile = "tests/ofertas-locales/scenarios/ofertasPackage13Scenarios.ts";
const text = readFileSync(path.join(repoRoot, scenarioFile), "utf8");
const need = (needle) => {
  if (!text.includes(needle)) throw new Error(`Scenario contract missing ${needle}`);
};

for (const key of [
  "FLYER_DRAFT", "FLYER_SOURCE_READY", "FLYER_SCAN_QUEUED", "FLYER_SCAN_ACTIVE",
  "FLYER_SCAN_PARTIAL_FAILURE", "FLYER_REVIEW_INCOMPLETE", "FLYER_READY_FOR_PREVIEW",
  "FLYER_PAYMENT_REQUIRED", "FLYER_READY_TO_SUBMIT", "FLYER_PENDING_REVIEW",
  "FLYER_CHANGES_REQUESTED", "FLYER_RESUBMITTED", "FLYER_ACTIVE", "FLYER_EXPIRING",
  "FLYER_EXPIRED", "FLYER_RENEWAL_SCHEDULED", "COUPON_DRAFT", "COUPON_REVIEW_INCOMPLETE",
  "COUPON_READY_FOR_PREVIEW", "COUPON_PENDING_REVIEW", "COUPON_CHANGES_REQUESTED",
  "COUPON_ACTIVE", "COUPON_EXPIRED", "ADMIN_APPROVAL_BLOCKED", "ADMIN_APPROVAL_READY",
  "ADMIN_ACTIVATION_INCOMPLETE", "ADMIN_RECOVERY_REQUIRED", "SHOPPER_EMPTY_RESULTS",
  "SHOPPER_PRODUCT_AVAILABLE", "SHOPPER_COUPON_AVAILABLE", "SHOPPER_ITEM_UNAVAILABLE",
  "SHOPPER_EXPIRED_PARENT",
]) need(key);

for (const field of [
  "parentId", "leonixAdId", "ownerId", "productKey", "sourceVersionId", "scanJobId",
  "childIds", "reviewCounts", "commercialState", "submissionState", "publicTermState",
  "renewalState", "expectedOwnerStatus", "expectedAdminStatus", "expectedPublicEligibility",
  "expectedActions", "prohibitedActions",
]) need(field);

if (text.includes("http://") || text.includes("https://")) throw new Error("Scenarios must not contain live URLs.");
if (!text.includes("qa-ofertas-parent-")) throw new Error("Scenarios must use non-production parent IDs.");

console.log("PASS: Package 13 deterministic scenario contract is complete and non-production.");
