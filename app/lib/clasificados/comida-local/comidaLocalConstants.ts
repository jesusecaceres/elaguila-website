import type {
  ComidaLocalFoodType,
  ComidaLocalLanguageOption,
  ComidaLocalPaymentMethod,
  ComidaLocalPriceLevel,
  ComidaLocalSectionKey,
  ComidaLocalServiceOption,
} from "./comidaLocalTypes";

export const COMIDA_LOCAL_CATEGORY_KEY = "comida-local" as const;
export const COMIDA_LOCAL_PRODUCT_NAME = "Comida Local";

export const COMIDA_LOCAL_FOOD_TYPE_OPTIONS: ReadonlyArray<{
  value: ComidaLocalFoodType;
  label: string;
}> = [
  { value: "tacos", label: "Tacos" },
  { value: "pupusas", label: "Pupusas" },
  { value: "tamales", label: "Tamales" },
  { value: "antojitos", label: "Antojitos" },
  { value: "postres", label: "Postres" },
  { value: "bebidas", label: "Bebidas" },
  { value: "mariscos", label: "Mariscos" },
  { value: "comida-casera", label: "Comida casera" },
  { value: "comida-eventos", label: "Comida para eventos" },
  { value: "otro", label: "Otro" },
];

export const COMIDA_LOCAL_SERVICE_OPTIONS: ReadonlyArray<{
  value: ComidaLocalServiceOption;
  label: string;
}> = [
  { value: "pickup", label: "Para recoger" },
  { value: "delivery", label: "Entrega" },
  { value: "in_person", label: "Solo en persona" },
];

export const COMIDA_LOCAL_PAYMENT_OPTIONS: ReadonlyArray<{
  value: ComidaLocalPaymentMethod;
  label: string;
}> = [
  { value: "cash", label: "Efectivo" },
  { value: "zelle", label: "Zelle" },
  { value: "cash_app", label: "Cash App" },
  { value: "venmo", label: "Venmo" },
  { value: "card", label: "Tarjeta" },
  { value: "other", label: "Otro" },
];

export const COMIDA_LOCAL_PRICE_LEVEL_OPTIONS: ReadonlyArray<{
  value: ComidaLocalPriceLevel;
  label: string;
}> = [
  { value: "1", label: "$" },
  { value: "2", label: "$$" },
  { value: "3", label: "$$$" },
];

export const COMIDA_LOCAL_LANGUAGE_OPTIONS: ReadonlyArray<{
  value: ComidaLocalLanguageOption;
  label: string;
}> = [
  { value: "es", label: "Español" },
  { value: "en", label: "Inglés" },
  { value: "bilingual", label: "Bilingüe" },
];

export const COMIDA_LOCAL_SECTIONS: ReadonlyArray<{
  key: ComidaLocalSectionKey;
  title: string;
}> = [
  { key: "identidad", title: "Identidad" },
  { key: "zona", title: "Zona" },
  { key: "que-vendes", title: "Qué vendes" },
  { key: "contacto", title: "Contacto" },
  { key: "ubicacion", title: "Ubicación y disponibilidad" },
  { key: "extras", title: "Extras" },
  { key: "fotos", title: "Fotos" },
];

/** Gallery cap placeholder until package tiers (FOOD-L5). */
export const COMIDA_LOCAL_GALLERY_MAX_PLACEHOLDER = 3;
