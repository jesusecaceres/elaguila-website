/**
 * Canonical optional amenities for Restaurantes (payments, service, accessibility, etc.).
 * Used for form, publish JSON, merge/sanitize, and public shell labels — never expose raw ids publicly.
 */

import type { ShellAmenitiesSection } from "@/app/clasificados/restaurantes/shell/restaurantDetailShellTypes";
import type { RestaurantePublishChipLeading } from "./restaurantePublishChipVisual";

export type RestauranteAmenityGroupId =
  | "payments"
  | "service"
  | "accessibility"
  | "atmosphere"
  | "amenities"
  | "foodOptions";

export type RestauranteAmenitiesSelection = Partial<Record<RestauranteAmenityGroupId, string[]>>;

type ItemDef = { id: string; labelEs: string; labelEn: string; leading: RestaurantePublishChipLeading };

const I = (id: string, labelEs: string, labelEn: string, leading: RestaurantePublishChipLeading): ItemDef => ({
  id,
  labelEs,
  labelEn,
  leading,
});

const GROUP_META: Record<
  RestauranteAmenityGroupId,
  { titleEs: string; titleEn: string; items: ItemDef[] }
> = {
  payments: {
    titleEs: "Pagos",
    titleEn: "Payments",
    items: [
      I("cash", "Efectivo", "Cash", { kind: "emoji", emoji: "💵" }),
      I("credit_cards", "Tarjetas de crédito", "Credit cards", { kind: "emoji", emoji: "💳" }),
      I("apple_pay", "Apple Pay", "Apple Pay", {
        kind: "pill",
        text: "Apple",
        className: "bg-neutral-900",
      }),
      I("google_pay", "Google Pay", "Google Pay", {
        kind: "pill",
        text: "Google",
        className: "bg-[#4285F4]",
      }),
      I("zelle", "Zelle", "Zelle", { kind: "brand", brand: "zelle" }),
      I("venmo", "Venmo", "Venmo", { kind: "brand", brand: "venmo" }),
      I("cash_app", "Cash App", "Cash App", { kind: "brand", brand: "cash_app" }),
      I("paypal", "PayPal", "PayPal", { kind: "brand", brand: "paypal" }),
    ],
  },
  service: {
    titleEs: "Servicio",
    titleEn: "Service",
    items: [
      I("reservations", "Reservaciones", "Reservations", { kind: "emoji", emoji: "📅" }),
      I("dine_in", "Comer en local", "Dine-in", { kind: "emoji", emoji: "🍽️" }),
      I("takeout", "Para llevar", "Takeout", { kind: "emoji", emoji: "🛍️" }),
      I("delivery", "Entrega a domicilio", "Delivery", { kind: "emoji", emoji: "🚚" }),
      I("pickup", "Recoger pedido", "Pickup", { kind: "emoji", emoji: "🛍️" }),
      I("catering", "Catering", "Catering", { kind: "emoji", emoji: "🍽️" }),
      I("drive_thru", "Auto servicio (drive-thru)", "Drive-thru", { kind: "emoji", emoji: "🚗" }),
      I("advance_order", "Pedido anticipado", "Advance order", { kind: "emoji", emoji: "📲" }),
    ],
  },
  accessibility: {
    titleEs: "Accesibilidad",
    titleEn: "Accessibility",
    items: [
      I("wheelchair_accessible", "Accesible en silla de ruedas", "Wheelchair accessible", { kind: "emoji", emoji: "♿" }),
      I("ada_entrance", "Entrada ADA", "ADA entrance", { kind: "emoji", emoji: "♿" }),
      I("accessible_restroom", "Baño accesible", "Accessible restroom", { kind: "emoji", emoji: "🚻" }),
      I("accessible_parking", "Estacionamiento accesible", "Accessible parking", { kind: "emoji", emoji: "🅿️" }),
      I("no_steps", "Sin escalones", "No steps", { kind: "emoji", emoji: "🚶" }),
    ],
  },
  atmosphere: {
    titleEs: "Ambiente",
    titleEn: "Atmosphere",
    items: [
      I("casual", "Casual", "Casual", { kind: "emoji", emoji: "😊" }),
      I("family_friendly", "Familiar", "Family-friendly", { kind: "emoji", emoji: "👨‍👩‍👧‍👦" }),
      I("good_for_groups", "Ideal para grupos", "Good for groups", { kind: "emoji", emoji: "👥" }),
      I("good_for_kids", "Ideal para niños", "Good for kids", { kind: "emoji", emoji: "🧒" }),
      I("romantic", "Romántico", "Romantic", { kind: "emoji", emoji: "💛" }),
      I("trendy", "De moda", "Trendy", { kind: "emoji", emoji: "✨" }),
      I("quiet", "Tranquilo", "Quiet", { kind: "emoji", emoji: "🤫" }),
      I("loud", "Animado / ruidoso", "Loud", { kind: "emoji", emoji: "🎶" }),
    ],
  },
  amenities: {
    titleEs: "Comodidades",
    titleEn: "Amenities",
    items: [
      I("wifi", "Wi‑Fi", "Wi‑Fi", { kind: "emoji", emoji: "📶" }),
      I("outdoor_seating", "Terraza / exterior", "Outdoor seating", { kind: "emoji", emoji: "🌿" }),
      I("tv", "TV", "TV", { kind: "emoji", emoji: "📺" }),
      I("dogs_allowed", "Se admiten perros", "Dogs allowed", { kind: "emoji", emoji: "🐾" }),
      I("parking_available", "Estacionamiento", "Parking available", { kind: "emoji", emoji: "🅿️" }),
      I("validated_parking", "Estacionamiento con validación", "Validated parking", { kind: "emoji", emoji: "🅿️" }),
      I("qr_menu", "Menú QR", "QR menu", { kind: "emoji", emoji: "📖" }),
      I("restrooms", "Baños", "Restrooms", { kind: "emoji", emoji: "🚻" }),
    ],
  },
  foodOptions: {
    titleEs: "Opciones de comida",
    titleEn: "Food options",
    items: [
      I("vegetarian_options", "Opciones vegetarianas", "Vegetarian options", { kind: "emoji", emoji: "🥗" }),
      I("vegan_options", "Opciones veganas", "Vegan options", { kind: "emoji", emoji: "🌱" }),
      I("gluten_free_options", "Sin gluten", "Gluten-free options", { kind: "emoji", emoji: "🌾" }),
      I("halal", "Halal", "Halal", { kind: "emoji", emoji: "🕌" }),
      I("kosher", "Kosher", "Kosher", { kind: "emoji", emoji: "✡️" }),
      I("breakfast", "Desayuno", "Breakfast", { kind: "emoji", emoji: "🍳" }),
      I("brunch", "Brunch", "Brunch", { kind: "emoji", emoji: "🍳" }),
      I("late_night", "Abierto hasta tarde", "Late night", { kind: "emoji", emoji: "🌙" }),
    ],
  },
};

export const RESTAURANTE_AMENITY_GROUP_ORDER: RestauranteAmenityGroupId[] = [
  "payments",
  "service",
  "accessibility",
  "atmosphere",
  "amenities",
  "foodOptions",
];

const ALLOWED_IDS: Record<RestauranteAmenityGroupId, Set<string>> = {} as Record<
  RestauranteAmenityGroupId,
  Set<string>
>;
for (const g of RESTAURANTE_AMENITY_GROUP_ORDER) {
  ALLOWED_IDS[g] = new Set(GROUP_META[g].items.map((x) => x.id));
}

const ITEM_LOOKUP: Map<string, ItemDef> = new Map();
for (const g of RESTAURANTE_AMENITY_GROUP_ORDER) {
  for (const it of GROUP_META[g].items) {
    ITEM_LOOKUP.set(`${g}:${it.id}`, it);
  }
}

export function getRestauranteAmenityGroupMeta(group: RestauranteAmenityGroupId) {
  return GROUP_META[group];
}

/** Sanitize unknown groups/ids, dedupe, drop empty groups. Returns `undefined` when nothing remains. */
export function sanitizeRestauranteAmenities(raw: unknown): RestauranteAmenitiesSelection | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const out: RestauranteAmenitiesSelection = {};
  let any = false;
  for (const g of RESTAURANTE_AMENITY_GROUP_ORDER) {
    const arr = o[g];
    if (!Array.isArray(arr)) continue;
    const allowed = ALLOWED_IDS[g];
    const seen = new Set<string>();
    const next: string[] = [];
    for (const x of arr) {
      if (typeof x !== "string") continue;
      const id = x.trim();
      if (!id || !allowed.has(id) || seen.has(id)) continue;
      seen.add(id);
      next.push(id);
    }
    if (next.length) {
      out[g] = next;
      any = true;
    }
  }
  return any ? out : undefined;
}

export function hasAnyRestauranteAmenities(x: RestauranteAmenitiesSelection | undefined): boolean {
  if (!x) return false;
  return RESTAURANTE_AMENITY_GROUP_ORDER.some((g) => (x[g]?.length ?? 0) > 0);
}

/** Resolve chip leading icon from public shell labels (display-only lookup). */
export function lookupRestauranteAmenityLeading(
  labelEs: string,
  labelEn: string,
): RestaurantePublishChipLeading | undefined {
  for (const def of ITEM_LOOKUP.values()) {
    if (def.labelEs === labelEs || def.labelEn === labelEn) return def.leading;
  }
  return undefined;
}

const GROUP_EMOJI: Record<string, string> = {
  Pagos: "💳",
  Payments: "💳",
  Servicio: "🍽️",
  Service: "🍽️",
  Accesibilidad: "♿",
  Accessibility: "♿",
  Ambiente: "✨",
  Atmosphere: "✨",
  Comodidades: "🛋️",
  Amenities: "🛋️",
  "Opciones de comida": "🥗",
  "Food options": "🥗",
};

export function emojiForRestauranteAmenityGroupTitle(title: string): string {
  return GROUP_EMOJI[title] ?? "✓";
}

export function buildShellAmenitiesSection(
  raw: RestauranteAmenitiesSelection | undefined,
): { amenitiesSection?: ShellAmenitiesSection } {
  const sanitized = sanitizeRestauranteAmenities(raw);
  if (!hasAnyRestauranteAmenities(sanitized)) return {};
  const groups: ShellAmenitiesSection["groups"] = [];
  for (const g of RESTAURANTE_AMENITY_GROUP_ORDER) {
    const ids = sanitized![g];
    if (!ids?.length) continue;
    const meta = GROUP_META[g];
    const items: { labelEs: string; labelEn: string }[] = [];
    for (const id of ids) {
      const def = ITEM_LOOKUP.get(`${g}:${id}`);
      if (def) items.push({ labelEs: def.labelEs, labelEn: def.labelEn });
    }
    if (!items.length) continue;
    groups.push({
      titleEs: meta.titleEs,
      titleEn: meta.titleEn,
      items,
    });
  }
  if (!groups.length) return {};
  return {
    amenitiesSection: {
      titleEs: "Amenidades y más",
      titleEn: "Amenities & More",
      groups,
    },
  };
}
