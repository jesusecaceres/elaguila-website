"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { resolveClasificadosPublishLang } from "@/app/lib/clasificados/clasificadosPublishLang";
import { previewBackToEditLabel } from "@/app/lib/clasificados/clasificadosUiChromeCopy";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { LeonixPreviewPageShell } from "@/app/clasificados/lib/preview/LeonixPreviewPageShell";
import {
  clearLeonixPreviewNavSessionFlag,
  markPublishFlowReturningToEdit,
} from "@/app/clasificados/lib/publishFlowLifecycleClient";
import { PublishCheckoutCheckpoint } from "@/app/(site)/clasificados/components/PublishCheckoutCheckpoint";
import { EmpleoPremiumDetailPage } from "../components/premiumJob/EmpleoPremiumDetailPage";
import { EMPLEOS_SESSION_KEYS } from "@/app/publicar/empleos/shared/constants/empleosSessionKeys";
import { EMPLEOS_PUBLISH_ROUTES } from "@/app/publicar/empleos/shared/constants/empleosPublishRoutes";
import { EMPLEOS_PUBLISH_SHARED_COPY } from "@/app/publicar/empleos/shared/copy/empleosPublishSharedCopy";
import { mapPremiumDraftToShell } from "@/app/publicar/empleos/shared/mappers/mapPremiumDraftToShell";
import {
  normalizeEmpleosPremiumDraft,
  type EmpleosPremiumDraft,
} from "@/app/publicar/empleos/shared/types/empleosPremiumDraft";
import { buildEmpleosPublishEnvelopeFromPremium } from "@/app/publicar/empleos/shared/publish/buildEmpleosPublishEnvelope";
import { saveEmpleosDraftAndStartPaidJobCheckout } from "@/app/publicar/empleos/shared/publish/empleosRevenueCheckout";
import { gateEmpleosPremiumPreview } from "@/app/publicar/empleos/shared/required/empleosRequiredForPreview";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import {
  CHECKOUT_NEWSLETTER_SOURCES,
  captureCheckoutNewsletterSubscriber,
} from "@/app/lib/newsletter/checkoutNewsletterCapture";
import {
  applyEmpleosPreviewPromoCode,
  empleosPreviewCheckpointConfig,
  EMPLEOS_NEWSLETTER_INTERESTS,
  EMPLEOS_PREVIEW_RULES_MODAL,
} from "@/app/clasificados/empleos/preview/shared/empleosPreviewPaidCheckout";

export function EmpleoPremiumPreviewClient() {
  const sp = useSearchParams();
  const { routeLang, copyLang: lang } = useMemo(
    () => resolveClasificadosPublishLang(sp?.get("lang")),
    [sp],
  );
  const fromPublicar = sp?.get("from") === "publicar";
  const [draft, setDraft] = useState<EmpleosPremiumDraft | null>(null);
  const [ready, setReady] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutErr, setCheckoutErr] = useState<string | null>(null);

  useLayoutEffect(() => {
    clearLeonixPreviewNavSessionFlag();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem(EMPLEOS_SESSION_KEYS.premium);
      if (!raw) setDraft(null);
      else {
        const parsed = JSON.parse(raw) as Partial<EmpleosPremiumDraft>;
        setDraft(normalizeEmpleosPremiumDraft(parsed));
      }
    } catch {
      setDraft(null);
    } finally {
      setReady(true);
    }
  }, []);

  const editHref = appendLangToPath(EMPLEOS_PUBLISH_ROUTES.premium, routeLang);
  const backLabel = previewBackToEditLabel(lang);
  const prevCopy = EMPLEOS_PUBLISH_SHARED_COPY[lang].previewNoDraft;

  const publishReadiness = useMemo(() => {
    if (!draft) return { ok: false as const };
    return gateEmpleosPremiumPreview(draft, lang);
  }, [draft, lang]);

  const checkpointConfig = useMemo(() => empleosPreviewCheckpointConfig(lang, "premium"), [lang]);

  const handlePromoApply = useCallback(
    async (code: string) => applyEmpleosPreviewPromoCode({ code, lang }),
    [lang],
  );

  const onCheckout = useCallback(
    async (ctx: { newsletterOptIn: boolean; promoCode: string | null }) => {
      setCheckoutErr(null);
      setCheckoutBusy(true);

      let current: EmpleosPremiumDraft | null = null;
      try {
        const raw = sessionStorage.getItem(EMPLEOS_SESSION_KEYS.premium);
        if (raw) current = normalizeEmpleosPremiumDraft(JSON.parse(raw) as Partial<EmpleosPremiumDraft>);
      } catch {
        current = null;
      }
      if (!current) {
        setCheckoutBusy(false);
        setCheckoutErr(
          lang === "es"
            ? "No se encontró el borrador. Vuelve a editar y abre la vista previa de nuevo."
            : "Draft not found. Go back to edit and open preview again.",
        );
        return;
      }

      const gate = gateEmpleosPremiumPreview(current, lang);
      if (!gate.ok) {
        setCheckoutBusy(false);
        setCheckoutErr(gate.issues.join(" · "));
        return;
      }

      const sb = createSupabaseBrowserClient();
      const { data } = await sb.auth.getSession();
      if (!data.session?.access_token) {
        setCheckoutBusy(false);
        setCheckoutErr(lang === "es" ? "Inicia sesión para continuar al pago." : "Sign in to continue to checkout.");
        return;
      }

      void captureCheckoutNewsletterSubscriber({
        email: data.session.user?.email ?? null,
        lang,
        preferredLanguage: lang,
        source: CHECKOUT_NEWSLETTER_SOURCES.empleos,
        interests: EMPLEOS_NEWSLETTER_INTERESTS.premium,
        checked: ctx.newsletterOptIn,
      });

      const envelope = buildEmpleosPublishEnvelopeFromPremium(current, lang);
      const paid = await saveEmpleosDraftAndStartPaidJobCheckout({
        envelope,
        accessToken: data.session.access_token,
        lang,
        promoCode: ctx.promoCode,
      });
      setCheckoutBusy(false);
      if (!paid.ok) {
        setCheckoutErr(paid.message);
      }
    },
    [lang],
  );

  if (!ready) {
    return <div className="min-h-screen bg-[#ECEAE7]" aria-busy="true" />;
  }

  if (fromPublicar && !draft) {
    return (
      <div className="min-h-screen bg-[#ECEAE7] px-4 py-10 text-center text-sm text-[color:var(--lx-text-2)]">
        <p>{prevCopy.message}</p>
        <Link href={editHref} className="mt-4 inline-block font-semibold text-[#2563EB] underline">
          {prevCopy.backLink}
        </Link>
      </div>
    );
  }

  if (fromPublicar && draft) {
    const data = mapPremiumDraftToShell(draft);
    return (
      <LeonixPreviewPageShell
        editHref={editHref}
        backLabel={backLabel}
        lang={lang}
        onBeforeNavigateToEdit={markPublishFlowReturningToEdit}
      >
        <EmpleoPremiumDetailPage data={data} withSiteChrome={false} />
        <div className="mx-auto mt-8 max-w-3xl px-4 pb-12 md:px-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-[#1E1810]">
              {lang === "en" ? "Final checkout" : "Pago final"}
            </h2>
            <p className="mt-1 text-sm text-[#5C5346]">
              {lang === "en"
                ? "Preview above does not require confirmations. Complete the summary and checkboxes below when you are ready for secure payment."
                : "La vista previa no requiere confirmaciones. Completa el resumen y las casillas abajo cuando estés listo para el pago seguro."}
            </p>
          </div>
          <PublishCheckoutCheckpoint
            id="empleos-premium-publish-checkout-checkpoint"
            config={checkpointConfig}
            lang={lang}
            busy={checkoutBusy}
            errorMessage={checkoutErr}
            draftReady={publishReadiness.ok}
            draftReadyMessage={
              publishReadiness.ok
                ? null
                : lang === "en"
                  ? "Complete the required fields in the form before starting secure checkout."
                  : "Completa los campos requeridos en el formulario antes de iniciar el pago seguro."
            }
            onPromoApply={handlePromoApply}
            onCheckout={(ctx) => void onCheckout(ctx)}
            editHref={editHref}
            rulesModal={EMPLEOS_PREVIEW_RULES_MODAL}
          />
        </div>
      </LeonixPreviewPageShell>
    );
  }

  return <EmpleoPremiumDetailPage />;
}
