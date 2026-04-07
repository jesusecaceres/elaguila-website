"use client";

import { isProListing } from "../../../components/planHelpers";

export type AutosSellerBadgeLang = "es" | "en";

export function AutosSellerLaneBadge(props: {
  lang: AutosSellerBadgeLang;
  listing: {
    sellerType?: string;
    seller_type?: string;
  };
}) {
  const { lang, listing } = props;
  const isBiz = listing.sellerType === "business" || listing.seller_type === "business";
  const pro = isProListing(listing as Parameters<typeof isProListing>[0]);

  const label = isBiz
    ? lang === "es"
      ? "Dealer"
      : "Dealer"
    : pro
      ? lang === "es"
        ? "Privado Pro"
        : "Private Pro"
      : lang === "es"
        ? "Privado"
        : "Private";

  return (
    <span className="inline-flex items-center rounded-full border border-black/10 bg-white px-2 py-0.5 text-[10px] font-semibold text-[#111111]">
      {label}
    </span>
  );
}
