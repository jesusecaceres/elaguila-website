"use client";

import { formatListingPrice } from "@/app/lib/formatListingPrice";
import type { RentasPlanTier } from "../../shared/utils/rentasPlanTier";
import type { RentasAnuncioLang } from "../types/rentasAnuncioLiveTypes";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function RentasAnuncioHeroMonthlyRent(props: {
  lang: RentasAnuncioLang;
  priceLabel: string;
  rentasPlanTier: RentasPlanTier | null;
}) {
  const { lang, priceLabel, rentasPlanTier } = props;
  return (
    <div className="mt-3">
      <div className={cx("font-medium text-[#111111]/80", rentasPlanTier === "privado_pro" ? "text-sm" : "text-sm")}>
        {lang === "es" ? "Renta mensual" : "Monthly rent"}
      </div>
      <div
        className={cx(
          "font-extrabold",
          rentasPlanTier === "privado_pro" ? "text-2xl sm:text-3xl text-[#111111]" : "text-2xl text-yellow-200"
        )}
      >
        {formatListingPrice(priceLabel, { lang })}
      </div>
    </div>
  );
}
