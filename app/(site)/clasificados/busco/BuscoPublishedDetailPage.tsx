"use client";

import { useEffect, useMemo, useState } from "react";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import {
  trackCommunityListingView,
  type CommunityGlobalAnalyticsCtx,
} from "@/app/lib/clasificados/comunidad/comunidadClasesBuscoGlobalAnalytics";
import { addListingView } from "@/app/lib/recentlyViewed";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { submitListingReportAction } from "@/app/admin/actions";
import { formatLeonixAdId } from "@/app/(site)/clasificados/community/shared/communityLeonixAdId";
import { CommunityQuickPublicDetailShell } from "@/app/(site)/clasificados/community/CommunityQuickPublicDetailShell";
import { CommunityQuickPublicDetailSidebar } from "@/app/(site)/clasificados/community/CommunityQuickPublicDetailSidebar";

import { BuscoQuickPublishedAd, type BuscoPublishedListingLike } from "./BuscoQuickPublishedAd";
import { detailPairsToMap, isBuscoQuickListing } from "./shared/buscoListingDetailPairs";

const TOP_COPY = {
  es: {
    back: "Volver a Clasificados",
    post: "Publicar solicitud",
    signIn: "Iniciar sesión",
    published: "Tu solicitud fue publicada correctamente.",
    adId: "Leonix Ad ID",
  },
  en: {
    back: "Back to Classifieds",
    post: "Post request",
    signIn: "Sign in",
    published: "Your request was published successfully.",
    adId: "Leonix Ad ID",
  },
} as const;

const REPORT_COPY = {
  es: {
    report: "Reportar anuncio",
    reportReasonPlaceholder: "Motivo del reporte (obligatorio)",
    reportSubmit: "Enviar reporte",
    reportCancel: "Cancelar",
    reportThankYou: "Gracias. Hemos recibido tu reporte.",
    reportReasonRequired: "Escribe el motivo del reporte.",
    reportFailed: "No se pudo enviar el reporte. Intenta de nuevo.",
    sending: "Enviando…",
  },
  en: {
    report: "Report listing",
    reportReasonPlaceholder: "Reason for report (required)",
    reportSubmit: "Submit report",
    reportCancel: "Cancel",
    reportThankYou: "Thank you. We have received your report.",
    reportReasonRequired: "Please enter a reason for the report.",
    reportFailed: "Could not submit report. Please try again.",
    sending: "Sending…",
  },
} as const;

type Listing = BuscoPublishedListingLike & {
  category: "busco";
  priceLabel: { es: string; en: string };
  owner_id?: string | null;
};

export function BuscoPublishedDetailPage({
  listing,
  lang,
  skipAnalytics,
}: {
  listing: Listing;
  lang: Lang;
  skipAnalytics?: boolean;
}) {
  const t = TOP_COPY[lang];
  const rt = REPORT_COPY[lang];

  const buscoQuickPairMap = useMemo(() => {
    const m = detailPairsToMap(listing.detailPairs);
    return isBuscoQuickListing(m) ? m : null;
  }, [listing.detailPairs]);

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportDone, setReportDone] = useState(false);
  const [publishSuccessVisible, setPublishSuccessVisible] = useState(false);
  const leonixAdId = formatLeonixAdId(listing.id);

  useEffect(() => {
    if (skipAnalytics) return;
    const ctx: CommunityGlobalAnalyticsCtx = { listingUuid: listing.id, category: "busco" };
    trackCommunityListingView(ctx);
    addListingView(listing.id);
  }, [listing.id, skipAnalytics]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = `leonix-busco-publish-success:${listing.id}`;
    if (window.sessionStorage.getItem(key) === "1") {
      window.sessionStorage.removeItem(key);
      setPublishSuccessVisible(true);
    }
  }, [listing.id]);

  const handleReportSubmit = async () => {
    const reason = reportReason.trim();
    if (!reason) {
      alert(rt.reportReasonRequired);
      return;
    }
    setReportSubmitting(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      await submitListingReportAction(listing.id, reason, user?.id ?? null);
      setReportDone(true);
      setTimeout(() => {
        setShowReportModal(false);
        setReportReason("");
      }, 1500);
    } catch {
      alert(rt.reportFailed);
    } finally {
      setReportSubmitting(false);
    }
  };

  if (!buscoQuickPairMap) return null;

  return (
    <>
      <CommunityQuickPublicDetailShell
        lang={lang}
        mode="published"
        onReport={() => {
          setReportReason("");
          setReportDone(false);
          setShowReportModal(true);
        }}
        topBar={
          <div className="space-y-3">
            {publishSuccessVisible ? (
              <BuscoPublishSuccessBanner publishedLabel={t.published} adIdLabel={t.adId} leonixAdId={leonixAdId} />
            ) : null}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <a
                href={`/clasificados?lang=${lang}`}
                className="inline-flex min-h-[40px] items-center rounded-xl border border-[#D6C7AD]/80 bg-[#FFFDF7] px-4 py-2 text-sm font-semibold text-[#5C564E] shadow-sm transition hover:bg-[#F5EDD8]"
              >
                ← {t.back}
              </a>
              <div className="flex flex-wrap gap-3">
                <a
                  href={`/publicar/busco/quick?lang=${lang}`}
                  className="inline-flex min-h-[40px] items-center rounded-xl bg-[#7A1E2C] px-4 py-2 text-sm font-bold text-[#FFFDF7] shadow-sm transition hover:opacity-90"
                >
                  {t.post}
                </a>
                <a
                  href={`/clasificados/login?lang=${lang}`}
                  className="inline-flex min-h-[40px] items-center rounded-xl border border-[#D6C7AD]/80 bg-[#FFFDF7] px-4 py-2 text-sm font-semibold text-[#5C564E] shadow-sm transition hover:bg-[#F5EDD8]"
                >
                  {t.signIn}
                </a>
              </div>
            </div>
          </div>
        }
        adBody={<BuscoQuickPublishedAd listing={listing} lang={lang} />}
        sidebar={
          <CommunityQuickPublicDetailSidebar
            lang={lang}
            mode="published"
            organizerName={lang === "es" ? "Solicitante" : "Requester"}
            listingId={listing.id}
          />
        }
      />

      {showReportModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
          <BuscoReportModal
            reportTitle={rt.report}
            reportDone={reportDone}
            reportThankYou={rt.reportThankYou}
            reportReasonPlaceholder={rt.reportReasonPlaceholder}
            reportReason={reportReason}
            onReportReasonChange={setReportReason}
            reportSubmitting={reportSubmitting}
            reportCancel={rt.reportCancel}
            reportSubmit={rt.reportSubmit}
            sending={rt.sending}
            onCancel={() => setShowReportModal(false)}
            onSubmit={() => void handleReportSubmit()}
          />
        </div>
      ) : null}
    </>
  );
}

function BuscoPublishSuccessBanner({
  publishedLabel,
  adIdLabel,
  leonixAdId,
}: {
  publishedLabel: string;
  adIdLabel: string;
  leonixAdId: string | null;
}) {
  return (
    <div
      className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-950 shadow-sm"
      data-testid="busco-publish-success-banner"
      role="status"
    >
      {publishedLabel} {leonixAdId ? `${adIdLabel}: ${leonixAdId}` : null}
    </div>
  );
}

function BuscoReportModal(props: {
  reportTitle: string;
  reportDone: boolean;
  reportThankYou: string;
  reportReasonPlaceholder: string;
  reportReason: string;
  onReportReasonChange: (v: string) => void;
  reportSubmitting: boolean;
  reportCancel: string;
  reportSubmit: string;
  sending: string;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 text-[#111111]">
      <h3 className="text-lg font-bold">{props.reportTitle}</h3>
      {props.reportDone ? (
        <p className="mt-4 text-[#111111]">{props.reportThankYou}</p>
      ) : (
        <>
          <textarea
            className="mt-4 w-full rounded-xl border border-gray-300 p-3 text-sm min-h-[100px] resize-y"
            placeholder={props.reportReasonPlaceholder}
            value={props.reportReason}
            onChange={(e) => props.onReportReasonChange(e.target.value)}
            disabled={props.reportSubmitting}
          />
          <div className="mt-4 flex gap-3 justify-end">
            <button
              type="button"
              className="px-4 py-2 rounded-full border border-gray-300 bg-white font-medium hover:bg-gray-50 disabled:opacity-50"
              onClick={props.onCancel}
              disabled={props.reportSubmitting}
            >
              {props.reportCancel}
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-full bg-[#C9B46A] text-[#111111] font-medium hover:opacity-90 disabled:opacity-50"
              onClick={props.onSubmit}
              disabled={props.reportSubmitting}
            >
              {props.reportSubmitting ? props.sending : props.reportSubmit}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
