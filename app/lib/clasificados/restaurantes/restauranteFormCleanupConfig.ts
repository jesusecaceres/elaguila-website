import type {
  RestauranteBusinessTypeKey,
  RestauranteServiceMode,
} from "@/app/clasificados/restaurantes/application/restauranteListingApplicationModel";
import type { RestauranteListingDraft } from "@/app/clasificados/restaurantes/application/restauranteDraftTypes";
import {
  RESTAURANTE_BUSINESS_TYPES,
  RESTAURANTE_SERVICE_MODES,
  TAXONOMY_KEY_OTHER,
  TAXONOMY_KEY_OTHER_LANG,
} from "@/app/clasificados/restaurantes/application/restauranteTaxonomy";

/** Recommended max custom “Otro” language chips in Restaurante form. */
export const RESTAURANTE_MAX_CUSTOM_LANGUAGES = 3;

/** Business types removed from Restaurante form — owned by Comida Local pipeline. */
export const RESTAURANTE_FORM_EXCLUDED_BUSINESS_TYPE_KEYS: RestauranteBusinessTypeKey[] = [
  "pop_up",
  "home_based_food",
  "street_vendor",
];

/** Active Tipo de negocio options for `/publicar/restaurantes`. */
export const RESTAURANTE_FORM_BUSINESS_TYPES = RESTAURANTE_BUSINESS_TYPES.filter(
  (o) => !RESTAURANTE_FORM_EXCLUDED_BUSINESS_TYPE_KEYS.includes(o.key),
);

export function isExcludedRestauranteFormBusinessType(key: string): boolean {
  return (RESTAURANTE_FORM_EXCLUDED_BUSINESS_TYPE_KEYS as readonly string[]).includes(key);
}

export function normalizeLanguageToken(value: string): string {
  return value.trim().toLowerCase();
}

/** Canonical custom language list; `languageOtherCustom` remains first chip for legacy drafts. */
export function resolveRestauranteCustomLanguages(draft: {
  customLanguages?: string[];
  languageOtherCustom?: string;
}): string[] {
  const raw = draft.customLanguages ?? [];
  const fromArray = raw.map((x) => x.trim()).filter(Boolean);
  if (fromArray.length) return fromArray;
  const legacy = draft.languageOtherCustom?.trim();
  return legacy ? [legacy] : [];
}

export function isDuplicateCustomLanguage(
  candidate: string,
  languagesSpoken: string[] | undefined,
  existingCustoms: string[] | undefined,
  resolveLanguageLabel: (key: string) => string,
): boolean {
  const norm = normalizeLanguageToken(candidate);
  if (!norm) return true;
  for (const existing of existingCustoms ?? []) {
    if (normalizeLanguageToken(existing) === norm) return true;
  }
  for (const key of languagesSpoken ?? []) {
    if (key === TAXONOMY_KEY_OTHER_LANG) continue;
    if (normalizeLanguageToken(resolveLanguageLabel(key)) === norm) return true;
  }
  return false;
}

/** Service modes for Restaurante form — excludes pop-up (Comida Local). */
export const RESTAURANTE_FORM_SERVICE_MODES = RESTAURANTE_SERVICE_MODES.filter((o) => o.key !== "pop_up");

export type RestauranteFormServiceFlagKey = "pickupAvailable" | "reservationsAvailable";

export type RestauranteFormServiceOption =
  | { kind: "mode"; key: RestauranteServiceMode; labelEs: string; chipEmoji: string }
  | {
      kind: "flag";
      key: RestauranteFormServiceFlagKey;
      labelEs: string;
      chipEmoji: string;
    };

/** Single consolidated checklist for Section B (modos + recogida/reservas flags). */
export const RESTAURANTE_FORM_SERVICE_OPTIONS: RestauranteFormServiceOption[] = [
  { kind: "mode", key: "dine_in", labelEs: "Comer en local", chipEmoji: "🍽️" },
  { kind: "mode", key: "takeout", labelEs: "Para llevar", chipEmoji: "🛍️" },
  { kind: "mode", key: "delivery", labelEs: "Entrega a domicilio", chipEmoji: "🚚" },
  { kind: "flag", key: "pickupAvailable", labelEs: "Recogida", chipEmoji: "📦" },
  { kind: "flag", key: "reservationsAvailable", labelEs: "Reservas", chipEmoji: "📅" },
  { kind: "mode", key: "catering", labelEs: "Catering", chipEmoji: "🍽️" },
  { kind: "mode", key: "events", labelEs: "Eventos", chipEmoji: "🎉" },
  { kind: "mode", key: "food_truck", labelEs: "Food truck", chipEmoji: "🚚" },
  { kind: "mode", key: "personal_chef", labelEs: "Chef personal", chipEmoji: "👨‍🍳" },
  { kind: "mode", key: "meal_prep", labelEs: "Meal prep", chipEmoji: "🍱" },
  { kind: "mode", key: "other", labelEs: "Otro", chipEmoji: "🔖" },
];

const SERVICE_MODE_TO_LEGACY_FLAG: Partial<
  Record<RestauranteServiceMode, keyof Pick<RestauranteListingDraft, "dineIn" | "takeout" | "delivery" | "foodTruck" | "personalChef">>
> = {
  dine_in: "dineIn",
  takeout: "takeout",
  delivery: "delivery",
  food_truck: "foodTruck",
  personal_chef: "personalChef",
};

export function isRestauranteFormServiceSelected(draft: RestauranteListingDraft, opt: RestauranteFormServiceOption): boolean {
  if (opt.kind === "flag") return Boolean(draft[opt.key]);
  return (draft.serviceModes ?? []).includes(opt.key);
}

export function buildRestauranteFormServicePatch(
  draft: RestauranteListingDraft,
  opt: RestauranteFormServiceOption,
): Partial<RestauranteListingDraft> {
  if (opt.kind === "flag") {
    return { [opt.key]: !draft[opt.key] } as Partial<RestauranteListingDraft>;
  }
  const cur = draft.serviceModes ?? [];
  const next = cur.includes(opt.key) ? cur.filter((m) => m !== opt.key) : [...cur, opt.key];
  const patch: Partial<RestauranteListingDraft> = { serviceModes: next };
  const legacy = SERVICE_MODE_TO_LEGACY_FLAG[opt.key];
  if (legacy) patch[legacy] = next.includes(opt.key);
  if (opt.key === (TAXONOMY_KEY_OTHER as RestauranteServiceMode) && !next.includes(opt.key)) {
    patch.serviceModeOtherCustom = undefined;
  }
  return patch;
}

/** Merge legacy boolean flags + strip pop-up from canonical service modes. */
export function migrateRestauranteServiceModesAndFlags(draft: RestauranteListingDraft): RestauranteListingDraft {
  const modes = new Set((draft.serviceModes ?? []).filter((m) => m !== "pop_up"));
  if (draft.dineIn) modes.add("dine_in");
  if (draft.takeout) modes.add("takeout");
  if (draft.delivery) modes.add("delivery");
  if (draft.foodTruck) modes.add("food_truck");
  if (draft.personalChef) modes.add("personal_chef");
  const serviceModes = Array.from(modes);
  return {
    ...draft,
    serviceModes,
    dineIn: modes.has("dine_in"),
    takeout: modes.has("takeout"),
    delivery: modes.has("delivery"),
    foodTruck: modes.has("food_truck"),
    personalChef: modes.has("personal_chef"),
    popUp: false,
  };
}

export function normalizeRestauranteCustomLanguages(draft: RestauranteListingDraft): RestauranteListingDraft {
  const raw = draft.customLanguages;
  let list: string[] = Array.isArray(raw) ? raw.map((x) => (typeof x === "string" ? x.trim() : "")).filter(Boolean) : [];
  if (!list.length && draft.languageOtherCustom?.trim()) {
    list = [draft.languageOtherCustom.trim()];
  }
  const seen = new Set<string>();
  list = list
    .filter((v) => {
      const n = normalizeLanguageToken(v);
      if (!n || seen.has(n)) return false;
      seen.add(n);
      return true;
    })
    .slice(0, RESTAURANTE_MAX_CUSTOM_LANGUAGES);
  const languagesSpoken = [...(draft.languagesSpoken ?? [])];
  const patch: Partial<RestauranteListingDraft> = {
    customLanguages: list.length ? list : undefined,
    languageOtherCustom: list[0],
  };
  if (list.length && !languagesSpoken.includes(TAXONOMY_KEY_OTHER_LANG)) {
    patch.languagesSpoken = [...languagesSpoken, TAXONOMY_KEY_OTHER_LANG];
  }
  if (!list.length) {
    patch.languageOtherCustom = undefined;
  }
  return { ...draft, ...patch };
}
