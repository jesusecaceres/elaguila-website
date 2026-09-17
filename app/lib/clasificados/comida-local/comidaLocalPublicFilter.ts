/**
 * Gate COMIDA-LOCAL-2 — the Comida Local public inclusion filter and its URL parser, extracted
 * verbatim from `comidaLocalPublicQueries.ts` so they are reachable WITHOUT dragging `server-only`
 * along with them.
 *
 * Why the extraction: the Saved Search matcher must run the category's REAL filter (not a copy),
 * and the filter is pure — it takes rows and filters and returns rows, with no I/O, no Supabase
 * client and no framework dependency. Leaving it inside the `server-only` query module would have
 * forced every consumer of the real semantics to become server-only too, which is how categories
 * end up with a second, drifting copy of their own filter.
 *
 * Behavior is UNCHANGED — the bodies are the ones the live landing/results page has always run:
 * substring `q` and `city`, exact `foodType`, membership `service`, exact `priceLevel`.
 * `comidaLocalPublicQueries` re-exports both symbols, so every existing import keeps working and
 * `listPublishedComidaLocalListings` still applies this exact function.
 */
import type {
  ComidaLocalPublicListingRow,
  ComidaLocalResultsFilters,
} from "./comidaLocalPublicTypes";

export const COMIDA_LOCAL_PUBLIC_STATUS_PUBLISHED = "published" as const;

function parseStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((v): v is string => typeof v === "string").map((s) => s.trim()).filter(Boolean);
}

function matchesQuery(row: ComidaLocalPublicListingRow, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const hay = [
    row.business_name,
    row.que_vendes,
    row.food_type,
    row.food_type_custom ?? "",
    row.city_display,
    row.city_canonical ?? "",
    row.zone_note ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(needle);
}

/**
 * The category's real inclusion filter, applied verbatim by `listPublishedComidaLocalListings` —
 * i.e. this IS what a shopper sees on the live landing/results page, and it is what the Saved
 * Search matcher evaluates a listing against.
 *
 * Note what it deliberately does NOT read: `location_note`, `location_url` or any Find Me Today
 * freshness state. The category has no current-location facet, which is exactly why there is no
 * durable temporary-location filter for a saved search to fingerprint.
 */
export function filterComidaLocalPublicRows(
  rows: ComidaLocalPublicListingRow[],
  filters: ComidaLocalResultsFilters,
): ComidaLocalPublicListingRow[] {
  return rows.filter((row) => {
    if (filters.q && !matchesQuery(row, filters.q)) return false;

    if (filters.city) {
      const cityNeedle = filters.city.trim().toLowerCase();
      const cityHay = `${row.city_display} ${row.city_canonical ?? ""}`.toLowerCase();
      if (!cityHay.includes(cityNeedle)) return false;
    }

    if (filters.foodType) {
      const ft = filters.foodType.trim().toLowerCase();
      if ((row.food_type ?? "").toLowerCase() !== ft) return false;
    }

    if (filters.service) {
      const services = parseStringArray(row.service_options);
      if (!services.includes(filters.service)) return false;
    }

    if (filters.priceLevel) {
      if ((row.price_level ?? "").trim() !== filters.priceLevel.trim()) return false;
    }

    return true;
  });
}

export function parseComidaLocalResultsSearchParams(
  sp: Record<string, string | string[] | undefined> | undefined,
): ComidaLocalResultsFilters {
  const one = (k: string) => {
    const v = sp?.[k];
    return typeof v === "string" ? v.trim() : Array.isArray(v) ? String(v[0] ?? "").trim() : "";
  };
  return {
    q: one("q"),
    city: one("city"),
    foodType: one("foodType"),
    service: one("service"),
    priceLevel: one("priceLevel"),
  };
}
