import type { BrNegocioCategoriaPropiedad } from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import type { BrResultsPropertyKind } from "@/app/clasificados/lib/leonixRealEstateListingContract";

export type NegocioAdvertiserKind = "agente" | "equipo" | "oficina" | "constructor";

export type BrListingBadge =
  | "negocio"
  | "destacada"
  | "reducida"
  | "open_house"
  | "tour_virtual"
  | "nuevo"
  | "planos"
  | "comercial"
  | "promocionada";

export type BrNegocioListing = {
  id: string;
  imageUrl: string;
  price: string;
  title: string;
  addressLine: string;
  beds: string;
  baths: string;
  sqft: string;
  year?: string;
  /** Particular vs negocio / inmobiliaria — URL `sellerType` + card rhythm. */
  sellerKind?: "privado" | "negocio";
  /** Structural category (residencial / comercial / terreno_lote) — filters on results, not Negocio application logic. */
  categoriaPropiedad: BrNegocioCategoriaPropiedad;
  badges: BrListingBadge[];
  advertiser: {
    kind: NegocioAdvertiserKind;
    name: string;
    photoUrl?: string;
    subtitle?: string;
  };
  trustChip?: string;
  metaLines?: string[];
  openHouse?: string;
  operationLabel?: string;
  licenseLine?: string;
  /** Card rhythm: wide row vs stacked */
  layout?: "vertical" | "horizontal";
  /** US ZIP when publish captures it — URL `zip` filter when present. */
  zipCode?: string;
  /** State code from `Leonix:state` when publish-backed. */
  stateCode?: string;
  /** Country from `Leonix:country` when publish-backed. */
  country?: string;
  /** Canonical `propertyType` URL slug when publish wrote `Leonix:results_property_kind`. */
  resultsPropertyKind?: BrResultsPropertyKind | null;
  /** Structured amenity signals from `Leonix:*` machine rows (`null` = unknown / not asserted). */
  facetPool?: boolean | null;
  facetPets?: boolean | null;
  facetFurnished?: boolean | null;
  /**
   * Sort key for “reciente” in `filterBrListings`: demo rows set explicitly; live rows use
   * max(`created_at`,`updated_at`,`published_at`) from `mapBrListingRowToNegocioCard`.
   */
  demoPublishedAtMs?: number;
  /** Stripped listing description for `q` search (not shown on cards). */
  searchBlob?: string;
  /**
   * Optional monetization metadata for future badge/CTA enhancements.
   * Currently not used prominently on cards; reserved for future placement signals.
   */
  adPlanLabel?: string;
  adPlanKey?: "paid_private" | "paid_business" | "unknown";
  monetizationWarnings?: string[];
  placementSignals?: string[];
};
