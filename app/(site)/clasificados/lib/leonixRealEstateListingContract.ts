/**
 * Leonix Clasificados — BR + Rentas: structural contract for live listings (not publish preview).
 * Persist via `listings.detail_pairs` + `listings.status` + `is_published` + `boost_expires`.
 */

import type { BrNegocioCategoriaPropiedad } from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";

/** Keys in `detail_pairs` `{ label, value }[]` — keep ASCII labels stable for admin/dashboard filters. */
export const LEONIX_DP_BRANCH = "Leonix:branch";
export const LEONIX_DP_OPERATION = "Leonix:operation";
export const LEONIX_DP_CATEGORIA_PROPIEDAD = "Leonix:categoria_propiedad";
export const LEONIX_DP_LISTING_LIFECYCLE = "Leonix:listing_lifecycle";
export const LEONIX_DP_PROMOTED = "Leonix:promoted";
export const LEONIX_DP_PROMOTED_UNTIL = "Leonix:promoted_until";
/** Reserved for paid boost checkout handoff (Stripe or other). */
export const LEONIX_DP_CHECKOUT_SESSION_ID = "Leonix:stripe_checkout_session_id";

/** Machine-readable facets for BR/Rentas resultados + admin (stable ASCII `label` in `detail_pairs`). */
export const LEONIX_DP_BEDROOMS_COUNT = "Leonix:bedrooms_count";
export const LEONIX_DP_BATHROOMS_COUNT = "Leonix:bathrooms_count";
export const LEONIX_DP_PARKING_SPOTS = "Leonix:parking_spots";
export const LEONIX_DP_POSTAL_CODE = "Leonix:postal_code";
/** `true` | `false` when known from publish; omit when unknown. */
export const LEONIX_DP_PETS_ALLOWED = "Leonix:pets_allowed";
export const LEONIX_DP_FURNISHED = "Leonix:furnished";
export const LEONIX_DP_POOL = "Leonix:pool";
/** Raw subtype code from application (e.g. `casa`, `apartamento`, `oficina`). */
export const LEONIX_DP_PROPERTY_SUBTYPE = "Leonix:property_subtype";
/** Canonical resultados `propertyType` slug: `casa` | `departamento` | `terreno` | `comercial`. */
export const LEONIX_DP_RESULTS_PROPERTY_KIND = "Leonix:results_property_kind";

export const LEONIX_MACHINE_FACET_LABELS: readonly string[] = [
  LEONIX_DP_BEDROOMS_COUNT,
  LEONIX_DP_BATHROOMS_COUNT,
  LEONIX_DP_PARKING_SPOTS,
  LEONIX_DP_POSTAL_CODE,
  LEONIX_DP_PETS_ALLOWED,
  LEONIX_DP_FURNISHED,
  LEONIX_DP_POOL,
  LEONIX_DP_PROPERTY_SUBTYPE,
  LEONIX_DP_RESULTS_PROPERTY_KIND,
] as const;

export type BrResultsPropertyKind = "casa" | "departamento" | "terreno" | "comercial";

export type LeonixMachineFacetRead = {
  bedroomsCount: number | null;
  bathroomsCount: number | null;
  parkingSpots: number | null;
  postalCode: string | null;
  petsAllowed: boolean | null;
  furnished: boolean | null;
  pool: boolean | null;
  propertySubtype: string | null;
  resultsPropertyKind: BrResultsPropertyKind | null;
};

export type LeonixClasificadosBranch =
  | "bienes_raices_privado"
  | "bienes_raices_negocio"
  | "rentas_privado"
  | "rentas_negocio";

export type LeonixListingOperation = "sale" | "rent";

export type LeonixDetailLifecycle = "draft" | "published" | "unpublished" | "removed";

export const LEONIX_BRANCH_VALUES: readonly LeonixClasificadosBranch[] = [
  "bienes_raices_privado",
  "bienes_raices_negocio",
  "rentas_privado",
  "rentas_negocio",
] as const;

/** Exact `label` match in `detail_pairs` JSON (machine keys use ASCII `Leonix:*`). */
export function readLeonixDetailPairValue(detailPairs: unknown, label: string): string | null {
  if (!Array.isArray(detailPairs)) return null;
  for (const p of detailPairs) {
    if (!p || typeof p !== "object") continue;
    const o = p as { label?: string; value?: string };
    if (o.label === label) {
      const v = (o.value ?? "").trim();
      return v || null;
    }
  }
  return null;
}

function readPair(detailPairs: unknown, label: string): string | null {
  return readLeonixDetailPairValue(detailPairs, label);
}

function parseFiniteNumber(raw: string | null): number | null {
  if (!raw) return null;
  const n = Number(String(raw).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function parseTriBool(raw: string | null): boolean | null {
  if (!raw) return null;
  const v = raw.trim().toLowerCase();
  if (v === "true" || v === "1" || v === "yes" || v === "si" || v === "sí") return true;
  if (v === "false" || v === "0" || v === "no") return false;
  return null;
}

function parseResultsPropertyKind(raw: string | null): BrResultsPropertyKind | null {
  if (!raw) return null;
  const v = raw.trim().toLowerCase();
  if (v === "casa" || v === "departamento" || v === "terreno" || v === "comercial") return v;
  return null;
}

/** Read publish-time machine facets from `detail_pairs` (preferred over label heuristics). */
export function parseLeonixMachineFacetRead(detailPairs: unknown): LeonixMachineFacetRead {
  return {
    bedroomsCount: parseFiniteNumber(readPair(detailPairs, LEONIX_DP_BEDROOMS_COUNT)),
    bathroomsCount: parseFiniteNumber(readPair(detailPairs, LEONIX_DP_BATHROOMS_COUNT)),
    parkingSpots: parseFiniteNumber(readPair(detailPairs, LEONIX_DP_PARKING_SPOTS)),
    postalCode: readPair(detailPairs, LEONIX_DP_POSTAL_CODE),
    petsAllowed: parseTriBool(readPair(detailPairs, LEONIX_DP_PETS_ALLOWED)),
    furnished: parseTriBool(readPair(detailPairs, LEONIX_DP_FURNISHED)),
    pool: parseTriBool(readPair(detailPairs, LEONIX_DP_POOL)),
    propertySubtype: readPair(detailPairs, LEONIX_DP_PROPERTY_SUBTYPE),
    resultsPropertyKind: parseResultsPropertyKind(readPair(detailPairs, LEONIX_DP_RESULTS_PROPERTY_KIND)),
  };
}

export type LeonixListingContractSlice = {
  branch: LeonixClasificadosBranch | null;
  operation: LeonixListingOperation | null;
  categoriaPropiedad: BrNegocioCategoriaPropiedad | null;
  lifecycle: LeonixDetailLifecycle | null;
  promoted: boolean;
  promotedUntilIso: string | null;
  stripeCheckoutSessionId: string | null;
};

export function parseLeonixListingContract(detailPairs: unknown): LeonixListingContractSlice {
  const branchRaw = readPair(detailPairs, LEONIX_DP_BRANCH);
  const branch = LEONIX_BRANCH_VALUES.includes(branchRaw as LeonixClasificadosBranch)
    ? (branchRaw as LeonixClasificadosBranch)
    : null;

  const opRaw = (readPair(detailPairs, LEONIX_DP_OPERATION) ?? "").toLowerCase();
  const operation: LeonixListingOperation | null =
    opRaw === "sale" || opRaw === "rent" ? (opRaw as LeonixListingOperation) : null;

  const catRaw = readPair(detailPairs, LEONIX_DP_CATEGORIA_PROPIEDAD);
  const categoriaPropiedad: BrNegocioCategoriaPropiedad | null =
    catRaw === "residencial" || catRaw === "comercial" || catRaw === "terreno_lote" ? catRaw : null;

  const lifeRaw = (readPair(detailPairs, LEONIX_DP_LISTING_LIFECYCLE) ?? "").toLowerCase();
  const lifecycle: LeonixDetailLifecycle | null =
    lifeRaw === "draft" ||
    lifeRaw === "published" ||
    lifeRaw === "unpublished" ||
    lifeRaw === "removed"
      ? (lifeRaw as LeonixDetailLifecycle)
      : null;

  const promRaw = (readPair(detailPairs, LEONIX_DP_PROMOTED) ?? "").toLowerCase();
  const promoted = promRaw === "true" || promRaw === "1" || promRaw === "yes";

  return {
    branch,
    operation,
    categoriaPropiedad,
    lifecycle,
    promoted,
    promotedUntilIso: readPair(detailPairs, LEONIX_DP_PROMOTED_UNTIL),
    stripeCheckoutSessionId: readPair(detailPairs, LEONIX_DP_CHECKOUT_SESSION_ID),
  };
}

/** Live public detail (shared canonical path — branch-specific URLs redirect here). */
export function leonixLiveAnuncioPath(listingId: string): string {
  return `/clasificados/anuncio/${listingId}`;
}

/** Publish preview stays under `/clasificados/.../preview/...` — never treat as live. */
export function isLeonixPublishPreviewPath(pathname: string): boolean {
  return pathname.includes("/preview/");
}
