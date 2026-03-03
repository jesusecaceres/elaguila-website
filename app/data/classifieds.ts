export type ClassifiedItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  createdAt: string;

  // Optional structured fields (used progressively; safe if missing)
  city?: string;
  zip?: string;

  // Servicios structured fields
  serviceGroup?: "home-garden" | "autos" | "health-beauty" | "more";
  serviceType?: string; // normalized key (e.g., landscaping, mechanic, tow)
  serviceVisit?: "comes" | "shop";
  serviceAvail?: "anytime" | "weekends" | "evenings" | "appointment";
  serviceFeatures?: string[]; // per-subtype feature keys
};

export const classifieds: ClassifiedItem[] = [];
