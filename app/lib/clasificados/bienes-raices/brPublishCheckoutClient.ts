/**
 * Browser client — start BR Stripe checkout after pending listing insert.
 */

import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";

export type BrCheckoutStartResult =
  | { ok: true; url: string; sessionId?: string; internalBypass?: boolean; testPublishBypass?: boolean }
  | { ok: false; error: string; message?: string };

export async function startBrNegocioCheckout(input: {
  listingId: string;
  lang: "es" | "en";
  returnToListingId?: string;
}): Promise<BrCheckoutStartResult> {
  const sb = createSupabaseBrowserClient();
  const { data } = await sb.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    return { ok: false, error: "unauthorized", message: input.lang === "es" ? "Inicia sesión." : "Sign in required." };
  }
  const r = await fetch("/api/clasificados/leonix/stripe/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      listingId: input.listingId,
      lang: input.lang,
      lane: "negocio",
      returnToListingId: input.returnToListingId,
    }),
  });
  const j = (await r.json()) as BrCheckoutStartResult & { url?: string; liveUrl?: string };
  if (!r.ok || !j.ok) {
    return {
      ok: false,
      error: (j as { error?: string }).error ?? "checkout_failed",
      message: (j as { message?: string }).message,
    };
  }
  if (j.liveUrl) {
    return { ok: true, url: j.liveUrl, internalBypass: true };
  }
  if (j.url) return { ok: true, url: j.url, sessionId: (j as { sessionId?: string }).sessionId };
  return { ok: false, error: "no_checkout_url" };
}
