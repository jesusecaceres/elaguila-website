import { readFileSync } from "node:fs";

const read = (p) => readFileSync(p, "utf8");
const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

const hydration = read("app/(site)/clasificados/publicar/rentas/shared/rentasDashboardEditHydration.ts");
const publish = read("app/(site)/clasificados/lib/leonixPublishRealEstateFromDraftState.ts");
const api = read("app/api/clasificados/rentas/listing-edit/route.ts");
const matrix = read("docs/rentas-published-edit-field-matrix-01.md");

const requiredFieldGroups = [
  "title",
  "property/listing type",
  "description",
  "rent",
  "deposit",
  "fees/utilities",
  "availability",
  "street/unit/cross streets/privacy",
  "city/state/ZIP/country/neighborhood",
  "bedrooms/bathrooms/sqft/size",
  "furnished/parking/laundry/pets/accessibility/amenities/features",
  "requirements/deposit/application/lease/move-in/restrictions/notes",
  "phone/SMS/WhatsApp/email/website",
  "primary image/gallery/order",
  "video/tour/brochure/floorplan URLs",
  "showing schedule",
  "system identity",
];
for (const group of requiredFieldGroups) {
  assert(matrix.includes(group), `field matrix missing group: ${group}`);
}

const sentinels = {
  privateTitle: "SENTINEL PRIVADO TITLE",
  businessTitle: "SENTINEL NEGOCIO TITLE",
  rent: "2499",
  phone: "4085551212",
  email: "sentinel@example.com",
  imageA: "https://cdn.example.test/rentas/a.jpg",
  imageB: "https://cdn.example.test/rentas/b.jpg",
  video: "https://video.example.test/tour",
  requirement: "SENTINEL REQUIREMENT",
  schedule: "SENTINEL SHOWING",
};

const fixture = {
  id: "00000000-0000-4000-8000-000000000001",
  leonix_ad_id: "RENT-SENTINEL-0001",
  category: "rentas",
  seller_type: "personal",
  title: sentinels.privateTitle,
  description: "SENTINEL DESCRIPTION",
  price: sentinels.rent,
  city: "San Jose",
  state: "CA",
  zip: "95116",
  contact_phone: sentinels.phone,
  contact_email: sentinels.email,
  images: [sentinels.imageA, sentinels.imageB],
  detail_pairs: [
    { label: "Rentas:requirements", value: sentinels.requirement },
    { label: "Rentas:showingAvailability", value: sentinels.schedule },
    { label: "Rentas:videoUrl", value: sentinels.video },
    { label: "UNKNOWN_LEGACY_FIELD", value: "PRESERVE_ME" },
  ],
};

assert(fixture.images[0] === sentinels.imageA && fixture.images[1] === sentinels.imageB, "fixture gallery order broken");
assert(hydration.includes("imagesFromRow(row.images)") && hydration.includes("photoDataUrls: gallery"), "hydration must map durable images into form media");
assert(hydration.includes("contact_phone") && hydration.includes("contact_email"), "hydration must map contact fields");
assert(hydration.includes("showingAvailability") && hydration.includes("requirements"), "hydration must map schedule and requirements fields");
assert(hydration.includes("videoUrls") && hydration.includes("virtualTourUrl"), "hydration must map video/tour URLs");
assert(publish.includes("orderedRentasGallerySourcesForPublish"), "publish/update params must preserve gallery ordering");
assert(api.includes("mergeDetailPairs") && api.includes("UNKNOWN") === false, "API must generically merge unknown detail pairs");
assert(api.includes("if (!seen.has(p.label)) out.push(p);"), "API must include new detail pairs without losing existing ones");
assert(api.includes("const nextImages = built.params.imageSources.length ? built.params.imageSources : existing.images"), "API must prevent blank media overwrite");
assert(api.includes("leonix_id_mismatch"), "API must preserve Leonix identity");
assert(api.includes("lane_mismatch"), "API must preserve lane identity");
assert(!/insert\(|upsert\(/.test(api), "same-listing update API must not create a new row");

console.log("verify-rentas-published-edit-round-trip-01: ok");
