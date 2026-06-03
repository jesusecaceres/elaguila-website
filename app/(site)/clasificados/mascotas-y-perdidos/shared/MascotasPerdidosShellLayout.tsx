"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { CategoryStandardResultsPageShell } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardResultsPageShell";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";

import { MASCOTAS_PERDIDOS_PRODUCT, type MascotasPerdidosShellLang } from "./mascotasPerdidosShellCopy";

type Props = {
  lang: MascotasPerdidosShellLang;
  children: ReactNode;
  backHref?: string;
  backLabel?: string;
};

export function MascotasPerdidosShellLayout({ lang, children, backHref, backLabel }: Props) {
  const hubHref = appendLangToPath("/clasificados", lang);
  const landingHref = appendLangToPath("/clasificados/mascotas-y-perdidos", lang);

  return (
    <CategoryStandardResultsPageShell maxWidthClass="max-w-3xl">
      <header className="mb-5 space-y-2 border-b border-[#D6C7AD]/50 pb-4">
        <nav className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#556B3E]" aria-label="Breadcrumb">
          <Link href={hubHref} className="hover:text-[#7A1E2C]">
            {lang === "es" ? "Clasificados" : "Classifieds"}
          </Link>
          <span aria-hidden>/</span>
          <Link href={landingHref} className="hover:text-[#7A1E2C]">
            {MASCOTAS_PERDIDOS_PRODUCT.title[lang]}
          </Link>
        </nav>
        {backHref && backLabel ? (
          <Link
            href={backHref}
            className="inline-flex text-sm font-semibold text-[#556B3E] hover:text-[#7A1E2C]"
          >
            ← {backLabel}
          </Link>
        ) : null}
        <h1 className="font-serif text-xl font-bold text-[#2A4536]">{MASCOTAS_PERDIDOS_PRODUCT.title[lang]}</h1>
      </header>
      {children}
    </CategoryStandardResultsPageShell>
  );
}
