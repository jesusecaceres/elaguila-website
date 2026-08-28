"use client";

import { useState } from "react";
import Image from "next/image";
import { FiClock, FiMapPin } from "react-icons/fi";
import { LeonixLikeButton } from "@/app/components/clasificados/analytics/LeonixLikeButton";
import { LeonixShareButton } from "@/app/components/clasificados/analytics/LeonixShareButton";
import {
  restaurantesGlobalLikeRecorder,
  restaurantesGlobalListingFromRow,
  restaurantesGlobalShareRecorder,
} from "../lib/recordRestaurantesGlobalAnalytics";
import type { RestaurantDetailShellData } from "./restaurantDetailShellTypes";

/** Gate C13 — same warm-brown Restaurant identity, moderately lighter/softer gradient endpoints
 * (was #1E1814/#3B2117/#2A2620). R-003: colors are now the named `--lx-restaurantes-*` category
 * tokens (`app/globals.css`) instead of arbitrary hardcoded hex literals — the exact same values,
 * not a redesign. */
const HEADER_SHELL =
  "relative overflow-hidden rounded-xl border-2 border-[color:var(--lx-restaurantes-header-border)] bg-gradient-to-br from-[color:var(--lx-restaurantes-header-bg-1)] via-[color:var(--lx-restaurantes-header-bg-2)] to-[color:var(--lx-restaurantes-header-bg-3)] text-[color:var(--lx-cta-light)] shadow-[0_12px_40px_rgba(30,24,16,0.18)] sm:rounded-2xl";

const LOGO_FRAME =
  "relative mx-auto h-[5.25rem] w-[5.25rem] shrink-0 overflow-hidden rounded-lg border-[2.5px] border-[color:var(--lx-gold)]/85 bg-[color:var(--lx-cta-light)] p-1.5 shadow-[0_8px_24px_rgba(201,168,74,0.22)] sm:h-24 sm:w-24 lg:mx-0 lg:h-[5.5rem] lg:w-[5.5rem]";

const HERO_IMAGE_FRAME =
  "relative hidden w-full overflow-hidden lg:block lg:max-h-[300px] lg:min-h-[200px] lg:flex-[1.15] lg:rounded-xl lg:border lg:border-[color:var(--lx-gold)]/35";

const CHIP =
  "inline-flex max-w-full shrink-0 items-center rounded-md border border-[color:var(--lx-gold)]/45 bg-[color:var(--lx-cta-light)]/12 px-2.5 py-1 text-[11px] font-semibold leading-tight text-[color:var(--lx-cta-light)] sm:text-xs";

export function RestauranteProfileHeader({
  data,
  lang = "es",
  listingId = "",
  listingSourceId,
  listingSlug,
  listingShareUrl,
  analyticsOwnerUserId,
  persistListingEngagement = true,
}: {
  data: RestaurantDetailShellData;
  lang?: "es" | "en";
  listingId?: string;
  listingSourceId?: string;
  listingSlug?: string;
  listingShareUrl?: string;
  analyticsOwnerUserId?: string | null;
  persistListingEngagement?: boolean;
}) {
  const ownerUid = (analyticsOwnerUserId ?? "").trim() || undefined;
  const listingKey = (listingId ?? "").trim() || data.id;
  const sourceId = (listingSourceId ?? "").trim();
  const allowEngagement = persistListingEngagement && Boolean(sourceId);
  const slug = (listingSlug ?? "").trim();
  const globalListing =
    sourceId && restaurantesGlobalListingFromRow({
      id: sourceId,
      slug: slug || undefined,
      leonix_ad_id: /^REST-/i.test(listingKey) ? listingKey : null,
    });
  const open = data.hoursPreview.status === "open";

  const chips: string[] = [];
  if (data.cuisineTypeLine) {
    for (const raw of data.cuisineTypeLine.split(" · ")) {
      const t = raw.trim();
      if (t) chips.push(t);
    }
  }
  if (data.taxonomyChips?.length) {
    for (const tc of data.taxonomyChips) {
      const t = tc.label?.trim();
      if (t && !chips.includes(t)) chips.push(t);
    }
  }

  const neighborhoodDisplay = data.quickInfo?.find((item) => item.key === "neighborhood")?.value?.trim() || "";
  const locationLine =
    data.contactHub?.location?.addressLine1?.trim() ||
    neighborhoodDisplay ||
    data.contactHub?.location?.addressLine2?.trim() ||
    "";

  const heroImage = data.heroImageUrl?.trim() ?? "";

  // Gate C12 — square/compact marks fill the frame edge to edge (no forced padding shrinking a
  // logo that's already the right shape); wide/tall marks keep the padded contain treatment so
  // nothing is destructively cropped. Ratio is only known once the image has actually loaded.
  const [logoAspectRatio, setLogoAspectRatio] = useState<number | null>(null);
  const logoIsCompact = logoAspectRatio != null && logoAspectRatio >= 0.8 && logoAspectRatio <= 1.25;

  return (
    <section className={HEADER_SHELL} aria-label={lang === "en" ? "Restaurant profile" : "Perfil del restaurante"}>
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[color:var(--lx-gold)]/55 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-[0.12]"
        style={{ background: "radial-gradient(circle, var(--lx-gold) 0%, transparent 70%)" }}
        aria-hidden
      />

      <div className="relative px-4 py-5 sm:px-6 sm:py-6 lg:px-7 lg:py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-6">
          {heroImage ? (
            <div className={HERO_IMAGE_FRAME}>
              <div className="relative aspect-[16/10] h-full min-h-[200px] w-full lg:aspect-auto lg:min-h-[220px]">
                <Image
                  src={heroImage}
                  alt={data.heroImageAlt || data.businessName}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 42vw, 0px"
                  priority
                  unoptimized={heroImage.startsWith("data:") || heroImage.startsWith("blob:")}
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[color:var(--lx-restaurantes-header-overlay)]/50 via-transparent to-transparent" aria-hidden />
              </div>
            </div>
          ) : null}

          <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
          <div className={`${LOGO_FRAME} ${logoIsCompact ? "!p-0.5" : ""}`}>
            {data.businessLogo?.trim() ? (
              <Image
                src={data.businessLogo}
                alt=""
                width={96}
                height={96}
                className="h-full w-full object-contain"
                unoptimized={data.businessLogo.startsWith("data:") || data.businessLogo.startsWith("blob:")}
                onLoad={(e) => {
                  const img = e.currentTarget;
                  if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                    setLogoAspectRatio(img.naturalWidth / img.naturalHeight);
                  }
                }}
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center rounded-md bg-[color:var(--lx-restaurantes-initial-bg)] text-2xl font-bold text-[color:var(--lx-restaurantes-initial-text)]"
                aria-hidden
              >
                {(data.businessName?.trim() || "R").charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--lx-cta-light)]/65">
              {lang === "en" ? "Restaurant" : "Restaurante"}
            </p>
            <h1 className="mt-1 font-serif text-2xl font-semibold leading-tight tracking-tight text-[color:var(--lx-cta-light)] sm:text-3xl lg:text-[2.15rem]">
              {data.businessName}
            </h1>

            {/* Global Business Hub OS — REVIEWS MASTER RULE (Level A, link-only): removed. This
                rendered owner-typed trustRating (historical externalRatingValue/externalReviewCount)
                as a gold-star provider-style aggregate rating. No provider API exists; the DB
                field is untouched, it simply no longer feeds this render path. */}

            {chips.length > 0 ? (
              <div className="mt-3 flex flex-wrap justify-center gap-1.5 sm:justify-start">
                {chips.slice(0, 6).map((chip) => (
                  <span key={chip} className={CHIP}>
                    <span className="line-clamp-2 break-words">{chip}</span>
                  </span>
                ))}
              </div>
            ) : null}

            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs sm:justify-start sm:text-sm">
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-semibold ${
                  open
                    ? "bg-[color:var(--lx-restaurantes-open-bg)]/35 text-[color:var(--lx-restaurantes-open-text)] ring-1 ring-[color:var(--lx-restaurantes-open-bg)]/50"
                    : "bg-[color:var(--lx-cta-light)]/10 text-[color:var(--lx-cta-light)]/85 ring-1 ring-[color:var(--lx-cta-light)]/20"
                }`}
              >
                <FiClock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {data.hoursPreview.statusLine}
              </span>
              {locationLine ? (
                <span className="inline-flex max-w-full items-start gap-1 text-[color:var(--lx-cta-light)]/85">
                  <FiMapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--lx-gold)]" aria-hidden />
                  <span className="min-w-0 break-words text-left">{locationLine}</span>
                </span>
              ) : null}
            </div>

            {neighborhoodDisplay && neighborhoodDisplay !== locationLine ? (
              <p className="mt-1.5 text-xs text-[color:var(--lx-cta-light)]/70">{neighborhoodDisplay}</p>
            ) : null}
          </div>

          {listingKey ? (
            <div className="flex shrink-0 flex-row justify-center gap-2 sm:flex-col sm:justify-start">
              <LeonixLikeButton
                listingId={listingKey}
                ownerUserId={ownerUid}
                variant="small"
                lang={lang}
                category="restaurantes"
                persistEngagement={allowEngagement}
                recordLikeEvent={
                  globalListing ? restaurantesGlobalLikeRecorder(globalListing) : undefined
                }
                className="!border-[color:var(--lx-gold)]/40 !bg-[color:var(--lx-cta-light)]/95 !text-[color:var(--lx-restaurantes-header-overlay)]"
              />
              <LeonixShareButton
                listingId={listingKey}
                ownerUserId={ownerUid}
                listingTitle={data.businessName}
                listingUrl={listingShareUrl}
                variant="small"
                lang={lang}
                category="restaurantes"
                directNativeShare
                persistEngagement={allowEngagement}
                recordShareEvent={
                  globalListing ? restaurantesGlobalShareRecorder(globalListing, "detail_share") : undefined
                }
                className="[&>button]:!border-[color:var(--lx-gold)]/40 [&>button]:!bg-[color:var(--lx-cta-light)]/95 [&>button]:!text-[color:var(--lx-restaurantes-header-overlay)]"
              />
            </div>
          ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
