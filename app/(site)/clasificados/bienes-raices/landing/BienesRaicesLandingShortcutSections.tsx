"use client";

import Link from "next/link";
import type { IconType } from "react-icons";
import {
  BIENES_BUDGET_SHORTCUTS,
  BIENES_PRACTICAL_SHORTCUTS,
  type BienesGatewayLink,
} from "./bienesRaicesLandingGateway";
import {
  BR_BUDGET_CHIP,
  BR_LANDING_SECTION,
  BR_LANDING_SECTION_PAD,
  BR_PRACTICAL_CHIP,
} from "@/app/clasificados/bienes-raices/shared/bienesRaicesLeonixPublicUi";
import { buildBrResultsUrl } from "@/app/clasificados/bienes-raices/shared/constants/brResultsRoutes";

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
  items: (BienesGatewayLink & { Icon: IconType })[];
  lang: "es" | "en";
  routeLang: string;
}) {
  return (
    <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:gap-2.5 [&::-webkit-scrollbar]:hidden">
      {items.filter((i) => i.wired).map((item) => {
        const Icon = item.Icon;
        const label = lang === "es" ? item.labelEs : item.labelEn;
        const href = buildBrResultsUrl({ ...item.params, lang: routeLang });
        return (
          <Link key={label} href={href} className={`${BR_BUDGET_CHIP} shrink-0 snap-start`}>
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
  items: (BienesGatewayLink & { Icon: IconType })[];
  lang: "es" | "en";
  routeLang: string;
}) {
  return (
    <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:gap-2.5 [&::-webkit-scrollbar]:hidden">
      {items.filter((i) => i.wired).map((item) => {
        const Icon = item.Icon;
        const label = lang === "es" ? item.labelEs : item.labelEn;
        const href = buildBrResultsUrl({ ...item.params, lang: routeLang });
        return (
          <Link key={label} href={href} className={`${BR_PRACTICAL_CHIP} shrink-0 snap-start`}>
            <Icon className="h-3.5 w-3.5 shrink-0 text-[#556B3E]" aria-hidden />
            {label}
          </Link>
        );
      })}
    </div>
  );
}

export function BienesRaicesLandingShortcutSections({
  lang,
  routeLang,
  budgetHeadingEs,
  budgetHeadingEn,
  practicalHeadingEs,
  practicalHeadingEn,
}: Props) {
  return (
    <div className="mt-6 space-y-5 sm:mt-7">
      <section className={BR_LANDING_SECTION} aria-labelledby="br-budget-shortcuts">
        <div className={`${BR_LANDING_SECTION_PAD} border-l-[3px] border-[#C9A84A]/55`}>
          <h2 id="br-budget-shortcuts" className="font-serif text-base font-bold text-[#2A4536] sm:text-lg">
            {lang === "es" ? budgetHeadingEs : budgetHeadingEn}
          </h2>
          <p className="mt-1 text-xs text-[#5C5346]/85">
            {lang === "es" ? "Precio aproximado en USD." : "Approximate price in USD."}
          </p>
          <div className="mt-3.5">
            <BudgetRow items={BIENES_BUDGET_SHORTCUTS} lang={lang} routeLang={routeLang} />
          </div>
        </div>
      </section>

      <section className={BR_LANDING_SECTION} aria-labelledby="br-practical-shortcuts">
        <div className={`${BR_LANDING_SECTION_PAD} border-l-[3px] border-[#556B3E]/40`}>
          <h2 id="br-practical-shortcuts" className="font-serif text-base font-bold text-[#2A4536] sm:text-lg">
            {lang === "es" ? practicalHeadingEs : practicalHeadingEn}
          </h2>
          <p className="mt-1 text-xs text-[#5C5346]/85">
            {lang === "es" ? "Atajos rápidos para encontrar propiedades con lo esencial." : "Quick shortcuts for properties with essentials."}
          </p>
          <div className="mt-3.5">
            <PracticalRow items={BIENES_PRACTICAL_SHORTCUTS} lang={lang} routeLang={routeLang} />
          </div>
        </div>
      </section>
    </div>
  );
}
