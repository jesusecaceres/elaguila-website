import Link from "next/link";

type Lang = "es" | "en";

/**
 * Explicit browse entry → results (shell). Search is primary; this supports discovery without typing.
 */
export function ServiciosLandingBrowseRow({ lang }: { lang: Lang }) {
  const href = `/clasificados/servicios/resultados?lang=${lang}`;

  return (
    <div className="mx-auto flex max-w-[920px] flex-col items-stretch gap-3 rounded-[18px] border border-[#dfe6ef]/90 bg-white/80 px-4 py-4 shadow-[0_12px_36px_-28px_rgba(20,38,58,0.35)] ring-1 ring-[#1e3a5f]/[0.04] sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6 sm:py-4">
      <p className="text-center text-[14px] leading-snug text-[#4a5d6e] sm:text-left sm:text-[15px]">
        {lang === "en"
          ? "Prefer to browse? Open the full Servicios directory — filter by city, trade, and contact options."
          : "¿Prefieres explorar? Abre el directorio completo de Servicios: filtra por ciudad, giro y forma de contacto."}
      </p>
      <Link
        href={href}
        className="inline-flex min-h-[48px] shrink-0 items-center justify-center rounded-full border-2 border-[#1a3352]/20 bg-[#1a3352] px-6 text-[14px] font-bold tracking-wide text-white shadow-[0_8px_22px_-12px_rgba(26,51,82,0.45)] transition hover:bg-[#152a45] hover:brightness-[1.02] active:scale-[0.99] sm:min-h-[44px] sm:px-7"
      >
        {lang === "en" ? "Browse all services" : "Ver todos los servicios"}
        <span className="ml-2" aria-hidden>
          →
        </span>
      </Link>
    </div>
  );
}
