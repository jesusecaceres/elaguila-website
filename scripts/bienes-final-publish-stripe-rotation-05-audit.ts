/**
 * BR-FINAL-PUBLISH-STRIPE-ROTATION-05 — repo validator for launch gate artifacts.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function exists(rel: string): boolean {
  return fs.existsSync(path.join(root, rel));
}

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

type Row = { requirement: string; pass: boolean; evidence: string };

const rows: Row[] = [];

function check(req: string, pass: boolean, evidence: string) {
  rows.push({ requirement: req, pass, evidence });
}

check("Audit file exists", exists("app/lib/clasificados/bienes-raices/BIENES_BR_FINAL_PUBLISH_STRIPE_ROTATION_05_AUDIT.md"), "BIENES_BR_FINAL_PUBLISH_STRIPE_ROTATION_05_AUDIT.md");

const audit = exists("app/lib/clasificados/bienes-raices/BIENES_BR_FINAL_PUBLISH_STRIPE_ROTATION_05_AUDIT.md")
  ? read("app/lib/clasificados/bienes-raices/BIENES_BR_FINAL_PUBLISH_STRIPE_ROTATION_05_AUDIT.md")
  : "";

check("TRUE/FALSE table in audit", audit.includes("Requirement | TRUE/FALSE"), "audit markdown");

check(
  "Similar listings fetch exists",
  exists("app/(site)/clasificados/bienes-raices/lib/fetchBrSimilarOtherClientListingsBrowser.ts"),
  "fetchBrSimilarOtherClientListingsBrowser.ts",
);

const similarSrc = exists("app/(site)/clasificados/bienes-raices/lib/fetchBrSimilarOtherClientListingsBrowser.ts")
  ? read("app/(site)/clasificados/bienes-raices/lib/fetchBrSimilarOtherClientListingsBrowser.ts")
  : "";

check("Current listing excluded", similarSrc.includes('.neq("id", args.currentListingId)'), "similar query");
check("Same group excluded", similarSrc.includes("excludeGroup"), "group filter");

check(
  "Stripe checkout route implemented",
  exists("app/api/clasificados/leonix/stripe/checkout/route.ts") &&
    !read("app/api/clasificados/leonix/stripe/checkout/route.ts").includes("leonix_checkout_not_enabled"),
  "checkout route",
);

check(
  "Stripe verify route exists",
  exists("app/api/clasificados/leonix/stripe/checkout/verify/route.ts"),
  "verify route",
);

check(
  "Pending payment publish mode",
  read("app/(site)/clasificados/lib/leonixPublishRealEstateListingCore.ts").includes("pending_payment"),
  "leonixPublishRealEstateListingCore.ts",
);

check(
  "Payment activation service",
  exists("app/lib/clasificados/bienes-raices/brListingPaymentService.ts"),
  "brListingPaymentService.ts",
);

check(
  "Similar UI wired in detail layout",
  read("app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx").includes("BrSimilarOtherClientPropertiesSection"),
  "EnVentaAnuncioLayout.tsx",
);

const pkg = read("package.json");
check(
  "npm script registered",
  pkg.includes("bienes:final-publish-stripe-rotation-05"),
  "package.json scripts",
);

const failed = rows.filter((r) => !r.pass);

console.log("\nBR-FINAL-PUBLISH-STRIPE-ROTATION-05 audit script\n");
for (const r of rows) {
  console.log(`${r.pass ? "PASS" : "FAIL"} — ${r.requirement} (${r.evidence})`);
}
console.log(`\n${rows.length - failed.length}/${rows.length} checks passed\n`);

if (failed.length) {
  process.exit(1);
}
