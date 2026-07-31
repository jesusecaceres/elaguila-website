"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import ContactActions from "@/app/(site)/clasificados/components/ContactActions";
import { addListingView } from "@/app/lib/recentlyViewed";
import { stripLeonixPublishedDescriptionBody } from "@/app/(site)/clasificados/lib/leonixListingGalleryMarker";
import { resolveMascotasPerdidosNoticeLabel } from "@/app/(site)/publicar/mascotas-y-perdidos/shared/mascotasPerdidosTaxonomy";

import { MascotasPerdidosShellLayout } from "./shared/MascotasPerdidosShellLayout";
import { detailPairsToMap } from "./shared/mascotasPerdidosListingDetailPairs";

const COPY = {
  es: {
    back: "Volver a Mascotas y Perdidos",
    post: "Publicar aviso",
    notice: "Aviso",
    lastSeen: "Última ubicación conocida",
    email: "Correo",
    noContact: "—",
  },
  en: {
    back: "Back to Lost & Found Pets",
    post: "Post a notice",
    notice: "Notice",
    lastSeen: "Last known location",
    email: "Email",
    noContact: "—",
  },
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
};

/**
 * I.6B — smallest category-specific renderer for a published Mascotas y Perdidos listing.
 * Mirrors MascotasPerdidosQuickPreviewClient's field layout for genuine Preview/public parity
 * (same fields, same source: `detail_pairs` built by publishMascotasPerdidosQuickToListings.ts),
 * reusing the same shell (MascotasPerdidosShellLayout) already used by preview/results. Not a
 * copy of the En Venta renderer — built from this category's own data contract only.
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
  const pairs = useMemo(() => detailPairsToMap(listing.detailPairs), [listing.detailPairs]);
  const noticeSlug = (pairs["Leonix:noticeType"] ?? "").trim();
  const noticeLabel = noticeSlug ? resolveMascotasPerdidosNoticeLabel(noticeSlug, lang) : t.notice;
  const lastSeenLocation = (pairs["Leonix:lastSeenLocation"] ?? "").trim();
  const description = stripLeonixPublishedDescriptionBody(listing.description ?? "") || (listing.description ?? "").trim();
  const imageUrl = Array.isArray(listing.images) && listing.images.length > 0 ? listing.images[0] : null;
  const phoneDigits = (listing.contact_phone ?? "").replace(/\D/g, "").slice(0, 15);
  const hasPhone = phoneDigits.length >= 10;
  const email = (listing.contact_email ?? "").trim();
  const smsBody =
    lang === "es"
      ? "Vi tu aviso en Leonix Media y quisiera contactarte."
      : "I saw your notice on Leonix Media and would like to contact you.";
  const mailtoSubject = lang === "es" ? "Sobre tu aviso en Leonix Media" : "About your notice on Leonix Media";

  useEffect(() => {
    if (skipAnalytics) return;
    // Recently-viewed only — the shared community global-analytics tracker's category union does
    // not include this pipeline, and extending it is out of scope (locked: global analytics).
    addListingView(listing.id);
  }, [listing.id, skipAnalytics]);

  const backHref = appendLangToPath("/clasificados/mascotas-y-perdidos", lang);
  const postHref = appendLangToPath("/publicar/mascotas-y-perdidos/quick", lang);

  return (
    <MascotasPerdidosShellLayout lang={lang} backHref={backHref} backLabel={t.back}>
      <div className="flex flex-wrap items-center justify-end gap-3">
        <Link
          href={postHref}
          className="inline-flex min-h-[40px] items-center rounded-xl bg-[#7A1E2C] px-4 py-2 text-sm font-bold text-[#FFFDF7] shadow-sm transition hover:opacity-90"
        >
          {t.post}
        </Link>
      </div>

      <article className="mt-4 overflow-hidden rounded-2xl border border-[#C9B46A]/40 bg-white shadow-[0_8px_28px_-18px_rgba(42,36,22,0.18)]">
        {imageUrl ? (
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-[#EDE8DF]">
            {/* Standard <img>: source is user-uploaded Supabase Storage URL, matching every other quick category's published detail rendering. */}
            <img src={imageUrl} alt="" className="h-full w-full object-cover" />
          </div>
        ) : null}

        <div className="space-y-3 p-4 sm:p-5">
          <span className="inline-flex max-w-full rounded-full bg-[#EDE8DF] px-2.5 py-0.5 text-[11px] font-semibold text-[#3D3428]">
            {noticeLabel}
          </span>

          <h1 className="text-xl font-bold leading-snug text-[#1E1810] sm:text-2xl">{listing.title}</h1>

          {listing.city ? <p className="font-medium text-[#5C5346]">{listing.city}</p> : null}

          {description ? <p className="whitespace-pre-wrap leading-relaxed">{description}</p> : null}

          {lastSeenLocation ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#7A7164]">{t.lastSeen}</p>
              <p>{lastSeenLocation}</p>
            </div>
          ) : null}

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
            <p className="text-[#5C5346]">{t.noContact}</p>
          )}

          {email ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#7A7164]">{t.email}</p>
              <a href={`mailto:${encodeURIComponent(email)}`} className="font-medium text-[#3D3428] underline">
                {email}
              </a>
            </div>
          ) : null}
        </div>
      </article>
    </MascotasPerdidosShellLayout>
  );
}
