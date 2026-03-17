export type CategoryKey =
  | "all"
  | "servicios"
  | "empleos"
  | "rentas"
  | "en-venta"
  | "bienes-raices"
  | "autos"
  | "restaurantes"
  | "clases"
  | "comunidad"
  | "travel";

type CategoryConfig = {
  label: { es: string; en: string };
  futureFilters: string[];
};

/** Global filters for Todos (cat=all). Use only this for the filters drawer when category is "all"; do not show Servicios-specific options. */
export const globalFiltersForTodos: never[] = [];

export const categoryConfig: Record<CategoryKey, CategoryConfig> = {
  all: {
    label: { es: "Todos", en: "All" },
    futureFilters: [],
  },
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
  "bienes-raices": {
    label: { es: "Bienes Raíces", en: "Real Estate" },
    futureFilters: ["propertyType", "price", "location"],
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

/** Servicios drawer filters: options shown only when cat=servicios. Do NOT use for Todos (cat=all). */
export type ServiciosDrawerOption = {
  key: string;
  label: { es: string; en: string };
  paramKey: string;
};

export type ServiciosDrawerFiltersConfig = {
  /** Servicios-only (A domicilio, En local, Urgente). For cat=servicios only; never for Todos. */
  universal: ServiciosDrawerOption[];
  byStype: Record<
    string,
    { sectionLabel: { es: string; en: string }; options: ServiciosDrawerOption[] }
  >;
};

export const serviciosDrawerFilters: ServiciosDrawerFiltersConfig = {
  universal: [
    { key: "mobile", label: { es: "A domicilio", en: "Comes to you" }, paramKey: "sv_mobile" },
    { key: "shop", label: { es: "En local", en: "At shop" }, paramKey: "sv_shop" },
    { key: "247", label: { es: "Urgente / 24-7", en: "Emergency / 24-7" }, paramKey: "sv_247" },
  ],
  byStype: {
    mechanic: {
      sectionLabel: { es: "Servicios mecánicos", en: "Mechanical services" },
      options: [
        { key: "smog", label: { es: "Smog", en: "Smog" }, paramKey: "sv_mech_smog" },
        { key: "grua", label: { es: "Grúa", en: "Towing" }, paramKey: "sv_mech_grua" },
        { key: "llantas", label: { es: "Llantas", en: "Tires" }, paramKey: "sv_mech_llantas" },
        { key: "cambio-aceite", label: { es: "Cambio de aceite", en: "Oil change" }, paramKey: "sv_mech_cambio_aceite" },
        { key: "lavado-autos", label: { es: "Lavado de autos", en: "Car wash" }, paramKey: "sv_mech_lavado_autos" },
        { key: "detallado", label: { es: "Detallado", en: "Detailing" }, paramKey: "sv_mech_detallado" },
        { key: "carroceria", label: { es: "Carrocería", en: "Body work" }, paramKey: "sv_mech_carroceria" },
        { key: "vidrios-parabrisas", label: { es: "Vidrios y parabrisas", en: "Glass & windshield" }, paramKey: "sv_mech_vidrios_parabrisas" },
        { key: "baterias", label: { es: "Baterías", en: "Batteries" }, paramKey: "sv_mech_baterias" },
        { key: "alineacion", label: { es: "Alineación", en: "Alignment" }, paramKey: "sv_mech_alineacion" },
      ],
    },
  },
};
