"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { loadOfertaLocalAiScanSession } from "@/app/lib/ofertas-locales/ofertasLocalesAiScanRecordPersistence";
import { fetchOfertaLocalReviewItems } from "@/app/lib/ofertas-locales/ofertasLocalesItemReviewClient";
import { hasOfertaLocalDraftContent } from "@/app/lib/ofertas-locales/ofertasLocalesPreviewHelpers";
import { submitOfertaLocalDraftForReview } from "@/app/lib/ofertas-locales/ofertasLocalesPublishSubmit";
import type { OfertaLocalItemReviewViewModel } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import { useOfertasLocalesDraft } from "@/app/lib/ofertas-locales/useOfertasLocalesDraft";
import { useOfertasLocalesAppLang, useOfertasLocalesPublishLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";
import { withClasificadosPublishLang } from "@/app/lib/clasificados/clasificadosPublishLang";
import { OfertasLocalesPreviewCard } from "./OfertasLocalesPreviewCard";
import { OFERTAS_LOCALES_PREVIEW_COPY } from "./ofertasLocalesPreviewCopy";

const PAGE_BG = "bg-[#FFFCF7]";
const BTN_PRIMARY =
  "inline-flex items-center justify-center rounded-xl bg-[#7A1E2C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6a1926]";

export default function OfertasLocalesPreviewClient() {
  const { draft, hasLoadedDraft } = useOfertasLocalesDraft();
  const { routeLang, copyLang: lang } = useOfertasLocalesPublishLang();
  const [aiItems, setAiItems] = useState<OfertaLocalItemReviewViewModel[]>([]);
  const [aiReviewLoading, setAiReviewLoading] = useState(false);
  const [aiReviewError, setAiReviewError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState<{ id: string; status: string } | null>(null);
  const [aiSession, setAiSession] = useState<{ ofertaLocalId: string | null; lastScanJobId: string | null }>({
    ofertaLocalId: null,
    lastScanJobId: null,
  });

  useEffect(() => {
    setAiSession(loadOfertaLocalAiScanSession());
  }, []);

  useEffect(() => {
    if (!aiSession.ofertaLocalId) return;
    let cancelled = false;
    setAiReviewLoading(true);
    setAiReviewError(null);
    void fetchOfertaLocalReviewItems(aiSession.ofertaLocalId, aiSession.lastScanJobId).then((result) => {
      if (cancelled) return;
      setAiReviewLoading(false);
      if (!result.ok) {
        setAiReviewError(result.detail ?? result.error ?? "Could not load AI review items.");
        setAiItems([]);
        return;
      }
      setAiItems(result.items ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, [aiSession.ofertaLocalId, aiSession.lastScanJobId]);

  const currentAiItems = useMemo(() => {
    if (!aiSession.lastScanJobId) return aiItems;
    return aiItems.filter((item) => item.scanJobId === aiSession.lastScanJobId);
  }, [aiItems, aiSession.lastScanJobId]);

  const approvedAiItems = useMemo(
    () => currentAiItems.filter((item) => item.reviewStatus === "approved"),
    [currentAiItems]
  );

  const needsReviewCount = useMemo(
    () =>
      currentAiItems.filter(
        (item) => item.reviewStatus === "pending" || item.reviewStatus === "needs_review"
      ).length,
    [currentAiItems]
  );

  const handleSubmitForReview = useCallback(async () => {
    if (needsReviewCount > 0) {
      setPublishError(
        lang === "en"
          ? `Finish reviewing the AI suggestions before submitting. You still have ${needsReviewCount} item(s) that need review.`
          : `Termina de revisar las sugerencias de AI antes de enviar. Todavía tienes ${needsReviewCount} producto(s) pendientes de revisión.`
      );
      return;
    }
    setPublishing(true);
    setPublishError(null);
    setPublishSuccess(null);
    const result = await submitOfertaLocalDraftForReview(draft, {
      ofertaLocalId: aiSession.ofertaLocalId,
      scanJobId: aiSession.lastScanJobId,
    });
    setPublishing(false);
    if (!result.ok) {
      const issueText = result.issues?.map((issue) => issue.message).join(" ");
      setPublishError(issueText || result.detail || result.error);
      return;
    }
    setPublishSuccess({ id: result.id, status: result.status });
  }, [aiSession.lastScanJobId, aiSession.ofertaLocalId, draft, lang, needsReviewCount]);

  if (!hasLoadedDraft) {
    return (
      <div className={`min-h-screen ${PAGE_BG}`}>
        <div className="mx-auto max-w-[1240px] px-4 py-16 text-center text-sm text-[#1E1814]/60">
          {lang === "en" ? "Loading preview…" : "Cargando vista previa…"}
        </div>
      </div>
    );
  }

  if (!hasOfertaLocalDraftContent(draft)) {
    return (
      <div className={`min-h-screen ${PAGE_BG}`}>
        <div className="mx-auto max-w-[1240px] px-4 py-16 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#7A1E2C]">
            {lang === "en" ? OFERTAS_LOCALES_PREVIEW_COPY.previewNoticeEn : OFERTAS_LOCALES_PREVIEW_COPY.previewNoticeEs}
          </p>
          <h1 className="mt-4 text-xl font-bold text-[#1E1814]">{OFERTAS_LOCALES_PREVIEW_COPY.emptyTitle}</h1>
          <p className="mt-2 text-sm text-[#1E1814]/70">{OFERTAS_LOCALES_PREVIEW_COPY.emptyBody}</p>
          <Link href={withClasificadosPublishLang("/publicar/ofertas-locales", routeLang)} className={`${BTN_PRIMARY} mt-6`}>
            {OFERTAS_LOCALES_PREVIEW_COPY.backToEditCreate}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <OfertasLocalesPreviewCard
      draft={draft}
      lang={lang}
      routeLang={routeLang}
      approvedAiItems={approvedAiItems}
      aiReviewLoading={aiReviewLoading}
      aiReviewError={aiReviewError}
      aiNeedsReviewCount={needsReviewCount}
      aiTotalCount={currentAiItems.length}
      publishing={publishing}
      publishError={publishError}
      publishSuccess={publishSuccess}
      onSubmitForReview={handleSubmitForReview}
    />
  );
}
