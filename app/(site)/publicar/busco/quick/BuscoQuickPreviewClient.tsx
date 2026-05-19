"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import ContactActions from "@/app/(site)/clasificados/components/ContactActions";
import { formatLeonixAdId } from "@/app/(site)/clasificados/community/shared/communityLeonixAdId";
import { BuscoShellLayout } from "@/app/(site)/clasificados/busco/shared/BuscoShellLayout";
import { buscoLangFromSearchParams } from "@/app/(site)/clasificados/busco/shared/buscoShellCopy";
import {
  clearLeonixPreviewNavSessionFlag,
  markPublishFlowReturningToEdit,
} from "@/app/clasificados/lib/publishFlowLifecycleClient";
import { digitsOnly } from "@/app/clasificados/publicar/servicios/lib/serviciosPhoneUi";

import { normalizeBuscoQuickDraft } from "../shared/buscoQuickDraft";
import { buscoQuickEditUrl } from "../shared/buscoPublishRoutes";
import type { BuscoQuickDraft } from "../shared/buscoQuickTypes";
import { BUSCO_QUICK_DRAFT_KEY } from "../shared/buscoSessionKeys";
import { resolveBuscoTypePublicLabel } from "../shared/buscoTaxonomy";

const LISTING_IMAGE_FALLBACK = "/logo.png";

const COPY = {
  es: {
    noDraft: "No hay borrador para previsualizar.",
    backToForm: "Volver al formulario",
    edit: "Editar solicitud",
    publishSoon: "La publicación estará disponible en la siguiente fase (C4).",
    publishDisabled: "Publicar (próximamente)",
    leonixAdId: "Leonix Ad ID",
    budget: "Presupuesto",
    contact: "Contacto",
    previewNote: "Vista previa — aún no se publica en Leonix Clasificados.",
  },
  en: {
    noDraft: "No draft to preview.",
    backToForm: "Back to form",
    edit: "Edit request",
    publishSoon: "Publishing will be available in the next phase (C4).",
    publishDisabled: "Publish (coming soon)",
    leonixAdId: "Leonix Ad ID",
    budget: "Budget",
    contact: "Contact",
    previewNote: "Preview — not published on Leonix Clasificados yet.",
  },
} as const;

export default function BuscoQuickPreviewClient() {
  const sp = useSearchParams();
  const lang = buscoLangFromSearchParams(sp);
  const t = COPY[lang];
  const [draft, setDraft] = useState<BuscoQuickDraft | null>(null);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    clearLeonixPreviewNavSessionFlag();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem(BUSCO_QUICK_DRAFT_KEY);
      if (!raw) {
        setDraft(null);
      } else {
        setDraft(normalizeBuscoQuickDraft(JSON.parse(raw)));
      }
    } catch {
      setDraft(null);
    } finally {
      setReady(true);
    }
  }, []);

  const editHref = buscoQuickEditUrl(lang);

  const leonixId = useMemo(() => {
    if (!draft?.previewListingId) return null;
    return formatLeonixAdId(draft.previewListingId);
  }, [draft?.previewListingId]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#F4EFE6] pt-28" aria-busy="true" data-testid="busco-preview-loading" />
    );
  }

  if (!draft) {
    return (
      <div className="min-h-screen bg-[#F4EFE6] px-4 py-16 text-center">
        <p className="text-sm text-[#5C5346]">{t.noDraft}</p>
        <Link
          href={editHref}
          className="mt-4 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[#111111] px-5 py-3 text-sm font-semibold text-[#F5F5F5]"
        >
          {t.backToForm}
        </Link>
      </div>
    );
  }

  const typeLabel = resolveBuscoTypePublicLabel(draft.buscoType, draft.buscoTypeCustom, lang);
  const cityLine = [draft.city.trim(), draft.zone.trim()].filter(Boolean).join(" · ");
  const phoneDigits = digitsOnly(draft.phone);
  const hasPhone = phoneDigits.length >= 10;
  const email = draft.email.trim();
  const smsBody =
    lang === "es"
      ? "Vi tu solicitud en Leonix Media y quisiera ayudarte."
      : "I saw your request on Leonix Media and would like to help.";
  const mailtoSubject =
    lang === "es" ? "Sobre tu solicitud en Leonix Media" : "About your request on Leonix Media";

  const heroSrc = draft.imageDataUrl.trim() || LISTING_IMAGE_FALLBACK;
  const heroIsFallback = !draft.imageDataUrl.trim();

  return (
    <BuscoShellLayout lang={lang}>
      <p className="rounded-xl border border-[#B8C8EA]/35 bg-[#F0F4FF]/90 px-3 py-2 text-xs font-medium text-[#3d4a5c]">
        {t.previewNote}
      </p>

      <article className="mt-4 overflow-hidden rounded-2xl border border-[#B8C8EA]/40 bg-white shadow-[0_8px_28px_-18px_rgba(42,36,22,0.18)]">
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#EDE8DF]">
          {heroIsFallback ? (
            <img
              src={heroSrc}
              alt=""
              className="h-full w-full object-contain object-center p-8 opacity-90"
            />
          ) : (
            <img src={heroSrc} alt="" className="h-full w-full object-cover" />
          )}
        </div>

        <div className="space-y-3 p-4 sm:p-5">
          <span className="inline-flex max-w-full rounded-full bg-[#D7E3F7] px-2.5 py-0.5 text-[11px] font-semibold text-[#1E3A5F]">
            {typeLabel}
          </span>

          <h2 className="text-xl font-bold leading-snug text-[#1E1810] sm:text-2xl">{draft.title.trim()}</h2>

          {cityLine ? <p className="text-sm font-medium text-[#5C5346]">{cityLine}</p> : null}

          {leonixId ? (
            <p className="font-mono text-xs text-[#3d5a73]" data-testid="busco-preview-leonix-ad-id">
              {t.leonixAdId}: {leonixId}
            </p>
          ) : null}

          {draft.budget.trim() ? (
            <p className="text-sm text-[#2a241c]/85">
              <span className="font-semibold">{t.budget}:</span> {draft.budget.trim()}
            </p>
          ) : null}

          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#2a241c]/90">{draft.description.trim()}</p>

          {(hasPhone || email) && (
            <section className="rounded-xl border border-[#B8C8EA]/30 bg-[#F8FAFF] p-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#3d5a73]">{t.contact}</p>
              <ContactActions
                lang={lang}
                phone={hasPhone ? phoneDigits : null}
                text={hasPhone ? phoneDigits : null}
                whatsappPhone={hasPhone ? phoneDigits : null}
                email={email || null}
                smsBody={smsBody}
                mailtoSubject={mailtoSubject}
                listingId={draft.previewListingId}
                listingCategory="busco"
                className="flex flex-wrap gap-2"
              />
            </section>
          )}
        </div>
      </article>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link
          href={editHref}
          prefetch={false}
          onClick={() => markPublishFlowReturningToEdit()}
          className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl border border-[#B8C8EA]/55 bg-[#FFFCF7] px-5 py-3 text-sm font-semibold text-[#111111] transition hover:bg-[#F0F4FF] sm:min-w-[11rem] sm:flex-none"
        >
          {t.edit}
        </Link>
        <button
          type="button"
          disabled
          title={t.publishSoon}
          className="inline-flex min-h-[48px] flex-1 cursor-not-allowed items-center justify-center rounded-xl bg-[#111111]/40 px-5 py-3 text-sm font-bold text-[#F5F5F5]/90 sm:min-w-[11rem] sm:flex-none"
        >
          {t.publishDisabled}
        </button>
      </div>
      <p className="text-center text-[11px] text-[#5C5346]/80">{t.publishSoon}</p>
    </BuscoShellLayout>
  );
}
