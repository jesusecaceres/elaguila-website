"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { FiGlobe, FiMapPin, FiPhone } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import type { RestaurantDetailShellData } from "./restaurantDetailShellTypes";

const PREVIEW_CARD =
  "overflow-hidden rounded-[28px] border border-[#D8C2A0]/70 bg-[#FFFAF3] shadow-[0_18px_70px_-30px_rgba(42,36,22,0.25)] transition-shadow duration-300 hover:shadow-[0_22px_90px_-36px_rgba(42,36,22,0.32)]";

/** Landscape results card: wide overall, left media ~40%, right content ~60%, media height capped by aspect (not stretched to content). */
const GRID =
  "grid min-w-0 grid-cols-1 gap-0 md:grid-cols-[minmax(0,42%)_minmax(0,58%)] md:items-start";
const MEDIA = "min-w-0 bg-[#F5F0E8] p-2.5 md:p-4 md:pr-3";
const MEDIA_FRAME =
  "relative aspect-[16/9] w-full overflow-hidden rounded-[22px] bg-[#EFE7DA] md:aspect-[16/10]";

const CONTENT = "flex min-w-0 flex-col gap-2 px-4 pb-3 pt-3 md:gap-3 md:px-7 md:pb-6 md:pt-5";

const TITLE =
  "text-[22px] font-bold leading-[1.12] tracking-tight text-[#1F1A17] sm:text-[24px] md:text-[32px] lg:text-[34px]";
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

const SUMMARY = "text-xs leading-snug text-[#5A5148] md:text-sm md:leading-relaxed";

const FEATURE_ROW = "flex flex-wrap gap-2";
const FEATURE_CHIP =
  "inline-flex items-center rounded-full border border-[#E1CFB3] bg-[#F6EBDD] px-3 py-1.5 text-[12px] font-semibold text-[#2B241F]";

const CTA_ROW = "flex flex-wrap items-stretch gap-2.5 pt-1 md:items-center";
const CTA_BTN_BASE =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-bold shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B66AD]/40";
const CTA_PRIMARY = "border-[#B98D4C]/60 bg-[#B98D4C] text-white hover:bg-[#a77f46]";
const CTA_SECONDARY = "border-[#E1CFB3] bg-white text-[#2B241F] hover:bg-[#FFFCF7] hover:border-[#BEA98E]";

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

/** Only allow URLs Next/Image can load without inventing storage paths. */
function isRenderableLogoUrl(raw: string): boolean {
  const u = raw.trim();
  if (!u) return false;
  if (u.startsWith("/")) return true;
  if (u.startsWith("https://") || u.startsWith("http://")) return true;
  if (u.startsWith("blob:")) return true;
  return false;
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
  /** Results / landing published cards: clean hero, no star row, optional like badge. */
  presentation?: "preview" | "public_discovery";
  /** Net public likes (from `listing_analytics`); shown only when `presentation="public_discovery"` and value &gt; 0. */
  likesCount?: number;
  /** Results grid: primary navigation to public detail. */
  publicDetailHref?: string;
  publicDetailLabel?: string;
  discoveryRefineHref?: string;
  discoveryRefineLabel?: string;
}

/**
 * Restaurantes preview / results card (compact). Social actions live on the full detail shell only.
 */
const RESULT_PRIMARY_CTA =
  "flex min-h-[44px] w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#D4A574] to-[#b45309] text-xs font-bold text-[#FFFCF7] shadow-[0_8px_22px_-10px_rgba(180,83,9,0.45)] transition hover:brightness-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706] focus-visible:ring-offset-2 md:min-h-[48px] md:text-sm";

export function RestaurantePreviewCard({
  data,
  className = "",
  lang = "es",
  presentation = "preview",
  likesCount,
  publicDetailHref,
  publicDetailLabel,
  discoveryRefineHref,
  discoveryRefineLabel,
}: RestaurantePreviewCardProps) {
  const heroImage = data.heroImageUrl?.trim() || "";
  const logoCandidate = (data.businessLogo ?? "").trim();
  const logoUrl = isRenderableLogoUrl(logoCandidate) ? logoCandidate : "";
  const showLogoOnHero = presentation !== "public_discovery" && Boolean(heroImage && logoUrl);
  const trustRating = data.trustRating;
  const showTrustStars = presentation !== "public_discovery" && Boolean(trustRating);
  const showLikeBadge =
    presentation === "public_discovery" && typeof likesCount === "number" && likesCount > 0;

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
    return Array.from(new Set(chips)).slice(0, 20);
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

  const ctasDesktop = useMemo(() => {
    const want = new Set(["call", "website", "directions", "whatsapp"]);
    const filtered = (data.primaryCtas ?? []).filter((c) => want.has(c.key) && c.href?.trim() && c.enabled !== false);
    const byKey = new Map<string, (typeof filtered)[number]>();
    for (const c of filtered) {
      if (!byKey.has(c.key)) byKey.set(c.key, c);
    }
    const order = ["call", "website", "directions", "whatsapp"] as const;
    return order.map((k) => byKey.get(k)).filter(Boolean) as (typeof filtered)[number][];
  }, [data.primaryCtas]);

  /** Mobile results: Llamar + Direcciones only (no web / WhatsApp). */
  const ctasMobile = useMemo(() => {
    const want = new Set(["call", "directions"]);
    const filtered = (data.primaryCtas ?? []).filter((c) => want.has(c.key) && c.href?.trim() && c.enabled !== false);
    const byKey = new Map<string, (typeof filtered)[number]>();
    for (const c of filtered) {
      if (!byKey.has(c.key)) byKey.set(c.key, c);
    }
    const order = ["call", "directions"] as const;
    return order.map((k) => byKey.get(k)).filter(Boolean) as (typeof filtered)[number][];
  }, [data.primaryCtas]);

  return (
    <div className={`${PREVIEW_CARD} w-full min-w-0 ${className}`}>
      <div className={GRID}>
        <div className={MEDIA}>
          <div className={MEDIA_FRAME}>
            {heroImage ? (
              <Image
                src={heroImage}
                alt={data.heroImageAlt || data.businessName}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 42vw, 520px"
                priority={false}
              />
            ) : (
              <div className="flex h-full min-h-[140px] w-full items-center justify-center">
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/5">
                    <FiMapPin className="h-6 w-6 text-[#8B7E70]" aria-hidden />
                  </div>
                  <p className="text-xs font-semibold text-[#8B7E70]">{lang === "en" ? "No image yet" : "Sin imagen"}</p>
                </div>
              </div>
            )}
            {showLogoOnHero ? (
              <div className="pointer-events-none absolute right-3 top-12 z-[2] flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-white/40 bg-white/95 shadow-md ring-1 ring-black/5 md:h-14 md:w-14 md:top-14">
                <Image
                  src={logoUrl}
                  alt={`${data.businessName} logo`}
                  width={56}
                  height={56}
                  className="max-h-full max-w-full object-contain p-1"
                  sizes="56px"
                />
              </div>
            ) : null}
            <div
              className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-black/55 via-transparent to-transparent md:hidden"
              aria-hidden
            />
            <div className="absolute inset-x-0 bottom-0 z-[3] flex items-end justify-between gap-2 px-2 pb-2 pt-8 md:hidden">
              {quick.neighborhood ? (
                <div className="min-w-0 max-w-[58%] rounded-md border border-white/25 bg-black/45 px-2 py-1 text-[10px] font-semibold leading-tight text-white shadow-sm backdrop-blur-sm">
                  <span className="block truncate">{quick.neighborhood}</span>
                </div>
              ) : (
                <span className="min-w-0 max-w-[58%]" aria-hidden />
              )}
              <span
                className={`shrink-0 rounded-md border px-2 py-1 text-[10px] font-semibold shadow-sm backdrop-blur-sm ${
                  data.hoursPreview.status === "open"
                    ? "border-emerald-300/40 bg-emerald-950/75 text-emerald-50"
                    : data.hoursPreview.status === "closed"
                      ? "border-rose-300/40 bg-rose-950/80 text-rose-50"
                      : "border-white/30 bg-black/55 text-white"
                }`}
              >
                <span className="line-clamp-2 text-left leading-snug">
                  {data.hoursPreview.statusLine?.trim() ||
                    (lang === "en" ? "Hours" : "Horario")}
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className={CONTENT}>
          <div className="min-w-0 space-y-1.5 md:space-y-3">
            {showTrustStars && trustRating ? (
              <div className="flex items-center gap-2">
                <StarRow rating={trustRating.average} />
                <span className="text-xs font-semibold text-[#8B7E70]">({trustRating.count})</span>
              </div>
            ) : null}

            <h2 className={TITLE}>{data.businessName}</h2>

            {showLikeBadge ? (
              <p className="text-sm font-semibold text-[#8B5E34]" aria-label={lang === "en" ? "Likes" : "Me gusta"}>
                ❤️ {likesCount}{" "}
                {lang === "en"
                  ? likesCount === 1
                    ? "like"
                    : "likes"
                  : "me gusta"}
              </p>
            ) : null}

            {identityChips.length ? (
              <>
                <div
                  className={`${CHIP_ROW} md:hidden`}
                  aria-label={lang === "en" ? "Cuisine and type" : "Cocina y tipo"}
                >
                  {identityChips.slice(0, 3).map((chip) => (
                    <span
                      key={chip}
                      className="inline-flex items-center rounded-full border border-[#E1CFB3] bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-[#2B241F] shadow-sm"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
                <div
                  className={`${CHIP_ROW} hidden md:flex`}
                  aria-label={lang === "en" ? "Cuisine and type" : "Cocina y tipo"}
                >
                  {identityChips.slice(0, 6).map((chip) => (
                    <span key={chip} className={CHIP}>
                      {chip}
                    </span>
                  ))}
                </div>
              </>
            ) : null}

            <div className={`${META_ROW} hidden md:flex`}>
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
              <>
                <a
                  href={addressHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full min-w-0 items-center gap-1.5 py-0.5 text-[12px] font-semibold leading-snug text-[#3D3630] md:hidden"
                  aria-label={lang === "en" ? "Open address in maps" : "Abrir dirección en mapas"}
                >
                  <FiMapPin className="h-3.5 w-3.5 shrink-0 text-[#8B7E70]" aria-hidden />
                  <span className="min-w-0 truncate">{addressQuery}</span>
                </a>
                <a
                  href={addressHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${ADDRESS_LINK} hidden md:inline-flex`}
                  aria-label={lang === "en" ? "Open address in maps" : "Abrir dirección en mapas"}
                >
                  <FiMapPin className="h-4 w-4 shrink-0 text-[#8B7E70]" aria-hidden />
                  <span className="min-w-0 truncate">{addressQuery}</span>
                  <span className="ml-auto text-xs font-bold text-[#8B7E70] group-hover:text-[#5A5148]">›</span>
                </a>
              </>
            ) : null}

            {summary ? (
              <>
                <p className={`${SUMMARY} line-clamp-2 md:hidden`}>{summary}</p>
                <p className={`${SUMMARY} hidden md:block`}>
                  {summary.length > 180 ? `${summary.slice(0, 180).trim()}…` : summary}
                </p>
              </>
            ) : null}

            {features.length ? (
              <>
                <div className="relative md:hidden" aria-label={lang === "en" ? "Services and features" : "Servicios y características"}>
                  <div className="-mx-1 flex gap-1.5 overflow-x-auto overflow-y-hidden px-1 pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]">
                    {features.map((f) => (
                      <span
                        key={f}
                        className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full border border-[#E1CFB3] bg-[#F6EBDD] px-2 py-0.5 text-[10px] font-semibold text-[#2B241F]"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                  <div
                    className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-9 bg-gradient-to-l from-[#FFFAF3] to-transparent"
                    aria-hidden
                  />
                </div>
                <div
                  className={`${FEATURE_ROW} hidden md:flex`}
                  aria-label={lang === "en" ? "Services and features" : "Servicios y características"}
                >
                  {features.slice(0, 5).map((f) => (
                    <span key={f} className={FEATURE_CHIP}>
                      {f}
                    </span>
                  ))}
                  {features.length > 5 ? (
                    <span className={FEATURE_CHIP}>+{features.length - 5}</span>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>

          {publicDetailHref?.trim() ? (
            <div className="flex min-w-0 flex-col gap-1 md:gap-1.5">
              <Link href={publicDetailHref} className={RESULT_PRIMARY_CTA}>
                {publicDetailLabel?.trim() || (lang === "en" ? "View full listing" : "Ver anuncio completo")}
              </Link>
              {discoveryRefineHref?.trim() && discoveryRefineLabel?.trim() ? (
                <Link
                  href={discoveryRefineHref}
                  className="text-center text-[10px] font-semibold text-[#8B5E34] underline-offset-4 hover:underline md:text-xs"
                >
                  {discoveryRefineLabel}
                </Link>
              ) : null}
            </div>
          ) : null}

          {ctasMobile.length ? (
            <div className="grid grid-cols-2 gap-2 pt-0.5 md:hidden" aria-label={lang === "en" ? "Actions" : "Acciones"}>
              {ctasMobile.map((cta) => {
                const n = ctasMobile.length;
                const alone = n === 1;
                const primary = cta.key === "directions";
                const Icon = cta.key === "call" ? FiPhone : FiMapPin;
                return (
                  <div key={cta.key} className={alone ? "col-span-2 flex justify-center" : undefined}>
                    <a
                      href={cta.href}
                      className={[
                        CTA_BTN_BASE,
                        primary ? CTA_PRIMARY : CTA_SECONDARY,
                        "min-h-[40px] px-3 py-2 text-xs",
                        alone ? "w-full max-w-[260px]" : "w-full",
                      ].join(" ")}
                      {...(cta.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span className="min-w-0 truncate">{cta.label}</span>
                    </a>
                  </div>
                );
              })}
            </div>
          ) : null}

          {ctasDesktop.length ? (
            <div className={`${CTA_ROW} hidden pt-0.5 md:flex`} aria-label={lang === "en" ? "Actions" : "Acciones"}>
              {ctasDesktop.map((cta) => {
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
        </div>
      </div>
    </div>
  );
}
