export type CategoryKey =
  | "servicios"
  | "empleos"
  | "rentas"
  | "en-venta"
  | "autos"
  | "restaurantes"
  | "clases"
  | "comunidad"
  | "travel";

type CategoryConfig = {
  label: { es: string; en: string };
  futureFilters: string[];
};

export const categoryConfig: Record<CategoryKey, CategoryConfig> = {
  servicios: {
    label: { es: "Servicios", en: "Services" },
    futureFilters: ["location", "type"],
  },
  empleos: {
    label: { es: "Empleos", en: "Jobs" },
    futureFilters: ["jobType", "location", "pay"],
  },
  rentas: {
    label: { es: "Rentas", en: "Rentals" },
    futureFilters: ["bedrooms", "price", "location"],
  },
  "en-venta": {
    label: { es: "En Venta", en: "For Sale" },
    futureFilters: ["condition", "price"],
  },
  autos: {
    label: { es: "Autos", en: "Cars" },
    futureFilters: ["make", "model", "year"],
  },
  restaurantes: {
    label: { es: "Restaurantes", en: "Restaurants" },
    // Restaurants are discovery-first. Keep filters intentionally light at launch.
    // Future: price range, open now, delivery/pickup, etc.
    futureFilters: ["location", "cuisine"],
  },
  clases: {
    label: { es: "Clases", en: "Classes" },
    futureFilters: ["level", "schedule"],
  },
  comunidad: {
    label: { es: "Comunidad", en: "Community" },
    futureFilters: ["location"],
  },
  travel: {
    label: { es: "Viajes", en: "Travel" },
    futureFilters: ["mode", "dates", "location"],
  },
};
