export type Restaurant = {
  id: string;
  name: string;
  cuisine?: string;
  city?: string;
  address?: string;
  phone?: string;
  text?: string;
  email?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  googleMapsUrl?: string;
  couponsUrl?: string;
  verified?: boolean;
  supporter?: "Corona" | "Corona de Oro";
};

// R1 (Discovery): start empty; businesses will populate via R2 self-serve posting.
// Keep placeholder-safe UI (no fake businesses shipped).
export const restaurants: Restaurant[] = [];
