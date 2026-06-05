/**
 * Gate G2B — Resolve published ad identity server-side (never trust client owner_user_id).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildCanonicalAdId,
  type ListingAnalyticsIdentity,
  type ListingAnalyticsSourceTable,
  isListingAnalyticsSourceTable,
} from "@/app/lib/analytics/listingAnalyticsIdentity";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export type ResolveListingAnalyticsIdentityInput = {
  sourceTable: string;
  sourceId: string;
  category?: string | null;
  canonicalAdId?: string | null;
};

export type ResolveListingAnalyticsIdentityError =
  | "invalid_source_table"
  | "invalid_source_id"
  | "listing_not_found"
  | "db_not_configured";

export type ResolveListingAnalyticsIdentityResult =
  | { ok: true; identity: ListingAnalyticsIdentity }
  | { ok: false; error: ResolveListingAnalyticsIdentityError };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function trim(v: string | null | undefined): string {
  return (v ?? "").trim();
}

function str(v: unknown): string {
  if (v == null) return "";
  return String(v).trim();
}

function isUuidLike(id: string): boolean {
  return UUID_RE.test(id);
}

type Row = Record<string, unknown>;

async function fetchRowByIdOrSlug(
  sb: SupabaseClient,
  table: ListingAnalyticsSourceTable,
  sourceId: string,
  opts: { slugColumn?: string | false; leonixColumn?: boolean } = {},
): Promise<Row | null> {
  const slugCol = opts.slugColumn === false ? null : (opts.slugColumn ?? "slug");
  const id = trim(sourceId);
  if (!id) return null;

  const select = "*";
  const base = () => sb.from(table).select(select);

  if (isUuidLike(id)) {
    const { data } = await base().eq("id", id).maybeSingle();
    if (data) return data as Row;
  }

  if (slugCol) {
    const { data: bySlug } = await base().eq(slugCol, id).maybeSingle();
    if (bySlug) return bySlug as Row;
  }

  if (opts.leonixColumn) {
    const { data: byAd } = await base().eq("leonix_ad_id", id).maybeSingle();
    if (byAd) return byAd as Row;
  }

  if (!isUuidLike(id)) {
    const { data } = await base().eq("id", id).maybeSingle();
    if (data) return data as Row;
  }

  return null;
}

function autosTitleFromPayload(row: Row): string | undefined {
  const payload = row.listing_payload;
  if (!payload || typeof payload !== "object") return undefined;
  const p = payload as Record<string, unknown>;
  const title = str(p.title ?? p.headline ?? p.vehicleTitle);
  return title || undefined;
}

function resolveListingsRow(
  row: Row,
  sourceId: string,
  categoryHint?: string,
): ResolveListingAnalyticsIdentityResult {
  const owner = str(row.owner_id);
  if (!owner) return { ok: false, error: "listing_not_found" };

  const id = str(row.id) || sourceId;
  const leonixAdId = str(row.leonix_ad_id) || undefined;
  const category = trim(categoryHint) || str(row.category) || "listings";
  const canonicalAdId = buildCanonicalAdId({
    sourceTable: "listings",
    sourceId: id,
    leonixAdId,
    slug: undefined,
  });

  return {
    ok: true,
    identity: {
      canonicalAdId,
      sourceTable: "listings",
      sourceId: id,
      category,
      ownerUserId: owner,
      title: str(row.title) || undefined,
      status: str(row.status) || undefined,
      leonixAdId,
      legacyListingId: canonicalAdId,
    },
  };
}

function resolveAutosRow(row: Row, sourceId: string): ResolveListingAnalyticsIdentityResult {
  const status = str(row.status);
  if (status === "removed") return { ok: false, error: "listing_not_found" };

  const owner = str(row.owner_user_id);
  if (!owner) return { ok: false, error: "listing_not_found" };

  const id = str(row.id) || sourceId;
  const leonixAdId = str(row.leonix_ad_id) || undefined;
  const canonicalAdId = buildCanonicalAdId({
    sourceTable: "autos_classifieds_listings",
    sourceId: id,
    leonixAdId,
  });

  return {
    ok: true,
    identity: {
      canonicalAdId,
      sourceTable: "autos_classifieds_listings",
      sourceId: id,
      category: "autos",
      ownerUserId: owner,
      title: autosTitleFromPayload(row),
      status: status || undefined,
      leonixAdId,
      legacyListingId: canonicalAdId,
    },
  };
}

function resolveSlugPrimaryRow(
  row: Row,
  sourceId: string,
  sourceTable: ListingAnalyticsSourceTable,
  category: string,
  titleKeys: string[],
  statusKey: string,
): ResolveListingAnalyticsIdentityResult {
  const owner = str(row.owner_user_id);
  if (!owner) return { ok: false, error: "listing_not_found" };

  const id = str(row.id) || sourceId;
  const slug = str(row.slug) || undefined;
  const leonixAdId = str(row.leonix_ad_id) || undefined;
  const canonicalAdId = buildCanonicalAdId({
    sourceTable,
    sourceId: id,
    leonixAdId,
    slug,
  });

  let title: string | undefined;
  for (const k of titleKeys) {
    const t = str(row[k]);
    if (t) {
      title = t;
      break;
    }
  }

  return {
    ok: true,
    identity: {
      canonicalAdId,
      sourceTable,
      sourceId: id,
      category,
      ownerUserId: owner,
      title,
      slug,
      status: str(row[statusKey]) || undefined,
      leonixAdId,
      legacyListingId: canonicalAdId,
    },
  };
}

async function resolveFromTable(
  sb: SupabaseClient,
  input: ResolveListingAnalyticsIdentityInput,
): Promise<ResolveListingAnalyticsIdentityResult> {
  const sourceTable = trim(input.sourceTable) as ListingAnalyticsSourceTable;
  const sourceId = trim(input.sourceId);
  const categoryHint = trim(input.category);

  if (!isListingAnalyticsSourceTable(sourceTable)) {
    return { ok: false, error: "invalid_source_table" };
  }
  if (!sourceId) return { ok: false, error: "invalid_source_id" };

  let row: Row | null = null;

  switch (sourceTable) {
    case "listings":
      row = await fetchRowByIdOrSlug(sb, "listings", sourceId, {
        slugColumn: false,
        leonixColumn: true,
      });
      if (!row) return { ok: false, error: "listing_not_found" };
      return resolveListingsRow(row, sourceId, categoryHint);
    case "autos_classifieds_listings":
      row = await fetchRowByIdOrSlug(sb, "autos_classifieds_listings", sourceId, {
        slugColumn: false,
        leonixColumn: true,
      });
      if (!row) return { ok: false, error: "listing_not_found" };
      return resolveAutosRow(row, sourceId);
    case "empleos_public_listings":
      row = await fetchRowByIdOrSlug(sb, "empleos_public_listings", sourceId, {
        leonixColumn: true,
      });
      if (!row) return { ok: false, error: "listing_not_found" };
      return resolveSlugPrimaryRow(row, sourceId, "empleos_public_listings", "empleos", ["title"], "lifecycle_status");
    case "servicios_public_listings":
      row = await fetchRowByIdOrSlug(sb, "servicios_public_listings", sourceId, {
        leonixColumn: true,
      });
      if (!row) return { ok: false, error: "listing_not_found" };
      return resolveSlugPrimaryRow(row, sourceId, "servicios_public_listings", "servicios", ["business_name"], "listing_status");
    case "restaurantes_public_listings":
      row = await fetchRowByIdOrSlug(sb, "restaurantes_public_listings", sourceId, {
        leonixColumn: true,
      });
      if (!row) return { ok: false, error: "listing_not_found" };
      return resolveSlugPrimaryRow(row, sourceId, "restaurantes_public_listings", "restaurantes", ["business_name"], "status");
    case "viajes_staged_listings":
      row = await fetchRowByIdOrSlug(sb, "viajes_staged_listings", sourceId, {
        leonixColumn: true,
      });
      if (!row) return { ok: false, error: "listing_not_found" };
      return resolveSlugPrimaryRow(row, sourceId, "viajes_staged_listings", "viajes", ["title"], "lifecycle_status");
    default:
      return { ok: false, error: "invalid_source_table" };
  }
}

/**
 * Load published ad row via service role and return canonical analytics identity.
 */
export async function resolveListingAnalyticsIdentity(
  input: ResolveListingAnalyticsIdentityInput,
  sb?: SupabaseClient,
): Promise<ResolveListingAnalyticsIdentityResult> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "db_not_configured" };
  }

  const client = sb ?? getAdminSupabase();
  const resolved = await resolveFromTable(client, input);
  if (!resolved.ok) return resolved;

  const hintCanonical = trim(input.canonicalAdId);
  if (hintCanonical && hintCanonical !== resolved.identity.canonicalAdId) {
    resolved.identity = {
      ...resolved.identity,
      legacyListingId: resolved.identity.canonicalAdId,
    };
  }

  return resolved;
}
