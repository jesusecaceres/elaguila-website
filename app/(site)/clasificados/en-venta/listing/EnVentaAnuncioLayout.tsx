"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import Navbar from "@/app/components/Navbar";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { BR_CATEGORY_HOME } from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";
import {
  brLuxuryBodyMutedClass,
  brLuxuryBtnPrimaryClass,
  brLuxuryBtnSecondaryClass,
  brLuxuryCardClass,
  brLuxuryInnerMaxClass,
  brLuxuryOverlineClass,
  brLuxuryPageClass,
  brLuxurySerifHeadingClass,
} from "@/app/clasificados/bienes-raices/shared/brResultsTheme";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { EnVentaCorreoModal } from "@/app/clasificados/en-venta/preview/EnVentaCorreoModal";
import { formatPostedAgo } from "./enVentaAnuncioFormatters";
import { EnVentaMediaGallery } from "./EnVentaMediaGallery";
import { EnVentaSellerCard } from "./EnVentaSellerCard";
import { EnVentaSellerPublicStats } from "./EnVentaSellerPublicStats";
import { EnVentaItemSpecs } from "./EnVentaItemSpecs";
import { EnVentaRelatedRail } from "./EnVentaRelatedRail";
import { enVentaClassifiedAdJsonLd } from "../seo/enVentaJsonLd";
import { RentasNegocioDesktopBusinessRail } from "@/app/clasificados/rentas/listing/components/RentasNegocioDesktopBusinessRail";
import { BrLiveFactsStrip } from "@/app/clasificados/bienes-raices/listing/BrLiveFactsStrip";
import { LeonixInlineListingReport } from "@/app/clasificados/components/LeonixInlineListingReport";
import { buildLeonixBusinessLiveDisplay, parseLeonixBusinessMetaForLive } from "@/app/clasificados/lib/leonixBusinessLiveDisplay";
import { resolveLeonixLiveListingContact } from "@/app/clasificados/lib/leonixListingContactResolve";
import {
  buildBrLiveGate12dHoaCard,
  buildBrLiveGate12dOpenHouseCard,
  buildBrPublicLocationForLiveDetail,
} from "@/app/clasificados/lib/leonixBrGate12d";
import { trackEnVentaListingOpen, trackEnVentaListingView } from "../analytics/enVentaAnalytics";
import { LeonixLikeButton } from "@/app/components/clasificados/analytics/LeonixLikeButton";
import { trackListingSave, trackListingShare } from "@/app/lib/clasificadosAnalytics";

type Lang = "es" | "en";

type AnuncioListingLike = {
  id: string;
  title: { es: string; en: string };
  priceLabel: { es: string; en: string };
  city: string;
  blurb: { es: string; en: string };
  images?: string[] | null;
  sellerType?: "personal" | "business";
  businessName?: string | null;
  business_name?: string | null;
  detailPairs?: Array<{ label: string; value: string }> | null;
  created_at?: string | null;
  status?: string;
  contact_phone?: string | null;
  contact_email?: string | null;
  owner_id?: string | null;
  business_meta?: string | null;
};

function pairsFromListing(l: AnuncioListingLike): Array<{ label: string; value: string }> {
  const dp = l.detailPairs;
  if (!Array.isArray(dp)) return [];
  return dp
    .map((p) => {
      if (!p || typeof p !== "object") return null;
      const o = p as { label?: string; value?: string };
      if (!o.label || !o.value) return null;
      return { label: String(o.label), value: String(o.value) };
    })
    .filter((x): x is { label: string; value: string } => x != null);
}

function conditionFromPairs(rows: Array<{ label: string; value: string }>, lang: Lang): string | null {
  for (const r of rows) {
    const lb = r.label.toLowerCase();
    if (lb.includes("condición") || lb.includes("condicion") || (lb.includes("condition") && !lb.includes("air"))) {
      const k = r.value.trim().toLowerCase();
      const map: Record<string, { es: string; en: string }> = {
        new: { es: "Nuevo", en: "New" },
        "like-new": { es: "Como nuevo", en: "Like new" },
        good: { es: "Bueno", en: "Good" },
        fair: { es: "Regular", en: "Fair" },
      };
      const hit = map[k];
      return hit ? hit[lang] : r.value;
    }
  }
  return null;
}

function normalizePhoneForTel(raw: string) {
  return String(raw || "").replace(/[^0-9+]/g, "");
}

function contactChannelFromPairs(rows: Array<{ label: string; value: string }>): string {
  for (const r of rows) {
    if (r.label.trim() === "Leonix:contactChannel") return r.value.trim().toLowerCase();
  }
  return "";
}

function digitsForWhatsAppLink(raw: string): string | null {
  const d = String(raw || "").replace(/\D/g, "");
  if (d.length < 10) return null;
  return d;
}

export type LeonixAnuncioListingSurface = "en-venta" | "bienes-raices";

export function EnVentaAnuncioLayout({
  listing,
  lang,
  backHref,
  surface = "en-venta",
  moreInCategoryHref,
  moreInCategoryLabel,
  showListingReport = false,
}: {
  listing: AnuncioListingLike;
  lang: Lang;
  backHref: string;
  /** Which vertical this live listing belongs to (drives BR facts strip + browse CTA defaults). */
  surface?: LeonixAnuncioListingSurface;
  /** Override “more in category” link (defaults to En Venta results). */
  moreInCategoryHref?: string;
  moreInCategoryLabel?: string;
  /** Inline moderation report (Leonix `submitListingReportAction`). */
  showListingReport?: boolean;
}) {
  const images = listing.images ?? [];
  const rows = useMemo(() => pairsFromListing(listing), [listing]);
  const premiumBr = surface === "bienes-raices";

  const brLocationBlock = useMemo(() => {
    if (!premiumBr) return null;
    return buildBrPublicLocationForLiveDetail({
      detailPairs: listing.detailPairs,
      humanRows: rows,
      listingCity: String(listing.city ?? ""),
    });
  }, [premiumBr, listing.detailPairs, listing.city, rows]);

  const brGate12dHoaCard = useMemo(
    () => (premiumBr ? buildBrLiveGate12dHoaCard(listing.detailPairs, lang) : null),
    [premiumBr, listing.detailPairs, lang],
  );

  const brGate12dOpenHouseCard = useMemo(
    () => (premiumBr ? buildBrLiveGate12dOpenHouseCard(listing.detailPairs, lang) : null),
    [premiumBr, listing.detailPairs, lang],
  );

  const contactChannel = useMemo(() => contactChannelFromPairs(rows), [rows]);
  const condition = conditionFromPairs(rows, lang);
  const sellerKind = listing.sellerType === "business" ? "business" : "personal";
  const biz = listing.businessName || listing.business_name || null;
  const businessMeta = useMemo(
    () => parseLeonixBusinessMetaForLive(listing.business_meta ?? null),
    [listing.business_meta]
  );
  const negocioDisplay = useMemo(
    () => buildLeonixBusinessLiveDisplay(listing, businessMeta, lang),
    [listing, businessMeta, lang]
  );
  const resolvedContact = useMemo(
    () =>
      resolveLeonixLiveListingContact({
        sellerType: listing.sellerType,
        seller_type: listing.sellerType,
        contact_phone: listing.contact_phone,
        contact_email: listing.contact_email,
        business_meta: listing.business_meta ?? null,
        detail_pairs: listing.detailPairs ?? null,
      }),
    [listing.sellerType, listing.contact_phone, listing.contact_email, listing.business_meta, listing.detailPairs],
  );
  const [correoOpen, setCorreoOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveReady, setSaveReady] = useState(false);

  const sellerNameForModal =
    sellerKind === "business"
      ? biz || (lang === "es" ? "Negocio" : "Business")
      : lang === "es"
        ? "Particular"
        : "Individual";

  const sellerTypeBadge =
    lang === "es"
      ? sellerKind === "business"
        ? "Negocio"
        : "Particular"
      : sellerKind === "business"
        ? "Business"
        : "Individual";

  const trustModeratedLine = lang === "es" ? "Anuncio moderado por Leonix" : "Leonix moderated listing";
  const trustSafetyLine =
    lang === "es"
      ? "Reúnete en un lugar público y verifica el artículo antes de pagar."
      : "Meet in a public place and verify the item before paying.";

  const fulfillmentLine = useMemo(() => {
    for (const r of rows) {
      if (/entrega|fulfillment/i.test(r.label)) return r.value;
    }
    return "";
  }, [rows]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      const uid = user?.id ?? null;
      trackEnVentaListingView(listing.id, uid);
      trackEnVentaListingOpen(listing.id, uid);
      if (uid) {
        const { data } = await supabase
          .from("saved_listings")
          .select("listing_id")
          .eq("user_id", uid)
          .eq("listing_id", listing.id)
          .maybeSingle();
        if (!cancelled) setSaved(!!data);
      } else {
        setSaved(false);
      }
      if (!cancelled) setSaveReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [listing.id]);

  const ownerId = listing.owner_id?.trim() || null;

  const onToggleSave = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      const here = typeof window !== "undefined" ? `${window.location.pathname}${window.location.search || ""}` : "/clasificados";
      window.location.href = `/login?redirect=${encodeURIComponent(here)}`;
      return;
    }
    if (saved) {
      await supabase.from("saved_listings").delete().eq("user_id", user.id).eq("listing_id", listing.id);
      setSaved(false);
      void trackListingSave(listing.id, false, { ownerUserId: ownerId ?? undefined, category: surface === "en-venta" ? "en-venta" : "bienes-raices" });
    } else {
      await supabase
        .from("saved_listings")
        .upsert({ user_id: user.id, listing_id: listing.id }, { onConflict: "user_id,listing_id" });
      setSaved(true);
      void trackListingSave(listing.id, true, { ownerUserId: ownerId ?? undefined, category: surface === "en-venta" ? "en-venta" : "bienes-raices" });
    }
  }, [listing.id, saved, ownerId, surface]);

  const onShareListing = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const url = typeof window !== "undefined" ? window.location.href : "";
    const title = listing.title[lang];
    let shareMethod: "web_share" | "copy_link" | "unknown" = "unknown";
    try {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share({ title, url });
        shareMethod = "web_share";
      } else {
        throw new Error("no_share");
      }
    } catch {
      try {
        if (typeof navigator !== "undefined" && navigator.clipboard) {
          await navigator.clipboard.writeText(url);
          shareMethod = "copy_link";
        }
      } catch {
        /* ignore */
      }
    }
    void trackListingShare(listing.id, {
      ownerUserId: ownerId ?? undefined,
      eventSource: "detail",
      shareMethod,
      category: surface === "en-venta" ? "en-venta" : "bienes-raices",
      metadata: { actorHint: user?.id ?? null },
    });
  }, [lang, listing.id, listing.title, ownerId, surface]);

  const jsonLd = enVentaClassifiedAdJsonLd({
    title: listing.title[lang],
    description: listing.blurb[lang],
    url: `/clasificados/anuncio/${listing.id}`,
    priceLabel: listing.priceLabel[lang],
    city: listing.city,
  });

  const posted = formatPostedAgo(listing.created_at ?? null, lang);
  const phoneTel = resolvedContact.phoneForTel ? normalizePhoneForTel(String(resolvedContact.phoneForTel)) : "";
  const waDigits = phoneTel ? digitsForWhatsAppLink(phoneTel) : null;
  const ch12 = resolvedContact.contactChannels;
  const gateAllowCall = ch12?.allowCall !== false;
  const gateAllowSms = ch12?.allowSms !== false;
  const legacyWa = contactChannel === "whatsapp" || contactChannel === "both";
  const showWhatsAppCta =
    Boolean(waDigits) && (ch12?.whatsappEnabled !== false) && (ch12 ? true : legacyWa);
  const email = String(resolvedContact.emailForMailto || "").trim();

  /** En Venta detail: one clear primary CTA (WhatsApp when offered, else message, else call). */
  const evPrimaryContactKind: "wa" | "email" | "tel" | null =
    !premiumBr && showWhatsAppCta && waDigits
      ? "wa"
      : !premiumBr && email
        ? "email"
        : !premiumBr && phoneTel && gateAllowCall
          ? "tel"
          : null;

  const scrollToContact = useCallback(() => {
    const el = document.getElementById("leonix-contact-actions");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const scrollToDescription = useCallback(() => {
    const el = document.getElementById("leonix-listing-description");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const BtnBase = "px-4 py-2 rounded-xl font-semibold transition";
  const secondary = premiumBr
    ? `${brLuxuryBtnSecondaryClass} min-h-[42px] px-4 py-2 text-sm`
    : "bg-white/5 border border-white/10 hover:bg-white/10 text-white";
  const primary = premiumBr
    ? `${brLuxuryBtnPrimaryClass} min-h-[42px] px-4 py-2 text-sm`
    : "bg-yellow-500 text-black hover:bg-yellow-400";

  const listingIdLabel = lang === "es" ? "ID del anuncio" : "Listing ID";
  const saveLabel =
    lang === "es" ? (saved ? "★ Guardado" : "☆ Guardar") : saved ? "★ Saved" : "☆ Save";
  const saveHint =
    lang === "es"
      ? "Guarda este anuncio en tu cuenta para verlo en el dashboard."
      : "Save this listing to your account to see it on your dashboard.";
  const shareLabel = lang === "es" ? "Compartir" : "Share";

  const browseMoreHref = moreInCategoryHref ?? `/clasificados/en-venta/results?lang=${lang}`;
  const browseMoreLabel =
    moreInCategoryLabel ?? (lang === "es" ? "Más en En Venta" : "More in For Sale");

  return (
    <div
      className={
        premiumBr
          ? `${brLuxuryPageClass} pb-28 text-[#2A2620] sm:pb-32`
          : "min-h-screen bg-[#D9D9D9] pb-24 text-[#111111]"
      }
    >
      <Navbar />
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section
        className={
          premiumBr
            ? `${brLuxuryInnerMaxClass} pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] pt-24 sm:pt-28 lg:pb-10`
            : "mx-auto max-w-6xl px-4 pt-28"
        }
      >
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href={backHref}
            className={
              premiumBr
                ? "rounded-full border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 px-4 py-2 text-sm font-semibold text-[#2A2620] shadow-sm transition hover:border-[#C9B46A]/45 hover:bg-white"
                : "rounded-full border border-black/10 bg-[#F5F5F5] px-4 py-2 text-sm font-semibold hover:bg-[#EFEFEF]"
            }
          >
            ← {lang === "es" ? "Volver" : "Back"}
          </Link>
          <Link
            href={browseMoreHref}
            className={
              premiumBr
                ? "text-sm font-semibold text-[#8A6F3A] underline decoration-[#C9B46A]/45 underline-offset-4 hover:text-[#6E5418]"
                : "text-sm font-semibold text-[#111111]/70 underline"
            }
          >
            {browseMoreLabel}
          </Link>
        </div>

        {premiumBr ? (
          <nav className="mb-8 flex flex-wrap items-center gap-2 text-sm text-[#5C5346]" aria-label="Breadcrumb">
            <Link href={appendLangToPath("/clasificados", lang)} className="transition hover:text-[#B8954A]">
              {lang === "es" ? "Clasificados" : "Classifieds"}
            </Link>
            <span className="text-[#C9B46A]/55">/</span>
            <Link href={appendLangToPath(BR_CATEGORY_HOME, lang)} className="transition hover:text-[#B8954A]">
              {lang === "es" ? "Bienes Raíces" : "Real estate"}
            </Link>
            <span className="text-[#C9B46A]/55">/</span>
            <span className="font-medium text-[#3D3630]">{lang === "es" ? "Anuncio" : "Listing"}</span>
          </nav>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <div className={premiumBr ? "overflow-hidden rounded-[22px] border border-[#E8DFD0]/80 shadow-[0_24px_64px_-32px_rgba(42,36,22,0.22)]" : ""}>
              <EnVentaMediaGallery urls={images} title={listing.title[lang]} />
            </div>
          </div>
          <div className={premiumBr ? "space-y-4 lg:col-span-5 lg:sticky lg:top-24 lg:self-start" : "space-y-4 lg:col-span-5"}>
            <div
              className={
                premiumBr
                  ? `${brLuxuryCardClass} p-6 ring-1 ring-[#C9B46A]/12`
                  : "rounded-2xl border border-black/10 bg-white p-5 shadow-sm"
              }
            >
              <p className={premiumBr ? brLuxuryOverlineClass : "hidden"}>
                {lang === "es" ? "Leonix · Bienes raíces" : "Leonix · Real estate"}
              </p>
              <div
                className={
                  premiumBr
                    ? "mt-2 text-3xl font-bold tracking-tight text-[#B8954A] sm:text-4xl"
                    : "text-3xl font-extrabold tracking-tight text-[#111111]"
                }
              >
                {listing.priceLabel[lang]}
              </div>
              {condition ? (
                <span className="mt-2 inline-flex rounded-full border border-[#C9B46A]/50 bg-[#FAF7EF] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#111111]">
                  {condition}
                </span>
              ) : null}
              <h1
                className={
                  premiumBr
                    ? `mt-4 ${brLuxurySerifHeadingClass} text-2xl leading-tight sm:text-[1.85rem]`
                    : "mt-3 text-2xl font-bold leading-tight text-[#111111]"
                }
              >
                {listing.title[lang]}
              </h1>
              <div className={premiumBr ? `mt-3 ${brLuxuryBodyMutedClass}` : "mt-2 text-sm text-[#111111]/75"}>
                <span className="break-words [overflow-wrap:anywhere]">{brLocationBlock?.display ?? listing.city}</span>
                {posted ? (
                  <>
                    <span className={premiumBr ? "text-[#C9B46A]/60" : "text-[#111111]/40"}> · </span>
                    {posted}
                  </>
                ) : null}
              </div>
              <p className="mt-3 rounded-lg border border-black/10 bg-[#F5F5F5] px-3 py-2 font-mono text-[11px] text-[#111111]/85">
                <span className="font-sans text-[10px] font-bold uppercase tracking-wide text-[#111111]/50">{listingIdLabel}</span>
                <span className="ml-2 select-all">{listing.id}</span>
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <LeonixLikeButton
                  listingId={listing.id}
                  ownerUserId={ownerId}
                  variant="small"
                  lang={lang}
                  category={surface === "en-venta" ? "en-venta" : "bienes-raices"}
                />
                <button
                  type="button"
                  title={saveHint}
                  disabled={!saveReady}
                  onClick={() => void onToggleSave()}
                  className={
                    premiumBr
                      ? "inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#E8DFD0] bg-white/95 px-3 py-2 text-xs font-bold text-[#2A2620] shadow-sm transition hover:border-[#C9B46A]/55 hover:bg-[#FFFCF7] disabled:opacity-50"
                      : "inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#C9B46A]/55 bg-[#FBF7EF] px-3 py-2 text-xs font-bold text-[#1E1810] shadow-sm transition hover:bg-[#F3EBDD] disabled:opacity-50"
                  }
                >
                  {saveLabel}
                </button>
                <button
                  type="button"
                  onClick={() => void onShareListing()}
                  className={
                    premiumBr
                      ? "inline-flex min-h-[40px] items-center rounded-xl border border-[#E8DFD0] bg-[#FFFCF7]/90 px-3 py-2 text-xs font-bold text-[#2A2620] transition hover:bg-white"
                      : "inline-flex min-h-[40px] items-center rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-bold text-[#1E1810] transition hover:bg-[#F5F5F5]"
                  }
                >
                  ↗️ {shareLabel}
                </button>
              </div>
              {fulfillmentLine ? (
                <p className="mt-3 text-sm font-medium text-[#111111]/85">
                  {lang === "es" ? "Entrega: " : "Fulfillment: "}
                  {fulfillmentLine}
                </p>
              ) : null}
            </div>

            {surface === "en-venta" ? (
              <div
                className="rounded-xl border border-black/10 bg-[#FAFAFA] px-3 py-2.5"
                role="note"
                aria-label={lang === "es" ? "Confianza y seguridad del comprador" : "Buyer trust and safety"}
              >
                <div className="mb-1.5">
                  <span className="inline-flex rounded-full border border-black/10 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#111111]/80">
                    {sellerTypeBadge}
                  </span>
                </div>
                <p className="text-xs font-semibold leading-snug text-[#111111]">{trustModeratedLine}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-[#111111]/75">{trustSafetyLine}</p>
              </div>
            ) : null}

            {!(sellerKind === "business" && negocioDisplay) ? (
              <div>
                <EnVentaSellerCard lang={lang} sellerKind={sellerKind} businessName={biz} />
                <EnVentaSellerPublicStats ownerId={ownerId} lang={lang} />
              </div>
            ) : null}

            {sellerKind === "business" && negocioDisplay ? (
              <RentasNegocioDesktopBusinessRail
                lang={lang}
                display={negocioDisplay}
                railTier={null}
                listing={{
                  contact_phone: resolvedContact.phoneForTel,
                  contact_email: resolvedContact.emailForMailto,
                }}
                onRequestInfo={scrollToContact}
                onScheduleVisit={scrollToContact}
              />
            ) : null}

            <div
              id="leonix-contact-actions"
              className={
                premiumBr
                  ? `${brLuxuryCardClass} p-6 ring-1 ring-[#C9B46A]/10`
                  : "rounded-2xl border border-black/10 bg-[#F5F5F5] p-4"
              }
            >
              <div className={premiumBr ? "text-sm font-bold text-[#1E1810]" : "text-sm font-bold text-[#111111]"}>
                {premiumBr
                  ? lang === "es"
                    ? "Contactar con el anunciante"
                    : "Contact the seller"
                  : lang === "es"
                    ? "Contactar al vendedor"
                    : "Contact the seller"}
              </div>
              <p
                className={
                  premiumBr
                    ? "mt-2 text-[11px] leading-relaxed text-[#5C5346]/85"
                    : "mt-2 text-[11px] leading-relaxed text-[#111111]/60"
                }
              >
                {premiumBr
                  ? lang === "es"
                    ? "Leonix conecta comprador y vendedor; no procesamos el pago del artículo. Prefiere lugares públicos para entregas o encuentros. Si ves algo ilegal o peligroso, usa «Reportar anuncio» abajo — el equipo revisa en /admin/reportes."
                    : "Leonix connects buyers and sellers; we do not process item payment. Prefer public meetups for exchanges. If you see something illegal or unsafe, use “Report listing” below—staff reviews the queue at /admin/reportes."
                  : lang === "es"
                    ? "Leonix no procesa el pago entre comprador y vendedor. Si algo se ve ilegal o inseguro, puedes usar «Reportar anuncio» abajo."
                    : "Leonix does not process payment between buyer and seller. If something looks illegal or unsafe, you can use “Report listing” below."}
              </p>
              {premiumBr ? (
                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button type="button" onClick={() => scrollToDescription()} className={`${brLuxuryBtnPrimaryClass} w-full text-[13px]`}>
                    {lang === "es" ? "Solicitar información" : "Request information"}
                  </button>
                  <button type="button" onClick={() => scrollToContact()} className={`${brLuxuryBtnSecondaryClass} w-full text-[13px]`}>
                    {lang === "es" ? "Programar visita" : "Schedule a tour"}
                  </button>
                </div>
              ) : null}
              <div className="mt-3">
                {listing.contact_phone || listing.contact_email ? (
                  premiumBr ? (
                    <div className="flex flex-wrap gap-2">
                      {phoneTel && gateAllowCall ? (
                        <a href={`tel:${phoneTel}`} className={`${BtnBase} ${primary}`}>
                          {lang === "es" ? "Llamar" : "Call"}
                        </a>
                      ) : null}
                      {phoneTel && gateAllowSms ? (
                        <a href={`sms:${phoneTel}`} className={`${BtnBase} ${secondary}`}>
                          {lang === "es" ? "Texto" : "Text"}
                        </a>
                      ) : null}
                      {showWhatsAppCta && waDigits ? (
                        <a
                          href={`https://wa.me/${waDigits}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${BtnBase} ${secondary}`}
                        >
                          WhatsApp
                        </a>
                      ) : null}
                      {email ? (
                        <button
                          type="button"
                          className={`${BtnBase} ${secondary}`}
                          onClick={() => setCorreoOpen(true)}
                        >
                          {lang === "es" ? "Enviar mensaje" : "Send message"}
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {evPrimaryContactKind === "wa" && waDigits ? (
                        <a
                          href={`https://wa.me/${waDigits}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-[#25D366] px-4 py-3 text-[15px] font-bold text-white shadow-sm transition hover:bg-[#20bd5a]"
                        >
                          WhatsApp
                        </a>
                      ) : null}
                      {evPrimaryContactKind === "email" && email ? (
                        <button
                          type="button"
                          onClick={() => setCorreoOpen(true)}
                          className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-yellow-500 px-4 py-3 text-[15px] font-bold text-black shadow-sm transition hover:bg-yellow-400"
                        >
                          {lang === "es" ? "Enviar mensaje" : "Send message"}
                        </button>
                      ) : null}
                      {evPrimaryContactKind === "tel" && phoneTel && gateAllowCall ? (
                        <a
                          href={`tel:${phoneTel}`}
                          className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-yellow-500 px-4 py-3 text-[15px] font-bold text-black shadow-sm transition hover:bg-yellow-400"
                        >
                          {lang === "es" ? "Llamar" : "Call"}
                        </a>
                      ) : null}
                      <div className="flex flex-wrap gap-2">
                        {phoneTel && evPrimaryContactKind !== "tel" && gateAllowCall ? (
                          <a
                            href={`tel:${phoneTel}`}
                            className="inline-flex min-h-[42px] items-center justify-center rounded-xl border border-black/15 bg-white px-4 py-2 text-sm font-semibold text-[#111111] hover:bg-[#EFEFEF]"
                          >
                            {lang === "es" ? "Llamar" : "Call"}
                          </a>
                        ) : null}
                        {phoneTel && gateAllowSms ? (
                          <a
                            href={`sms:${phoneTel}`}
                            className="inline-flex min-h-[42px] items-center justify-center rounded-xl border border-black/15 bg-white px-4 py-2 text-sm font-semibold text-[#111111] hover:bg-[#EFEFEF]"
                          >
                            {lang === "es" ? "Texto" : "Text"}
                          </a>
                        ) : null}
                        {showWhatsAppCta && waDigits && evPrimaryContactKind !== "wa" ? (
                          <a
                            href={`https://wa.me/${waDigits}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-[42px] items-center justify-center rounded-xl border border-black/15 bg-white px-4 py-2 text-sm font-semibold text-[#111111] hover:bg-[#EFEFEF]"
                          >
                            WhatsApp
                          </a>
                        ) : null}
                        {email && evPrimaryContactKind !== "email" ? (
                          <button
                            type="button"
                            onClick={() => setCorreoOpen(true)}
                            className="inline-flex min-h-[42px] items-center justify-center rounded-xl border border-black/15 bg-white px-4 py-2 text-sm font-semibold text-[#111111] hover:bg-[#EFEFEF]"
                          >
                            {lang === "es" ? "Enviar mensaje" : "Send message"}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  )
                ) : (
                  <p className="text-sm text-[#111111]/65">
                    {lang === "es" ? "El vendedor no mostró contacto público." : "The seller did not expose public contact."}
                  </p>
                )}
                {email ? (
                  <p className="mt-2 text-[11px] text-[#111111]/55">
                    {premiumBr
                      ? lang === "es"
                        ? "«Enviar mensaje» guarda la consulta en tu cuenta. Desde el mismo modal puedes abrir Gmail, Yahoo o tu correo."
                        : "“Send message” saves the inquiry to your account. From the same modal you can open Gmail, Yahoo, or your default mail app."
                      : lang === "es"
                        ? "«Enviar mensaje» guarda la consulta en tu cuenta Leonix. Desde el mismo modal puedes abrir Gmail, Yahoo o tu correo."
                        : "“Send message” saves the inquiry to your Leonix account. From the same modal you can open Gmail, Yahoo, or your default mail app."}
                  </p>
                ) : null}
                {showListingReport ? <LeonixInlineListingReport listingId={listing.id} lang={lang} /> : null}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-12 lg:gap-10">
          <div className="space-y-6 lg:col-span-8">
            {surface === "bienes-raices" ? <BrLiveFactsStrip detailPairs={listing.detailPairs} lang={lang} /> : null}
            {surface === "bienes-raices" && brLocationBlock ? (
              <section
                className={`${brLuxuryCardClass} p-6 sm:p-7`}
                aria-label={lang === "es" ? "Ubicación" : "Location"}
              >
                <h2 className={brLuxuryOverlineClass}>{lang === "es" ? "Ubicación" : "Location"}</h2>
                <p className={`mt-3 whitespace-pre-wrap ${brLuxuryBodyMutedClass} sm:text-[15px]`}>{brLocationBlock.display}</p>
                {brLocationBlock.mapsHref ? (
                  <a
                    href={brLocationBlock.mapsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-4 inline-flex min-h-[44px] items-center justify-center rounded-xl ${brLuxuryBtnSecondaryClass} px-4 text-sm font-semibold`}
                  >
                    {lang === "es" ? "Abrir en Google Maps" : "Open in Google Maps"}
                  </a>
                ) : null}
              </section>
            ) : null}
            {surface === "bienes-raices" && brGate12dHoaCard && brGate12dHoaCard.rows.length > 0 ? (
              <section
                className={`${brLuxuryCardClass} p-6 sm:p-7`}
                aria-label={brGate12dHoaCard.title}
              >
                <h2 className={brLuxuryOverlineClass}>{brGate12dHoaCard.title}</h2>
                <ul className={`mt-4 space-y-3 ${brLuxuryBodyMutedClass} sm:text-[15px]`}>
                  {brGate12dHoaCard.rows.map((r) => (
                    <li key={`${r.label}-${r.value}`} className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
                      <span className="font-semibold text-[#2A2620]">{r.label}:</span>
                      <span className="min-w-0 flex-1 whitespace-pre-wrap [overflow-wrap:anywhere]">{r.value}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            {surface === "bienes-raices" &&
            brGate12dOpenHouseCard &&
            (brGate12dOpenHouseCard.rows.length > 0 || brGate12dOpenHouseCard.virtualTourUrl) ? (
              <section
                className={`${brLuxuryCardClass} p-6 sm:p-7`}
                aria-label={brGate12dOpenHouseCard.title}
              >
                <h2 className={brLuxuryOverlineClass}>{brGate12dOpenHouseCard.title}</h2>
                {brGate12dOpenHouseCard.rows.length > 0 ? (
                  <ul className={`mt-4 space-y-3 ${brLuxuryBodyMutedClass} sm:text-[15px]`}>
                    {brGate12dOpenHouseCard.rows.map((r) => (
                      <li key={`${r.label}-${r.value}`} className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
                        <span className="font-semibold text-[#2A2620]">{r.label}:</span>
                        <span className="min-w-0 flex-1 whitespace-pre-wrap [overflow-wrap:anywhere]">{r.value}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {brGate12dOpenHouseCard.virtualTourUrl ? (
                  <a
                    href={brGate12dOpenHouseCard.virtualTourUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-4 inline-flex min-h-[44px] items-center justify-center rounded-xl ${brLuxuryBtnSecondaryClass} px-4 text-sm font-semibold`}
                  >
                    {lang === "es" ? "Abrir tour virtual" : "Open virtual tour"}
                  </a>
                ) : null}
              </section>
            ) : null}
            <section
              className={
                premiumBr
                  ? `${brLuxuryCardClass} p-6 sm:p-7`
                  : "rounded-2xl border border-black/10 bg-white p-5"
              }
            >
              <h2 className={premiumBr ? "text-xs font-bold uppercase tracking-[0.16em] text-[#8A6F3A]" : "text-sm font-bold text-[#111111]"}>
                {lang === "es" ? "Descripción" : "Description"}
              </h2>
              <p
                className={
                  premiumBr
                    ? `mt-4 whitespace-pre-wrap ${brLuxuryBodyMutedClass} sm:text-[15px]`
                    : "mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#111111]/85"
                }
              >
                {listing.blurb[lang]}
              </p>
            </section>
            <EnVentaItemSpecs lang={lang} rows={rows} />
          </div>
          <div className="lg:col-span-4">
            <EnVentaRelatedRail lang={lang} q={listing.title[lang].split(/\s+/).slice(0, 4).join(" ")} />
          </div>
        </div>
      </section>

      {premiumBr && phoneTel && gateAllowCall ? (
        <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-[#E8DFD0]/90 bg-[#FFFCF7]/95 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-18px_52px_-20px_rgba(42,36,22,0.22)] backdrop-blur-md lg:hidden">
          <a href={`tel:${phoneTel}`} className={`${brLuxuryBtnPrimaryClass} flex-1 text-center text-[13px]`}>
            {lang === "es" ? "Llamar" : "Call"}
          </a>
          <button type="button" onClick={() => scrollToContact()} className={`${brLuxuryBtnSecondaryClass} flex-1 text-[13px]`}>
            {lang === "es" ? "Contacto" : "Contact"}
          </button>
        </div>
      ) : null}

      {email ? (
        <EnVentaCorreoModal
          open={correoOpen}
          onClose={() => setCorreoOpen(false)}
          lang={lang}
          sellerName={sellerNameForModal}
          sellerEmail={email}
          listingTitle={listing.title[lang]}
          listingId={listing.id}
          sellerOwnerId={ownerId}
          listingIdDisplay={listing.id}
        />
      ) : null}
    </div>
  );
}
