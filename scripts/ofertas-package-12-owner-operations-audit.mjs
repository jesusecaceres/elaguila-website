import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(path.join(repoRoot, p), "utf8");
const assertIncludes = (label, text, needle) => {
  if (!text.includes(needle)) throw new Error(`${label} missing ${needle}`);
};
const assertNotIncludes = (label, text, needle) => {
  if (text.includes(needle)) throw new Error(`${label} must not include ${needle}`);
};

const helpers = read("app/lib/ofertas-locales/ofertasLocalesOwnerHelpers.ts");
const list = read("app/(site)/dashboard/ofertas-locales/page.tsx");
const detail = read("app/(site)/dashboard/ofertas-locales/[id]/page.tsx");

for (const marker of [
  "operationalStatus: OfertaLocalOperationalStatus",
  "detail.operationalStatus",
  "safe.operationalStatus",
  "publicLinkAllowed",
  "editAllowed",
  "parseOfertaLocalOwnerSafeRejectionNote",
]) {
  assertIncludes("owner helpers", helpers, marker);
}

for (const marker of [
  "item.operationalStatus.ownerNextAction",
  "item.operationalStatus.blockingReasons",
  "colNext",
  "publicResultsHref",
]) {
  assertIncludes("owner list", list, marker);
}

for (const marker of [
  "offer.operationalStatus.ownerNextAction",
  "offer.operationalStatus.blockingReasons",
  "sourceReplacementAllowed",
  "scanRetryAllowed",
  "submissionAllowed",
  "publicLinkAllowed",
  "OfertasLocalesOwnerRenewalActionCenter",
]) {
  assertIncludes("owner detail", detail, marker);
}

for (const forbidden of ["fake leads", "refund", "approve listing", "cart"]) {
  assertNotIncludes("owner operations", `${list}\n${detail}`.toLowerCase(), forbidden);
}

console.log("PASS: Package 12 owner operations surface uses derived status, blockers, actions, and safe public links.");
