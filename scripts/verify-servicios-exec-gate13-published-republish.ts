/**
 * Servicios Final Consolidated Lifecycle Execution — Gate 13 (published edit/republish,
 * 2026-09-18).
 *
 * Dashboard -> Edit -> Preview -> "Publish" already correctly kept an already-published row
 * published on save (`decideServiciosOwnerSaveStatus`'s `published -> published` transition,
 * proven by Gate 7's own regression guard) and already PATCHed the SAME row/UUID (Gate 6) with
 * zero Stripe calls (`handlePublishFromPreview` never calls checkout). What was missing:
 *   - No republish audit metadata was ever recorded (republished_at/republish_count/actor), even
 *     though the DB schema already has the columns (migration
 *     20260509120000_classifieds_republish_capability.sql, same shape already used by the admin
 *     "republish" named action in app/api/admin/servicios/listings/[id]/route.ts).
 *   - The CTA still read "Publish"/"Publicar" for a republish of an already-live listing.
 *   - The post-save redirect always set `justPublished=1`, which triggers the public detail
 *     page's congratulatory "just published" panel even when the listing was already live.
 *
 * Fix: the publish route now records republish audit metadata (source "owner", actor =
 * server-verified ownerUserId) ONLY when the save keeps an ALREADY-published row published (never
 * a first-time transition into published). The Preview CTA reads "Guardar y republicar"/"Save &
 * Republish" for that case, and the redirect no longer sets `justPublished=1`. The DB-generated
 * `republish_sort_at` ranking column is deliberately left unwired from any ranking query in this
 * pass (Gate 14's territory) — this gate only writes the audit columns.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-exec-gate13-published-republish.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";

const failures: string[] = [];
function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK: ${name}`);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    console.error(`FAIL: ${name}\n  ${e instanceof Error ? e.message : String(e)}`);
  }
}
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}
const raw = (rel: string) =>
  stripComments(readFileSync(new URL(`../${rel}`, import.meta.url), "utf8").replace(/\r\n/g, "\n"));

const ROUTE = "app/api/clasificados/servicios/publish/route.ts";
const PREVIEW = "app/(site)/clasificados/publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx";

check("the publish route records republish audit metadata only when an already-published row stays published", () => {
  const src = raw(ROUTE);
  const idx = src.indexOf("let republishAuditPatch: Record<string, unknown> = {};");
  assert.ok(idx > 0);
  const block = src.slice(idx, idx + 700);
  assert.ok(block.includes('existingStatus.trim().toLowerCase() === "published" && nextStatus === "published"'), "must be gated on the row ALREADY being published, not a first-time transition");
  assert.ok(block.includes("republished_at: now,"));
  assert.ok(block.includes("republish_count: Number(republishRow?.republish_count ?? 0) + 1,"));
  assert.ok(block.includes('last_republished_source: "owner",'));
  assert.ok(block.includes("last_republished_by: ownerUserId ?? null,"));
});

check("the republish audit patch is applied to the SAME update as the content save (same row/UUID, single PATCH)", () => {
  const src = raw(ROUTE);
  const idx = src.indexOf(".update({\n            business_name: businessName,");
  assert.ok(idx > 0);
  const block = src.slice(idx, idx + 350);
  assert.ok(block.includes("...republishAuditPatch,"));
});

check("REGRESSION GUARD: this branch never calls Stripe / creates a subscription — a plain content PATCH only", () => {
  const src = raw(ROUTE);
  const idx = src.indexOf("let republishAuditPatch: Record<string, unknown> = {};");
  const end = src.indexOf("} else if (existingListingIdRaw) {", idx);
  const block = src.slice(idx, end);
  assert.ok(!/stripe/i.test(block), "must not touch Stripe in the owner content-save branch");
  assert.ok(!/leonix_subscription_records/.test(block), "must not touch subscription records here");
});

check("REGRESSION GUARD: republish_sort_at is not wired into any ranking/order-by logic in this pass", () => {
  const src = raw(ROUTE);
  assert.ok(!src.includes("republish_sort_at"), "Gate 13 only writes the audit columns; ranking wiring is Gate 14's scope");
});

check("Preview CTA reads 'Guardar y republicar' / 'Save & Republish' for an already-published listing-bound row", () => {
  const src = raw(PREVIEW);
  assert.ok(src.includes("const isRepublishOfPublished = listingBoundPreview && listingBoundStatus?.trim().toLowerCase() === SERVICIOS_LISTING_STATUS_PUBLISHED;"));
  const idx = src.indexOf("{isRepublishOfPublished");
  assert.ok(idx > 0);
  const block = src.slice(idx, idx + 500);
  assert.ok(block.includes('"Save & Republish"') && block.includes('"Guardar y republicar"'));
});

check("the post-save redirect no longer claims 'just published' for a republish of an already-live listing", () => {
  const src = raw(PREVIEW);
  assert.ok(src.includes('if (!isRepublishOfPublished) q.set("justPublished", "1");'));
});

check("REGRESSION GUARD: a genuinely fresh (non listing-bound) publish is untouched — still sets justPublished and still reads 'Publish'/'Publicar'", () => {
  const src = raw(PREVIEW);
  assert.ok(src.includes('"Publish"') && src.includes('"Publicar"'));
});

if (failures.length) {
  console.error(`\nverify-servicios-exec-gate13-published-republish: ${failures.length} failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nverify-servicios-exec-gate13-published-republish: PASS");
