import Link from "next/link";
import type { ReactNode } from "react";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { categoryStandardUi } from "./categoryStandardTheme";

type Props = {
  lang: Lang;
  title: string;
  subtitle?: string;
  backHref: string;
  backLabel: string;
  breadcrumb?: ReactNode;
  publishHref?: string;
  publishLabel?: string;
  clearHref?: string;
  resultCount?: number;
};

/** Compact results header — no full hero image band. */
export function CategoryStandardResultsHeader({
  lang,
  title,
  subtitle,
  backHref,
  backLabel,
  breadcrumb,
  publishHref,
  publishLabel,
  clearHref,
  resultCount,
}: Props) {
  const ui = categoryStandardUi(lang);

  return (
    <header className="space-y-3 border-b border-[#D6C7AD]/50 pb-4">
      {breadcrumb ? <div className="text-xs font-medium text-[#556B3E]">{breadcrumb}</div> : null}
      <Link
        href={backHref}
        className="inline-flex text-sm font-semibold text-[#556B3E] transition hover:text-[#7A1E2C]"
      >
        ← {backLabel}
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-serif text-xl font-bold text-[#2A4536] sm:text-2xl">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-[#3D3428]/85">{subtitle}</p> : null}
          {typeof resultCount === "number" ? (
            <p className="mt-2 text-sm font-semibold text-[#556B3E]">{ui.count(resultCount)}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {clearHref ? (
            <Link href={clearHref} className="text-xs font-bold text-[#7A1E2C] hover:underline">
              {ui.clearFilters}
            </Link>
          ) : null}
          {publishHref && publishLabel ? (
            <Link
              href={publishHref}
              className="inline-flex min-h-[2.25rem] items-center rounded-lg bg-[#7A1E2C] px-4 text-xs font-bold text-[#FFFDF7] hover:bg-[#5e1721]"
            >
              {publishLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
