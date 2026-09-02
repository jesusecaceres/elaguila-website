"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { addListingView } from "@/app/lib/recentlyViewed";
import {
  trackCommunityListingView,
  type CommunityGlobalAnalyticsCtx,
} from "@/app/lib/clasificados/comunidad/comunidadClasesBuscoGlobalAnalytics";
import { LeonixInlineListingReport } from "@/app/clasificados/components/LeonixInlineListingReport";
import { mascotasPerdidosPublishedQuickToDraft } from "@/app/(site)/publicar/mascotas-y-perdidos/shared/mascotasPerdidosPublishedQuickToDraft";
import { MascotasPerdidosQuickAdCanvas } from "@/app/(site)/publicar/mascotas-y-perdidos/components/MascotasPerdidosQuickAdCanvas";

import { MascotasPerdidosShellLayout } from "./shared/MascotasPerdidosShellLayout";

const COPY = {
  es: { back: "Volver a Mascotas y Perdidos", post: "Publicar aviso" },
  en: { back: "Back to Lost & Found Pets", post: "Post a notice" },
} as const;

export type MascotasPerdidosPublishedListingLike = {
  id: string;
  title: string;
  city: string;
  description: string;
  images?: string[] | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  detailPairs?: unknown;
  leonix_ad_id?: string | null;
};

/**
 * Gate 3 — renders a published Mascotas y Perdidos listing through the same category-owned
 * `MascotasPerdidosQuickAdCanvas` used by Preview (WYSIWYG parity), hydrated from `detail_pairs`
 * via `mascotasPerdidosPublishedQuickToDraft` (mirrors the Comunidad/Clases hydration pattern).
 * Legacy "simple" lane rows (pre-Gate-3) hydrate safely — every rich-lane field defaults empty.
 */
export function MascotasPerdidosPublishedDetailPage({
  listing,
  lang,
  skipAnalytics,
}: {
  listing: MascotasPerdidosPublishedListingLike;
  lang: Lang;
  skipAnalytics?: boolean;
}) {
  const t = COPY[lang];
  const draft = useMemo(() => mascotasPerdidosPublishedQuickToDraft(listing), [listing]);

  useEffect(() => {
    if (skipAnalytics) return;
    // Globalization Build D-F5 — this page had zero canonical analytics; only Recently Viewed
    // was wired. Mirrors the Busco/Comunidad/Clases trackCommunityListingView adoption.
    const ctx: CommunityGlobalAnalyticsCtx = { listingUuid: listing.id, category: "mascotas-y-perdidos" };
    trackCommunityListingView(ctx);
    addListingView(listing.id);
  }, [listing.id, skipAnalytics]);

  const backHref = appendLangToPath("/clasificados/mascotas-y-perdidos", lang);
  const postHref = appendLangToPath("/publicar/mascotas-y-perdidos/quick", lang);

  return (
    <MascotasPerdidosShellLayout lang={lang} backHref={backHref} backLabel={t.back}>
      <div className="flex flex-wrap items-center justify-end gap-3">
        <Link href={postHref} className="inline-flex min-h-[40px] items-center rounded-xl bg-[#7A1E2C] px-4 py-2 text-sm font-bold text-[#FFFDF7] shadow-sm transition hover:opacity-90">
          {t.post}
        </Link>
      </div>

      <MascotasPerdidosQuickAdCanvas draft={draft} lang={lang} shell="standalone" leonixAdId={listing.leonix_ad_id ?? null} />

      {/* Globalization Build D-F5 — Report was entirely missing from this page (the one every
          current Mascotas y Perdidos listing actually renders through), a real gap for a
          category genuinely susceptible to scam/spam lost-and-found posts. */}
      <div className="mt-6 max-w-md">
        <LeonixInlineListingReport listingId={listing.id} lang={lang} />
      </div>
    </MascotasPerdidosShellLayout>
  );
}
