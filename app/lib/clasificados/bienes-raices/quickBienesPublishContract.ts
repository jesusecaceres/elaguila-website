/**
 * Gate QB-BOUNDARY-02 — the PURE half of the Quick Bienes Negocio server custody operation.
 *
 * THE BLOCKER THIS CLOSES
 * -----------------------
 * Quick Bienes Negocio used to publish as TWO independent steps taken by the browser:
 *
 *      1. browser POSTs a role descriptor to a server media gate and reads a yes/no
 *      2. browser INSERTs the listing row itself, through the RLS-governed Supabase client
 *
 * Nothing tied step 2 to step 1. Skipping step 1 and going straight to step 2 published a row the
 * server had never inspected, because the gate's answer was advice the browser chose to follow.
 *
 * The replacement is ONE server operation that validates and writes in the same request, so there
 * is no seam left between the decision and the row. This module owns every part of that operation
 * that can be decided without IO — the allowed-column whitelist, the server-forced identity
 * columns, the canonical field rules and the idempotency key — so all of it is directly testable
 * without a database, and the route stays a thin shell around it.
 *
 * FAIL CLOSED, AND NARROW BY CONSTRUCTION
 *  - Column allowance is a WHITELIST. Anything the caller sends that is not on it is dropped, so
 *    a new column can never be reachable by accident.
 *  - `owner_id`, `category`, `seller_type`, `status`, `is_published` and the payment metadata are
 *    NOT caller-supplied at all. They are written from server-held values, so a caller can neither
 *    publish as another owner, nor land its row in another category, nor arrive pre-published.
 *  - `inventory_role` is forced to `main`: the Quick package includes exactly ONE property, so a
 *    Quick publish can never create an inventory child.
 */

/**
 * Columns a Quick Bienes caller may contribute. Deliberately a subset of the staff-assisted
 * route's list: the identity and lifecycle columns that route lets a STAFF actor set are absent
 * here, because this route serves a customer publishing for themselves.
 *
 * `listing_json` is NOT here. The Quick payment metadata is rebuilt server-side, so a caller
 * cannot claim its row is already paid for.
 */
export const QUICK_BIENES_ALLOWED_COLUMNS: readonly string[] = [
  "title",
  "description",
  "city",
  "state",
  "zip",
  "price",
  "is_free",
  "business_name",
  "business_meta",
  "detail_pairs",
  "profile_json",
  "contact_json",
  "contact_phone",
  "contact_email",
];

/** Columns the SERVER always writes itself, whatever the caller sent. */
export const QUICK_BIENES_SERVER_OWNED_COLUMNS: readonly string[] = [
  "owner_id",
  "category",
  "seller_type",
  "status",
  "is_published",
  "inventory_role",
  "listing_json",
  "updated_at",
];

export const QUICK_BIENES_CATEGORY = "bienes-raices";
export const QUICK_BIENES_SELLER_TYPE = "business";
export const QUICK_BIENES_INVENTORY_ROLE = "main";

export type QuickBienesFieldIssueCode =
  | "title_required"
  | "city_required"
  | "price_invalid"
  | "listing_row_required"
  | "media_required";

export type QuickBienesFieldIssue = { code: QuickBienesFieldIssueCode; messageEs: string; messageEn: string };

const FIELD_MESSAGES: Readonly<Record<QuickBienesFieldIssueCode, { es: string; en: string }>> = {
  title_required: { es: "Falta el título.", en: "Title is required." },
  city_required: { es: "Falta la ciudad.", en: "City is required." },
  price_invalid: { es: "El precio no es válido.", en: "The price is not valid." },
  listing_row_required: { es: "Falta la información del anuncio.", en: "Listing information is missing." },
  media_required: {
    es: "Se necesita al menos una foto real de la propiedad.",
    en: "At least one real photo of the property is required.",
  },
};

function issue(code: QuickBienesFieldIssueCode): QuickBienesFieldIssue {
  return { code, messageEs: FIELD_MESSAGES[code].es, messageEn: FIELD_MESSAGES[code].en };
}

function trimmed(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * The canonical listing fields a Quick Bienes row must carry. Mirrors the checks the browser
 * publish core already performed before its own insert, moved to the server where they are the
 * boundary rather than a courtesy.
 */
export function validateQuickBienesListingFields(input: {
  listingRow: unknown;
  mediaCount: number;
}): QuickBienesFieldIssue[] {
  const issues: QuickBienesFieldIssue[] = [];
  if (!input.listingRow || typeof input.listingRow !== "object" || Array.isArray(input.listingRow)) {
    return [issue("listing_row_required")];
  }
  const row = input.listingRow as Record<string, unknown>;

  if (!trimmed(row.title)) issues.push(issue("title_required"));
  if (!trimmed(row.city)) issues.push(issue("city_required"));

  const price = row.price;
  const priceNumber = typeof price === "number" ? price : typeof price === "string" ? Number(price) : NaN;
  if (!Number.isFinite(priceNumber) || priceNumber < 0) issues.push(issue("price_invalid"));

  if (!Number.isFinite(input.mediaCount) || input.mediaCount < 1) issues.push(issue("media_required"));

  return issues;
}

/** Keep only whitelisted columns. Everything else is dropped silently and never reaches the row. */
export function pickQuickBienesAllowedColumns(listingRow: unknown): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!listingRow || typeof listingRow !== "object" || Array.isArray(listingRow)) return out;
  for (const [key, value] of Object.entries(listingRow as Record<string, unknown>)) {
    if (QUICK_BIENES_ALLOWED_COLUMNS.includes(key)) out[key] = value;
  }
  return out;
}

/**
 * The exact row the server writes.
 *
 * Every identity and lifecycle column is supplied here from server-held values, AFTER the caller's
 * whitelisted contribution is spread in — so an allowed column can never shadow a server-owned
 * one even if the whitelist and the override list ever drifted.
 *
 * `listing_json` carries the Quick binding: the payment lane, the `pending` payment status the
 * row genuinely has, and the SIMPLE base package key this publish is bound to. Because the server
 * writes it, later reads of "which product is this row" find a fact the browser never touched.
 */
export function buildQuickBienesListingRow(input: {
  listingRow: unknown;
  ownerUserId: string;
  quickPackageKey: string;
  nowIso: string;
  /** Pre-existing `listing_json` content to preserve, when amending a reused pending row. */
  listingJsonBase?: Record<string, unknown> | null;
}): Record<string, unknown> {
  const contributed = pickQuickBienesAllowedColumns(input.listingRow);
  return {
    ...contributed,
    owner_id: input.ownerUserId,
    category: QUICK_BIENES_CATEGORY,
    seller_type: QUICK_BIENES_SELLER_TYPE,
    status: "pending",
    is_published: false,
    inventory_role: QUICK_BIENES_INVENTORY_ROLE,
    listing_json: buildQuickBienesListingJson({
      base: input.listingJsonBase ?? null,
      quickPackageKey: input.quickPackageKey,
    }),
    updated_at: input.nowIso,
  };
}

/**
 * The server-written `listing_json` for a Quick Bienes row. Preserves anything already stored and
 * replaces only the `br_payment` block, so an amended pending row does not lose its other content.
 */
export function buildQuickBienesListingJson(input: {
  base: Record<string, unknown> | null;
  quickPackageKey: string;
}): Record<string, unknown> {
  const base = input.base && typeof input.base === "object" && !Array.isArray(input.base) ? input.base : {};
  return {
    ...base,
    br_payment: {
      payment_status: "pending",
      lane: "negocio",
      base_package_key: input.quickPackageKey,
    },
  };
}

/**
 * The identity a retry must collapse onto.
 *
 * A duplicate click, a lost response or a second tab must not leave two pending properties. The
 * key is the durable identity of the publish — owner, category, seller type, the main inventory
 * role, and the title the customer typed — never a per-click id, so a retry that carries no id at
 * all still finds its own row. This mirrors the reuse lookup the browser publish core already
 * performed, moved to the server where a client cannot decline to run it.
 */
export type QuickBienesReuseKey = {
  owner_id: string;
  category: string;
  seller_type: string;
  status: string;
  is_published: boolean;
  inventory_role: string;
  title: string;
};

export function buildQuickBienesReuseKey(input: {
  ownerUserId: string;
  title: unknown;
}): QuickBienesReuseKey {
  return {
    owner_id: input.ownerUserId,
    category: QUICK_BIENES_CATEGORY,
    seller_type: QUICK_BIENES_SELLER_TYPE,
    status: "pending",
    is_published: false,
    inventory_role: QUICK_BIENES_INVENTORY_ROLE,
    title: trimmed(input.title),
  };
}

export type QuickBienesRefusalCode =
  | "auth_required"
  | "db_not_configured"
  | "invalid_body"
  | "quick_product_mismatch"
  | "media_contract_violation"
  | "invalid_listing_fields"
  | "reuse_lookup_failed"
  | "listing_write_failed";

/** The one refusal shape this operation answers with, so no caller has to guess the body. */
export type QuickBienesRefusalBody = {
  ok: false;
  error: QuickBienesRefusalCode;
  issues?: string[];
  message: string;
  messageEs: string;
};

export function quickBienesRefusal(
  code: QuickBienesRefusalCode,
  copy: { en: string; es: string },
  issues?: string[],
): QuickBienesRefusalBody {
  return { ok: false, error: code, ...(issues?.length ? { issues } : {}), message: copy.en, messageEs: copy.es };
}
