"use client";

import Image from "next/image";
import Link from "next/link";
import { FiChevronRight, FiMapPin } from "react-icons/fi";
import { formatCityStateLabel, formatMiles, formatUsd } from "./autoDealerFormatters";
import { withLangParam } from "../lib/autosNegociosLang";
import type { AutosNegociosLang } from "../lib/autosNegociosLang";

export type AutosDealerInventoryVehicleCardRow = {
  id: string;
  imageUrl: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  price: number;
  mileage: number;
  city?: string;
  state?: string;
  href: string;
};

const RESULT_CARD =
  "group flex min-w-0 flex-col overflow-hidden rounded-3xl border border-[#D4A574]/30 bg-[#FFFAF0] shadow-[0_12px_48px_-20px_rgba(212,165,116,0.15)] transition-all duration-200 hover:border-[#D4A574]/50 hover:shadow-[0_16px_56px_-24px_rgba(212,165,116,0.20)] active:opacity-95 border-l-[3px] border-l-[#D4A574]/85";

export function AutosDealerInventoryVehicleCard({
  car,
  lang,
  ctaLabel,
}: {
  car: AutosDealerInventoryVehicleCardRow;
  lang: AutosNegociosLang;
  ctaLabel: string;
}) {
  const title = `${new Intl.NumberFormat("en-US").format(car.year)} ${car.make} ${car.model}${car.trim ? ` ${car.trim}` : ""}`;
  const loc = formatCityStateLabel(car.city, car.state);
  const href = car.href.startsWith("/") ? withLangParam(car.href, lang) : car.href;

  return (
    <article className={RESULT_CARD}>
      <Link href={href} className="flex min-h-0 flex-1 flex-col">
        <div className="relative aspect-[16/11] w-full overflow-hidden bg-[#F5F0E8] sm:aspect-[5/3]">
          <Image
            src={car.imageUrl}
            alt={title}
            fill
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
            sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 26vw"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2 p-4 sm:p-5">
          <h3 className="line-clamp-2 min-h-[2.75rem] font-serif text-[15px] font-semibold leading-snug tracking-tight text-[#1A1A1A] sm:text-base">
            {title}
          </h3>
          <p className="text-xl font-bold tabular-nums text-[#2A7F3E] sm:text-2xl">{formatUsd(car.price)}</p>
          <div className="flex items-center gap-2 text-sm text-[#4A4A4A]">
            {loc ? (
              <>
                <FiMapPin className="h-4 w-4 shrink-0 text-[#D4A574]" aria-hidden />
                <span className="truncate">{loc}</span>
                <span className="text-[#7A7A7A]">•</span>
              </>
            ) : null}
            <span>{formatMiles(car.mileage)}</span>
          </div>
          <span className="mt-auto inline-flex min-h-[40px] w-full items-center justify-center gap-1 rounded-full border border-[#D4A574]/50 bg-[linear-gradient(135deg,rgba(212,165,116,0.12),rgba(193,154,107,0.08))] px-3 text-[11px] font-bold text-[#1A1A1A] transition hover:border-[#D4A574]">
            {ctaLabel}
            <FiChevronRight className="h-4 w-4" aria-hidden />
          </span>
        </div>
      </Link>
    </article>
  );
}
