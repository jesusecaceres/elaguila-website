/**
 * Package 3 — Viajes Community Opportunity Intake data contract (owner lock 2026-08-25).
 *
 * The intake is the mandatory first step for a brand-new Viajes BUSINESS submission: a short,
 * mobile-first form that gives Leonix early visibility into the opportunity BEFORE the provider
 * completes the full application. It persists as an additive `intake` block inside the existing
 * `viajes_staged_listings.listing_json` versioned envelope (see `viajesStagedListingTypes.ts`) on
 * an early row with `lifecycle_status: "draft"` — ONE row identity from first intake to
 * publication. No new table, no second draft system.
 *
 * Lives beside the staged-listing types (not under `publicar/`) because it is part of the staged
 * JSON storage contract, consumed by the publish UI, the API routes, admin, and tests alike.
 *
 * Doctrine: free to participate, curated for community value, reviewed before publication.
 * The intake block is an auditable snapshot — the full application never rewrites it.
 */

/** Reused/extended offer-type vocabulary. The first five match the existing negocios select. */
export const VIAJES_INTAKE_OFFER_TYPES = [
  "paquete",
  "tour",
  "crucero",
  "resort",
  "escapada",
  // Package 3 additions (intake + full application select both accept these):
  "transporte",
  "agencia-servicio",
  "viaje-grupo",
  "viaje-familiar",
  "viaje-religioso",
  "viaje-educativo",
  "otro",
] as const;
export type ViajesIntakeOfferType = (typeof VIAJES_INTAKE_OFFER_TYPES)[number];

export const VIAJES_INTAKE_PRICE_BASIS = ["per_person", "couple", "family", "group"] as const;
export type ViajesIntakePriceBasis = (typeof VIAJES_INTAKE_PRICE_BASIS)[number];

/**
 * Community-benefit taxonomy (owner-locked list). Bilingual/Spanish-language service is
 * deliberately NOT a benefit type here — the existing negocios fields `guiaEspanol` /
 * `idiomaAtencion` already model language capabilities and the full application collects them.
 */
export const VIAJES_INTAKE_BENEFIT_TYPES = [
  "exclusive_discount",
  "reduced_booking_fee",
  "free_consultation",
  "payment_plan",
  "family_discount",
  "child_discount",
  "group_discount",
  "senior_discount",
  "free_upgrade",
  "free_transportation",
  "added_amenity",
  "exclusive_dates",
  "community_pricing",
  "other",
] as const;
export type ViajesIntakeBenefitType = (typeof VIAJES_INTAKE_BENEFIT_TYPES)[number];

export const VIAJES_INTAKE_SAME_PUBLIC_OFFER = ["same", "extra", "partial"] as const;
export type ViajesIntakeSamePublicOffer = (typeof VIAJES_INTAKE_SAME_PUBLIC_OFFER)[number];

export const VIAJES_INTAKE_VALUE_BANDS = [
  "lt25",
  "25_50",
  "51_100",
  "101_250",
  "gt250",
  "non_monetary",
] as const;
export type ViajesIntakeValueBand = (typeof VIAJES_INTAKE_VALUE_BANDS)[number];

export type ViajesIntakeCommunityBenefit = {
  types: ViajesIntakeBenefitType[];
  /** Exact written description of the benefit — required whenever a benefit is claimed. */
  description: string;
  samePublicOffer: ViajesIntakeSamePublicOffer | "";
  estimatedValueBand: ViajesIntakeValueBand | "";
  expiration: string;
  /** Includes blackout dates / qualification notes (merged by design — no separate field). */
  restrictions: string;
};

export type ViajesIntakeV1 = {
  schemaVersion: 1;
  /** REUSE fields — prefill 1:1 into ViajesNegociosDraft (see mapViajesIntakeToNegociosDraft). */
  businessName: string;
  email: string;
  phone: string;
  website: string;
  /** Freeform social line — prefills the negocios legacy `socials` field. */
  socials: string;
  offerType: ViajesIntakeOfferType | "";
  destino: string;
  ciudadSalida: string;
  /** Approximate normal/public price, free text like the negocios `precio` field. */
  precio: string;
  /** NEW intake-only truth (never duplicated into negocios fields). */
  contactName: string;
  priceBasis: ViajesIntakePriceBasis | "";
  communityBenefit: ViajesIntakeCommunityBenefit;
  /** ISO timestamp set server-side at intake save. */
  completedAt: string;
};

export function emptyViajesIntakeCommunityBenefit(): ViajesIntakeCommunityBenefit {
  return {
    types: [],
    description: "",
    samePublicOffer: "",
    estimatedValueBand: "",
    expiration: "",
    restrictions: "",
  };
}

export function emptyViajesIntake(): ViajesIntakeV1 {
  return {
    schemaVersion: 1,
    businessName: "",
    email: "",
    phone: "",
    website: "",
    socials: "",
    offerType: "",
    destino: "",
    ciudadSalida: "",
    precio: "",
    contactName: "",
    priceBasis: "",
    communityBenefit: emptyViajesIntakeCommunityBenefit(),
    completedAt: "",
  };
}

/** Input length caps (enforced server-side; mirrored client-side as maxLength). */
export const VIAJES_INTAKE_MAX_LENGTHS = {
  businessName: 160,
  contactName: 120,
  email: 200,
  phone: 40,
  website: 300,
  socials: 300,
  destino: 160,
  ciudadSalida: 120,
  precio: 60,
  benefitDescription: 2000,
  benefitExpiration: 200,
  benefitRestrictions: 2000,
} as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+()\-.\s\d]{7,40}$/;

function clip(v: unknown, max: number): string {
  return String(v ?? "").trim().slice(0, max);
}

/** Prepends https:// to bare domains; leaves empty and already-schemed values alone. */
export function normalizeViajesIntakeWebsite(raw: string): string {
  const v = raw.trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  return `https://${v}`;
}

export type ViajesIntakeValidationResult =
  | { ok: true; intake: ViajesIntakeV1 }
  | { ok: false; errors: string[] };

/**
 * Server-side normalization + validation of a client-submitted intake. Never trusts enum values:
 * anything outside the allowlists is rejected. `completedAt` is always stamped server-side.
 */
export function normalizeViajesIntakeInput(raw: unknown): ViajesIntakeValidationResult {
  const errors: string[] = [];
  const b = (raw ?? {}) as Record<string, unknown>;
  const cbRaw = (b.communityBenefit ?? {}) as Record<string, unknown>;
  const L = VIAJES_INTAKE_MAX_LENGTHS;

  const businessName = clip(b.businessName, L.businessName);
  const contactName = clip(b.contactName, L.contactName);
  const email = clip(b.email, L.email);
  const phone = clip(b.phone, L.phone);
  const website = normalizeViajesIntakeWebsite(clip(b.website, L.website));
  const socials = clip(b.socials, L.socials);
  const destino = clip(b.destino, L.destino);
  const ciudadSalida = clip(b.ciudadSalida, L.ciudadSalida);
  const precio = clip(b.precio, L.precio);

  if (!businessName) errors.push("business_name_required");
  if (!contactName) errors.push("contact_name_required");
  if (!email) errors.push("email_required");
  else if (!EMAIL_RE.test(email)) errors.push("email_invalid");
  if (!phone) errors.push("phone_required");
  else if (!PHONE_RE.test(phone)) errors.push("phone_invalid");
  if (!destino) errors.push("destination_required");

  const offerTypeRaw = clip(b.offerType, 40);
  const offerType = (VIAJES_INTAKE_OFFER_TYPES as readonly string[]).includes(offerTypeRaw)
    ? (offerTypeRaw as ViajesIntakeOfferType)
    : "";
  if (!offerType) errors.push("offer_type_required");

  const priceBasisRaw = clip(b.priceBasis, 20);
  const priceBasis = (VIAJES_INTAKE_PRICE_BASIS as readonly string[]).includes(priceBasisRaw)
    ? (priceBasisRaw as ViajesIntakePriceBasis)
    : "";

  const typesRaw = Array.isArray(cbRaw.types) ? cbRaw.types : [];
  const types = [
    ...new Set(
      typesRaw
        .map((t) => clip(t, 40))
        .filter((t): t is ViajesIntakeBenefitType =>
          (VIAJES_INTAKE_BENEFIT_TYPES as readonly string[]).includes(t),
        ),
    ),
  ];

  const samePublicOfferRaw = clip(cbRaw.samePublicOffer, 20);
  const samePublicOffer = (VIAJES_INTAKE_SAME_PUBLIC_OFFER as readonly string[]).includes(samePublicOfferRaw)
    ? (samePublicOfferRaw as ViajesIntakeSamePublicOffer)
    : "";
  if (!samePublicOffer) errors.push("same_public_offer_required");

  const valueBandRaw = clip(cbRaw.estimatedValueBand, 20);
  const estimatedValueBand = (VIAJES_INTAKE_VALUE_BANDS as readonly string[]).includes(valueBandRaw)
    ? (valueBandRaw as ViajesIntakeValueBand)
    : "";

  const description = clip(cbRaw.description, L.benefitDescription);
  const expiration = clip(cbRaw.expiration, L.benefitExpiration);
  const restrictions = clip(cbRaw.restrictions, L.benefitRestrictions);

  // A claimed benefit must be described in writing.
  if (samePublicOffer !== "same" && samePublicOffer !== "" && types.length > 0 && !description) {
    errors.push("benefit_description_required");
  }

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    intake: {
      schemaVersion: 1,
      businessName,
      contactName,
      email,
      phone,
      website,
      socials,
      offerType,
      destino,
      ciudadSalida,
      precio,
      priceBasis,
      communityBenefit: {
        types,
        description,
        samePublicOffer,
        estimatedValueBand,
        expiration,
        restrictions,
      },
      completedAt: new Date().toISOString(),
    },
  };
}

/**
 * TRUE when the intake actually asserts a community benefit: the offer gives Leonix something
 * beyond the public offer AND names at least one benefit type with a written description.
 * `samePublicOffer: "same"` is never a claim — that listing is ordinary useful discovery.
 */
export function viajesIntakeClaimsBenefit(intake: ViajesIntakeV1): boolean {
  const cb = intake.communityBenefit;
  return (
    (cb.samePublicOffer === "extra" || cb.samePublicOffer === "partial") &&
    cb.types.length > 0 &&
    cb.description.trim().length > 0
  );
}

/** Provisional staged-row title for an intake-stage row (replaced by the real offer title at full submit). */
export function viajesIntakeProvisionalTitle(intake: ViajesIntakeV1): string {
  const name = intake.businessName.trim();
  const dest = intake.destino.trim();
  return dest ? `${name} — ${dest}` : name;
}
