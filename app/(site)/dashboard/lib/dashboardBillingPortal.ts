"use client";

import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";

export type DashboardBillingPortalCategory =
  | "servicios"
  | "restaurantes"
  | "autos-dealer"
  | "bienes-negocio";

export function dashboardBillingPortalLabel(lang: "es" | "en"): string {
  return lang === "es" ? "Administrar facturación" : "Manage billing";
}

export function dashboardBillingPortalBusyLabel(lang: "es" | "en"): string {
  return lang === "es" ? "Abriendo facturación…" : "Opening billing…";
}

export function dashboardBillingPortalErrorCopy(lang: "es" | "en"): string {
  return lang === "es"
    ? "No se pudo abrir la facturación de este anuncio. Actualiza la página e inténtalo de nuevo."
    : "Could not open billing for this listing. Refresh the page and try again.";
}

export async function openDashboardBillingPortal(input: {
  category: DashboardBillingPortalCategory;
  listingId: string;
  returnPath: string;
  lang: "es" | "en";
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const listingId = input.listingId.trim();
  if (!listingId) return { ok: false, message: dashboardBillingPortalErrorCopy(input.lang) };

  try {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token?.trim();
    if (!token) return { ok: false, message: dashboardBillingPortalErrorCopy(input.lang) };

    const res = await fetch("/api/stripe/billing-portal-session", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        category: input.category,
        listingId,
        returnPath: input.returnPath,
      }),
    });

    const json = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      url?: string;
    };
    if (!res.ok || json.ok !== true || typeof json.url !== "string") {
      return { ok: false, message: dashboardBillingPortalErrorCopy(input.lang) };
    }

    let portal: URL;
    try {
      portal = new URL(json.url);
    } catch {
      return { ok: false, message: dashboardBillingPortalErrorCopy(input.lang) };
    }
    if (portal.protocol !== "https:") {
      return { ok: false, message: dashboardBillingPortalErrorCopy(input.lang) };
    }

    window.location.assign(portal.toString());
    return { ok: true };
  } catch {
    return { ok: false, message: dashboardBillingPortalErrorCopy(input.lang) };
  }
}
