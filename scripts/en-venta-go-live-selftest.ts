/**
 * Automated smoke / contract checks for En Venta go-live (no live Supabase required).
 * Run: npx tsx scripts/en-venta-go-live-selftest.ts
 */
import assert from "node:assert/strict";
import { isEnVentaListingPubliclyVisible } from "../app/(site)/clasificados/en-venta/lib/enVentaListingVisibility";
import { mapDbRowToEnVentaAnuncioDTO } from "../app/(site)/clasificados/en-venta/mapping/mapDbRowToEnVentaListingData";
import { getOrderedEnVentaImageUrls } from "../app/(site)/clasificados/en-venta/preview/buildEnVentaPreviewModel";
import { buildEnVentaPublishSuccessUrls } from "../app/(site)/clasificados/en-venta/shared/constants/enVentaResultsRoutes";
import { createEmptyEnVentaFreeState } from "../app/(site)/clasificados/publicar/en-venta/free/application/schema/enVentaFreeFormState";

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
  assert.equal((dto.conditionKey ?? "").toLowerCase(), "good");
  assert.equal(dto.meetupOffered, false);

  /** Post-publish browse handoff must serialize the same params `EnVentaResultsClient` reads (`evDept`, `evSub`, `city`). */
  const successUrls = buildEnVentaPublishSuccessUrls("es", {
    rama: "electronicos",
    evSub: "phones",
    city: "San Francisco",
  });
  const scoped = new URL(successUrls.scopedUrl, "https://leonix.example");
  assert.equal(scoped.searchParams.get("evDept"), "electronicos");
  assert.equal(scoped.searchParams.get("evSub"), "phones");
  assert.equal(scoped.searchParams.get("city"), "San Francisco");
  assert.equal(scoped.searchParams.get("lang"), "es");

  /** Primary image index must match publish + preview ordering (`publishEnVentaFromDraft` uses this order for uploads). */
  const imgState = createEmptyEnVentaFreeState();
  imgState.images = ["https://a.example/1.jpg", "https://b.example/2.jpg", "https://c.example/3.jpg"];
  imgState.primaryImageIndex = 1;
  assert.deepEqual(getOrderedEnVentaImageUrls(imgState), [
    "https://b.example/2.jpg",
    "https://a.example/1.jpg",
    "https://c.example/3.jpg",
  ]);

  console.log("en-venta-go-live-selftest: OK");
}

main();
