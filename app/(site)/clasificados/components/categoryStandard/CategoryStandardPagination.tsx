import Link from "next/link";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";

type Props = {
  lang: Lang;
  basePath: string;
  searchParams: URLSearchParams;
  currentPage: number;
  pageCount: number;
  className?: string;
};

function pageHref(basePath: string, sp: URLSearchParams, page: number): string {
  const next = new URLSearchParams(sp.toString());
  if (page <= 1) next.delete("page");
  else next.set("page", String(page));
  const qs = next.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

/** Server-safe pagination links preserving all current query params. */
export function CategoryStandardPagination({ lang, basePath, searchParams, currentPage, pageCount, className }: Props) {
  if (pageCount <= 1) return null;

  const prevLabel = lang === "en" ? "Previous" : "Anterior";
  const nextLabel = lang === "en" ? "Next" : "Siguiente";

  const windowStart = Math.max(1, Math.min(currentPage - 2, pageCount - 4));
  const pages = Array.from({ length: Math.min(5, pageCount) }, (_, i) => windowStart + i).filter((p) => p <= pageCount);

  return (
    <nav className={className ?? "mt-8 flex flex-wrap items-center justify-center gap-2"} aria-label={lang === "en" ? "Pagination" : "Paginación"}>
      {currentPage > 1 ? (
        <Link
          href={pageHref(basePath, searchParams, currentPage - 1)}
          className="rounded-lg border border-[#D6C7AD] bg-[#FFFDF7] px-3 py-2 text-sm font-semibold text-[#1F241C] hover:bg-[#FAF6EE]"
        >
          {prevLabel}
        </Link>
      ) : (
        <span className="rounded-lg border border-[#E8DFD0] bg-[#FFFDF7] px-3 py-2 text-sm text-[#7A7164]">{prevLabel}</span>
      )}
      {pages.map((p) => (
        <Link
          key={p}
          href={pageHref(basePath, searchParams, p)}
          className={`flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border px-3 py-2 text-sm font-semibold ${
            p === currentPage
              ? "border-[#C9A84A]/50 bg-[#FAF6EE] text-[#1F241C]"
              : "border-[#D6C7AD] bg-[#FFFDF7] text-[#3D3428] hover:bg-[#FAF6EE]"
          }`}
        >
          {p}
        </Link>
      ))}
      {currentPage < pageCount ? (
        <Link
          href={pageHref(basePath, searchParams, currentPage + 1)}
          className="rounded-lg border border-[#D6C7AD] bg-[#FFFDF7] px-3 py-2 text-sm font-semibold text-[#1F241C] hover:bg-[#FAF6EE]"
        >
          {nextLabel}
        </Link>
      ) : (
        <span className="rounded-lg border border-[#E8DFD0] bg-[#FFFDF7] px-3 py-2 text-sm text-[#7A7164]">{nextLabel}</span>
      )}
    </nav>
  );
}
