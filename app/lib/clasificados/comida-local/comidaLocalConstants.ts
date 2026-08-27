import { COMIDA_LOCAL_DEFAULT_GALLERY_MAX } from "./comidaLocalPackages";
import type {
  ComidaLocalBusinessType,
  ComidaLocalFoodType,
  ComidaLocalHighlightOption,
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

/** Gate D2 — seller/business format registry, distinct from foodType (cuisine). */
export const COMIDA_LOCAL_BUSINESS_TYPE_OPTIONS: ReadonlyArray<{
  value: ComidaLocalBusinessType;
  label: string;
}> = [
  { value: "food_truck", label: "Food truck" },
  { value: "puesto", label: "Puesto / carrito" },
  { value: "comida_casa", label: "Comida desde casa" },
  { value: "pop_up", label: "Pop-up" },
  { value: "feria", label: "Feria / mercado" },
  { value: "catering", label: "Catering" },
  { value: "meal_prep", label: "Meal prep" },
  { value: "panaderia", label: "Panadería / repostería" },
  { value: "chef_privado", label: "Chef privado" },
  { value: "delivery_only", label: "Solo entrega" },
  { value: "mercado", label: "Vendedor de mercado" },
  { value: "otro", label: "Otro" },
];

/** Gate D4 — expanded service-mode registry (additive over the original 3-value set). */
export const COMIDA_LOCAL_SERVICE_OPTIONS: ReadonlyArray<{
  value: ComidaLocalServiceOption;
  label: string;
}> = [
  { value: "pickup", label: "Para recoger" },
  { value: "delivery", label: "Entrega" },
  { value: "in_person", label: "Solo en persona" },
  { value: "preorder", label: "Pedido anticipado" },
  { value: "scheduled_pickup", label: "Recoger con horario" },
  { value: "custom_order", label: "Pedido personalizado" },
  { value: "catering", label: "Catering" },
  { value: "events", label: "Eventos" },
  { value: "mobile", label: "Móvil" },
  { value: "market_pickup", label: "Recoger en mercado/feria" },
  { value: "meal_prep", label: "Meal prep" },
  { value: "limited_daily_quantity", label: "Cantidad limitada por día" },
  { value: "other", label: "Otro" },
];

/** Gate D15 — Comida Local specific highlights (not Restaurant amenities). */
export const COMIDA_LOCAL_HIGHLIGHT_OPTIONS: ReadonlyArray<{
  value: ComidaLocalHighlightOption;
  label: string;
}> = [
  { value: "hecho_en_casa", label: "Hecho en casa" },
  { value: "receta_familiar", label: "Receta familiar" },
  { value: "ingredientes_frescos", label: "Ingredientes frescos" },
  { value: "halal", label: "Halal" },
  { value: "kosher", label: "Kosher" },
  { value: "vegetariano", label: "Vegetariano" },
  { value: "vegano", label: "Vegano" },
  { value: "sin_gluten", label: "Sin gluten" },
  { value: "hecho_al_momento", label: "Hecho al momento" },
  { value: "porciones_limitadas", label: "Porciones limitadas" },
  { value: "catering", label: "Catering disponible" },
  { value: "pedidos_personalizados", label: "Pedidos personalizados" },
  { value: "entrega_disponible", label: "Entrega disponible" },
  { value: "pickup_disponible", label: "Pickup disponible" },
  { value: "familiar", label: "Negocio familiar" },
  { value: "local", label: "100% local" },
  { value: "otro", label: "Otro" },
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
  { value: "otro", label: "Otro idioma" },
];

export const COMIDA_LOCAL_SECTIONS: ReadonlyArray<{
  key: ComidaLocalSectionKey;
  title: string;
}> = [
  { key: "identidad", title: "Identidad" },
  { key: "zona", title: "Zona" },
  { key: "que-vendes", title: "Qué vendes" },
  { key: "contacto", title: "Contacto" },
  { key: "ubicacion", title: "Encuéntrame hoy" },
  { key: "extras", title: "Extras" },
  { key: "fotos", title: "Fotos" },
];

/** Gallery cap for Basic-ready default (FOOD-L5D package config). */
export const COMIDA_LOCAL_GALLERY_MAX = COMIDA_LOCAL_DEFAULT_GALLERY_MAX;

/** @deprecated Use COMIDA_LOCAL_GALLERY_MAX */
export const COMIDA_LOCAL_GALLERY_MAX_PLACEHOLDER = COMIDA_LOCAL_GALLERY_MAX;
