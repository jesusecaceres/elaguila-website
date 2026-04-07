"use client";

import { isProListing } from "../../../components/planHelpers";
import { autosBoostAllowed, resolveAutosBoostLane } from "../../boosts/autosBoostPolicy";
import type { AutosAnuncioLang } from "../types/autosAnuncioLiveTypes";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function AutosAnuncioLaneContextStrip(props: {
  lang: AutosAnuncioLang;
  listing: {
    sellerType?: string;
    seller_type?: string;
    businessName?: string | null;
    business_name?: string | null;
  };
}) {
  const { lang, listing } = props;
  const isBiz = listing.sellerType === "business" || listing.seller_type === "business";
  const isPro = isProListing(listing as Parameters<typeof isProListing>[0]);
  const lane = resolveAutosBoostLane({
    sellerType: (listing.sellerType ?? listing.seller_type ?? "personal") as "personal" | "business",
    isProPrivate: !isBiz && isPro,
  });

  const laneLabel =
    lane === "dealer"
      ? lang === "es"
        ? "Dealer"
        : "Dealer"
      : lane === "pro_private"
        ? lang === "es"
          ? "Privado Pro"
          : "Private Pro"
        : lang === "es"
          ? "Privado"
          : "Private";

  const boostHint = autosBoostAllowed(lane)
    ? lang === "es"
      ? "Elegible para impulsos"
      : "Boosts eligible"
    : lang === "es"
      ? "Sin impulsos (plan gratuito)"
      : "No boosts (free)";

  const bizName = (listing.businessName ?? listing.business_name ?? "").trim();

  return (
    <div
      className="mt-6 rounded-2xl border border-[#C9B46A]/40 bg-[#F8F6F0] p-4 sm:p-5"
      data-section="autos-lane-context"
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#111111]/70">
        {lang === "es" ? "Tipo de anuncio" : "Listing type"}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span
          className={cx(
            "rounded-full border px-2.5 py-1 text-xs font-semibold",
            lane === "dealer"
              ? "border-yellow-400/50 bg-[#F5F5F5] text-[#111111]"
              : lane === "pro_private"
                ? "border-emerald-400/35 bg-emerald-500/10 text-[#111111]"
                : "border-black/10 bg-white text-[#111111]"
          )}
        >
          {laneLabel}
        </span>
        <span className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-[11px] text-[#111111]/85">
          {boostHint}
        </span>
      </div>
      {isBiz && bizName ? (
        <p className="mt-2 text-sm font-medium text-[#111111]">
          {lang === "es" ? "Negocio" : "Business"} — {bizName}
        </p>
      ) : null}
    </div>
  );
}
