"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";

import { BUSCO_PRODUCT, type BuscoShellLang } from "./buscoShellCopy";

type Props = {
  lang: BuscoShellLang;
  children: ReactNode;
  backHref?: string;
  backLabel?: string;
};

export function BuscoShellLayout({ lang, children, backHref, backLabel }: Props) {
  const hubHref = appendLangToPath("/clasificados", lang);
  const landingHref = appendLangToPath("/clasificados/busco", lang);

  return (
    <div className="min-h-screen pb-16 text-[#111111] [background:radial-gradient(ellipse_at_top,rgba(120,150,200,0.12),transparent_58%),#F4EFE6]">
      <Navbar />
      <header className="border-b border-[#B8C8EA]/20 bg-[#F4EFE6]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#3d5a73]">
            <Link href={hubHref} className="hover:underline">
              {lang === "es" ? "Clasificados" : "Classifieds"}
            </Link>
            <span aria-hidden>/</span>
            <Link href={landingHref} className="hover:underline">
              {BUSCO_PRODUCT.title[lang]}
            </Link>
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1E1810] sm:text-2xl">{BUSCO_PRODUCT.title[lang]}</h1>
            <p className="mt-1 text-sm leading-relaxed text-[#5C5346]/90">{BUSCO_PRODUCT.description[lang]}</p>
            <p className="mt-2 text-xs font-medium leading-relaxed text-[#3d4a5c]">{BUSCO_PRODUCT.helper[lang]}</p>
          </div>
          {backHref && backLabel ? (
            <Link
              href={backHref}
              className="inline-flex min-h-[40px] w-fit items-center text-sm font-semibold text-[#3d5a73] underline-offset-2 hover:underline"
            >
              ← {backLabel}
            </Link>
          ) : null}
        </div>
      </header>
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-5">{children}</div>
    </div>
  );
}
