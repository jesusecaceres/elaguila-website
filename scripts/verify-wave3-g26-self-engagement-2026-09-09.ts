/**
 * Globalization Wave 3 G26 — self-engagement gaps (an owner acting on their own listing).
 * Fixes two real, evidence-backed gaps: (1) Rentas' own live listing detail page mounted
 * LeonixSaveButton/LeonixLikeButton with no `ownerUserId`, so the shared self-engagement guard
 * never fired for Rentas even though the enclosing component already had the owner id in scope;
 * (2) neither Report implementation (the shared LeonixInlineListingReport action or En Venta's
 * own reason-code drawer) checked listing ownership at all, so an owner could report their own
 * listing. Source-level checks only.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
let pass = 0;
let fail = 0;

function read(rel: string): string {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

function check(label: string, condition: boolean): void {
  if (condition) {
    pass += 1;
    console.log(`  ok  - ${label}`);
  } else {
    fail += 1;
    console.error(`  FAIL - ${label}`);
  }
}

console.log("verify-wave3-g26-self-engagement-2026-09-09: starting");

// --- 1. Rentas live detail page now threads ownerUserId to Save/Like ---
{
  const f = read("app/(site)/clasificados/rentas/listing/[id]/RentasListingDetailClient.tsx");
  check(
    "RENTAS 1: LeonixSaveButton now receives ownerUserId (was previously mounted with none)",
    f.includes("ownerUserId={listing.ownerId}"),
  );
  check(
    "RENTAS 2: both the Privado and Negocio RentasVisualMatchPreviewView calls now pass ownerId",
    (f.match(/ownerId=\{listing\.ownerId\}/g) ?? []).length >= 2,
  );
}
{
  const f = read("app/(site)/clasificados/rentas/preview/shared/RentasVisualMatchPreviewView.tsx");
  check(
    "RENTAS 3: the embedded LeonixLikeButton now receives ownerUserId from the component's own ownerId prop",
    f.includes("ownerUserId={ownerId}"),
  );
}

// --- 2. Report ownership checks added to both implementations ---
{
  const f = read("app/admin/actions.ts");
  check(
    "REPORT 1: submitListingReportAction (shared LeonixInlineListingReport backend) now checks ownership before inserting",
    f.includes("isSelfEngagement(reporterId, ownerRow?.owner_id ?? null)") &&
      f.includes('throw new Error("You cannot report your own listing.")'),
  );
}
{
  const f = read("app/(site)/clasificados/en-venta/report/submitEnVentaListingReport.ts");
  check(
    "REPORT 2: submitEnVentaListingReport now checks ownership before inserting",
    f.includes("isSelfEngagement(input.reporterId, listing?.owner_id ?? null)") &&
      f.includes('{ ok: false, error: "self_report_not_allowed" }'),
  );
}
{
  const f = read("app/api/clasificados/en-venta/report/route.ts");
  check(
    "REPORT 3: the En Venta report API surfaces the self-report rejection as its own status instead of a generic 500",
    f.includes('result.error === "self_report_not_allowed"') && f.includes("status: 403"),
  );
}

console.log(`\nverify-wave3-g26-self-engagement-2026-09-09: ${pass}/${pass + fail} checks passed`);
if (fail > 0) process.exit(1);
