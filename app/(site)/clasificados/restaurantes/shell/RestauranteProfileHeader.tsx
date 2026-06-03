"use client";

import Image from "next/image";
import { FiClock, FiMapPin, FiStar } from "react-icons/fi";
import { LeonixLikeButton } from "@/app/components/clasificados/analytics/LeonixLikeButton";
import { LeonixSaveButton } from "@/app/components/clasificados/analytics/LeonixSaveButton";
import { LeonixShareButton } from "@/app/components/clasificados/analytics/LeonixShareButton";
import type { RestaurantDetailShellData } from "./restaurantDetailShellTypes";

const HEADER_SHELL =
  "relative overflow-hidden rounded-xl border-2 border-[#E8D9C4] bg-gradient-to-br from-[#1E1814] via-[#3B2117] to-[#2A2620] text-[#FFFCF7] shadow-[0_12px_40px_rgba(30,24,16,0.18)] sm:rounded-2xl";

const LOGO_FRAME =
  "relative mx-auto h-[5.25rem] w-[5.25rem] shrink-0 overflow-hidden rounded-lg border-[2.5px] border-[#C9A84A]/85 bg-[#FFFCF7] p-1.5 shadow-[0_8px_24px_rgba(201,168,74,0.22)] sm:h-24 sm:w-24 lg:mx-0";

const CHIP =
  "inline-flex max-w-full shrink-0 items-center rounded-md border border-[#C9A84A]/45 bg-[#FFFCF7]/12 px-2.5 py-1 text-[11px] font-semibold leading-tight text-[#FFFCF7] sm:text-xs";

export function RestauranteProfileHeader({
  data,
  lang = "es",
  listingId = "",
  listingShareUrl,
  analyticsOwnerUserId,
  persistListingEngagement = true,
}: {
  data: RestaurantDetailShellData;
  lang?: "es" | "en";
  listingId?: string;
  listingShareUrl?: string;
  analyticsOwnerUserId?: string | null;
  persistListingEngagement?: boolean;
}) {
  const ownerUid = (analyticsOwnerUserId ?? "").trim() || undefined;
  const listingKey = (listingId ?? "").trim() || data.id;
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

  return (
    <section className={HEADER_SHELL} aria-label={lang === "en" ? "Restaurant profile" : "Perfil del restaurante"}>
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C9A84A]/55 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-[0.12]"
        style={{ background: "radial-gradient(circle, #C9A84A 0%, transparent 70%)" }}
        aria-hidden
      />

      <div className="relative px-4 py-5 sm:px-6 sm:py-6 lg:px-7 lg:py-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5 lg:gap-6">
          <div className={LOGO_FRAME}>
            {data.businessLogo?.trim() ? (
              <Image
                src={data.businessLogo}
                alt=""
                width={96}
                height={96}
                className="h-full w-full object-contain"
                unoptimized={data.businessLogo.startsWith("data:") || data.businessLogo.startsWith("blob:")}
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center rounded-md bg-[#F5F0E8] text-2xl font-bold text-[#7A1E2C]"
                aria-hidden
              >
                {(data.businessName?.trim() || "R").charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#FFFCF7]/65">
              {lang === "en" ? "Restaurant" : "Restaurante"}
            </p>
            <h1 className="mt-1 font-serif text-2xl font-semibold leading-tight tracking-tight text-[#FFFCF7] sm:text-3xl lg:text-[2rem]">
              {data.businessName}
            </h1>

            {data.trustRating ? (
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <FiStar className="h-4 w-4 shrink-0 text-[#C9A84A]" aria-hidden />
                <span className="text-sm font-semibold">{data.trustRating.average.toFixed(1)}</span>
                <span className="text-sm text-[#FFFCF7]/75">
                  ({data.trustRating.count.toLocaleString(lang === "en" ? "en-US" : "es-US")}{" "}
                  {lang === "en" ? "reviews" : "valoraciones"})
                </span>
              </div>
            ) : null}

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
                    ? "bg-[#2D5A3D]/35 text-[#A8D4B8] ring-1 ring-[#2D5A3D]/50"
                    : "bg-[#FFFCF7]/10 text-[#FFFCF7]/85 ring-1 ring-[#FFFCF7]/20"
                }`}
              >
                <FiClock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {data.hoursPreview.statusLine}
              </span>
              {locationLine ? (
                <span className="inline-flex max-w-full items-start gap-1 text-[#FFFCF7]/85">
                  <FiMapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#C9A84A]" aria-hidden />
                  <span className="min-w-0 break-words text-left">{locationLine}</span>
                </span>
              ) : null}
            </div>

            {neighborhoodDisplay && neighborhoodDisplay !== locationLine ? (
              <p className="mt-1.5 text-xs text-[#FFFCF7]/70">{neighborhoodDisplay}</p>
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
                persistEngagement={persistListingEngagement}
                className="!border-[#C9A84A]/40 !bg-[#FFFCF7]/95 !text-[#1E1814]"
              />
              <LeonixSaveButton
                listingId={listingKey}
                ownerUserId={ownerUid}
                variant="small"
                lang={lang}
                category="restaurantes"
                persistEngagement={persistListingEngagement}
                className="!border-[#C9A84A]/40 !bg-[#FFFCF7]/95 !text-[#1E1814]"
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
                persistEngagement={persistListingEngagement}
                className="[&>button]:!border-[#C9A84A]/40 [&>button]:!bg-[#FFFCF7]/95 [&>button]:!text-[#1E1814]"
              />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
