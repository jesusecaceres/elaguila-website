"use client";

import { useEffect, useState } from "react";

import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import type { OfertaLocalOwnerDetail } from "@/app/lib/ofertas-locales/ofertasLocalesOwnerHelpers";
import {
  redirectToRevenueCategoryCheckout,
  startRevenueCategoryCheckout,
} from "@/app/lib/listingPlans/revenueCategoryCheckoutClient";

type Lang = "es" | "en";

type RenewalPayload = {
  ok?: boolean;
  eligibility?: string;
  message?: string;
  daysRemaining?: number | null;
  renewalAttempt?: { id: string; state: string; commercial_path: string; scheduled_activation_at?: string | null; expires_at?: string | null } | null;
  checkout?: { required: boolean; operation: "renew_listing"; startsPublicTerm: false } | null;
};

export function OfertasLocalesOwnerRenewalActionCenter({
  offer,
  lang,
}: {
  offer: OfertaLocalOwnerDetail;
  lang: Lang;
}) {
  const [loading, setLoading] = useState(false);
  const [renewal, setRenewal] = useState<RenewalPayload | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const t =
    lang === "es"
      ? {
          title: "Renovar / republicar",
          body: "La renovación usa el mismo anuncio e ID Leonix. El pago o cortesía no inicia los 30 días; el nuevo término empieza con aprobación de Leonix.",
          load: "Ver elegibilidad",
          start: "Iniciar renovación",
          submit: "Enviar renovación a revisión",
          cancel: "Cancelar intento sin publicar",
          active: "Activo",
          notReady: "Renovación no disponible todavía.",
          checkoutTruth: "Pago seguro requerido. No publica automáticamente.",
          continueCheckout: "Continuar pago seguro",
        }
      : {
          title: "Renew / republish",
          body: "Renewal keeps the same listing and Leonix ID. Payment or courtesy does not start the 30 days; the new term starts after Leonix approval.",
          load: "Check eligibility",
          start: "Start renewal",
          submit: "Submit renewal for review",
          cancel: "Cancel unpaid attempt",
          active: "Active",
          notReady: "Renewal is not available yet.",
          checkoutTruth: "Secure payment required. It does not publish automatically.",
          continueCheckout: "Continue secure checkout",
        };

  async function requestRenewal(method: "GET" | "POST" | "PATCH", body?: Record<string, unknown>) {
    setLoading(true);
    setMessage(null);
    const sb = createSupabaseBrowserClient();
    const { data } = await sb.auth.getSession();
    const token = data.session?.access_token ?? "";
    if (!token) {
      setLoading(false);
      return;
    }
    const res = await fetch(`/api/ofertas-locales/owner/${offer.id}/renewal`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    const json = (await res.json().catch(() => ({}))) as RenewalPayload & { error?: string };
    setLoading(false);
    if (!res.ok || !json.ok) {
      setMessage(json.error ?? t.notReady);
      return;
    }
    setRenewal(json);
    setMessage(json.message ?? null);
  }

  useEffect(() => {
    void requestRenewal("GET");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offer.id]);

  const attempt = renewal?.renewalAttempt;
  const canStart = renewal?.eligibility === "eligible_paid" || renewal?.eligibility === "eligible_partner_courtesy";
  const canSubmit = attempt && ["authorized", "preparing_content", "ready_to_submit", "correction_required"].includes(attempt.state);
  const canCheckout = attempt?.commercial_path === "paid" && ["awaiting_payment", "payment_pending"].includes(attempt.state);

  async function handleCheckout() {
    if (!attempt || !offer.commercialProductKey) return;
    setLoading(true);
    const result = await startRevenueCategoryCheckout({
      operation: "renew_listing",
      category: "ofertas-locales",
      packageKey: offer.commercialProductKey,
      listingId: offer.id,
      leonixAdId: offer.leonixAdId,
      renewalAttemptId: attempt.id,
      currentExpiresAt: offer.expiresAt,
      returnPath: `/dashboard/ofertas-locales/${offer.id}?lang=${lang}`,
      returnContext: "owner_renewal_action_center",
      locale: lang,
    });
    setLoading(false);
    if (result.ok) {
      redirectToRevenueCategoryCheckout(result.checkoutUrl);
      return;
    }
    setMessage(result.userMessage);
  }

  return (
    <section className="rounded-2xl border border-[#E8DFD0] bg-white p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1E1810]">{t.title}</h2>
          <p className="mt-1 text-sm text-[#5C5346]">{t.body}</p>
        </div>
        <button
          type="button"
          onClick={() => requestRenewal("GET")}
          className="min-h-11 rounded-xl border border-[#D8C889] px-4 py-2 text-sm font-semibold text-[#6B5B2E]"
          disabled={loading}
        >
          {t.load}
        </button>
      </div>

      <div className="mt-4 rounded-xl bg-[#FFFCF7] p-3 text-sm text-[#1E1810]">
        <div className="font-semibold">{renewal?.eligibility ?? offer.publicTermStatus}</div>
        {renewal?.daysRemaining != null ? <div>{renewal.daysRemaining} days remaining</div> : null}
        {attempt ? (
          <div className="mt-1 font-mono text-xs text-[#5C5346]">
            renewal {attempt.id.slice(0, 8)} · {attempt.state} · {attempt.commercial_path}
          </div>
        ) : null}
        {attempt?.scheduled_activation_at ? (
          <div className="mt-1 text-xs text-[#5C5346]">Scheduled: {attempt.scheduled_activation_at}</div>
        ) : null}
        {message ? <p className="mt-2 text-xs font-semibold text-[#7A1E2C]">{message}</p> : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {canStart ? (
          <button
            type="button"
            onClick={() => requestRenewal("POST", { commercialPath: renewal?.eligibility === "eligible_partner_courtesy" ? "partner_courtesy" : "paid" })}
            className="min-h-11 rounded-xl bg-[#7A1E2C] px-4 py-2 text-sm font-semibold text-white"
            disabled={loading}
          >
            {t.start}
          </button>
        ) : null}
        {canSubmit ? (
          <button
            type="button"
            onClick={() => requestRenewal("PATCH", { action: "submit", renewalAttemptId: attempt.id })}
            className="min-h-11 rounded-xl bg-[#1F6B4A] px-4 py-2 text-sm font-semibold text-white"
            disabled={loading}
          >
            {t.submit}
          </button>
        ) : null}
        {canCheckout ? (
          <button
            type="button"
            onClick={handleCheckout}
            className="min-h-11 rounded-xl bg-[#7A1E2C] px-4 py-2 text-sm font-semibold text-white"
            disabled={loading}
          >
            {t.continueCheckout}
          </button>
        ) : null}
        {attempt && ["draft", "awaiting_payment", "payment_pending", "authorized", "preparing_content"].includes(attempt.state) ? (
          <button
            type="button"
            onClick={() => requestRenewal("PATCH", { action: "cancel", renewalAttemptId: attempt.id })}
            className="min-h-11 rounded-xl border border-[#E8DFD0] px-4 py-2 text-sm font-semibold text-[#7A1E2C]"
            disabled={loading}
          >
            {t.cancel}
          </button>
        ) : null}
      </div>

      {attempt?.commercial_path === "paid" ? <p className="mt-3 text-xs text-[#5C5346]">{t.checkoutTruth}</p> : null}
    </section>
  );
}
