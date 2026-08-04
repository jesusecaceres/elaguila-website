import type { ViajesResultRow } from "../data/viajesResultsSampleData";
import type { ViajesOfferModelV2 } from "./v2/viajesOfferModelV2";

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function rowSlug(row: ViajesResultRow): string {
  if (row.kind === "business" && row.slug) return row.slug;
  const href = row.href || "";
  const m = href.match(/\/oferta\/([^/?#]+)/);
  return m?.[1] || row.id;
}

function rowTitle(row: ViajesResultRow): string {
  if (row.kind === "business") return row.offerTitle;
  if (row.kind === "affiliate") return row.title;
  return row.title;
}

function rowDestination(row: ViajesResultRow): string {
  if (row.kind === "editorial") return row.destinationLabel;
  return row.destination;
}

export function viajesProviderIdentityKeys(offer: ViajesOfferModelV2): string[] {
  const keys = new Set<string>();
  const id = offer.provider.id.trim().toLowerCase();
  if (id) keys.add(`id:${id}`);
  const route = offer.provider.profileRoute.trim().replace(/^\/+|\/+$/g, "").toLowerCase();
  if (route) {
    keys.add(`route:${route}`);
    const last = route.split("/").filter(Boolean).pop();
    if (last) keys.add(`slug:${last}`);
  }
  const name = slugify(offer.provider.name);
  if (name) keys.add(`name:${name}`);
  return [...keys];
}

export function viajesResultMatchesProvider(
  row: ViajesResultRow,
  keys: string[],
  opts?: { excludeSlug?: string }
): boolean {
  if (opts?.excludeSlug && rowSlug(row) === opts.excludeSlug) return false;
  if (!keys.length) return false;
  if (row.kind !== "business") return false;
  if (row.sellerLane === "private") return false;

  const rowKeys = new Set<string>();
  const slug = row.businessProfileSlug?.trim().toLowerCase();
  if (slug) {
    rowKeys.add(`slug:${slug}`);
    rowKeys.add(`route:${slug}`);
    rowKeys.add(`route:clasificados/viajes/negocio/${slug}`);
  }
  const provider = slugify(row.businessName || "");
  if (provider) rowKeys.add(`name:${provider}`);

  return keys.some((k) => rowKeys.has(k));
}

export function filterViajesMoreFromProvider(
  rows: ViajesResultRow[],
  offer: ViajesOfferModelV2,
  opts?: { excludeSlug?: string; limit?: number }
): ViajesResultRow[] {
  const keys = viajesProviderIdentityKeys(offer);
  if (!keys.length) return [];
  const limit = opts?.limit ?? 6;
  return rows
    .filter((row) =>
      viajesResultMatchesProvider(row, keys, { excludeSlug: opts?.excludeSlug || offer.lifecycle.slug })
    )
    .slice(0, limit);
}

export function filterViajesSimilarGetaways(
  rows: ViajesResultRow[],
  offer: ViajesOfferModelV2,
  opts?: { excludeSlug?: string; limit?: number }
): ViajesResultRow[] {
  const exclude = (opts?.excludeSlug || offer.lifecycle.slug || "").toLowerCase();
  const destBlob = `${offer.basics.destinationLabel} ${offer.locations.destination.city}`.toLowerCase();
  const destTokens = destBlob
    .split(/[^a-z0-9áéíóúüñ]+/i)
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length >= 3);
  const limit = opts?.limit ?? 6;
  return rows
    .filter((row) => {
      if (exclude && rowSlug(row).toLowerCase() === exclude) return false;
      if (!destTokens.length) return false;
      const hay = `${rowDestination(row)} ${rowTitle(row)}`.toLowerCase();
      return destTokens.some((t) => hay.includes(t));
    })
    .slice(0, limit);
}

export function viajesResultCardTitle(row: ViajesResultRow): string {
  return rowTitle(row);
}

export function viajesResultCardSlug(row: ViajesResultRow): string {
  return rowSlug(row);
}
