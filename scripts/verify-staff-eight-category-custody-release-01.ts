/**
 * LEONIX STAFF GATEWAY — Gate 6 custody / preview / same-row claim transfer.
 * Run: npx tsx --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-staff-eight-category-custody-release-01.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  createProspectPreviewTokenWithSecret,
  verifyProspectPreviewTokenWithSecret,
} from "../app/lib/auth/prospectPreviewToken";
import {
  createAssistedPublishingTokenWithSecret,
  verifyAssistedPublishingTokenWithSecret,
} from "../app/lib/auth/assistedPublishingToken";
import {
  LISTING_OWNER_COLUMN,
  planLinkedListingOwnerTransfer,
} from "../app/lib/business/ownership/linkedListingOwnerTransfer";
import { QUICK_SALES_CATEGORY_MAP } from "../app/lib/sales/quickSalesCategories";

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");
const PREVIEW_SECRET = "preview-secret-harness-only";
const ASSISTED_SECRET = "assisted-secret-harness-only";
const NOW = 1_800_000_000_000;

const failures: string[] = [];
const passed: string[] = [];
let checks = 0;
function check(name: string, fn: () => void) {
  checks += 1;
  try {
    fn();
    passed.push(name);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
  }
}

function main() {
  check("A1: owner-null staff families never require a client user", () => {
    for (const descriptor of Object.values(QUICK_SALES_CATEGORY_MAP)) {
      assert.equal(descriptor.requiresClientUserId, false, descriptor.category);
    }
  });

  check("A2: owner-null transfer plans the same listing IDs and never copies", () => {
    const claimer = "user-claim";
    const plan = planLinkedListingOwnerTransfer({
      claimerUserId: claimer,
      listings: [
        { listingSource: "servicios_public_listings", listingId: "svc-1", currentOwner: null },
        { listingSource: "restaurantes_public_listings", listingId: "rest-1", currentOwner: "" },
        { listingSource: "listings", listingId: "rent-1", currentOwner: null },
        { listingSource: "autos_classifieds_listings", listingId: "auto-1", currentOwner: claimer },
        { listingSource: "empleos_public_listings", listingId: "job-1", currentOwner: "someone-else" },
      ],
    });
    assert.equal(plan.ok, true);
    if (!plan.ok) throw new Error("unreachable");
    assert.deepEqual(plan.listingIds, ["svc-1", "rest-1", "rent-1", "auto-1", "job-1"]);
    assert.equal(plan.updates.length, 3);
    assert.equal(plan.updates[0]?.ownerColumn, "owner_user_id");
    assert.equal(plan.updates[2]?.ownerColumn, "owner_id");
    assert.equal(plan.updates.every((u) => u.nextOwner === claimer), true);
    assert.equal(plan.skipped.find((s) => s.listingId === "auto-1")?.reason, "already_claimer");
    assert.equal(plan.skipped.find((s) => s.listingId === "job-1")?.reason, "foreign_owner");
  });

  check("A3: missing claimer fails closed", () => {
    const plan = planLinkedListingOwnerTransfer({ claimerUserId: "  ", listings: [] });
    assert.equal(plan.ok, false);
    if (!plan.ok) assert.equal(plan.error, "missing_claimer");
  });

  check("A4: accept route transfers after RPC; RPC itself still uses caller client", () => {
    const route = read("app/api/business/ownership-claim/accept/route.ts");
    assert.ok(route.includes("acceptOwnershipClaim(callerClient"));
    assert.ok(route.includes("transferLinkedListingsOnAcceptedClaim"));
    assert.ok(route.includes("listingIds"));
    assert.ok(route.includes("transfer.recorded !== true"));
    assert.ok(route.includes("status: 409"));
    const repo = read("app/lib/business/ownership/repository.ts");
    assert.ok(repo.includes('callerClient.rpc("accept_business_ownership_claim"'));
    assert.equal(repo.includes("getAdminSupabase().rpc(\"accept_business_ownership_claim\""), false);
  });

  check("A5: unapplied SQL transfers owner-null linked rows in place, never INSERT listings", () => {
    const sql = read("supabase/migrations/20260922180000_accept_claim_transfer_linked_listing_owners.sql");
    assert.ok(sql.includes("AND owner_user_id IS NULL"));
    assert.ok(sql.includes("AND owner_id IS NULL"));
    assert.ok(sql.includes("UPDATE public.servicios_public_listings"));
    assert.ok(sql.includes("UPDATE public.listings SET owner_id"));
    assert.equal(/INSERT INTO public\.listings/i.test(sql), false);
    assert.equal(/INSERT INTO public\.servicios_public_listings/i.test(sql), false);
    assert.ok(sql.includes("Additive, unapplied"));
  });

  check("A6: owner column map covers every assisted listing source", () => {
    assert.equal(LISTING_OWNER_COLUMN.listings, "owner_id");
    assert.equal(LISTING_OWNER_COLUMN.servicios_public_listings, "owner_user_id");
    assert.equal(LISTING_OWNER_COLUMN.autos_classifieds_listings, "owner_user_id");
    assert.equal(LISTING_OWNER_COLUMN.comida_local_public_listings, "owner_user_id");
  });

  check("B1: preview token expiry and tamper fail closed", () => {
    const token = createProspectPreviewTokenWithSecret(
      {
        category: "servicios",
        listingSource: "servicios_public_listings",
        listingId: "listing-1",
        businessId: "biz-1",
        issuedByRosterId: "roster-1",
        ttlSec: 3600,
      },
      PREVIEW_SECRET,
      NOW,
    );
    assert.ok(token);
    assert.ok(verifyProspectPreviewTokenWithSecret(token, "servicios", PREVIEW_SECRET, NOW + 1000));
    assert.equal(verifyProspectPreviewTokenWithSecret(token, "servicios", PREVIEW_SECRET, NOW + 3600_001), null);
    assert.equal(verifyProspectPreviewTokenWithSecret(token, "restaurantes", PREVIEW_SECRET, NOW + 1000), null);
    const [payload, sig] = token!.split(".");
    const decoded = JSON.parse(Buffer.from(payload!, "base64url").toString("utf8")) as Record<string, unknown>;
    decoded.listingId = "other";
    const tampered = `${Buffer.from(JSON.stringify(decoded), "utf8").toString("base64url")}.${sig}`;
    assert.equal(verifyProspectPreviewTokenWithSecret(tampered, "servicios", PREVIEW_SECRET, NOW + 1000), null);
  });

  check("B2: assisted HMAC tamper/expiry fail closed", () => {
    const token = createAssistedPublishingTokenWithSecret(
      {
        rosterId: "roster-1",
        authUserId: "staff-1",
        category: "servicios",
        businessId: "biz-1",
        listingId: "listing-1",
        packageKey: "servicios_quick_monthly",
        assistedAction: "save_for_client",
      },
      ASSISTED_SECRET,
      NOW,
    );
    assert.ok(token);
    assert.ok(verifyAssistedPublishingTokenWithSecret(token, ASSISTED_SECRET, NOW + 1000));
    assert.equal(verifyAssistedPublishingTokenWithSecret(token, ASSISTED_SECRET, NOW + 3_600_001), null);
    assert.equal(verifyAssistedPublishingTokenWithSecret(`${token}x`, ASSISTED_SECRET, NOW + 1000), null);
  });

  check("C1: no second custody table; linked_by is attribution", () => {
    const custody = read("app/lib/business/assistedListingCustody.ts");
    assert.ok(custody.includes("business_listing_links"));
    assert.ok(custody.includes("`linked_by` is attribution"));
    assert.equal(custody.includes("leonix_managed_custody"), false);
    assert.equal(read("app/lib/business/ownership/linkedListingOwnerTransfer.ts").includes("leonix_managed_custody"), false);
  });

  console.log(`\n${passed.length}/${checks} passed`);
  for (const p of passed) console.log(`  OK   ${p}`);
  if (failures.length) {
    console.error(`\n${failures.length} FAILED`);
    for (const f of failures) console.error(`  FAIL ${f}`);
    process.exit(1);
  }
  console.log("\nverify-staff-eight-category-custody-release-01: ALL CHECKS EXECUTED AND PASSED");
}

main();
