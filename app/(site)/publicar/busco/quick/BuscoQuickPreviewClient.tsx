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
import { normalizeWebsiteForOpen } from "@/app/publicar/community/shared/lib/communityWebsiteAndSocial";
import { formatBuscoBudget } from "../shared/buscoFormatBudget";

import { normalizeBuscoQuickDraft } from "../shared/buscoQuickDraft";
import { buscoQuickEditUrl } from "../shared/buscoPublishRoutes";
import type { BuscoQuickDraft } from "../shared/buscoQuickTypes";
import { BUSCO_QUICK_DRAFT_KEY } from "../shared/buscoSessionKeys";
import { resolveBuscoTypePublicLabel } from "../shared/buscoTaxonomy";
import { BuscoQuickPreviewPublishBar } from "./BuscoQuickPreviewPublishBar";

const LISTING_IMAGE_FALLBACK = "/logo.png";

const COPY = {
  es: {
    noDraft: "No hay borrador para previsualizar.",
    backToForm: "Volver al formulario",
    edit: "Editar solicitud",
    leonixAdId: "Leonix Ad ID",
    budget: "Presupuesto",
    contactTitle: "Contactar anunciante",
    locationTitle: "Ubicación aproximada",
    socialsTitle: "También puedes contactar por",
    trustCue: "Publicado en Leonix",
    urgencyPronto: "Pronto",
    urgencyUrgente: "Urgente",
    otherLink: "Otro enlace",
    previewNote: "Vista previa — aún no se publica en Leonix Clasificados.",
  },
  en: {
    noDraft: "No draft to preview.",
    backToForm: "Back to form",
    edit: "Edit request",
    leonixAdId: "Leonix Ad ID",
    budget: "Budget",
    contactTitle: "Contact advertiser",
    locationTitle: "Approximate location",
    socialsTitle: "You can also connect through",
    trustCue: "Published on Leonix",
    urgencyPronto: "Soon",
    urgencyUrgente: "Urgent",
    otherLink: "Other link",
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
      <BuscoShellLayout lang={lang}>
        <section className="rounded-2xl border border-dashed border-[#B8C8EA]/45 bg-[#F8FAFF]/90 px-4 py-10 text-center">
          <p className="text-sm font-semibold text-[#1E1810]">{t.noDraft}</p>
          <Link
            href={editHref}
            className="mt-5 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[#111111] px-5 py-3 text-sm font-semibold text-[#F5F5F5] transition hover:opacity-95"
          >
            {t.backToForm}
          </Link>
        </section>
      </BuscoShellLayout>
    );
  }

  const typeLabel = resolveBuscoTypePublicLabel(draft.buscoType, draft.buscoTypeCustom, lang);
  // Location
  const cityStateLine = [draft.city.trim(), draft.state.trim() && draft.zip.trim() ? `${draft.state.trim()} ${draft.zip.trim()}` : draft.state.trim() || draft.zip.trim()].filter(Boolean).join(", ");
  const fullLocationLine = [cityStateLine, draft.country.trim(), draft.zone.trim()].filter(Boolean).join(" · ");
  // Phones
  const phoneDigits = digitsOnly(draft.phone);
  const hasPhone = phoneDigits.length >= 10;
  const waDig = digitsOnly(draft.whatsapp);
  const hasWhatsApp = waDig.length >= 10;
  const smsDig = digitsOnly(draft.smsPhone);
  const smsDigits = smsDig.length >= 10 ? smsDig : phoneDigits;
  const hasSms = smsDigits.length >= 10;
  const email = draft.email.trim();
  const hasAnyContact = hasPhone || hasWhatsApp || hasSms || !!email;
  // Budget + urgency
  const budget = draft.budget.trim() ? formatBuscoBudget(draft.budget.trim()) : "";
  const urgency = draft.urgency;
  // Socials
  const fbHref = draft.facebook.trim() ? (normalizeWebsiteForOpen(draft.facebook.trim()) ?? null) : null;
  const igHref = draft.instagram.trim() ? (normalizeWebsiteForOpen(draft.instagram.trim()) ?? null) : null;
  const ttHref = draft.tiktok.trim() ? (normalizeWebsiteForOpen(draft.tiktok.trim()) ?? null) : null;
  const ocHref = draft.otherContactUrl.trim() ? (normalizeWebsiteForOpen(draft.otherContactUrl.trim()) ?? null) : null;
  const ocLabel = draft.otherContactLabel.trim() || t.otherLink;
  const hasSocials = !!(fbHref || igHref || ttHref || ocHref);

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

      <article className="mt-4 overflow-hidden rounded-2xl border border-[#C9B46A]/40 bg-[#FCF9F2] shadow-md">
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#EDE8DF]">
          {heroIsFallback ? (
            <img src={heroSrc} alt="" className="h-full w-full object-contain object-center p-8 opacity-90" />
          ) : (
            <img src={heroSrc} alt="" className="h-full w-full object-cover" />
          )}
          {urgency === "urgente" || urgency === "pronto" ? (
            <span className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-[11px] font-bold shadow-sm ${
              urgency === "urgente" ? "bg-red-600 text-white" : "bg-amber-500 text-white"
            }`}>
              {urgency === "urgente" ? t.urgencyUrgente : t.urgencyPronto}
            </span>
          ) : null}
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <span className="inline-flex max-w-full rounded-full bg-[#F0EBE0] px-2.5 py-0.5 text-[11px] font-semibold text-[#5C3D2E]">
            {typeLabel}
          </span>

          <h2 className="text-xl font-bold leading-snug text-[#1E1810] sm:text-2xl">{draft.title.trim()}</h2>

          {budget ? (
            <p className="text-sm text-[#2a241c]/85">
              <span className="font-semibold">{t.budget}:</span> {budget}
            </p>
          ) : null}

          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#2a241c]/90">{draft.description.trim()}</p>

          {leonixId ? (
            <p className="font-mono text-xs text-[#8B7355]" data-testid="busco-preview-leonix-ad-id">
              {t.leonixAdId}: {leonixId}
            </p>
          ) : null}

          {/* Contact card */}
          {hasAnyContact ? (
            <section className="rounded-xl border border-[#C9B46A]/35 bg-[#FFFDF5] p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#7B2D42]">{t.contactTitle}</p>
              <ContactActions
                lang={lang}
                phone={hasPhone ? phoneDigits : null}
                text={hasSms ? smsDigits : null}
                whatsappPhone={hasWhatsApp ? waDig : (hasPhone ? phoneDigits : null)}
                email={email || null}
                smsBody={smsBody}
                mailtoSubject={mailtoSubject}
                listingId={draft.previewListingId}
                listingCategory="busco"
                className="flex flex-wrap gap-2"
              />
            </section>
          ) : null}

          {/* Optional socials */}
          {hasSocials ? (
            <section className="rounded-xl border border-[#C9B46A]/25 bg-[#FCF9F2] p-3">
              <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-[#7B2D42]">{t.socialsTitle}</p>
              <div className="flex flex-wrap gap-2">
                {fbHref ? <a href={fbHref} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[40px] items-center rounded-lg border border-[#C9B46A]/35 bg-white px-3 py-2 text-xs font-semibold text-[#2A2826] shadow-sm">Facebook</a> : null}
                {igHref ? <a href={igHref} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[40px] items-center rounded-lg border border-[#C9B46A]/35 bg-white px-3 py-2 text-xs font-semibold text-[#2A2826] shadow-sm">Instagram</a> : null}
                {ttHref ? <a href={ttHref} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[40px] items-center rounded-lg border border-[#C9B46A]/35 bg-white px-3 py-2 text-xs font-semibold text-[#2A2826] shadow-sm">TikTok</a> : null}
                {ocHref ? <a href={ocHref} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[40px] items-center rounded-lg border border-[#C9B46A]/35 bg-white px-3 py-2 text-xs font-semibold text-[#2A2826] shadow-sm">{ocLabel}</a> : null}
              </div>
            </section>
          ) : null}

          {/* Approximate location */}
          {fullLocationLine ? (
            <section className="rounded-xl border border-[#C9B46A]/25 bg-[#FFFDF5] px-3 py-3">
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[#7B2D42]">{t.locationTitle}</p>
              <p className="break-words text-sm text-[#2a241c]/85">{fullLocationLine}</p>
            </section>
          ) : null}

          {/* Trust cue */}
          <p className="text-center text-[10px] text-[#8B7355]/80">{t.trustCue}</p>
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
        <BuscoQuickPreviewPublishBar draft={draft} lang={lang} />
      </div>
    </BuscoShellLayout>
  );
}
