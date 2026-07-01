"use client";

import Link from "next/link";
import type { IconType } from "react-icons";
import {
  RENTAS_BUDGET_SHORTCUTS,
  RENTAS_PRACTICAL_SHORTCUTS,
  type RentasGatewayLink,
} from "./rentasLandingGateway";
import {
  RENTAS_BUDGET_CHIP,
  RENTAS_LANDING_SECTION,
  RENTAS_LANDING_SECTION_PAD,
  RENTAS_PRACTICAL_CHIP,
} from "@/app/clasificados/rentas/shared/rentasLeonixPublicUi";
import { buildRentasResultsUrl } from "@/app/clasificados/rentas/shared/utils/rentasResultsRoutes";

type Props = {
  lang: "es" | "en";
  routeLang: string;
  budgetHeadingEs: string;
  budgetHeadingEn: string;
  practicalHeadingEs: string;
  practicalHeadingEn: string;
};

function BudgetRow({
  items,
  lang,
  routeLang,
}: {
  items: (RentasGatewayLink & { Icon: IconType })[];
  lang: "es" | "en";
  routeLang: string;
}) {
  return (
    <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:gap-2.5 [&::-webkit-scrollbar]:hidden">
      {items.filter((i) => i.wired).map((item) => {
        const Icon = item.Icon;
        const label = lang === "es" ? item.labelEs : item.labelEn;
        const href = buildRentasResultsUrl({ ...item.params, lang: routeLang });
        return (
          <Link key={label} href={href} className={`${RENTAS_BUDGET_CHIP} shrink-0 snap-start`}>
            <Icon className="h-3.5 w-3.5 shrink-0 text-[#B8954A]" aria-hidden />
            {label}
          </Link>
        );
      })}
    </div>
  );
}

function PracticalRow({
  items,
  lang,
  routeLang,
}: {
  items: (RentasGatewayLink & { Icon: IconType })[];
  lang: "es" | "en";
  routeLang: string;
}) {
  return (
    <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:gap-2.5 [&::-webkit-scrollbar]:hidden">
      {items.filter((i) => i.wired).map((item) => {
        const Icon = item.Icon;
        const label = lang === "es" ? item.labelEs : item.labelEn;
        const href = buildRentasResultsUrl({ ...item.params, lang: routeLang });
        return (
          <Link key={label} href={href} className={`${RENTAS_PRACTICAL_CHIP} shrink-0 snap-start`}>
            <Icon className="h-3.5 w-3.5 shrink-0 text-[#556B3E]" aria-hidden />
            {label}
          </Link>
        );
      })}
    </div>
  );
}

export function RentasLandingShortcutSections({
  lang,
  routeLang,
  budgetHeadingEs,
  budgetHeadingEn,
  practicalHeadingEs,
  practicalHeadingEn,
}: Props) {
  return (
    <div className="mt-5 space-y-4 sm:mt-6">
      <section className={RENTAS_LANDING_SECTION} aria-labelledby="rentas-budget-shortcuts">
        <div className={`${RENTAS_LANDING_SECTION_PAD} border-l-[3px] border-[#C9A84A]/55`}>
          <h2 id="rentas-budget-shortcuts" className="font-serif text-sm font-bold text-[#2A4536] sm:text-base">
            {lang === "es" ? budgetHeadingEs : budgetHeadingEn}
          </h2>
          <p className="mt-1 text-xs text-[#5C5346]/85">
            {lang === "es" ? "Renta mensual aproximada en USD." : "Approximate monthly rent in USD."}
          </p>
          <div className="mt-3 rounded-lg bg-[#FAF6EE]/60 p-2.5 sm:p-3">
            <BudgetRow items={RENTAS_BUDGET_SHORTCUTS} lang={lang} routeLang={routeLang} />
          </div>
        </div>
      </section>

      <section className={RENTAS_LANDING_SECTION} aria-labelledby="rentas-practical-shortcuts">
        <div className={`${RENTAS_LANDING_SECTION_PAD} border-l-[3px] border-[#556B3E]/40`}>
          <h2 id="rentas-practical-shortcuts" className="font-serif text-sm font-bold text-[#2A4536] sm:text-base">
            {lang === "es" ? practicalHeadingEs : practicalHeadingEn}
          </h2>
          <p className="mt-1 text-xs text-[#5C5346]/85">
            {lang === "es" ? "Atajos rápidos para lo esencial." : "Quick shortcuts for what matters."}
          </p>
          <div className="mt-3 rounded-lg bg-[#F8FAF6]/70 p-2.5 sm:p-3">
            <PracticalRow items={RENTAS_PRACTICAL_SHORTCUTS} lang={lang} routeLang={routeLang} />
          </div>
        </div>
      </section>
    </div>
  );
}
