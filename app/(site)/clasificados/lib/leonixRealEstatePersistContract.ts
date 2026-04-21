/**
 * Shared Leonix BR/Rentas persistence: structural keys in `detail_pairs` alongside human-facing facts.
 * Live anuncio + admin filters read these via `leonixRealEstateListingContract.ts`.
 */

import {
  LEONIX_DP_BRANCH,
  LEONIX_DP_CATEGORIA_PROPIEDAD,
  LEONIX_DP_LISTING_LIFECYCLE,
  LEONIX_DP_OPERATION,
  LEONIX_MACHINE_FACET_LABELS,
  type LeonixClasificadosBranch,
} from "@/app/clasificados/lib/leonixRealEstateListingContract";
import type { BrNegocioCategoriaPropiedad } from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";

export type LeonixListingPersistOperation = "sale" | "rent";

/** Replace any prior contract rows with the same label, then append (stable order: facts first, contract last). */
export function mergeLeonixListingContractDetailPairs(
  humanFactPairs: Array<{ label: string; value: string }>,
  args: {
    branch: LeonixClasificadosBranch;
    operation: LeonixListingPersistOperation;
    categoriaPropiedad: BrNegocioCategoriaPropiedad;
    lifecycle?: "draft" | "published" | "unpublished" | "removed";
    /** Stable machine facets (Leonix:* labels) — written before the structural branch/operation tail. */
    machineFacetPairs?: Array<{ label: string; value: string }>;
  }
): Array<{ label: string; value: string }> {
  const machineSet = new Set(LEONIX_MACHINE_FACET_LABELS as readonly string[]);
  const tailLabels = new Set<string>([
    LEONIX_DP_BRANCH,
    LEONIX_DP_OPERATION,
    LEONIX_DP_CATEGORIA_PROPIEDAD,
    LEONIX_DP_LISTING_LIFECYCLE,
  ]);
  const reservedHuman = new Set<string>([...LEONIX_MACHINE_FACET_LABELS, ...tailLabels]);
  const base = humanFactPairs.filter((p) => p.label && p.value && !reservedHuman.has(p.label));
  const machine = (args.machineFacetPairs ?? []).filter((p) => p.label && p.value && machineSet.has(p.label));
  const life = args.lifecycle ?? "published";
  return [
    ...base,
    ...machine,
    { label: LEONIX_DP_BRANCH, value: args.branch },
    { label: LEONIX_DP_OPERATION, value: args.operation },
    { label: LEONIX_DP_CATEGORIA_PROPIEDAD, value: args.categoriaPropiedad },
    { label: LEONIX_DP_LISTING_LIFECYCLE, value: life },
  ];
}
