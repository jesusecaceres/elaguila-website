import Link from "next/link";
import { appendLangToPath } from "@/app/(site)/clasificados/lib/hubUrl";
import type { SupportedLang } from "@/app/lib/language";
import { getClasificadosFeaturedOfertasCopy } from "../_lib/clasificadosLandingHubCopy";

type Props = {
  routeLang: SupportedLang;
};

function OfertasFeaturedMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="#7A1E2C"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-9 w-9"
      aria-hidden
    >
      <path d="M4 8h16v12H4z" />
      <path d="M8 8V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3" />
      <path d="M9 13h6M9 17h4" />
    </svg>
  );
}

export function ClasificadosFeaturedOfertasModule({ routeLang }: Props) {
  const copy = getClasificadosFeaturedOfertasCopy(routeLang);
  const browseHref = appendLangToPath("/clasificados/ofertas-locales", routeLang);
  const publishHref = appendLangToPath("/publicar/ofertas-locales", routeLang);

  return (
    <section
      className="relative overflow-hidden rounded-2xl border-2 border-[#C9A84A]/55 bg-gradient-to-br from-[#FFF6F0] via-[#FFFCF7] to-[#F8F0E4] p-5 shadow-[0_16px_40px_-20px_rgba(122,30,44,0.22)] sm:p-7"
      aria-labelledby="clasificados-featured-ofertas-title"
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#7A1E2C]/8 blur-2xl"
        aria-hidden
      />
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:gap-8">
        <div className="shrink-0">
          <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-[#C9A84A]/45 bg-white/90 shadow-sm">
            <OfertasFeaturedMark />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#7A1E2C]">
            {routeLang === "en" ? "Featured" : "Destacado"}
          </p>
          <h2 id="clasificados-featured-ofertas-title" className="mt-1 text-2xl font-bold text-[#1E1810] sm:text-[1.65rem]">
            {copy.title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">{copy.body}</p>
          <p className="mt-2 max-w-2xl text-xs leading-relaxed text-[#5C5346]/90 sm:text-sm">{copy.supportLine}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {copy.chips.map((chip) => (
              <span
                key={chip}
                className="inline-flex rounded-full border border-[#C9A84A]/50 bg-[#FFFDF7] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#6B5320]"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
        <div className="flex w-full shrink-0 flex-col gap-3 sm:flex-row md:w-auto md:flex-col lg:min-w-[12.5rem]">
          <Link
            href={browseHref}
            className="inline-flex min-h-[2.75rem] w-full items-center justify-center rounded-xl bg-[#7A1E2C] px-5 py-2.5 text-center text-sm font-bold text-white shadow-md transition hover:bg-[#5e1721] md:w-full"
          >
            {copy.browseCta}
          </Link>
          <Link
            href={publishHref}
            className="inline-flex min-h-[2.75rem] w-full items-center justify-center rounded-xl border-2 border-[#C9A84A]/65 bg-[#FFFCF7] px-5 py-2.5 text-center text-sm font-bold text-[#3D3428] transition hover:border-[#C9A84A] hover:bg-[#FBF7EF] md:w-full"
          >
            {copy.publishCta}
          </Link>
        </div>
      </div>
    </section>
  );
}
