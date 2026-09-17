/**
 * Gate BIENES-PRIVADO-1 — browser client for the FSBO (Privado) owner status route, plus the
 * owner-safe bilingual copy for its refusals.
 *
 * Mirrors `brDashboardLifecycleClient.ts` exactly (session access token -> bearer header -> POST),
 * so the two BR lanes have one client shape. This module holds NO transition rules: it cannot
 * decide whether a change is legal, only ask the server. Every Privado status write on the owner
 * surfaces goes through here instead of a direct RLS table update.
 */
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import type { BrFsboOwnerStatusAction } from "@/app/lib/clasificados/bienes-raices/brFsboOwnerStatusAuthority";

export type BrFsboStatusClientResult =
  | { ok: true; status: string; isPublished: boolean }
  | { ok: false; code: string };

export async function callBrFsboStatusMutation(input: {
  listingId: string;
  action: BrFsboOwnerStatusAction;
}): Promise<BrFsboStatusClientResult> {
  const listingId = input.listingId.trim();
  if (!listingId) return { ok: false, code: "invalid_request" };

  const supabase = createSupabaseBrowserClient();
  const { data: auth } = await supabase.auth.getSession();
  const token = auth.session?.access_token;
  if (!token?.trim()) return { ok: false, code: "br_fsbo_status_auth_required" };

  try {
    const res = await fetch("/api/clasificados/bienes-raices/privado-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token.trim()}`,
      },
      body: JSON.stringify({ listingId, action: input.action }),
    });
    const json = (await res.json().catch(() => null)) as
      | { ok?: boolean; code?: string; status?: string; isPublished?: boolean }
      | null;
    if (!res.ok || !json?.ok) {
      return { ok: false, code: json?.code ?? "br_fsbo_status_request_failed" };
    }
    return { ok: true, status: String(json.status ?? ""), isPublished: json.isPublished === true };
  } catch {
    return { ok: false, code: "br_fsbo_status_request_failed" };
  }
}

/**
 * Owner-safe copy for the server's own typed codes. `payment_required` deliberately reads as an
 * actionable instruction rather than a generic failure: the listing genuinely has not been paid
 * for, and telling the owner to "try again" would be a lie.
 */
export function brFsboStatusErrorMessage(code: string, lang: "es" | "en"): string {
  const es: Record<string, string> = {
    br_fsbo_status_auth_required: "Debes iniciar sesión de nuevo.",
    br_fsbo_status_listing_not_found: "No se encontró el anuncio.",
    br_fsbo_status_owner_mismatch: "Este anuncio no pertenece a tu cuenta.",
    br_fsbo_status_lane_mismatch: "Esta acción no aplica a este tipo de anuncio.",
    br_fsbo_status_transition_not_allowed: "Esta acción no está disponible en el estado actual del anuncio.",
    br_fsbo_status_payment_required: "Este anuncio aún no está pagado. Completa el pago para publicarlo.",
    supabase_not_configured: "El servicio no está disponible en este momento.",
  };
  const en: Record<string, string> = {
    br_fsbo_status_auth_required: "Please sign in again.",
    br_fsbo_status_listing_not_found: "Listing not found.",
    br_fsbo_status_owner_mismatch: "This listing does not belong to your account.",
    br_fsbo_status_lane_mismatch: "This action does not apply to this kind of listing.",
    br_fsbo_status_transition_not_allowed: "This action is not available in the listing's current state.",
    br_fsbo_status_payment_required: "This listing is not paid yet. Complete payment to publish it.",
    supabase_not_configured: "This service is unavailable right now.",
  };
  const table = lang === "en" ? en : es;
  return (
    table[code] ??
    (lang === "en" ? "The change could not be applied." : "No se pudo aplicar el cambio.")
  );
}
