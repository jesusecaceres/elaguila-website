/**
 * Leading markers for Restaurantes publish chips (decorative only; labels stay the accessible name).
 */

export type RestaurantePublishChipLeading =
  | { kind: "emoji"; emoji: string }
  | { kind: "brand"; brand: "zelle" | "venmo" | "cash_app" | "paypal" }
  | { kind: "pill"; text: string; className: string };
