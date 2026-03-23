"use client";

import { formatListingPrice } from "@/app/lib/formatListingPrice";
import type { EnVentaAnuncioLang } from "../types/enVentaAnuncioLiveTypes";

export function EnVentaAnuncioHeroPrice(props: { lang: EnVentaAnuncioLang; priceLabel: string }) {
  const { lang, priceLabel } = props;
  return (
    <div className="mt-3 text-2xl font-extrabold text-yellow-200">
      {formatListingPrice(priceLabel, { lang })}
    </div>
  );
}
