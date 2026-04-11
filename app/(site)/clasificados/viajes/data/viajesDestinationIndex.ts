/**
 * Derived destination catalog for Viajes autocomplete.
 * Built from landing samples + `getViajesPublicResultRows()` — extend when live inventory feeds the adapter.
 */

import { VIAJES_DESTINATION_COLLECTIONS, VIAJES_TOP_OFFERS } from "./viajesLandingSampleData";
import { VIAJES_NEGOCIO_PROFILES } from "./viajesNegocioProfileSampleData";
import { VIAJES_OFFER_DETAILS } from "./viajesOfferDetailSampleData";
import { getViajesPublicResultRows } from "../lib/viajesPublicInventory";
import { normalizeViajesDestinationKey, viajesDestinationMatchBlob } from "../lib/normalizeViajesDestination";

export type ViajesDestinationRecord = {
  /** Canonical `dest` query value */
  destParam: string;
  /** Primary label shown in UI */
  label: string;
  /** Secondary line (region, country, collection) */
  detail?: string;
  /** Normalized text used for matching */
  searchBlob: string;
};

function destFromResultsHref(href: string): string | null {
  try {
    const u = href.startsWith("http") ? new URL(href) : new URL(href, "https://leonix.local");
    return u.searchParams.get("dest");
  } catch {
    return null;
  }
}

function mergeRecord(map: Map<string, ViajesDestinationRecord>, rec: ViajesDestinationRecord) {
  const key = rec.destParam;
  const existing = map.get(key);
  if (!existing) {
    map.set(key, rec);
    return;
  }
  if (rec.detail && !existing.detail) existing.detail = rec.detail;
  const mergedBlob = viajesDestinationMatchBlob([existing.searchBlob, rec.searchBlob]);
  existing.searchBlob = mergedBlob;
}

function buildIndex(): ViajesDestinationRecord[] {
  const map = new Map<string, ViajesDestinationRecord>();

  for (const col of VIAJES_DESTINATION_COLLECTIONS) {
    const destParam =
      col.browse.dest?.trim() ||
      normalizeViajesDestinationKey(col.name).replace(/\s+/g, "-");
    mergeRecord(map, {
      destParam,
      label: col.name,
      detail: col.supportingLine.slice(0, 80),
      searchBlob: viajesDestinationMatchBlob([col.name, col.supportingLine, destParam]),
    });
  }

  for (const offer of VIAJES_TOP_OFFERS) {
    const fromHref = offer.resultsBrowse?.dest?.trim() || (offer.href ? destFromResultsHref(offer.href) : null);
    if (fromHref) {
      mergeRecord(map, {
        destParam: fromHref,
        label: offer.title,
        detail: offer.locationLine,
        searchBlob: viajesDestinationMatchBlob([offer.title, offer.locationLine, fromHref]),
      });
    } else {
      const parts = offer.locationLine.split(",").map((s) => s.trim());
      const city = parts[0] ?? offer.title;
      const destParam = normalizeViajesDestinationKey(city).replace(/\s+/g, "-");
      mergeRecord(map, {
        destParam,
        label: city,
        detail: parts.slice(1).join(", ") || offer.locationLine,
        searchBlob: viajesDestinationMatchBlob([offer.title, offer.locationLine, destParam]),
      });
    }
  }

  for (const row of getViajesPublicResultRows()) {
    if (row.kind === "editorial") {
      const dest = row.destinationLabel;
      const first = dest.split(/[,·]/)[0]?.trim() ?? dest;
      const destParam = normalizeViajesDestinationKey(first).replace(/\s+/g, "-");
      mergeRecord(map, {
        destParam,
        label: first,
        detail: dest,
        searchBlob: viajesDestinationMatchBlob([row.title, dest, destParam]),
      });
      continue;
    }
    const dest = row.destination;
    const first = dest.split(/[,·]/)[0]?.trim() ?? dest;
    const destParam = normalizeViajesDestinationKey(first).replace(/\s+/g, "-");
    const title = row.kind === "affiliate" ? row.title : row.offerTitle;
    mergeRecord(map, {
      destParam,
      label: first,
      detail: dest,
      searchBlob: viajesDestinationMatchBlob([title, dest, destParam]),
    });
  }

  for (const offer of Object.values(VIAJES_OFFER_DETAILS)) {
    const dest = offer.destination;
    const head = dest.split(",")[0]?.trim() ?? dest;
    const destParam = normalizeViajesDestinationKey(head).replace(/\s+/g, "-");
    mergeRecord(map, {
      destParam,
      label: head,
      detail: dest,
      searchBlob: viajesDestinationMatchBlob([offer.title, dest, dest, offer.slug]),
    });
  }

  for (const profile of Object.values(VIAJES_NEGOCIO_PROFILES)) {
    for (const d of profile.destinationsServed) {
      const destParam = normalizeViajesDestinationKey(d).replace(/\s+/g, "-");
      mergeRecord(map, {
        destParam,
        label: d,
        detail: `Cobertura · ${profile.businessName}`,
        searchBlob: viajesDestinationMatchBlob([d, profile.businessName, destParam]),
      });
    }
  }

  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label, "es"));
}

let cached: ViajesDestinationRecord[] | null = null;

export function getViajesDestinationIndex(): ViajesDestinationRecord[] {
  if (!cached) cached = buildIndex();
  return cached;
}

export function filterViajesDestinations(rawQuery: string, limit = 8): ViajesDestinationRecord[] {
  const q = normalizeViajesDestinationKey(rawQuery);
  if (!q) return getViajesDestinationIndex().slice(0, limit);

  const all = getViajesDestinationIndex();
  const scored = all
    .map((r) => {
      const blob = r.searchBlob;
      if (blob.includes(q) || r.destParam.includes(q)) return { r, score: 0 };
      const labelN = normalizeViajesDestinationKey(r.label);
      if (labelN.startsWith(q)) return { r, score: 1 };
      if (blob.split(" ").some((w) => w.startsWith(q))) return { r, score: 2 };
      return { r, score: 3 };
    })
    .filter((x) => x.score < 3)
    .sort((a, b) => a.score - b.score || a.r.label.localeCompare(b.r.label, "es"));

  return scored.slice(0, limit).map((x) => x.r);
}
