import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AreaKind, BusinessServiceArea, StructuredLocationDetailsV1 } from "../types";
import { normalizeServiceAreaText } from "../normalization";

type ServiceAreaRow = {
  id: string;
  business_id: string;
  area_kind: string;
  raw_text: string;
  normalized_text: string;
  city_hint: string | null;
  is_primary: boolean;
  country: string | null;
  structured_details: unknown;
  created_at: string;
  updated_at: string;
};

const SERVICE_AREA_COLUMNS =
  "id, business_id, area_kind, raw_text, normalized_text, city_hint, is_primary, country, structured_details, created_at, updated_at";

function isStructuredDetailsV1(value: unknown): value is StructuredLocationDetailsV1 {
  return typeof value === "object" && value !== null && (value as { schemaVersion?: unknown }).schemaVersion === 1;
}

function mapServiceAreaRow(row: ServiceAreaRow): BusinessServiceArea {
  return {
    id: row.id,
    businessId: row.business_id,
    areaKind: row.area_kind as BusinessServiceArea["areaKind"],
    rawText: row.raw_text,
    normalizedText: row.normalized_text,
    cityHint: row.city_hint,
    isPrimary: row.is_primary,
    country: row.country,
    structuredDetails: isStructuredDetailsV1(row.structured_details) ? row.structured_details : { schemaVersion: 1 },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** RLS scopes this to businesses the caller has an active membership in. */
export async function listServiceAreasForBusiness(client: SupabaseClient, businessId: string): Promise<BusinessServiceArea[]> {
  const { data, error } = await client.from("business_service_areas").select(SERVICE_AREA_COLUMNS).eq("business_id", businessId);
  if (error || !data) return [];
  return (data as ServiceAreaRow[]).map(mapServiceAreaRow);
}

/**
 * Business Information Editor (Gate 1) — the FIRST post-finalization update path for
 * business_service_areas. Admin/service-role client only, staff-authorized caller. Same
 * single-business-wide-primary caveat as contactsRepo.ts
 * (`business_service_areas_one_primary_idx` is `(business_id) WHERE is_primary = true`, not
 * one-per-area_kind) — never sets is_primary on update, always inserts a new row with
 * is_primary=false, targeting the SAME row `buildBusinessApplicationContext` reads as "the"
 * physical address / service-area text (first row of that areaKind).
 *
 * `structuredDetailsPatch` is shallow-merged onto the existing row's structured_details (never
 * replaced wholesale), so editing e.g. just the street doesn't silently drop coverage/timezone
 * fields a different, unrelated flow already wrote there.
 */
export async function upsertServiceAreaAsStaff(
  adminClient: SupabaseClient,
  businessId: string,
  areaKind: AreaKind,
  input: {
    rawText: string;
    cityHint?: string | null;
    country?: string | null;
    structuredDetailsPatch?: Partial<StructuredLocationDetailsV1>;
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalizedText = normalizeServiceAreaText(input.rawText);
  if (!normalizedText) return { ok: false, error: "invalid_service_area_text" };

  const { data: rows } = await adminClient
    .from("business_service_areas")
    .select("id, structured_details")
    .eq("business_id", businessId)
    .eq("area_kind", areaKind);
  const existing = (rows ?? [])[0] as { id: string; structured_details: unknown } | undefined;

  const nowIso = new Date().toISOString();
  const existingStructuredDetails: unknown = existing ? existing.structured_details : null;
  const priorDetails: StructuredLocationDetailsV1 = isStructuredDetailsV1(existingStructuredDetails)
    ? existingStructuredDetails
    : { schemaVersion: 1 as const };
  // A key present in the patch with value `undefined` must NOT blank out an existing value — only
  // explicitly-provided (defined) keys ever overwrite. A raw `{...a, ...b}` spread would assign
  // `undefined` for any key `b` merely mentions, silently erasing whatever `a` had there.
  const definedPatchEntries = Object.entries(input.structuredDetailsPatch ?? {}).filter(([, v]) => v !== undefined);
  const structuredDetails: StructuredLocationDetailsV1 = { ...priorDetails, ...Object.fromEntries(definedPatchEntries) };

  if (existing) {
    const { error } = await adminClient
      .from("business_service_areas")
      .update({
        raw_text: input.rawText.trim(),
        normalized_text: normalizedText,
        city_hint: input.cityHint?.trim() || null,
        country: input.country?.trim() || null,
        structured_details: structuredDetails,
        updated_at: nowIso,
      })
      .eq("id", existing.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }

  const { error } = await adminClient.from("business_service_areas").insert({
    business_id: businessId,
    area_kind: areaKind,
    raw_text: input.rawText.trim(),
    normalized_text: normalizedText,
    city_hint: input.cityHint?.trim() || null,
    is_primary: false,
    country: input.country?.trim() || null,
    structured_details: structuredDetails,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
