import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(path.join(repoRoot, p), "utf8");
const assertIncludes = (label, text, needle) => {
  if (!text.includes(needle)) throw new Error(`${label} missing ${needle}`);
};

const ownerList = read("app/(site)/dashboard/ofertas-locales/page.tsx");
const ownerDetail = read("app/(site)/dashboard/ofertas-locales/[id]/page.tsx");
const adminPage = read("app/admin/(dashboard)/workspace/clasificados/ofertas-locales/page.tsx");
const adminList = read("app/admin/(dashboard)/workspace/clasificados/ofertas-locales/OfertasLocalesAdminReviewList.tsx");
const renewalCenter = read("app/(site)/dashboard/ofertas-locales/[id]/OfertasLocalesOwnerRenewalActionCenter.tsx");
const status = read("app/lib/ofertas-locales/ofertasLocalesOperationalStatus.ts");

for (const marker of [
  "nextActionTitle",
  "blockers",
  "sourceReplaceAllowed",
  "scanRetryAllowed",
  "submitAllowed",
  "publicLinkAllowed",
]) {
  assertIncludes("owner ES/EN copy", ownerDetail, marker);
}

for (const marker of ["labelEs", "labelEn", "adminLabelEs", "adminLabelEn", "explanationEs", "explanationEn"]) {
  assertIncludes("status localization", status, marker);
}

for (const marker of [
  "overflow-x-auto",
  "min-w-[1000px]",
  "sm:flex-row",
  "sm:grid-cols",
  "min-h-11",
  "rounded-xl",
]) {
  assertIncludes("responsive owner/admin surfaces", `${ownerList}\n${ownerDetail}\n${adminList}\n${renewalCenter}`, marker);
}

for (const marker of [
  "<button",
  "<label",
  "required",
  "title=",
  "disabled:",
  "font-mono",
]) {
  assertIncludes("accessibility markers", `${ownerDetail}\n${adminPage}\n${adminList}`, marker);
}

console.log("PASS: Package 12 mobile, ES/EN, and accessibility markers are present on modified operations surfaces.");
