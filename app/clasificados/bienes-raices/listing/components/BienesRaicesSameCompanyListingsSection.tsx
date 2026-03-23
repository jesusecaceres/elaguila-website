"use client";

import Link from "next/link";
import { formatListingPrice } from "@/app/lib/formatListingPrice";
import type { BrAnuncioLang } from "../types/brAnuncioLiveTypes";
import type { BrSameCompanySampleItem } from "../types/brAnuncioLiveTypes";

/** BR negocio + plus flag: sample “more from this company” grid (extracted from anuncio page). */
export function BienesRaicesSameCompanyListingsSection(props: {
  lang: BrAnuncioLang;
  items: BrSameCompanySampleItem[];
}) {
  const { lang, items } = props;
  return (
    <div className="mt-10" data-section="bienes-raices-mas-anuncios">
      <h3 className="text-xl font-bold text-[#111111] mb-4">
        {lang === "es" ? "Más anuncios de esta compañía" : "More listings from this company"}
      </h3>
      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/clasificados/anuncio/${item.id}?lang=${lang}`}
              className="block rounded-2xl border border-[#C9B46A]/55 bg-[#F5F5F5] p-4 hover:bg-[#EFEFEF] transition"
            >
              <div className="text-base font-bold text-[#111111] line-clamp-2">{item.title[lang]}</div>
              <div className="mt-1 text-sm font-semibold text-[#111111]">
                {formatListingPrice(item.priceLabel[lang], { lang })}
              </div>
              <div className="mt-1 text-xs text-[#111111]">
                {item.city} · {item.postedAgo[lang]}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-[#C9B46A]/30 bg-[#F8F6F0] p-5 text-center">
          <p className="text-sm text-[#111111]/80">
            {lang === "es"
              ? "No hay otros anuncios de esta empresa por ahora."
              : "No other listings from this company at the moment."}
          </p>
        </div>
      )}
    </div>
  );
}
