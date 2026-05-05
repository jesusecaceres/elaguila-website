"use client";

import Image from "next/image";
import { useMemo } from "react";
import { FiGlobe, FiMapPin, FiPhone } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { LeonixSaveButton } from "@/app/components/clasificados/analytics/LeonixSaveButton";
import { LeonixLikeButton } from "@/app/components/clasificados/analytics/LeonixLikeButton";
import { LeonixShareButton } from "@/app/components/clasificados/analytics/LeonixShareButton";
import type { RestaurantDetailShellData } from "./restaurantDetailShellTypes";

const PREVIEW_CARD =
  "overflow-hidden rounded-[28px] border border-[#D8C2A0]/70 bg-[#FFFAF3] shadow-[0_18px_70px_-30px_rgba(42,36,22,0.25)] transition-shadow duration-300 hover:shadow-[0_22px_90px_-36px_rgba(42,36,22,0.32)]";

const GRID = "grid gap-0 md:grid-cols-[360px_1fr]";
const MEDIA = "relative h-[240px] w-full bg-[#F5F0E8] md:h-full";
const MEDIA_INNER = "absolute inset-0 p-4 md:p-5";
const MEDIA_FRAME = "relative h-full w-full overflow-hidden rounded-[22px] bg-[#EFE7DA]";

const CONTENT = "flex min-w-0 flex-col gap-5 px-5 pb-6 pt-5 md:px-6 md:pb-7 md:pt-6";

const TITLE = "text-[28px] font-bold leading-[1.1] tracking-tight text-[#1F1A17] md:text-[40px]";
const CHIP_ROW = "flex flex-wrap gap-2";
const CHIP =
  "inline-flex items-center rounded-full border border-[#E1CFB3] bg-white/70 px-3 py-1.5 text-[12px] font-semibold text-[#2B241F] shadow-sm";

const META_ROW = "flex flex-wrap items-center gap-2.5 text-[13px] font-semibold text-[#5A5148]";
const META_PILL =
  "inline-flex items-center gap-2 rounded-full border border-[#E1CFB3] bg-[#FFFDF7] px-3 py-1.5 shadow-sm";
const STATUS_OPEN = "bg-emerald-50 text-emerald-900 border-emerald-200/80";
const STATUS_CLOSED = "bg-rose-50 text-rose-900 border-rose-200/80";

const ADDRESS_LINK =
  "group inline-flex min-h-[44px] w-full items-center gap-2 rounded-2xl border border-[#E1CFB3] bg-white/80 px-4 py-3 text-sm font-semibold text-[#2B241F] shadow-sm transition hover:bg-white hover:border-[#BEA98E] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B66AD]/40";

const SUMMARY = "text-sm leading-relaxed text-[#5A5148]";

const FEATURE_ROW = "flex flex-wrap gap-2";
const FEATURE_CHIP =
  "inline-flex items-center rounded-full border border-[#E1CFB3] bg-[#F6EBDD] px-3 py-1.5 text-[12px] font-semibold text-[#2B241F]";

const CTA_ROW = "flex flex-wrap gap-2.5 pt-1";
const CTA_BTN_BASE =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-bold shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B66AD]/40";
const CTA_PRIMARY = "border-[#B98D4C]/60 bg-[#B98D4C] text-white hover:bg-[#a77f46]";
const CTA_SECONDARY = "border-[#E1CFB3] bg-white text-[#2B241F] hover:bg-[#FFFCF7] hover:border-[#BEA98E]";

const ENGAGEMENT_SECTION = "mt-1 border-t border-[#D8C2A0]/35 pt-5";

function cleanOtherLabel(raw: string): string {
  const t = String(raw ?? "").trim();
  if (!t) return "";
  const lower = t.toLowerCase();
  if (lower === "otro" || lower === "other") return "";
  if (lower.startsWith("otro:") || lower.startsWith("other:")) {
    return t.split(":").slice(1).join(":").trim();
  }
  if (lower.startsWith("otro ")) return t.replace(/^otro\s+/i, "").trim();
  if (lower.startsWith("other ")) return t.replace(/^other\s+/i, "").trim();
  return t;
}

function mapsSearchHref(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" role="img" aria-label={`${rating.toFixed(1)} de 5 estrellas`}>
      {Array.from({ length: 5 }, (_, i) => {
        const v = rating - i;
        const pct = Math.round(Math.min(1, Math.max(0, v)) * 100);
        return (
          <span key={i} className="relative h-4 w-[1.05em] text-[15px] leading-none">
            <span className="absolute text-white/35" aria-hidden>★</span>
            <span className="absolute overflow-hidden text-[#f0d78c]" style={{ width: `${pct}%` }} aria-hidden>★</span>
          </span>
        );
      })}
    </div>
  );
}

interface RestaurantePreviewCardProps {
  data: RestaurantDetailShellData;
  className?: string;
  lang?: "es" | "en";
  showEngagementMetrics?: boolean;
  listingId?: string;
}

/**
 * Premium Leonix Restaurantes Preview Card
 * Follows LEONIX_PREVIEW_CARD_CONTRACT.md with engagement metrics integration
 */
export function RestaurantePreviewCard({ 
  data, 
  className = "", 
  lang = "es",
  showEngagementMetrics = true,
  listingId
}: RestaurantePreviewCardProps) {
  const heroImage = data.heroImageUrl?.trim() || "";

  const identityChips = useMemo(() => {
    const chips: string[] = [];
    if (data.cuisineTypeLine?.trim()) {
      for (const raw of data.cuisineTypeLine.split(" · ")) {
        const cleaned = cleanOtherLabel(raw);
        if (cleaned) chips.push(cleaned);
      }
    }
    if (data.taxonomyChips?.length) {
      for (const t of data.taxonomyChips) {
        const cleaned = cleanOtherLabel(t.label);
        if (cleaned) chips.push(cleaned);
      }
    }
    return Array.from(new Set(chips)).slice(0, 6);
  }, [data.cuisineTypeLine, data.taxonomyChips]);

  const quick = useMemo(() => {
    const byKey = new Map<string, string>();
    for (const item of data.quickInfo ?? []) {
      const v = cleanOtherLabel(item.value);
      if (v) byKey.set(item.key, v);
    }
    return {
      neighborhood: byKey.get("neighborhood") || "",
      price: byKey.get("price") || "",
      service: byKey.get("service") || "",
    };
  }, [data.quickInfo]);

  const features = useMemo(() => {
    const serviceChips: string[] = [];
    if (quick.service) {
      for (const raw of quick.service.split(" · ")) {
        const cleaned = cleanOtherLabel(raw);
        if (cleaned) serviceChips.push(cleaned);
      }
    }
    const unique = Array.from(new Set(serviceChips));
    return unique;
  }, [quick.service]);

  const addressQuery = (data.contact?.mapsSearchQuery || data.contact?.addressLine1 || "").trim();
  const addressHref = addressQuery ? mapsSearchHref(addressQuery) : "";

  const summary = (data.summaryShort || data.aboutBody || "").trim();

  const ctas = useMemo(() => {
    const want = new Set(["call", "website", "directions", "whatsapp"]);
    const filtered = (data.primaryCtas ?? []).filter((c) => want.has(c.key) && c.href?.trim() && c.enabled !== false);
    const byKey = new Map<string, (typeof filtered)[number]>();
    for (const c of filtered) {
      if (!byKey.has(c.key)) byKey.set(c.key, c);
    }
    const order = ["call", "website", "directions", "whatsapp"] as const;
    return order.map((k) => byKey.get(k)).filter(Boolean) as (typeof filtered)[number][];
  }, [data.primaryCtas]);

  return (
    <div className={`${PREVIEW_CARD} ${className}`}>
      <div className={GRID}>
        <div className={MEDIA}>
          <div className={MEDIA_INNER}>
            <div className={MEDIA_FRAME}>
              {heroImage ? (
                <Image
                  src={heroImage}
                  alt={data.heroImageAlt || data.businessName}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 360px"
                  priority={false}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/5">
                      <FiMapPin className="h-6 w-6 text-[#8B7E70]" aria-hidden />
                    </div>
                    <p className="text-xs font-semibold text-[#8B7E70]">{lang === "en" ? "No image yet" : "Sin imagen"}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={CONTENT}>
          <div className="min-w-0 space-y-3">
            {data.trustRating ? (
              <div className="flex items-center gap-2">
                <StarRow rating={data.trustRating.average} />
                <span className="text-xs font-semibold text-[#8B7E70]">({data.trustRating.count})</span>
              </div>
            ) : null}

            <h2 className={TITLE}>{data.businessName}</h2>

            {identityChips.length ? (
              <div className={CHIP_ROW} aria-label={lang === "en" ? "Cuisine and type" : "Cocina y tipo"}>
                {identityChips.map((chip) => (
                  <span key={chip} className={CHIP}>
                    {chip}
                  </span>
                ))}
              </div>
            ) : null}

            <div className={META_ROW}>
              <span
                className={[
                  META_PILL,
                  data.hoursPreview.status === "open" ? STATUS_OPEN : data.hoursPreview.status === "closed" ? STATUS_CLOSED : "",
                ].join(" ")}
              >
                <span className="h-2 w-2 rounded-full bg-current opacity-70" aria-hidden />
                <span className="min-w-0 truncate">
                  {data.hoursPreview.statusLine?.trim() || (lang === "en" ? "Hours" : "Horario")}
                </span>
              </span>

              {quick.neighborhood ? <span className={META_PILL}>{quick.neighborhood}</span> : null}
              {quick.price ? <span className={META_PILL}>{quick.price}</span> : null}
            </div>

            {addressQuery ? (
              <a
                href={addressHref}
                target="_blank"
                rel="noopener noreferrer"
                className={ADDRESS_LINK}
                aria-label={lang === "en" ? "Open address in maps" : "Abrir dirección en mapas"}
              >
                <FiMapPin className="h-4 w-4 shrink-0 text-[#8B7E70]" aria-hidden />
                <span className="min-w-0 truncate">{addressQuery}</span>
                <span className="ml-auto text-xs font-bold text-[#8B7E70] group-hover:text-[#5A5148]">›</span>
              </a>
            ) : null}

            {summary ? (
              <p className={SUMMARY}>
                {summary.length > 180 ? `${summary.slice(0, 180).trim()}…` : summary}
              </p>
            ) : null}

            {features.length ? (
              <div className={FEATURE_ROW} aria-label={lang === "en" ? "Services and features" : "Servicios y características"}>
                {features.slice(0, 5).map((f) => (
                  <span key={f} className={FEATURE_CHIP}>
                    {f}
                  </span>
                ))}
                {features.length > 5 ? (
                  <span className={FEATURE_CHIP}>+{features.length - 5}</span>
                ) : null}
              </div>
            ) : null}
          </div>

          {ctas.length ? (
            <div className={CTA_ROW} aria-label={lang === "en" ? "Actions" : "Acciones"}>
              {ctas.map((cta) => {
                const primary = cta.key === "directions";
                const Icon =
                  cta.key === "call" ? FiPhone : cta.key === "website" ? FiGlobe : cta.key === "whatsapp" ? FaWhatsapp : FiMapPin;
                return (
                  <a
                    key={cta.key}
                    href={cta.href}
                    className={[CTA_BTN_BASE, primary ? CTA_PRIMARY : CTA_SECONDARY].join(" ")}
                    {...(cta.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  >
                    <Icon className="h-[1.05rem] w-[1.05rem] shrink-0" aria-hidden />
                    {cta.label}
                  </a>
                );
              })}
            </div>
          ) : null}

          {showEngagementMetrics && listingId ? (
            <div className={ENGAGEMENT_SECTION}>
              <div className="flex items-center gap-3">
                <LeonixLikeButton listingId={listingId} ownerUserId={data.id} variant="small" lang={lang} />
                <LeonixSaveButton listingId={listingId} ownerUserId={data.id} variant="small" lang={lang} />
                <LeonixShareButton
                  listingId={listingId}
                  ownerUserId={data.id}
                  listingTitle={data.businessName}
                  listingUrl=""
                  variant="small"
                  lang={lang}
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
