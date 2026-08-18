import type {
  AudienceTag,
  PrimaryCategorySlug,
  PublicResourceRecord,
  SecondaryTag,
  UrgencyLevel,
} from "./types";

/**
 * Deterministic search/filter foundation — no AI, no network calls.
 * Every filter field is optional; omitted fields are not applied.
 * Matching never invents results: an empty catalog always returns [].
 */
export type ResourceFilterQuery = {
  /** Free-text match over organization/program name and short descriptions. */
  query?: string | null;
  category?: PrimaryCategorySlug | null;
  urgencyLevel?: UrgencyLevel | null;
  tag?: SecondaryTag | null;
  audience?: AudienceTag | null;
  /** Case-insensitive substring match against `languages`. */
  language?: string | null;
  /** Case-insensitive substring match against `serviceArea`. */
  serviceArea?: string | null;
};

function normalize(value: string | null | undefined): string {
  return String(value ?? "").trim().toLowerCase();
}

function matchesQuery(resource: PublicResourceRecord, query: string): boolean {
  const q = normalize(query);
  if (!q) return true;
  const haystack = [
    resource.organizationName,
    resource.programName ?? "",
    resource.shortDescriptionEs,
    resource.shortDescriptionEn,
  ]
    .map(normalize)
    .join(" ");
  return haystack.includes(q);
}

function matchesLanguage(resource: PublicResourceRecord, language: string): boolean {
  const q = normalize(language);
  if (!q) return true;
  return (resource.languages ?? []).some((l) => normalize(l).includes(q));
}

function matchesServiceArea(resource: PublicResourceRecord, serviceArea: string): boolean {
  const q = normalize(serviceArea);
  if (!q) return true;
  return normalize(resource.serviceArea).includes(q);
}

/** Filters a catalog of public resource records against a query. Pure, synchronous. */
export function filterResources(
  catalog: readonly PublicResourceRecord[],
  filters: ResourceFilterQuery,
): PublicResourceRecord[] {
  if (!catalog || catalog.length === 0) return [];

  return catalog.filter((resource) => {
    if (filters.category && resource.primaryCategory !== filters.category) return false;
    if (filters.urgencyLevel && resource.urgencyLevel !== filters.urgencyLevel) return false;
    if (filters.tag && !(resource.secondaryCategories ?? []).includes(filters.tag)) return false;
    if (filters.audience && !(resource.audienceTags ?? []).includes(filters.audience)) return false;
    if (filters.query && !matchesQuery(resource, filters.query)) return false;
    if (filters.language && !matchesLanguage(resource, filters.language)) return false;
    if (filters.serviceArea && !matchesServiceArea(resource, filters.serviceArea)) return false;
    return true;
  });
}

/** True when at least one filter field is populated. Useful for "empty state" UI decisions. */
export function hasActiveFilters(filters: ResourceFilterQuery): boolean {
  return Boolean(
    normalize(filters.query) ||
      filters.category ||
      filters.urgencyLevel ||
      filters.tag ||
      filters.audience ||
      normalize(filters.language) ||
      normalize(filters.serviceArea),
  );
}
