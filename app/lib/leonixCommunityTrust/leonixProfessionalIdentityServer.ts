/**
 * Item 21 (Final Completion) — resolves the durable `leonix_professional_identities` row for a
 * (owner_id, category) pair, creating it on first use. This is the target-id source for BR
 * Negocio / Rentas Negocio Community Trust votes (never a disposable listing id).
 *
 * Depends on the PREPARED (not yet applied) migration
 * supabase/migrations/20260827180000_leonix_professional_identities_br_rentas_community_trust.sql.
 * Until that migration is applied, every call here fails closed (returns `ok: false`) because
 * the table does not exist yet — this module does not assume the migration has landed.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export type BrRentasCommunityTrustCategory = "bienes_raices_negocio" | "rentas_negocio";

export async function resolveLeonixProfessionalIdentityId(
  supabase: SupabaseClient,
  input: { ownerId: string; category: BrRentasCommunityTrustCategory; displayName?: string | null },
): Promise<{ ok: true; id: string } | { ok: false }> {
  const ownerId = input.ownerId.trim();
  if (!ownerId) return { ok: false };

  const { data: existing, error: selectError } = await supabase
    .from("leonix_professional_identities")
    .select("id")
    .eq("owner_id", ownerId)
    .eq("category", input.category)
    .maybeSingle();

  if (!selectError && existing?.id) {
    return { ok: true, id: existing.id as string };
  }

  const { data: inserted, error: insertError } = await supabase
    .from("leonix_professional_identities")
    .insert({
      owner_id: ownerId,
      category: input.category,
      display_name: input.displayName?.trim() || null,
    })
    .select("id")
    .single();

  if (!insertError && inserted?.id) {
    return { ok: true, id: inserted.id as string };
  }

  // Lost the create race (unique (owner_id, category) index) — re-select the winner's row.
  const { data: retry, error: retryError } = await supabase
    .from("leonix_professional_identities")
    .select("id")
    .eq("owner_id", ownerId)
    .eq("category", input.category)
    .maybeSingle();

  if (!retryError && retry?.id) {
    return { ok: true, id: retry.id as string };
  }

  return { ok: false };
}
