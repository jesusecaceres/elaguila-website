/**
 * Item 210 — build a real `BrNegocioListing` (the same type/shape the live results grid renders)
 * from the BR Privado preview VM, so the seller sees the ACTUAL results-card component before
 * publishing, not an approximation. Mirrors the already-proven Rentas pattern
 * (`buildRentasResultCardPreviewListingFromPrivadoVm`).
 */

import type { BienesRaicesPrivadoPreviewVm } from "./bienesRaicesPrivadoPreviewVm";
import type { BrNegocioListing } from "@/app/clasificados/bienes-raices/resultados/cards/listingTypes";

function factValue(vm: BienesRaicesPrivadoPreviewVm, label: string): string {
  return vm.quickFacts.find((f) => f.label === label)?.value ?? "—";
}

export function buildBrResultCardPreviewListing(vm: BienesRaicesPrivadoPreviewVm): BrNegocioListing {
  const kind: "casa" | "comercial" | "terreno" =
    vm.categoria === "comercial" ? "comercial" : vm.categoria === "terreno_lote" ? "terreno" : "casa";

  return {
    id: "preview",
    imageUrl: vm.media.heroUrl ?? "",
    price: vm.priceDisplay,
    title: vm.heroTitle || "—",
    addressLine: vm.addressLine,
    beds: factValue(vm, "Recámaras"),
    baths: factValue(vm, "Baños"),
    sqft: factValue(vm, "Interior"),
    sellerKind: "privado",
    categoriaPropiedad: vm.categoria,
    resultsPropertyKind: kind,
    badges: [],
    advertiser: {
      kind: "agente",
      name: vm.seller.name || "—",
      photoUrl: vm.seller.photoUrl ?? undefined,
      subtitle: vm.seller.byOwnerLabel || undefined,
    },
    operationLabel: vm.operationSummary,
    layout: "vertical",
  };
}
