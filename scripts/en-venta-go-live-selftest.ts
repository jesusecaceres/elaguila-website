/**
 * Automated smoke / contract checks for En Venta go-live (no live Supabase required).
 * Run: npx tsx scripts/en-venta-go-live-selftest.ts
 */
import assert from "node:assert/strict";
import { isEnVentaListingPubliclyVisible } from "../app/(site)/clasificados/en-venta/lib/enVentaListingVisibility";
import { mapDbRowToEnVentaAnuncioDTO } from "../app/(site)/clasificados/en-venta/mapping/mapDbRowToEnVentaListingData";

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
  /** Legacy rows: `is_published` omitted still browse-visible when active (only explicit `false` hides). */
  assert.equal(isEnVentaListingPubliclyVisible(row({ status: "active" })), true);

  const dto = mapDbRowToEnVentaAnuncioDTO({
    id: "00000000-0000-4000-8000-000000000001",
    owner_id: "u1",
    title: "Test item",
    description: "Body",
    city: "San Francisco",
    zip: "94102",
    category: "en-venta",
    price: 12,
    is_free: false,
    seller_type: "business",
    business_name: "Acme",
    status: "active",
    is_published: true,
    created_at: new Date().toISOString(),
    images: [],
    detail_pairs: [
      { label: "Leonix:evDept", value: "electronicos" },
      { label: "Leonix:evSub", value: "phones" },
      { label: "Leonix:itemType", value: "phone" },
      { label: "Leonix:pickup", value: "1" },
      { label: "Leonix:ship", value: "0" },
      { label: "Leonix:delivery", value: "1" },
      { label: "Leonix:negotiable", value: "1" },
      { label: "Leonix:meetup", value: "0" },
      { label: "Leonix:brand", value: "AcmeBrand" },
      { label: "Leonix:model", value: "X1" },
      { label: "Leonix:plan", value: "pro" },
      { label: "Condición", value: "good" },
    ],
  });
  assert.equal(dto.sellerKind, "business");
  assert.equal(dto.businessName, "Acme");
  assert.equal(dto.departmentKey, "electronicos");
  assert.equal(dto.subKey, "phones");
  assert.equal(dto.negotiable, true);
  assert.equal(dto.fulfillment.pickup, true);
  assert.equal(dto.fulfillment.shipping, false);
  assert.equal(dto.fulfillment.delivery, true);
  assert.equal(dto.planTier, "pro");

  console.log("en-venta-go-live-selftest: OK");
}

main();
