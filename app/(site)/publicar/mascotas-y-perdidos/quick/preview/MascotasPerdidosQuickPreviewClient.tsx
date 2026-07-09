"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";

import ContactActions from "@/app/(site)/clasificados/components/ContactActions";
import { MascotasPerdidosShellLayout } from "@/app/(site)/clasificados/mascotas-y-perdidos/shared/MascotasPerdidosShellLayout";
import {
  mascotasPerdidosLangFromSearchParams,
  mascotasPerdidosRouteLangFromSearchParams,
} from "@/app/(site)/clasificados/mascotas-y-perdidos/shared/mascotasPerdidosShellCopy";
import {
  clearLeonixPreviewNavSessionFlag,
  markPublishFlowReturningToEdit,
} from "@/app/clasificados/lib/publishFlowLifecycleClient";
import { digitsOnly } from "@/app/clasificados/publicar/servicios/lib/serviciosPhoneUi";

import { mascotasPerdidosFormCopy } from "../../shared/mascotasPerdidosFormCopy";
import {
  normalizeMascotasPerdidosQuickDraft,
} from "../../shared/mascotasPerdidosQuickDraft";
import { mascotasPerdidosQuickEditUrl } from "../../shared/mascotasPerdidosPublishRoutes";
import type { MascotasPerdidosQuickDraft } from "../../shared/mascotasPerdidosQuickTypes";
import { MASCOTAS_PERDIDOS_QUICK_DRAFT_KEY } from "../../shared/mascotasPerdidosSessionKeys";
import { mascotasPerdidosPreviewCopy } from "../../shared/mascotasPerdidosPreviewCopy";
import { resolveMascotasPerdidosNoticeLabel } from "../../shared/mascotasPerdidosTaxonomy";
import { MascotasPerdidosQuickPreviewPublishBar } from "./MascotasPerdidosQuickPreviewPublishBar";

const LISTING_IMAGE_FALLBACK = "/logo.png";

function PreviewField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="border-t border-[#C9B46A]/25 pt-3 first:border-t-0 first:pt-0">
      <p className="text-[11px] font-bold uppercase tracking-wide text-[#6B5A32]">{label}</p>
      <div className="mt-1 text-sm text-[#2a241c]/90">{children}</div>
    </div>
  );
}

export default function MascotasPerdidosQuickPreviewClient() {
  const sp = useSearchParams();
  const lang = mascotasPerdidosLangFromSearchParams(sp);
  const routeLang = mascotasPerdidosRouteLangFromSearchParams(sp);
  const t = mascotasPerdidosPreviewCopy(lang);
  const fields = mascotasPerdidosFormCopy(lang).fields;
  const [draft, setDraft] = useState<MascotasPerdidosQuickDraft | null>(null);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    clearLeonixPreviewNavSessionFlag();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem(MASCOTAS_PERDIDOS_QUICK_DRAFT_KEY);
      if (!raw) {
        setDraft(null);
      } else {
        setDraft(normalizeMascotasPerdidosQuickDraft(JSON.parse(raw)));
      }
    } catch {
      setDraft(null);
    } finally {
      setReady(true);
    }
  }, []);

  const editHref = mascotasPerdidosQuickEditUrl(routeLang);

  if (!ready) {
    return (
      <div
        className="min-h-screen bg-[#F4EFE6] pt-28"
        aria-busy="true"
        data-testid="mascotas-perdidos-preview-loading"
      />
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

  const noticeLabel = resolveMascotasPerdidosNoticeLabel(draft.noticeType, lang);
  const phoneDigits = digitsOnly(draft.contactPhone);
  const hasPhone = phoneDigits.length >= 10;
  const email = draft.email.trim();
  const heroSrc = draft.imageDataUrl.trim() || LISTING_IMAGE_FALLBACK;
  const heroIsFallback = !draft.imageDataUrl.trim();
  const smsBody =
    lang === "es"
      ? "Vi tu aviso en Leonix Media y quisiera contactarte."
      : "I saw your notice on Leonix Media and would like to contact you.";
  const mailtoSubject =
    lang === "es" ? "Sobre tu aviso en Leonix Media" : "About your notice on Leonix Media";

  return (
    <MascotasPerdidosShellLayout lang={lang}>
      <p className="rounded-xl border border-[#C9B46A]/35 bg-[#FFF9ED]/90 px-3 py-2 text-xs font-medium text-[#3D3428]">
        {t.previewNote}
      </p>
      <p
        className="mt-2 rounded-xl border border-[#C9B46A]/40 bg-[#FFFCF7] px-3 py-2 text-xs font-semibold text-[#6B5A32]"
        data-testid="mascotas-perdidos-preview-leonix-pending"
      >
        {t.leonixPending}
      </p>

      <article className="mt-4 overflow-hidden rounded-2xl border border-[#C9B46A]/40 bg-white shadow-[0_8px_28px_-18px_rgba(42,36,22,0.18)]">
        <PreviewField label={fields.image}>
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-[#EDE8DF]">
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
        </PreviewField>

        <div className="space-y-3 p-4 sm:p-5">
          <PreviewField label={fields.noticeType}>
            <span className="inline-flex max-w-full rounded-full bg-[#EDE8DF] px-2.5 py-0.5 text-[11px] font-semibold text-[#3D3428]">
              {noticeLabel}
            </span>
          </PreviewField>

          <PreviewField label={fields.title}>
            <h2 className="text-xl font-bold leading-snug text-[#1E1810] sm:text-2xl">{draft.title.trim()}</h2>
          </PreviewField>

          <PreviewField label={fields.description}>
            <p className="whitespace-pre-wrap leading-relaxed">{draft.description.trim()}</p>
          </PreviewField>

          <PreviewField label={fields.city}>
            <p className="font-medium text-[#5C5346]">{draft.city.trim()}</p>
          </PreviewField>

          <PreviewField label={fields.lastSeenLocation}>
            <p>{draft.lastSeenLocation.trim()}</p>
          </PreviewField>

          <PreviewField label={fields.contactPhone}>
            {hasPhone ? (
              <ContactActions
                lang={lang}
                phone={phoneDigits}
                text={phoneDigits}
                whatsappPhone={phoneDigits}
                email={email || null}
                smsBody={smsBody}
                mailtoSubject={mailtoSubject}
                listingCategory="mascotas-y-perdidos"
                className="flex flex-wrap gap-2"
              />
            ) : (
              <p className="text-[#5C5346]">—</p>
            )}
          </PreviewField>

          {email ? (
            <PreviewField label={fields.email}>
              <a href={`mailto:${encodeURIComponent(email)}`} className="font-medium text-[#3D3428] underline">
                {email}
              </a>
            </PreviewField>
          ) : null}
        </div>
      </article>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link
          href={editHref}
          prefetch={false}
          onClick={() => markPublishFlowReturningToEdit()}
          className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl border border-[#C9B46A]/55 bg-[#FFFCF7] px-5 py-3 text-sm font-semibold text-[#111111] transition hover:bg-[#FFF9ED] sm:min-w-[11rem] sm:flex-none"
          data-testid="mascotas-perdidos-preview-edit"
        >
          {t.edit}
        </Link>
        <MascotasPerdidosQuickPreviewPublishBar draft={draft} lang={lang} routeLang={routeLang} />
      </div>
    </MascotasPerdidosShellLayout>
  );
}
