/**
 * Automated smoke / contract checks for En Venta go-live (no live Supabase required).
 * Run: npx tsx scripts/en-venta-go-live-selftest.ts
 */
import assert from "node:assert/strict";
import { isEnVentaListingPubliclyVisible } from "../app/(site)/clasificados/en-venta/lib/enVentaListingVisibility";

function row(p: Record<string, unknown>) {
  return { category: "en-venta", ...p };
}

function main() {
  assert.equal(isEnVentaListingPubliclyVisible(row({ status: "active", is_published: true })), true);
  assert.equal(isEnVentaListingPubliclyVisible(row({ status: "draft", is_published: false })), false);
  assert.equal(isEnVentaListingPubliclyVisible(row({ status: "active", is_published: false })), false);
  assert.equal(isEnVentaListingPubliclyVisible(row({ status: "removed", is_published: false })), false);
  assert.equal(isEnVentaListingPubliclyVisible(row({ status: "sold", is_published: true })), false);
  assert.equal(isEnVentaListingPubliclyVisible({ category: "rentas", status: "active", is_published: true }), false);

  console.log("en-venta-go-live-selftest: OK");
}

main();
