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

function readPair(detailPairs: unknown, label: string): string | null {
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
