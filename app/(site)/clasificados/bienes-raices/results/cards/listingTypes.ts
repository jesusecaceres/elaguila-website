export type NegocioAdvertiserKind = "agente" | "equipo" | "oficina" | "constructor";

export type BrListingBadge =
  | "negocio"
  | "destacada"
  | "reducida"
  | "open_house"
  | "tour_virtual"
  | "nuevo"
  | "planos"
  | "comercial";

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
};
