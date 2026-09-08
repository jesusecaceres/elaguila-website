import "server-only";

import { randomBytes } from "node:crypto";

type SupabaseLike = { from: (table: string) => any };

export const OFERTA_LOCAL_LEONIX_AD_ID_PATTERN = /^LNX-[A-Z0-9]{8}$/;

export function generateOfertaLocalLeonixAdId(): string {
  return `LNX-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export function isOfertaLocalLeonixAdId(value: string | null | undefined): boolean {
  return OFERTA_LOCAL_LEONIX_AD_ID_PATTERN.test(String(value ?? "").trim());
}

export type EnsureOfertaLocalLeonixAdIdResult =
  | { ok: true; leonixAdId: string; generated: boolean }
  | { ok: false; code: string; message: string };

export async function ensureOfertaLocalLeonixAdId(input: {
  supabase: SupabaseLike;
  ofertaLocalId: string;
  ownerId: string;
}): Promise<EnsureOfertaLocalLeonixAdIdResult> {
  const ofertaLocalId = input.ofertaLocalId.trim();
  const ownerId = input.ownerId.trim();
  if (!ofertaLocalId || !ownerId) {
    return { ok: false, code: "invalid_identity_input", message: "Listing and owner are required." };
  }

  const { data: existing, error: existingError } = await input.supabase
    .from("ofertas_locales")
    .select("id, owner_id, leonix_ad_id")
    .eq("id", ofertaLocalId)
    .maybeSingle();

  if (existingError) {
    return {
      ok: false,
      code: "leonix_ad_id_lookup_failed",
      message: existingError.message ?? "Could not read existing Leonix Ad ID.",
    };
  }

  if (!existing?.id) {
    return { ok: false, code: "listing_not_found", message: "Ofertas listing not found." };
  }

  if (String(existing.owner_id ?? "") !== ownerId) {
    return { ok: false, code: "listing_owner_mismatch", message: "Listing owner does not match." };
  }

  const current = String(existing.leonix_ad_id ?? "").trim();
  if (isOfertaLocalLeonixAdId(current)) {
    return { ok: true, leonixAdId: current, generated: false };
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = generateOfertaLocalLeonixAdId();
    const { data, error } = await input.supabase
      .from("ofertas_locales")
      .update({ leonix_ad_id: candidate, updated_at: new Date().toISOString() })
      .eq("id", ofertaLocalId)
      .eq("owner_id", ownerId)
      .is("leonix_ad_id", null)
      .select("leonix_ad_id")
      .maybeSingle();

    if (data?.leonix_ad_id && isOfertaLocalLeonixAdId(String(data.leonix_ad_id))) {
      return { ok: true, leonixAdId: String(data.leonix_ad_id), generated: true };
    }

    const msg = error?.message ?? "";
    if (error && !/duplicate|unique/i.test(msg)) {
      return { ok: false, code: "leonix_ad_id_assign_failed", message: msg || "Could not assign Leonix Ad ID." };
    }

    const { data: raced } = await input.supabase
      .from("ofertas_locales")
      .select("id, owner_id, leonix_ad_id")
      .eq("id", ofertaLocalId)
      .maybeSingle();
    const racedId = String(raced?.leonix_ad_id ?? "").trim();
    if (isOfertaLocalLeonixAdId(racedId) && String(raced?.owner_id ?? "") === ownerId) {
      return { ok: true, leonixAdId: racedId, generated: false };
    }
  }

  return {
    ok: false,
    code: "leonix_ad_id_collision_exhausted",
    message: "Could not assign a unique Leonix Ad ID after retries.",
  };
}
