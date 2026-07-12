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
import { EmpleoQuickDetailPage } from "../components/quickJob/EmpleoQuickDetailPage";
import { EMPLEOS_SESSION_KEYS } from "@/app/publicar/empleos/shared/constants/empleosSessionKeys";
import { EMPLEOS_PUBLISH_ROUTES } from "@/app/publicar/empleos/shared/constants/empleosPublishRoutes";
import { EMPLEOS_PUBLISH_SHARED_COPY } from "@/app/publicar/empleos/shared/copy/empleosPublishSharedCopy";
import { mapQuickDraftToShell } from "@/app/publicar/empleos/shared/mappers/mapQuickDraftToShell";
import {
  normalizeEmpleosQuickDraft,
  type EmpleosQuickDraft,
} from "@/app/publicar/empleos/shared/types/empleosQuickDraft";
import { buildEmpleosPublishEnvelopeFromQuick } from "@/app/publicar/empleos/shared/publish/buildEmpleosPublishEnvelope";
import { saveEmpleosDraftAndStartPaidJobCheckout } from "@/app/publicar/empleos/shared/publish/empleosRevenueCheckout";
import { gateEmpleosQuickPreview } from "@/app/publicar/empleos/shared/required/empleosRequiredForPreview";
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

export function EmpleoQuickPreviewClient() {
  const sp = useSearchParams();
  const { routeLang, copyLang: lang } = useMemo(
    () => resolveClasificadosPublishLang(sp?.get("lang")),
    [sp],
  );
  const fromPublicar = sp?.get("from") === "publicar";
  const [draft, setDraft] = useState<EmpleosQuickDraft | null>(null);
  const [ready, setReady] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutErr, setCheckoutErr] = useState<string | null>(null);

  useLayoutEffect(() => {
    clearLeonixPreviewNavSessionFlag();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem(EMPLEOS_SESSION_KEYS.quick);
      if (!raw) setDraft(null);
      else {
        const parsed = JSON.parse(raw) as Partial<EmpleosQuickDraft> & {
          benefits?: string[];
          benefitsText?: string;
        };
        setDraft(normalizeEmpleosQuickDraft(parsed));
      }
    } catch {
      setDraft(null);
    } finally {
      setReady(true);
    }
  }, []);

  const editHref = appendLangToPath(EMPLEOS_PUBLISH_ROUTES.quick, routeLang);
  const backLabel = previewBackToEditLabel(lang);
  const prevCopy = EMPLEOS_PUBLISH_SHARED_COPY[lang].previewNoDraft;

  const publishReadiness = useMemo(() => {
    if (!draft) return { ok: false as const };
    return gateEmpleosQuickPreview(draft, lang);
  }, [draft, lang]);

  const checkpointConfig = useMemo(() => empleosPreviewCheckpointConfig(lang, "quick"), [lang]);

  const handlePromoApply = useCallback(
    async (code: string) => applyEmpleosPreviewPromoCode({ code, lang }),
    [lang],
  );

  const onCheckout = useCallback(
    async (ctx: { newsletterOptIn: boolean; promoCode: string | null }) => {
      setCheckoutErr(null);
      setCheckoutBusy(true);

      let current: EmpleosQuickDraft | null = null;
      try {
        const raw = sessionStorage.getItem(EMPLEOS_SESSION_KEYS.quick);
        if (raw) current = normalizeEmpleosQuickDraft(JSON.parse(raw) as Partial<EmpleosQuickDraft>);
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

      const gate = gateEmpleosQuickPreview(current, lang);
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
        interests: EMPLEOS_NEWSLETTER_INTERESTS.quick,
        checked: ctx.newsletterOptIn,
      });

      const envelope = buildEmpleosPublishEnvelopeFromQuick(current, lang);
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
        <Link
          href={editHref}
          className="mt-4 inline-block font-semibold text-[#6B5320] underline underline-offset-2"
        >
          {prevCopy.backLink}
        </Link>
      </div>
    );
  }

  if (fromPublicar && draft) {
    const data = mapQuickDraftToShell(draft);
    const shareAbs = typeof window !== "undefined" ? window.location.href : "";
    const previewEngagement = {
      listingId: `preview_${Date.now()}`, // Draft-only: no real ID
      ownerUserId: null,
      shareUrl: shareAbs,
      persistEngagement: false, // Inert analytics in preview
      listingSourceId: null, // No real DB identity in preview
      slug: null,
      leonixAdId: null,
      likeCount: 0, // No fake counts in preview
    };
    return (
      <LeonixPreviewPageShell
        editHref={editHref}
        lang={lang}
        onBeforeNavigateToEdit={markPublishFlowReturningToEdit}
      >
        <EmpleoQuickDetailPage data={data} withSiteChrome={false} hideResultsNav engagement={previewEngagement} />
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
            id="empleos-quick-publish-checkout-checkpoint"
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

  return <EmpleoQuickDetailPage />;
}
