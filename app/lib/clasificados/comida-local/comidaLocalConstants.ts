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

export const COMIDA_LOCAL_FOOD_TYPE_OPTIONS: ReadonlyArray<
  ComidaLocalBilingualOption<ComidaLocalFoodType>
> = [
  { value: "tacos", labelEs: "Tacos", labelEn: "Tacos" },
  { value: "pupusas", labelEs: "Pupusas", labelEn: "Pupusas" },
  { value: "tamales", labelEs: "Tamales", labelEn: "Tamales" },
  { value: "antojitos", labelEs: "Antojitos", labelEn: "Antojitos" },
  { value: "postres", labelEs: "Postres", labelEn: "Desserts" },
  { value: "bebidas", labelEs: "Bebidas", labelEn: "Drinks" },
  { value: "mariscos", labelEs: "Mariscos", labelEn: "Seafood" },
  { value: "comida-casera", labelEs: "Comida casera", labelEn: "Home cooking" },
  { value: "comida-eventos", labelEs: "Comida para eventos", labelEn: "Event catering" },
  { value: "otro", labelEs: "Otro", labelEn: "Other" },
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
  { value: "fresco_diario", labelEs: "Fresco cada día", labelEn: "Fresh daily" },
  { value: "ingredientes_locales", labelEs: "Ingredientes locales", labelEn: "Local ingredients" },
  { value: "preorder", labelEs: "Pedido anticipado", labelEn: "Pre-order" },
  {
    value: "disponible_fines_de_semana",
    labelEs: "Disponible los fines de semana",
    labelEn: "Weekend availability",
  },
  { value: "otro", labelEs: "Otro", labelEn: "Other" },
];

export const COMIDA_LOCAL_PAYMENT_OPTIONS: ReadonlyArray<
  ComidaLocalBilingualOption<ComidaLocalPaymentMethod>
> = [
  { value: "cash", labelEs: "Efectivo", labelEn: "Cash" },
  { value: "zelle", labelEs: "Zelle", labelEn: "Zelle" },
  { value: "cash_app", labelEs: "Cash App", labelEn: "Cash App" },
  { value: "venmo", labelEs: "Venmo", labelEn: "Venmo" },
  { value: "card", labelEs: "Tarjeta", labelEn: "Card" },
  { value: "other", labelEs: "Otro", labelEn: "Other" },
];

export const COMIDA_LOCAL_PRICE_LEVEL_OPTIONS: ReadonlyArray<{
  value: ComidaLocalPriceLevel;
  label: string;
}> = [
  { value: "1", label: "$" },
  { value: "2", label: "$$" },
  { value: "3", label: "$$$" },
];

export const COMIDA_LOCAL_LANGUAGE_OPTIONS: ReadonlyArray<
  ComidaLocalBilingualOption<ComidaLocalLanguageOption>
> = [
  { value: "es", labelEs: "Español", labelEn: "Spanish" },
  { value: "en", labelEs: "Inglés", labelEn: "English" },
  { value: "bilingual", labelEs: "Bilingüe", labelEn: "Bilingual" },
  { value: "otro", labelEs: "Otro idioma", labelEn: "Other language" },
];

export const COMIDA_LOCAL_SECTIONS: ReadonlyArray<{
  key: ComidaLocalSectionKey;
  titleEs: string;
  titleEn: string;
}> = [
  { key: "identidad", titleEs: "Identidad", titleEn: "Identity" },
  { key: "zona", titleEs: "Zona", titleEn: "Area" },
  { key: "que-vendes", titleEs: "Qué vendes", titleEn: "What you sell" },
  { key: "contacto", titleEs: "Contacto", titleEn: "Contact" },
  { key: "ubicacion", titleEs: "Encuéntrame hoy", titleEn: "Find me today" },
  { key: "extras", titleEs: "Extras", titleEn: "Extras" },
  { key: "fotos", titleEs: "Fotos", titleEn: "Photos" },
];

/** Gallery cap for Basic-ready default (FOOD-L5D package config). */
export const COMIDA_LOCAL_GALLERY_MAX = COMIDA_LOCAL_DEFAULT_GALLERY_MAX;

/** @deprecated Use COMIDA_LOCAL_GALLERY_MAX */
export const COMIDA_LOCAL_GALLERY_MAX_PLACEHOLDER = COMIDA_LOCAL_GALLERY_MAX;
