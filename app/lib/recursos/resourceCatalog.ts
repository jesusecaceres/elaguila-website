import type { PublicResourceRecord } from "./types";

/**
 * Foundation Build 01 seed data policy: no invented nonprofit data, no
 * scraped records, no placeholder phone numbers. Coach will provide the
 * verified production resource inventory in a later gate.
 *
 * This catalog is intentionally empty. The public page and the search/
 * filter foundation must render gracefully with zero records.
 */
export const RESOURCE_CATALOG: readonly PublicResourceRecord[] = [];
