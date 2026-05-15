"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { trackListingSave } from "@/app/lib/clasificadosAnalytics";
import { trackEvent } from "@/app/lib/listingAnalytics";
import { addListingView } from "@/app/lib/recentlyViewed";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { submitListingReportAction } from "@/app/admin/actions";
import { ClasesPublishedQuickAd } from "@/app/(site)/publicar/clases/components/ClasesPublishedQuickAd";
import { ComunidadPublishedQuickAd } from "@/app/(site)/publicar/comunidad/components/ComunidadPublishedQuickAd";
import {
  detailPairsToMap,
  isCommunityQuickListing,
} from "@/app/(site)/clasificados/community/shared/communityListingDetailPairs";

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
  es: { back: "Volver a Clasificados", post: "Publicar anuncio", signIn: "Iniciar sesión" },
  en: { back: "Back to Classifieds", post: "Post listing", signIn: "Sign in" },
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

  const [saved, setSaved] = useState(false);
  const [savedSyncDone, setSavedSyncDone] = useState(false);
  const [viewerUserId, setViewerUserId] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportDone, setReportDone] = useState(false);

  const isOwner = Boolean(
    viewerUserId && listing.owner_id && String(listing.owner_id) === String(viewerUserId),
  );

  useEffect(() => {
    if (skipAnalytics) return;
    let cancelled = false;
    void (async () => {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      const uid = user?.id ?? null;
      void trackEvent(listing.id, "listing_view", uid);
      void trackEvent(listing.id, "listing_open", uid);
    })();
    addListingView(listing.id);
    return () => {
      cancelled = true;
    };
  }, [listing.id, skipAnalytics]);

  useEffect(() => {
    if (skipAnalytics || !listing.id || savedSyncDone) return;
    let mounted = true;
    void (async () => {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!mounted) return;
      if (user) {
        const { data } = await supabase
          .from("saved_listings")
          .select("listing_id")
          .eq("user_id", user.id)
          .eq("listing_id", listing.id)
          .maybeSingle();
        if (mounted) setSaved(!!data);
      }
      setSavedSyncDone(true);
    })();
    return () => {
      mounted = false;
    };
  }, [listing.id, savedSyncDone, skipAnalytics]);

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
        if (!skipAnalytics) void trackEvent(listing.id, "listing_share", uid);
        return;
      }
    } catch {
      /* fall through */
    }

    await copyText(url || buildShareMessage());
    if (!skipAnalytics) void trackEvent(listing.id, "listing_share", uid);
  };

  const handleGuardarAnuncio = async () => {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      const here = `${window.location.pathname}${window.location.search || ""}`;
      window.location.href = `/login?redirect=${encodeURIComponent(here)}`;
      return;
    }
    if (saved) {
      await supabase.from("saved_listings").delete().eq("user_id", user.id).eq("listing_id", listing.id);
      setSaved(false);
      void trackListingSave(listing.id, false, { ownerUserId: listing.owner_id ?? undefined });
    } else {
      await supabase
        .from("saved_listings")
        .upsert({ user_id: user.id, listing_id: listing.id }, { onConflict: "user_id,listing_id" });
      setSaved(true);
      void trackListingSave(listing.id, true, { ownerUserId: listing.owner_id ?? undefined });
    }
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
          <div className="flex flex-wrap items-center justify-between gap-4">
            <a
              href={`/clasificados?lang=${lang}`}
              className="px-5 py-2.5 rounded-full border border-[#C9B46A]/55 bg-[#F5F5F5] backdrop-blur ring-1 ring-[#C9B46A]/25 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.85)] text-[#111111] font-semibold hover:bg-[#D9D9D9]/45 transition"
            >
              ← {t.back}
            </a>
            <div className="flex flex-wrap gap-3">
              <a
                href={`/clasificados/publicar?lang=${lang}`}
                className="px-6 py-2.5 rounded-full bg-[#111111] text-[#F5F5F5] font-semibold hover:opacity-95 transition"
              >
                {t.post}
              </a>
              <a
                href={`/clasificados/login?lang=${lang}`}
                className="px-6 py-2.5 rounded-full border border-[#C9B46A]/55 bg-[#F5F5F5] backdrop-blur ring-1 ring-[#C9B46A]/25 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.85)] text-[#111111] font-semibold hover:bg-[#D9D9D9]/45 transition"
              >
                {t.signIn}
              </a>
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
            saved={saved}
            onSave={skipAnalytics ? undefined : handleGuardarAnuncio}
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
