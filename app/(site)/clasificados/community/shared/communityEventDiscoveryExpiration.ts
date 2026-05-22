import {
  detailPairsToMap,
  type CommunityListingPairMap,
} from "@/app/(site)/clasificados/community/shared/communityListingDetailPairs";
import type { CommunityListingBrowseRow } from "@/app/(site)/clasificados/community/shared/communityListingsBrowseClient";

const ISO_DATE_PREFIX = /^(\d{4}-\d{2}-\d{2})/;

/** YYYY-MM-DD from Leonix:eventDate / Leonix:eventEndDate (ignores time suffix). */
export function parseLeonixEventDateKey(raw: string | undefined): string | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  const m = s.match(ISO_DATE_PREFIX);
  return m ? m[1] : null;
}

/** Local calendar day key (browser timezone) for discovery expiration comparisons. */
export function localCalendarDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Discovery expiry date for Comunidad y Eventos: eventEndDate first, else eventDate.
 * Does not use weeklyScheduleJson or day-of-week horario.
 */
export function communityEventDiscoveryExpiryDateKey(pairs: CommunityListingPairMap): string | null {
  const end = parseLeonixEventDateKey(pairs["Leonix:eventEndDate"]);
  if (end) return end;
  return parseLeonixEventDateKey(pairs["Leonix:eventDate"]);
}

/**
 * Comunidad discovery surfaces only: visible through the expiry calendar day (inclusive).
 * Missing dates stay visible. Expired = expiry date strictly before today (local).
 */
export function isCommunityEventActiveForDiscovery(
  pairs: CommunityListingPairMap,
  todayKey: string = localCalendarDateKey(),
): boolean {
  const expiryKey = communityEventDiscoveryExpiryDateKey(pairs);
  if (!expiryKey) return true;
  return expiryKey >= todayKey;
}

export function filterComunidadRowsForDiscovery(
  rows: CommunityListingBrowseRow[],
  todayKey: string = localCalendarDateKey(),
): CommunityListingBrowseRow[] {
  return rows.filter((row) => {
    const pairs = detailPairsToMap(row.detail_pairs);
    return isCommunityEventActiveForDiscovery(pairs, todayKey);
  });
}

/** Active comunidad rows: soonest event end/start first, then newest created_at. */
export function sortComunidadDiscoveryRows(rows: CommunityListingBrowseRow[]): CommunityListingBrowseRow[] {
  return [...rows].sort((a, b) => {
    const pa = detailPairsToMap(a.detail_pairs);
    const pb = detailPairsToMap(b.detail_pairs);
    const ka = communityEventDiscoveryExpiryDateKey(pa) ?? "9999-12-31";
    const kb = communityEventDiscoveryExpiryDateKey(pb) ?? "9999-12-31";
    if (ka !== kb) return ka.localeCompare(kb);
    const ca = String(a.created_at ?? "");
    const cb = String(b.created_at ?? "");
    return cb.localeCompare(ca);
  });
}

export function prepareComunidadDiscoveryRows(
  rows: CommunityListingBrowseRow[],
  options?: { limit?: number; todayKey?: string },
): CommunityListingBrowseRow[] {
  const today = options?.todayKey ?? localCalendarDateKey();
  const active = sortComunidadDiscoveryRows(filterComunidadRowsForDiscovery(rows, today));
  const limit = options?.limit;
  return limit != null ? active.slice(0, limit) : active;
}
