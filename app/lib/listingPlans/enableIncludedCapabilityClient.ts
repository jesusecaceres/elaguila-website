/**
 * Browser client — POST /api/dashboard/enable-included-capability.
 * Package C Build 3 (C5/C6) — replaces the retired $79 dashboard add-on checkout for
 * Restaurantes/Servicios coupons: no Stripe, no checkout URL, no redirect. The server verifies
 * real base-package capability before writing anything.
 */

import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";

const ENABLE_INCLUDED_CAPABILITY_ROUTE = "/api/dashboard/enable-included-capability";

export type EnableIncludedCapabilityResult =
  | { ok: true }
  | { ok: false; code: string; userMessage: string };

function enableIncludedCapabilityErrorMessage(lang: "es" | "en", code: string): string {
  if (code === "no_qualifying_package" || code === "expired") {
    return lang === "es"
      ? "Este módulo está incluido con tu plan de $399/mes. Activa o renueva tu plan base para usarlo."
      : "This module is included with your $399/mo plan. Activate or renew your base plan to use it.";
  }
  if (code === "suspended") {
    return lang === "es"
      ? "Tu suscripción está suspendida. Resuelve el pago para usar este módulo."
      : "Your subscription is suspended. Resolve payment to use this module.";
  }
  return lang === "es"
    ? "No pudimos activar este módulo. Intenta de nuevo o contacta a Leonix."
    : "We could not enable this module. Please try again or contact Leonix.";
}

export async function enableIncludedCommercialCapability(input: {
  category: string;
  listingId: string;
  capability?: string;
  lang: "es" | "en";
}): Promise<EnableIncludedCapabilityResult> {
  const sb = createSupabaseBrowserClient();
  const { data } = await sb.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    return {
      ok: false,
      code: "unauthorized",
      userMessage: input.lang === "es" ? "Inicia sesión para continuar." : "Sign in to continue.",
    };
  }

  try {
    const res = await fetch(ENABLE_INCLUDED_CAPABILITY_ROUTE, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        category: input.category,
        listingId: input.listingId,
        capability: input.capability ?? "coupons_offers",
      }),
    });
    const j = (await res.json().catch(() => ({}))) as { ok?: boolean; code?: string };
    if (res.ok && j.ok) return { ok: true };
    const code = j.code ?? "unknown_error";
    return { ok: false, code, userMessage: enableIncludedCapabilityErrorMessage(input.lang, code) };
  } catch {
    return {
      ok: false,
      code: "network_error",
      userMessage: enableIncludedCapabilityErrorMessage(input.lang, "network_error"),
    };
  }
}
