"use client";

import { useCallback, useState } from "react";
import { FiShare2 } from "react-icons/fi";
import { CtaActionSheet } from "@/app/components/cta/CtaActionSheet";
import { getSafePublicAdUrl } from "@/app/components/cta/ctaDataHelpers";
import type { CtaActionCallback, CtaSheetIntent } from "@/app/components/cta/types";
import { trackListingShare } from "@/app/lib/clasificadosAnalytics";

type Props = {
  listingId: string | null | undefined;
  listingUrl?: string;
  listingTitle?: string;
  /** Optional full share body (title + details + URL). When set, hub copy/native share use this. */
  shareText?: string | null;
  variant?: "default" | "small" | "large";
  className?: string;
  lang?: "es" | "en";
  category?: string;
  ownerUserId?: string | null;
  /** When false, share UI works but analytics are not recorded. */
  persistEngagement?: boolean;
  /** When set, replaces default clasificados analytics insert. */
  recordShareEvent?: (shareMethod: string, extraMeta?: Record<string, unknown>) => void | Promise<void>;
  /**
   * @deprecated The main Compartir control always opens the Leonix share hub (`share_ad`).
   * Native share and per-network actions live inside the sheet.
   */
  preferNativeShareOnNarrowViewports?: boolean;
  /** When true, bypass the share drawer and invoke `navigator.share` directly with clipboard fallback. */
  directNativeShare?: boolean;
};

const LABELS = {
  es: { share: "Compartir", shareDirect: "Compartir con apps" },
  en: { share: "Share", shareDirect: "Share with apps" },
} as const;

/**
 * Opens the Leonix share hub (`CtaActionSheet` + `share_ad`) on first tap — no dropdown menu.
 */
export function LeonixShareButton({
  listingId,
  listingUrl,
  listingTitle,
  shareText,
  variant = "default",
  className = "",
  lang = "es",
  category,
  ownerUserId,
  persistEngagement,
  recordShareEvent,
  preferNativeShareOnNarrowViewports: _legacyPreferNative,
  directNativeShare = false,
}: Props) {
  const effectiveId = (listingId ?? "").trim();
  const allowTrack = persistEngagement !== false && Boolean(effectiveId);

  const trackShare = useCallback(
    async (shareMethod: string, extraMeta?: Record<string, unknown>) => {
      if (!allowTrack || !effectiveId) return;
      if (recordShareEvent) {
        await recordShareEvent(shareMethod, extraMeta);
        return;
      }
      await trackListingShare(effectiveId, {
        category,
        ownerUserId: ownerUserId ?? undefined,
        eventSource: "cta_card",
        shareMethod,
        metadata: { listingTitle: listingTitle || "", ...extraMeta },
      });
    },
    [allowTrack, effectiveId, recordShareEvent, category, ownerUserId, listingTitle],
  );

  const handleSheetAction = useCallback<CtaActionCallback>(
    (info) => {
      if (!allowTrack || !effectiveId) return;

      if (info.kind === "share_ad") {
        const id = info.actionId;
        const outcome = String((info.meta as { outcome?: string } | undefined)?.outcome ?? "");

        if (id === "hub_native_share") {
          if (outcome === "native") void trackShare("web_share", { hub: true, ...info.meta });
          else if (outcome === "fallback_copy") void trackShare("copy_link", { hub: true, nativeFallback: true, ...info.meta });
          return;
        }
        if (id === "hub_copy_link") {
          void trackShare("copy_link", { hub: true, ...info.meta });
          return;
        }
        if (id === "hub_copy_share_text") {
          void trackShare("copy_share_text", { hub: true, ...info.meta });
          return;
        }
        if (id === "hub_copy_full_share") {
          void trackShare("copy_full_share_message", { hub: true, ...info.meta });
          return;
        }
        if (id === "hub_whatsapp") {
          void trackShare("whatsapp", { hub: true, ...info.meta });
          return;
        }
        if (id === "hub_sms") {
          void trackShare("sms", { hub: true, ...info.meta });
          return;
        }
        if (id === "hub_facebook") {
          void trackShare("facebook", { hub: true, ...info.meta });
          return;
        }
        if (id === "hub_twitter") {
          void trackShare("twitter", { hub: true, ...info.meta });
          return;
        }
        if (id === "hub_email") {
          void trackShare("email", { hub: true, ...info.meta });
          return;
        }
        if (id === "hub_instagram") {
          void trackShare("instagram", { hub: true, ...info.meta });
        }
        return;
      }

      if (info.kind === "share_social") {
        const platform = String(info.meta?.platform ?? "");
        if (info.actionId.startsWith("social_open_")) {
          const m =
            platform === "facebook" ? "facebook" : platform === "twitter" ? "twitter" : platform === "whatsapp" ? "whatsapp" : "";
          if (m) void trackShare(m);
          return;
        }
        if (info.actionId === "social_copy_link") {
          void trackShare("copy_link");
          return;
        }
        if (info.actionId === "social_copy_share_text") {
          void trackShare("copy_share_text", { sheetCopy: "share_text", platform });
          return;
        }
      }
    },
    [allowTrack, effectiveId, trackShare],
  );

  const [sheetIntent, setSheetIntent] = useState<CtaSheetIntent | null>(null);
  const labels = LABELS[lang];

  const resolvedListingUrl = (listingUrl ?? "").trim();
  const publicUrl = getSafePublicAdUrl({ publicUrl: resolvedListingUrl }).trim() || resolvedListingUrl;

  const sizeClasses = {
    small: "px-3 py-1.5 text-sm",
    default: "px-4 py-2 text-sm",
    large: "px-5 py-3 text-base",
  };

  const iconSizes = {
    small: "h-4 w-4",
    default: "h-4 w-4",
    large: "h-5 w-5",
  };

  const triggerNativeShare = useCallback(async () => {
    const safeTitle = (listingTitle ?? "").trim() || (lang === "en" ? "Leonix listing" : "Anuncio Leonix");
    const body = (shareText ?? "").trim();
    const shareData: ShareData = {
      title: safeTitle,
      text: body || safeTitle,
      url: publicUrl || undefined,
    };
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        void trackShare("web_share", { direct: true });
      } catch {
        /* user cancelled or unsupported — silent */
      }
    } else {
      try {
        await navigator.clipboard.writeText(publicUrl || window.location.href);
        void trackShare("copy_link", { direct: true, nativeFallback: true });
      } catch { /* silent */ }
    }
  }, [listingTitle, shareText, publicUrl, lang, trackShare]);

  const openShareHub = () => {
    if (directNativeShare) {
      void triggerNativeShare();
      return;
    }
    const safeTitle = (listingTitle ?? "").trim();
    const body = (shareText ?? "").trim();
    setSheetIntent({
      kind: "share_ad",
      publicUrl: resolvedListingUrl,
      shareTitle: safeTitle || (lang === "en" ? "Leonix listing" : "Anuncio Leonix"),
      shareText: body || null,
    });
    void trackShare("share_sheet_open", { publicUrl: publicUrl || undefined });
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={openShareHub}
        className={`
          inline-flex items-center gap-2 rounded-full font-medium
          bg-white text-[#1A1A1A] border border-[#D4A574]
          hover:bg-[#FFFAF0] transition-all duration-200
          ${sizeClasses[variant]}
        `}
        aria-label={labels.share}
      >
        <FiShare2 className={iconSizes[variant]} />
        <span>{directNativeShare ? labels.shareDirect : labels.share}</span>
      </button>

      <CtaActionSheet
        open={sheetIntent != null}
        onClose={() => setSheetIntent(null)}
        intent={sheetIntent}
        lang={lang}
        onAction={handleSheetAction}
      />
    </div>
  );
}
