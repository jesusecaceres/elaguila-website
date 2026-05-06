/**
 * Canonical optional amenities for Restaurantes (payments, service, accessibility, etc.).
 * Used for form, publish JSON, merge/sanitize, and public shell labels — never expose raw ids publicly.
 */

import type { ShellAmenitiesSection } from "@/app/clasificados/restaurantes/shell/restaurantDetailShellTypes";

export type RestauranteAmenityGroupId =
  | "payments"
  | "service"
  | "accessibility"
  | "atmosphere"
  | "amenities"
  | "foodOptions";

export type RestauranteAmenitiesSelection = Partial<Record<RestauranteAmenityGroupId, string[]>>;

type ItemDef = { id: string; labelEs: string; labelEn: string };

const I = (id: string, labelEs: string, labelEn: string): ItemDef => ({ id, labelEs, labelEn });

const GROUP_META: Record<
  RestauranteAmenityGroupId,
  { titleEs: string; titleEn: string; items: ItemDef[] }
> = {
  payments: {
    titleEs: "Pagos",
    titleEn: "Payments",
    items: [
      I("cash", "Efectivo", "Cash"),
      I("credit_cards", "Tarjetas de crédito", "Credit cards"),
      I("apple_pay", "Apple Pay", "Apple Pay"),
      I("google_pay", "Google Pay", "Google Pay"),
      I("zelle", "Zelle", "Zelle"),
      I("venmo", "Venmo", "Venmo"),
      I("cash_app", "Cash App", "Cash App"),
      I("paypal", "PayPal", "PayPal"),
    ],
  },
  service: {
    titleEs: "Servicio",
    titleEn: "Service",
    items: [
      I("reservations", "Reservaciones", "Reservations"),
      I("dine_in", "Comer en local", "Dine-in"),
      I("takeout", "Para llevar", "Takeout"),
      I("delivery", "Entrega a domicilio", "Delivery"),
      I("pickup", "Recoger pedido", "Pickup"),
      I("catering", "Catering", "Catering"),
      I("drive_thru", "Auto servicio (drive-thru)", "Drive-thru"),
      I("advance_order", "Pedido anticipado", "Advance order"),
    ],
  },
  accessibility: {
    titleEs: "Accesibilidad",
    titleEn: "Accessibility",
    items: [
      I("wheelchair_accessible", "Accesible en silla de ruedas", "Wheelchair accessible"),
      I("ada_entrance", "Entrada ADA", "ADA entrance"),
      I("accessible_restroom", "Baño accesible", "Accessible restroom"),
      I("accessible_parking", "Estacionamiento accesible", "Accessible parking"),
      I("no_steps", "Sin escalones", "No steps"),
    ],
  },
  atmosphere: {
    titleEs: "Ambiente",
    titleEn: "Atmosphere",
    items: [
      I("casual", "Casual", "Casual"),
      I("family_friendly", "Familiar", "Family-friendly"),
      I("good_for_groups", "Ideal para grupos", "Good for groups"),
      I("good_for_kids", "Ideal para niños", "Good for kids"),
      I("romantic", "Romántico", "Romantic"),
      I("trendy", "De moda", "Trendy"),
      I("quiet", "Tranquilo", "Quiet"),
      I("loud", "Animado / ruidoso", "Loud"),
    ],
  },
  amenities: {
    titleEs: "Comodidades",
    titleEn: "Amenities",
    items: [
      I("wifi", "Wi‑Fi", "Wi‑Fi"),
      I("outdoor_seating", "Terraza / exterior", "Outdoor seating"),
      I("tv", "TV", "TV"),
      I("dogs_allowed", "Se admiten perros", "Dogs allowed"),
      I("parking_available", "Estacionamiento", "Parking available"),
      I("validated_parking", "Estacionamiento con validación", "Validated parking"),
      I("qr_menu", "Menú QR", "QR menu"),
      I("restrooms", "Baños", "Restrooms"),
    ],
  },
  foodOptions: {
    titleEs: "Opciones de comida",
    titleEn: "Food options",
    items: [
      I("vegetarian_options", "Opciones vegetarianas", "Vegetarian options"),
      I("vegan_options", "Opciones veganas", "Vegan options"),
      I("gluten_free_options", "Sin gluten", "Gluten-free options"),
      I("halal", "Halal", "Halal"),
      I("kosher", "Kosher", "Kosher"),
      I("breakfast", "Desayuno", "Breakfast"),
      I("brunch", "Brunch", "Brunch"),
      I("late_night", "Abierto hasta tarde", "Late night"),
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
