/**
 * Gate G2A.5 — Magazine placement priority helper (pure functions).
 *
 * Controls digital ordering inside Destacados modules and tie-breakers
 * inside print-priority result buckets based on magazine page/placement.
 *
 * Priority order:
 *   1. Back cover (lowest number = highest priority)
 *   2. Inside page / regular full-page by page number
 *   3. Half-page by page number
 *   4. Quarter-page by page number
 *   5. Classified print by page number
 *   6. Internal/reserved pages
 *   7. Missing page number = fallback (9999)
 *
 * Cover square-number logic is intentionally NOT included.
 * Special banner/front-cover placements are deferred to later gates.
 */

export type PrintPlacementType =
  | "back_cover"
  | "inside_page"
  | "regular_full_page"
  | "half_page"
  | "quarter_page"
  | "classified_print"
  | "internal_reserved";

export type MagazinePlacementInput = {
  print_placement_type?: string | null;
  magazine_page_number?: number | string | null;
  magazine_issue?: string | null;
  reserved_internal?: boolean | null;
};

export type MagazinePlacementPriority = {
  digital_placement_priority: number;
  print_placement_type: PrintPlacementType;
  magazine_page_number: number | null;
  magazine_issue: string | null;
  reserved_internal: boolean;
  digital_priority_basis: "back_cover_then_page_number";
  warnings: string[];
};

const VALID_PLACEMENT_TYPES = new Set<PrintPlacementType>([
  "back_cover",
  "inside_page",
  "regular_full_page",
  "half_page",
  "quarter_page",
  "classified_print",
  "internal_reserved",
]);

const PLACEMENT_TYPE_OFFSET: Record<PrintPlacementType, number> = {
  back_cover: 0,
  inside_page: 100,
  regular_full_page: 100,
  half_page: 200,
  quarter_page: 300,
  classified_print: 400,
  internal_reserved: 9000,
};

const FALLBACK_PAGE = 9999;

export function normalizePrintPlacementType(
  value: string | null | undefined,
): PrintPlacementType {
  const v = (value ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (VALID_PLACEMENT_TYPES.has(v as PrintPlacementType)) {
    return v as PrintPlacementType;
  }
  return "inside_page";
}

function parsePageNumber(raw: number | string | null | undefined): number | null {
  if (raw == null) return null;
  const n = typeof raw === "number" ? raw : Number(String(raw).trim());
  if (!Number.isFinite(n) || n < 1) return null;
  return Math.floor(n);
}

export function resolveMagazinePlacementPriority(
  input: MagazinePlacementInput,
): MagazinePlacementPriority {
  const warnings: string[] = [];
  const placementType = normalizePrintPlacementType(input.print_placement_type);
  const pageNumber = parsePageNumber(input.magazine_page_number);
  const issue = (input.magazine_issue ?? "").trim() || null;
  const reservedInternal = input.reserved_internal === true || placementType === "internal_reserved";

  if (!issue) {
    warnings.push("Magazine issue is missing; placement priority still calculated but issue context is unknown.");
  }

  let priority: number;

  if (placementType === "back_cover") {
    priority = 1;
  } else if (placementType === "internal_reserved") {
    priority = 9000;
  } else {
    const offset = PLACEMENT_TYPE_OFFSET[placementType] ?? 100;
    if (pageNumber != null) {
      priority = pageNumber + offset;
    } else {
      warnings.push(`Page number is missing for ${placementType}; using fallback priority ${FALLBACK_PAGE}.`);
      priority = FALLBACK_PAGE;
    }
  }

  return {
    digital_placement_priority: priority,
    print_placement_type: placementType,
    magazine_page_number: pageNumber,
    magazine_issue: issue,
    reserved_internal: reservedInternal,
    digital_priority_basis: "back_cover_then_page_number",
    warnings,
  };
}

/**
 * Compare two magazine placement priorities for sort ordering.
 * Lower digital_placement_priority = higher priority (sorts first).
 * Ties return 0 so callers preserve existing order.
 */
export function compareMagazinePlacementPriority(
  a: MagazinePlacementPriority,
  b: MagazinePlacementPriority,
): number {
  if (a.digital_placement_priority !== b.digital_placement_priority) {
    return a.digital_placement_priority - b.digital_placement_priority;
  }
  return 0;
}
