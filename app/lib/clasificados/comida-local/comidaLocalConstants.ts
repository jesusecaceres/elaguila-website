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

/** Gate F2 — bilingual option shape (mirrors ofertasLocalesBusinessCategoryUx.ts's proven
 * {value, labelEs, labelEn} convention). Stored `value` identifiers are language-neutral and
 * unchanged; only display labels vary by lang. */
export type ComidaLocalBilingualOption<T extends string> = {
  value: T;
  labelEs: string;
  labelEn: string;
};

/** Gate F2 — pick the right label for lang; defaults to Spanish (prior behavior unchanged). */
export function comidaLocalOptionLabel<T extends string>(
  opt: ComidaLocalBilingualOption<T>,
  lang: "es" | "en" = "es",
): string {
  return lang === "en" ? opt.labelEn : opt.labelEs;
}

/** Gate D2 — seller/business format registry, distinct from foodType (cuisine). */
export const COMIDA_LOCAL_BUSINESS_TYPE_OPTIONS: ReadonlyArray<
  ComidaLocalBilingualOption<ComidaLocalBusinessType>
> = [
  { value: "food_truck", labelEs: "Food truck", labelEn: "Food truck" },
  { value: "puesto", labelEs: "Puesto / carrito", labelEn: "Stand / cart" },
  { value: "comida_casa", labelEs: "Comida desde casa", labelEn: "Home kitchen" },
  { value: "pop_up", labelEs: "Pop-up", labelEn: "Pop-up" },
  { value: "feria", labelEs: "Feria / mercado", labelEn: "Fair / market" },
  { value: "catering", labelEs: "Catering", labelEn: "Catering" },
  { value: "meal_prep", labelEs: "Meal prep", labelEn: "Meal prep" },
  { value: "panaderia", labelEs: "Panadería / repostería", labelEn: "Bakery / pastry" },
  { value: "chef_privado", labelEs: "Chef privado", labelEn: "Private chef" },
  { value: "delivery_only", labelEs: "Solo entrega", labelEn: "Delivery only" },
  { value: "mercado", labelEs: "Vendedor de mercado", labelEn: "Market vendor" },
  { value: "otro", labelEs: "Otro", labelEn: "Other" },
];

/** Gate D4 — expanded service-mode registry (additive over the original 3-value set). */
export const COMIDA_LOCAL_SERVICE_OPTIONS: ReadonlyArray<
  ComidaLocalBilingualOption<ComidaLocalServiceOption>
> = [
  { value: "pickup", labelEs: "Recoger", labelEn: "Pickup" },
  { value: "delivery", labelEs: "Entrega", labelEn: "Delivery" },
  { value: "in_person", labelEs: "Solo en persona", labelEn: "In person only" },
  { value: "preorder", labelEs: "Pedido anticipado", labelEn: "Pre-order" },
  { value: "scheduled_pickup", labelEs: "Recoger con horario", labelEn: "Scheduled pickup" },
  { value: "custom_order", labelEs: "Pedido personalizado", labelEn: "Custom order" },
  { value: "catering", labelEs: "Catering", labelEn: "Catering" },
  { value: "events", labelEs: "Eventos", labelEn: "Events" },
  { value: "mobile", labelEs: "Móvil", labelEn: "Mobile" },
  { value: "market_pickup", labelEs: "Recoger en mercado/feria", labelEn: "Market/fair pickup" },
  { value: "meal_prep", labelEs: "Meal prep", labelEn: "Meal prep" },
  { value: "limited_daily_quantity", labelEs: "Cantidad limitada por día", labelEn: "Limited daily quantity" },
  { value: "other", labelEs: "Otro", labelEn: "Other" },
];

/** Gate D15 — Comida Local specific highlights (not Restaurant amenities). */
export const COMIDA_LOCAL_HIGHLIGHT_OPTIONS: ReadonlyArray<
  ComidaLocalBilingualOption<ComidaLocalHighlightOption>
> = [
  { value: "hecho_en_casa", labelEs: "Hecho en casa", labelEn: "Homemade" },
  { value: "receta_familiar", labelEs: "Receta familiar", labelEn: "Family recipe" },
  { value: "ingredientes_frescos", labelEs: "Ingredientes frescos", labelEn: "Fresh ingredients" },
  { value: "halal", labelEs: "Halal", labelEn: "Halal" },
  { value: "kosher", labelEs: "Kosher", labelEn: "Kosher" },
  { value: "vegetariano", labelEs: "Vegetariano", labelEn: "Vegetarian" },
  { value: "vegano", labelEs: "Vegano", labelEn: "Vegan" },
  { value: "sin_gluten", labelEs: "Sin gluten", labelEn: "Gluten-free" },
  { value: "hecho_al_momento", labelEs: "Hecho al momento", labelEn: "Made to order" },
  { value: "porciones_limitadas", labelEs: "Porciones limitadas", labelEn: "Limited portions" },
  { value: "catering", labelEs: "Catering disponible", labelEn: "Catering available" },
  { value: "pedidos_personalizados", labelEs: "Pedidos personalizados", labelEn: "Custom orders" },
  { value: "entrega_disponible", labelEs: "Entrega disponible", labelEn: "Delivery available" },
  { value: "pickup_disponible", labelEs: "Pickup disponible", labelEn: "Pickup available" },
  { value: "familiar", labelEs: "Negocio familiar", labelEn: "Family-owned" },
  { value: "local", labelEs: "100% local", labelEn: "100% local" },
  { value: "otro", labelEs: "Otro", labelEn: "Other" },
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
