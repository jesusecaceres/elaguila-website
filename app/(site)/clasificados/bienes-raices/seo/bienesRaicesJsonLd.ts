/**
 * Gate BIENES-NEGOCIO-2 — real, non-fabricated structured data for a published Bienes Raíces
 * property detail page.
 *
 * CORRECTION TO THE GATE-ZERO MRI: that document recorded "the canonical detail page emits
 * `@type: ClassifiedAd` with a relative url" for Bienes Raíces. Re-tracing for this gate shows the
 * `listing.category === "bienes-raices"` branch in `app/(site)/clasificados/anuncio/[id]/page.tsx`
 * RETURNS EARLY, before the generic `ClassifiedAd` block further down. Bienes Raíces therefore
 * emitted **no structured data at all**. The `ClassifiedAd` block belongs to the fall-through
 * categories only and is left untouched by this gate.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────────────
 * WHY THIS SHAPE (schema.org truth, not a type invented because the MRI named one)
 *
 * `RealEstateListing` is a real schema.org type — but it is a subtype of **WebPage**, i.e. it
 * describes the LISTING PAGE, not the building. It has no `numberOfBedrooms`, no
 * `numberOfBathroomsTotal` and no `floorSize`. Hanging those on it would be invalid vocabulary.
 *
 * So the accurate structure is two nodes:
 *   RealEstateListing (the page)  --mainEntity-->  the property itself
 *
 * The property node type is chosen from the category's OWN persisted
 * `Leonix:results_property_kind` facet, never guessed from prose:
 *   casa         -> SingleFamilyResidence   (an Accommodation: bedrooms/bathrooms/floorSize valid)
 *   departamento -> Apartment               (an Accommodation: same fields valid)
 *   terreno      -> Place                   (land is not Accommodation; Place is the honest type)
 *   comercial    -> Place                   (schema.org has no commercial-property type, and
 *                                            LocalBusiness would assert an operating business
 *                                            that a for-sale building is not)
 *
 * Because `Place` is not an Accommodation, bedroom/bathroom/floor-area properties are OMITTED for
 * terreno and comercial rather than emitted where the vocabulary does not define them.
 *
 * PRICE lives on an `Offer`, never on the listing node: `price` must be a NUMBER. The page's
 * `priceLabel` is a formatted string ("$850,000") and is deliberately not used here. `Offer` also
 * carries the real sale-vs-rent business function from `Leonix:operation`.
 *
 * NO RATINGS, STRUCTURALLY. Like the Restaurantes and Comida Local builders, this contract has no
 * rating or review-count parameter at all, so no owner-entered value can reach `aggregateRating`
 * here or via any future caller.
 *
 * PRIVACY — three rules, all enforced by the caller passing already-gated values:
 *   1. `streetAddress` is emitted ONLY when the caller proves the seller opted in
 *      (`Leonix:br:show_exact_address` === "true"). Default is closed.
 *   2. `postalCode`, city, region and country are the category's own declared public set — the
 *      listing contract states verbatim that without the exact-address opt-in, public surfaces may
 *      still use "city / zona / CP". Region and country come from `Leonix:state` / `Leonix:country`
 *      and are OMITTED when absent — never hardcoded (the generic `ClassifiedAd` block hardcodes
 *      `addressRegion: "CA"`, which is fabricated for any listing outside California; this builder
 *      does not repeat that).
 *   3. No agent/owner personal address is ever emitted. The seller node carries business identity
 *      only (name, phone, site), and only when real.
 *
 * Pure: no I/O, no React, no Supabase.
 */

import { readLeonixDetailPairValue } from "@/app/clasificados/lib/leonixRealEstateListingContract";

export type BienesRaicesJsonLdPropertyKind = "casa" | "departamento" | "terreno" | "comercial";

/**
 * Reads a square-foot number out of the human detail pairs the publish path already writes
 * ("Pies cuadrados" / "Sq ft" / "Lote" / …). Returns null for "—" or anything non-numeric — a
 * missing area is omitted from the schema, never emitted as 0.
 */
export function brSqftFromDetailPairs(detailPairs: unknown, labels: readonly string[]): number | null {
  for (const label of labels) {
    const raw = (readLeonixDetailPairValue(detailPairs, label) ?? "").trim();
    if (!raw || raw === "—") continue;
    const match = raw.replace(/,/g, "").match(/\d+(\.\d+)?/);
    if (!match) continue;
    const n = Number(match[0]);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

/**
 * Business identity for the seller node, read from the SAME `business_meta` keys the live detail
 * shell and the published-row parser already use. Business fields only — no personal address, and
 * every field is omitted when absent rather than defaulted.
 */
export function parseBrBusinessMetaForSeo(raw: unknown): {
  agentName: string | null;
  telephone: string | null;
  website: string | null;
} {
  let meta: Record<string, unknown> = {};
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    meta = raw as Record<string, unknown>;
  } else if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        meta = parsed as Record<string, unknown>;
      }
    } catch {
      /* a malformed business_meta simply yields no seller fields */
    }
  }
  const pick = (key: string): string | null => {
    const v = meta[key];
    return typeof v === "string" && v.trim() ? v.trim() : null;
  };
  return {
    agentName: pick("negocioAgente"),
    telephone: pick("negocioTelOficina"),
    website: pick("negocioSitioWeb"),
  };
}

export type BienesRaicesJsonLdInput = {
  /** Absolute canonical URL — the same value the page declares as its canonical. */
  url: string;
  /** Public listing title. */
  name: string;
  description?: string;
  /** Public gallery image URLs (already durable/public). */
  images?: readonly string[];
  /** Stable public identifier (Leonix ad id) — real identity, never a generated one. */
  leonixAdId?: string | null;
  /** Canonical row id. */
  listingId?: string | null;
  datePosted?: string | null;

  /** Persisted `Leonix:results_property_kind`. Omitted -> the property node is a plain Place. */
  propertyKind?: BienesRaicesJsonLdPropertyKind | null;
  /** Human property subtype label, when the seller actually chose one. */
  propertySubtype?: string | null;

  city?: string | null;
  /** From `Leonix:state` — omitted when absent, never defaulted. */
  addressRegion?: string | null;
  /** From `Leonix:country` — omitted when absent, never defaulted. */
  addressCountry?: string | null;
  /** From `Leonix:postal_code` — part of the category's declared public set. */
  postalCode?: string | null;
  /** ONLY pass this when the exact-address opt-in is genuinely true. */
  streetAddress?: string | null;

  /** Real machine facets; null/absent means "not published", never zero. */
  bedrooms?: number | null;
  bathrooms?: number | null;
  /** Interior area in square feet, when a real number was published. */
  floorSizeSqft?: number | null;
  /** Lot area in square feet, when a real number was published. */
  lotSizeSqft?: number | null;

  /** Numeric price. Null/0 or a free listing emits no Offer at all. */
  priceNumber?: number | null;
  /** `sale` | `rent` from `Leonix:operation`. */
  operation?: "sale" | "rent" | null;
  /** Seller-declared availability from `Leonix:br:listing_status`. */
  listingStatus?: string | null;

  /** Business identity — emitted only when a real name exists. */
  sellerBusinessName?: string | null;
  sellerAgentName?: string | null;
  sellerTelephone?: string | null;
  sellerUrl?: string | null;
};

function clean(raw: unknown): string {
  return typeof raw === "string" ? raw.trim() : "";
}

function positiveNumber(raw: unknown): number | null {
  if (typeof raw !== "number" || !Number.isFinite(raw) || raw <= 0) return null;
  return raw;
}

function propertyNodeType(kind: BienesRaicesJsonLdPropertyKind | null | undefined): string {
  switch (kind) {
    case "casa":
      return "SingleFamilyResidence";
    case "departamento":
      return "Apartment";
    // terreno / comercial / unknown -> see the header: Place is the honest type.
    default:
      return "Place";
  }
}

/** Only Accommodation subtypes may carry bedroom/bathroom/floor-area vocabulary. */
function isAccommodationNode(nodeType: string): boolean {
  return nodeType === "SingleFamilyResidence" || nodeType === "Apartment";
}

/**
 * `Leonix:br:listing_status` -> a schema.org ItemAvailability, but ONLY for the two values that
 * have an honest equivalent. `bajo_contrato` / `pendiente` have no faithful mapping (they are
 * neither "in stock" nor "sold out" in schema.org's sense), so availability is omitted rather than
 * approximated.
 */
function availabilityFor(listingStatus: string | null | undefined): string | null {
  const s = clean(listingStatus).toLowerCase();
  if (s === "disponible") return "https://schema.org/InStock";
  if (s === "vendido") return "https://schema.org/SoldOut";
  return null;
}

function sqftValue(value: number): Record<string, unknown> {
  return {
    "@type": "QuantitativeValue",
    value,
    unitCode: "FTK", // UN/CEFACT code for square foot
  };
}

export function bienesRaicesPropertyJsonLd(input: BienesRaicesJsonLdInput): Record<string, unknown> {
  const url = clean(input.url);

  // ── address (privacy-gated by the caller) ───────────────────────────────────────────────────
  const address: Record<string, unknown> = { "@type": "PostalAddress" };
  const street = clean(input.streetAddress);
  if (street) address.streetAddress = street;
  const city = clean(input.city);
  if (city) address.addressLocality = city;
  const region = clean(input.addressRegion);
  if (region) address.addressRegion = region;
  const postal = clean(input.postalCode);
  if (postal) address.postalCode = postal;
  const country = clean(input.addressCountry);
  if (country) address.addressCountry = country;
  const hasAddress = Object.keys(address).length > 1;

  // ── the property itself ─────────────────────────────────────────────────────────────────────
  const nodeType = propertyNodeType(input.propertyKind);
  const property: Record<string, unknown> = { "@type": nodeType, name: clean(input.name) };
  if (hasAddress) property.address = address;
  const subtype = clean(input.propertySubtype);
  if (subtype) property.additionalType = subtype;

  if (isAccommodationNode(nodeType)) {
    const beds = positiveNumber(input.bedrooms);
    if (beds != null) property.numberOfBedrooms = beds;
    const baths = positiveNumber(input.bathrooms);
    if (baths != null) property.numberOfBathroomsTotal = baths;
    const floor = positiveNumber(input.floorSizeSqft);
    if (floor != null) property.floorSize = sqftValue(floor);
  }
  // `lotSize` is not schema.org vocabulary on Accommodation/Place, so a real lot area is expressed
  // as an explicit, labelled additionalProperty rather than an invented field name.
  const lot = positiveNumber(input.lotSizeSqft);
  if (lot != null) {
    property.additionalProperty = [
      { "@type": "PropertyValue", name: "lotSize", value: lot, unitCode: "FTK" },
    ];
  }

  // ── the listing page ────────────────────────────────────────────────────────────────────────
  const json: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    url,
    name: clean(input.name),
    mainEntity: property,
  };
  const description = clean(input.description);
  if (description) json.description = description;
  const images = (input.images ?? []).map(clean).filter(Boolean);
  if (images.length > 0) json.image = images;
  const datePosted = clean(input.datePosted);
  if (datePosted) json.datePosted = datePosted;

  // Real public identity only — never a generated identifier.
  const leonixAdId = clean(input.leonixAdId);
  if (leonixAdId) json.identifier = leonixAdId;
  else {
    const listingId = clean(input.listingId);
    if (listingId) json.identifier = listingId;
  }

  // ── offer (numeric price only) ──────────────────────────────────────────────────────────────
  const price = positiveNumber(input.priceNumber);
  if (price != null) {
    const offer: Record<string, unknown> = {
      "@type": "Offer",
      price,
      priceCurrency: "USD",
      itemOffered: property,
    };
    if (input.operation === "rent") offer.businessFunction = "https://schema.org/LeaseOut";
    else if (input.operation === "sale") offer.businessFunction = "https://schema.org/Sell";
    const availability = availabilityFor(input.listingStatus);
    if (availability) offer.availability = availability;
    json.offers = offer;
  }

  // ── seller / brokerage identity (business only, only when real) ─────────────────────────────
  const businessName = clean(input.sellerBusinessName) || clean(input.sellerAgentName);
  if (businessName) {
    const seller: Record<string, unknown> = { "@type": "RealEstateAgent", name: businessName };
    const telephone = clean(input.sellerTelephone);
    if (telephone) seller.telephone = telephone;
    const sellerUrl = clean(input.sellerUrl);
    if (sellerUrl) seller.url = sellerUrl;
    const agentName = clean(input.sellerAgentName);
    if (agentName && agentName !== businessName) {
      seller.employee = { "@type": "Person", name: agentName };
    }
    json.provider = seller;
  }

  return json;
}
