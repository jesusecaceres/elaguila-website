"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { MascotasPerdidosShellLayout } from "@/app/(site)/clasificados/mascotas-y-perdidos/shared/MascotasPerdidosShellLayout";
import {
  mascotasPerdidosLangFromSearchParams,
  mascotasPerdidosRouteLangFromSearchParams,
} from "@/app/(site)/clasificados/mascotas-y-perdidos/shared/mascotasPerdidosShellCopy";
import { MascotasPerdidosNoticeCard } from "@/app/(site)/clasificados/mascotas-y-perdidos/MascotasPerdidosNoticeCard";
import { buildMascotasPerdidosNoticeCardModelFromDraft } from "@/app/(site)/clasificados/mascotas-y-perdidos/shared/mascotasPerdidosCardModel";
import {
  clearLeonixPreviewNavSessionFlag,
  markPublishFlowReturningToEdit,
} from "@/app/clasificados/lib/publishFlowLifecycleClient";

import { mascotasPerdidosPreviewCopy } from "../../shared/mascotasPerdidosPreviewCopy";
import { normalizeMascotasPerdidosQuickDraft } from "../../shared/mascotasPerdidosQuickDraft";
import { mascotasPerdidosQuickEditUrl } from "../../shared/mascotasPerdidosPublishRoutes";
import type { MascotasPerdidosQuickDraft } from "../../shared/mascotasPerdidosQuickTypes";
import { MASCOTAS_PERDIDOS_QUICK_DRAFT_KEY } from "../../shared/mascotasPerdidosSessionKeys";
import { MascotasPerdidosQuickAdCanvas } from "../../components/MascotasPerdidosQuickAdCanvas";
import { MascotasPerdidosQuickPreviewPublishBar } from "./MascotasPerdidosQuickPreviewPublishBar";

export default function MascotasPerdidosQuickPreviewClient() {
  const sp = useSearchParams();
  const lang = mascotasPerdidosLangFromSearchParams(sp);
  const routeLang = mascotasPerdidosRouteLangFromSearchParams(sp);
  const t = mascotasPerdidosPreviewCopy(lang);
  const [draft, setDraft] = useState<MascotasPerdidosQuickDraft | null>(null);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    clearLeonixPreviewNavSessionFlag();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem(MASCOTAS_PERDIDOS_QUICK_DRAFT_KEY);
      setDraft(raw ? normalizeMascotasPerdidosQuickDraft(JSON.parse(raw)) : null);
    } catch {
      setDraft(null);
    } finally {
      setReady(true);
    }
  }, []);

  const editHref = mascotasPerdidosQuickEditUrl(routeLang);

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#F4EFE6] pt-28" aria-busy="true" data-testid="mascotas-perdidos-preview-loading" />
    );
  }

  if (!draft) {
    return (
      <div className="min-h-screen bg-[#F4EFE6] px-4 py-16 text-center">
        <p className="text-sm text-[#5C5346]">{t.noDraft}</p>
        <Link href={editHref} className="mt-4 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[#111111] px-5 py-3 text-sm font-semibold text-[#F5F5F5]">
          {t.backToForm}
        </Link>
      </div>
    );
  }

  const resultCardModel = buildMascotasPerdidosNoticeCardModelFromDraft(draft, lang, editHref);

  return (
    <MascotasPerdidosShellLayout lang={lang}>
      <p className="rounded-xl border border-[#C9B46A]/35 bg-[#FFF9ED]/90 px-3 py-2 text-xs font-medium text-[#3D3428]">
        {t.previewNote}
      </p>
      <p className="mt-2 rounded-xl border border-[#C9B46A]/40 bg-[#FFFCF7] px-3 py-2 text-xs font-semibold text-[#6B5A32]" data-testid="mascotas-perdidos-preview-leonix-pending">
        {t.leonixPending}
      </p>

      <MascotasPerdidosQuickAdCanvas draft={draft} lang={lang} shell="standalone" />

      {/* Section R — real result-card preview, same component discovery uses */}
      <section className="mt-6" data-testid="mascotas-perdidos-preview-result-card">
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#6B5A32]">{t.resultCardPreviewTitle}</h2>
        <p className="mt-1 text-xs text-[#5C5346]/85">{t.resultCardPreviewHint}</p>
        <div className="mt-3">
          <MascotasPerdidosNoticeCard model={resultCardModel} lang={lang} />
        </div>
      </section>

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
