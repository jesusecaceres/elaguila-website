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
  menuUrl?: string;
  price?: "$" | "$$" | "$$$" | "$$$$";
  tags?: string[];
  highlights?: string[];
  photos?: string[]; // image URLs
  popularItems?: { name: string; price?: string; note?: string }[];
  hoursNote?: string;
  verified?: boolean;
  supporter?: "Corona" | "Corona de Oro";
  reviewSummary?: {
    ratingAvg?: number;
    ratingCount?: number;
    recommendPct?: number;
    topMentions?: string[];
    updatedAt?: string; // ISO
  };
};

// R1 (Discovery): start empty; businesses will populate via R2 self-serve posting.
// Keep placeholder-safe UI (no fake businesses shipped).
export const restaurants: Restaurant[] = [];
