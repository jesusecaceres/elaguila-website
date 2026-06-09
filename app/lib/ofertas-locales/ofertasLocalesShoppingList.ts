/**
 * Ofertas Locales shopper shopping list — pure helpers (Stack E).
 * Client-only persistence; no Supabase or private fields.
 */

import { formatOfertaLocalPublicItemPriceDisplay } from "./ofertasLocalesPublicSearchHelpers";
import { normalizeOfertaLocalSearchText } from "./ofertasLocalesFormatting";
import type { OfertaLocalPublicSearchItem } from "./ofertasLocalesTypes";
import type { OfertasLocalesAppLang } from "./useOfertasLocalesAppLang";

export const OFERTAS_LOCALES_SHOPPING_LIST_STORAGE_KEY = "leonix:ofertas-locales:shopping-list:v1";

export const OFERTAS_LOCALES_SHOPPING_LIST_MAX_ITEMS = 50;
export const OFERTAS_LOCALES_SHOPPING_LIST_MIN_QTY = 1;
export const OFERTAS_LOCALES_SHOPPING_LIST_MAX_QTY = 99;
export const OFERTAS_LOCALES_SHOPPING_LIST_MAX_NOTE = 140;

export type OfertaLocalShoppingListItem = {
  itemId: string;
  itemName: string;
  priceText: string;
  priceAmount: number | null;
  unit: string;
  businessName: string;
  businessKey: string;
  city: string;
  state: string;
  zipCode: string;
  address: string;
  phoneHref: string | null;
  websiteHref: string | null;
  directionsHref: string | null;
  sourceAssetHref: string | null;
  validFrom: string | null;
  validUntil: string | null;
  quantity: number;
  note: string;
  addedAt: string;
};

export type OfertaLocalShoppingListBusinessGroup = {
  businessKey: string;
  businessName: string;
  city: string;
  state: string;
  zipCode: string;
  address: string;
  directionsHref: string | null;
  items: OfertaLocalShoppingListItem[];
};

export type OfertaLocalShoppingListState = {
  version: 1;
  items: OfertaLocalShoppingListItem[];
  updatedAt: string;
};

function sanitizeText(raw: string, max: number): string {
  return String(raw ?? "")
    .replace(/\0/g, "")
    .replace(/<[^>]*>/g, "")
    .trim()
    .slice(0, max);
}

function clampQuantity(qty: number): number {
  if (!Number.isFinite(qty)) return OFERTAS_LOCALES_SHOPPING_LIST_MIN_QTY;
  return Math.min(
    OFERTAS_LOCALES_SHOPPING_LIST_MAX_QTY,
    Math.max(OFERTAS_LOCALES_SHOPPING_LIST_MIN_QTY, Math.floor(qty))
  );
}

export function buildOfertaLocalShoppingListBusinessKey(
  businessName: string,
  city: string,
  zipCode: string
): string {
  return [
    normalizeOfertaLocalSearchText(businessName),
    normalizeOfertaLocalSearchText(city),
    normalizeOfertaLocalSearchText(zipCode),
  ].join("|");
}

export function createShoppingListItemFromPublicItem(
  item: OfertaLocalPublicSearchItem
): OfertaLocalShoppingListItem {
  const businessName = sanitizeText(item.businessName, 200);
  const city = sanitizeText(item.city, 80);
  const zipCode = sanitizeText(item.zipCode, 10);
  return {
    itemId: sanitizeText(item.id, 64),
    itemName: sanitizeText(item.itemName, 200),
    priceText: sanitizeText(item.priceText, 64),
    priceAmount: item.priceAmount,
    unit: sanitizeText(item.unit, 32),
    businessName,
    businessKey: buildOfertaLocalShoppingListBusinessKey(businessName, city, zipCode),
    city,
    state: sanitizeText(item.state, 40),
    zipCode,
    address: sanitizeText(item.address, 200),
    phoneHref: item.phoneHref,
    websiteHref: item.websiteHref,
    directionsHref: item.directionsHref,
    sourceAssetHref: item.sourceAssetHref,
    validFrom: item.validFrom,
    validUntil: item.validUntil,
    quantity: OFERTAS_LOCALES_SHOPPING_LIST_MIN_QTY,
    note: "",
    addedAt: new Date().toISOString(),
  };
}

export function createEmptyOfertaLocalShoppingListState(): OfertaLocalShoppingListState {
  return { version: 1, items: [], updatedAt: new Date().toISOString() };
}

export function addOfertaLocalShoppingListItem(
  list: OfertaLocalShoppingListState,
  item: OfertaLocalShoppingListItem
): OfertaLocalShoppingListState {
  const existingIdx = list.items.findIndex((x) => x.itemId === item.itemId);
  if (existingIdx >= 0) {
    const next = [...list.items];
    const existing = next[existingIdx];
    next[existingIdx] = {
      ...existing,
      quantity: clampQuantity(existing.quantity + 1),
    };
    return { version: 1, items: next, updatedAt: new Date().toISOString() };
  }
  if (list.items.length >= OFERTAS_LOCALES_SHOPPING_LIST_MAX_ITEMS) {
    return list;
  }
  return {
    version: 1,
    items: [...list.items, { ...item, quantity: clampQuantity(item.quantity) }],
    updatedAt: new Date().toISOString(),
  };
}

export function removeOfertaLocalShoppingListItem(
  list: OfertaLocalShoppingListState,
  itemId: string
): OfertaLocalShoppingListState {
  return {
    version: 1,
    items: list.items.filter((x) => x.itemId !== itemId),
    updatedAt: new Date().toISOString(),
  };
}

export function updateOfertaLocalShoppingListItemQuantity(
  list: OfertaLocalShoppingListState,
  itemId: string,
  quantity: number
): OfertaLocalShoppingListState {
  return {
    version: 1,
    items: list.items.map((x) =>
      x.itemId === itemId ? { ...x, quantity: clampQuantity(quantity) } : x
    ),
    updatedAt: new Date().toISOString(),
  };
}

export function updateOfertaLocalShoppingListItemNote(
  list: OfertaLocalShoppingListState,
  itemId: string,
  note: string
): OfertaLocalShoppingListState {
  const safe = sanitizeText(note, OFERTAS_LOCALES_SHOPPING_LIST_MAX_NOTE);
  return {
    version: 1,
    items: list.items.map((x) => (x.itemId === itemId ? { ...x, note: safe } : x)),
    updatedAt: new Date().toISOString(),
  };
}

export function clearOfertaLocalShoppingList(
  list: OfertaLocalShoppingListState
): OfertaLocalShoppingListState {
  return createEmptyOfertaLocalShoppingListState();
}

export function groupOfertaLocalShoppingListByBusiness(
  list: OfertaLocalShoppingListState
): OfertaLocalShoppingListBusinessGroup[] {
  const map = new Map<string, OfertaLocalShoppingListBusinessGroup>();
  for (const item of list.items) {
    const key = item.businessKey || buildOfertaLocalShoppingListBusinessKey(item.businessName, item.city, item.zipCode);
    const existing = map.get(key);
    if (existing) {
      existing.items.push(item);
      continue;
    }
    map.set(key, {
      businessKey: key,
      businessName: item.businessName,
      city: item.city,
      state: item.state,
      zipCode: item.zipCode,
      address: item.address,
      directionsHref: item.directionsHref,
      items: [item],
    });
  }
  return [...map.values()].sort((a, b) => a.businessName.localeCompare(b.businessName));
}

export function getOfertaLocalShoppingListCounts(list: OfertaLocalShoppingListState): {
  storeCount: number;
  itemCount: number;
  lineCount: number;
} {
  const groups = groupOfertaLocalShoppingListByBusiness(list);
  const lineCount = list.items.reduce((sum, x) => sum + x.quantity, 0);
  return { storeCount: groups.length, itemCount: lineCount, lineCount: list.items.length };
}

export function isOfertaLocalShoppingListItemAdded(
  list: OfertaLocalShoppingListState,
  itemId: string
): boolean {
  return list.items.some((x) => x.itemId === itemId);
}

export function serializeOfertaLocalShoppingList(list: OfertaLocalShoppingListState): string {
  return JSON.stringify({
    version: 1,
    updatedAt: list.updatedAt,
    items: list.items.map((item) => ({
      itemId: item.itemId,
      itemName: item.itemName,
      priceText: item.priceText,
      priceAmount: item.priceAmount,
      unit: item.unit,
      businessName: item.businessName,
      businessKey: item.businessKey,
      city: item.city,
      state: item.state,
      zipCode: item.zipCode,
      address: item.address,
      phoneHref: item.phoneHref,
      websiteHref: item.websiteHref,
      directionsHref: item.directionsHref,
      sourceAssetHref: item.sourceAssetHref,
      validFrom: item.validFrom,
      validUntil: item.validUntil,
      quantity: clampQuantity(item.quantity),
      note: sanitizeText(item.note, OFERTAS_LOCALES_SHOPPING_LIST_MAX_NOTE),
      addedAt: item.addedAt,
    })),
  });
}

export function parseOfertaLocalShoppingList(value: string | null | undefined): OfertaLocalShoppingListState {
  if (!value?.trim()) return createEmptyOfertaLocalShoppingListState();
  try {
    const parsed = JSON.parse(value) as { items?: unknown[]; version?: number };
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.items)) {
      return createEmptyOfertaLocalShoppingListState();
    }
    const items: OfertaLocalShoppingListItem[] = [];
    for (const raw of parsed.items) {
      if (!raw || typeof raw !== "object") continue;
      const o = raw as Record<string, unknown>;
      const itemId = sanitizeText(String(o.itemId ?? ""), 64);
      const itemName = sanitizeText(String(o.itemName ?? ""), 200);
      if (!itemId || !itemName) continue;
      const businessName = sanitizeText(String(o.businessName ?? ""), 200);
      const city = sanitizeText(String(o.city ?? ""), 80);
      const zipCode = sanitizeText(String(o.zipCode ?? ""), 10);
      items.push({
        itemId,
        itemName,
        priceText: sanitizeText(String(o.priceText ?? ""), 64),
        priceAmount:
          typeof o.priceAmount === "number" && Number.isFinite(o.priceAmount) ? o.priceAmount : null,
        unit: sanitizeText(String(o.unit ?? ""), 32),
        businessName,
        businessKey:
          sanitizeText(String(o.businessKey ?? ""), 300) ||
          buildOfertaLocalShoppingListBusinessKey(businessName, city, zipCode),
        city,
        state: sanitizeText(String(o.state ?? ""), 40),
        zipCode,
        address: sanitizeText(String(o.address ?? ""), 200),
        phoneHref: o.phoneHref ? sanitizeText(String(o.phoneHref), 200) : null,
        websiteHref: o.websiteHref ? sanitizeText(String(o.websiteHref), 500) : null,
        directionsHref: o.directionsHref ? sanitizeText(String(o.directionsHref), 500) : null,
        sourceAssetHref: o.sourceAssetHref ? sanitizeText(String(o.sourceAssetHref), 500) : null,
        validFrom: o.validFrom ? sanitizeText(String(o.validFrom), 32) : null,
        validUntil: o.validUntil ? sanitizeText(String(o.validUntil), 32) : null,
        quantity: clampQuantity(Number(o.quantity)),
        note: sanitizeText(String(o.note ?? ""), OFERTAS_LOCALES_SHOPPING_LIST_MAX_NOTE),
        addedAt: sanitizeText(String(o.addedAt ?? new Date().toISOString()), 40),
      });
      if (items.length >= OFERTAS_LOCALES_SHOPPING_LIST_MAX_ITEMS) break;
    }
    return { version: 1, items, updatedAt: new Date().toISOString() };
  } catch {
    return createEmptyOfertaLocalShoppingListState();
  }
}

export const OFERTAS_LOCALES_SHOPPING_LIST_MAP_MAX_STORES = 5;

export function buildOfertaLocalShoppingListStoreAddress(
  group: OfertaLocalShoppingListBusinessGroup
): string | null {
  const parts = [group.address, group.city, group.state, group.zipCode].filter((p) => p.trim());
  if (parts.length > 0) return parts.join(", ");
  if (group.city.trim()) return group.city.trim();
  if (group.zipCode.trim()) return group.zipCode.trim();
  return null;
}

export type OfertaLocalShoppingListMapsDirResult = {
  url: string | null;
  reason: "empty" | "no_address" | null;
};

/** Google Maps directions handoff V1 — not Google Routes API optimization. */
export function buildOfertaLocalShoppingListGoogleMapsDirUrl(
  list: OfertaLocalShoppingListState
): OfertaLocalShoppingListMapsDirResult {
  const groups = groupOfertaLocalShoppingListByBusiness(list);
  if (groups.length === 0) return { url: null, reason: "empty" };

  const limited = groups.slice(0, OFERTAS_LOCALES_SHOPPING_LIST_MAP_MAX_STORES);

  if (limited.length === 1) {
    const group = limited[0];
    const directions = group.directionsHref?.trim();
    if (directions && directions.includes("google.com/maps")) {
      return { url: directions, reason: null };
    }
    const addr = buildOfertaLocalShoppingListStoreAddress(group);
    if (!addr) return { url: null, reason: "no_address" };
    return {
      url: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}`,
      reason: null,
    };
  }

  const addresses: string[] = [];
  for (const group of limited) {
    const addr = buildOfertaLocalShoppingListStoreAddress(group);
    if (addr) addresses.push(addr);
  }

  if (addresses.length === 0) return { url: null, reason: "no_address" };

  if (addresses.length === 1) {
    return {
      url: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addresses[0])}`,
      reason: null,
    };
  }

  const destination = addresses[addresses.length - 1];
  const waypoints = addresses.slice(0, -1).join("|");
  const params = new URLSearchParams({ api: "1", destination, waypoints });
  return { url: `https://www.google.com/maps/dir/?${params.toString()}`, reason: null };
}

export function formatOfertaLocalShoppingListPlainText(
  list: OfertaLocalShoppingListState,
  lang: OfertasLocalesAppLang
): string {
  const groups = groupOfertaLocalShoppingListByBusiness(list);
  if (groups.length === 0) {
    return lang === "en" ? "My shopping list (empty)" : "Mi lista de compras (vacía)";
  }
  const lines: string[] = [];
  lines.push(lang === "en" ? "My Leonix shopping list" : "Mi lista de compras Leonix");
  lines.push("");
  for (const group of groups) {
    const loc = [group.city, group.state, group.zipCode].filter(Boolean).join(", ");
    lines.push(`▸ ${group.businessName}${loc ? ` — ${loc}` : ""}`);
    for (const item of group.items) {
      const price = formatOfertaLocalPublicItemPriceDisplay(item);
      const qty = item.quantity > 1 ? ` x${item.quantity}` : "";
      const note = item.note.trim() ? ` (${item.note.trim()})` : "";
      lines.push(`  • ${item.itemName}${qty} — ${price}${note}`);
    }
    lines.push("");
  }
  return lines.join("\n").trim();
}
