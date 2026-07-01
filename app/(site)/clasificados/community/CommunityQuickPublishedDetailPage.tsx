"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import {
  trackCommunityListingView,
  trackCommunityListingShare,
  type CommunityAnalyticsCategory,
} from "@/app/lib/clasificados/comunidad/comunidadClasesBuscoGlobalAnalytics";
import { addListingView } from "@/app/lib/recentlyViewed";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { submitListingReportAction } from "@/app/admin/actions";
import { ClasesPublishedQuickAd } from "@/app/(site)/publicar/clases/components/ClasesPublishedQuickAd";
import { ComunidadPublishedQuickAd } from "@/app/(site)/publicar/comunidad/components/ComunidadPublishedQuickAd";
import {
  detailPairsToMap,
  isCommunityQuickListing,
} from "@/app/(site)/clasificados/community/shared/communityListingDetailPairs";
import { formatLeonixAdId } from "@/app/(site)/clasificados/community/shared/communityLeonixAdId";

import { CommunityQuickPublicDetailShell } from "./CommunityQuickPublicDetailShell";
import { CommunityQuickPublicDetailSidebar } from "./CommunityQuickPublicDetailSidebar";

type Listing = {
  id: string;
  category: "clases" | "comunidad";
  title: { es: string; en: string };
  priceLabel: { es: string; en: string };
  city: string;
  blurb: { es: string; en: string };
  images?: string[] | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  detailPairs?: unknown;
  owner_id?: string | null;
};

const TOP_COPY = {
  es: {
    back: "Volver a Clasificados",
    post: "Publicar anuncio",
    signIn: "Iniciar sesión",
    published: "Tu anuncio fue publicado correctamente.",
    adId: "ID de anuncio",
  },
  en: {
    back: "Back to Classifieds",
    post: "Post listing",
    signIn: "Sign in",
    published: "Your listing was published successfully.",
    adId: "Ad ID",
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

export function CommunityQuickPublishedDetailPage({
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

  const communityQuickPairMap = useMemo(() => {
    const m = detailPairsToMap(listing.detailPairs);
    return isCommunityQuickListing(m) ? m : null;
  }, [listing.detailPairs]);

  const organizerName = communityQuickPairMap?.["Leonix:organizer"]?.trim() ?? "";

  const [viewerUserId, setViewerUserId] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportDone, setReportDone] = useState(false);
  const [publishSuccessVisible, setPublishSuccessVisible] = useState(false);
  const leonixAdId = formatLeonixAdId(listing.id);

  const isOwner = Boolean(
    viewerUserId && listing.owner_id && String(listing.owner_id) === String(viewerUserId),
  );

  useEffect(() => {
    if (skipAnalytics) return;
    trackCommunityListingView({ listingUuid: listing.id, category: listing.category as CommunityAnalyticsCategory });
    addListingView(listing.id);
  }, [listing.id, skipAnalytics]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (mounted) setViewerUserId(user?.id ?? null);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = `leonix-community-publish-success:${listing.id}`;
    if (window.sessionStorage.getItem(key) === "1") {
      window.sessionStorage.removeItem(key);
      setPublishSuccessVisible(true);
    }
  }, [listing.id]);

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert(lang === "es" ? "Copiado." : "Copied.");
    } catch {
      window.prompt(lang === "es" ? "Copia este enlace:" : "Copy this link:", text);
    }
  };

  const buildShareMessage = useCallback(() => {
    const title = listing.title[lang];
    const price = listing.priceLabel[lang];
    const city = listing.city;
    const url = typeof window !== "undefined" ? window.location.href : "";
    return `${title} — ${price} (${city})\n${url}`;
  }, [listing, lang]);

  const handleShare = async () => {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const uid = user?.id ?? null;
    const url = typeof window !== "undefined" ? window.location.href : "";
    const title = listing.title[lang];
    const text = listing.blurb[lang];
    const nav: unknown = typeof navigator !== "undefined" ? navigator : null;
    const shareFn =
      nav && typeof (nav as { share?: unknown }).share === "function"
        ? (nav as { share: (opts: unknown) => Promise<void> }).share
        : null;

    try {
      if (shareFn) {
        await shareFn({ title, text, url });
        if (!skipAnalytics) trackCommunityListingShare({ listingUuid: listing.id, category: listing.category as CommunityAnalyticsCategory }, "native_share");
        return;
      }
    } catch {
      /* fall through */
    }

    await copyText(url || buildShareMessage());
    if (!skipAnalytics) trackCommunityListingShare({ listingUuid: listing.id, category: listing.category as CommunityAnalyticsCategory }, "copy_link");
  };

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

  const adBody =
    listing.category === "clases" ? (
      <ClasesPublishedQuickAd listing={listing} lang={lang} />
    ) : (
      <ComunidadPublishedQuickAd listing={listing} lang={lang} />
    );

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
              <div
                className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-950 shadow-sm"
                data-testid="community-publish-success-banner"
                role="status"
              >
                {t.published} {leonixAdId ? `${t.adId}: ${leonixAdId}` : null}
              </div>
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
                  href={`/clasificados/publicar?lang=${lang}`}
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
        adBody={adBody}
        sidebar={
          <CommunityQuickPublicDetailSidebar
            lang={lang}
            mode="published"
            organizerName={organizerName}
            listingId={listing.id}
            isOwner={isOwner}
            onShare={() => void handleShare()}
            onCopyLink={() => void copyText(typeof window !== "undefined" ? window.location.href : "")}
            onCopyInfo={() => void copyText(buildShareMessage())}
          />
        }
      />

      {showReportModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 text-[#111111]">
            <h3 className="text-lg font-bold">{rt.report}</h3>
            {reportDone ? (
              <p className="mt-4 text-[#111111]">{rt.reportThankYou}</p>
            ) : (
              <>
                <textarea
                  className="mt-4 w-full rounded-xl border border-gray-300 p-3 text-sm min-h-[100px] resize-y"
                  placeholder={rt.reportReasonPlaceholder}
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  disabled={reportSubmitting}
                />
                <div className="mt-4 flex gap-3 justify-end">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-full border border-gray-300 bg-white font-medium hover:bg-gray-50 disabled:opacity-50"
                    onClick={() => setShowReportModal(false)}
                    disabled={reportSubmitting}
                  >
                    {rt.reportCancel}
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 rounded-full bg-[#C9B46A] text-[#111111] font-medium hover:opacity-90 disabled:opacity-50"
                    onClick={() => void handleReportSubmit()}
                    disabled={reportSubmitting}
                  >
                    {reportSubmitting ? rt.sending : rt.reportSubmit}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
