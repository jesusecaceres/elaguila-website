import Link from "next/link";
import { CategoryLandingChipsRail } from "@/app/(site)/clasificados/components/categoryLanding/CategoryLandingChipsRail";

type Lang = "es" | "en";

const QUICK_FILTERS: readonly { labelEs: string; labelEn: string; suffix: string }[] = [
  { labelEs: "Abierto ahora", labelEn: "Open now", suffix: "open_now=1" },
  { labelEs: "Licenciados", labelEn: "Licensed", suffix: "licensed=1" },
  { labelEs: "Asegurados", labelEn: "Insured", suffix: "insured=1" },
  { labelEs: "Cotización gratis", labelEn: "Free estimate", suffix: "free_estimate=1" },
  { labelEs: "Con fotos", labelEn: "With photos", suffix: "has_photos=1" },
  { labelEs: "Con videos", labelEn: "With videos", suffix: "has_videos=1" },
  { labelEs: "Con ofertas", labelEn: "With offers", suffix: "has_offers=1" },
  { labelEs: "Más gustados", labelEn: "Most liked", suffix: "sort=most_liked" },
  { labelEs: "Más recientes", labelEn: "Newest", suffix: "sort=newest" },
];

/**
 * Shortcuts into `/resultados` using only existing URL params (no new filter logic).
 */
export function ServiciosLandingQuickFilterLinks({ lang }: { lang: Lang }) {
  const base = "/clasificados/servicios/resultados";

  return (
    <div className="mx-auto w-full max-w-[min(100%,920px)] px-0 sm:px-0">
      <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-[#3d5a73]/80 sm:mb-3 sm:text-[11px]">
        {lang === "en" ? "Quick filters" : "Filtros rápidos"}
      </p>
      <CategoryLandingChipsRail
        label={lang === "en" ? "Shortcuts to filtered Servicios results" : "Atajos a resultados filtrados de Servicios"}
      >
        {QUICK_FILTERS.map((f) => {
          const label = lang === "en" ? f.labelEn : f.labelEs;
          const href = `${base}?lang=${lang}&${f.suffix}`;
          return (
            <Link
              key={f.suffix}
              href={href}
              className="inline-flex min-h-[44px] shrink-0 snap-start items-center rounded-full border border-[#c9b8a4]/90 bg-[#FFFCF7] px-3 py-2 text-[12px] font-semibold text-[#2a241c] shadow-sm transition hover:border-[#C9A84A]/70 hover:bg-[#FFF9EE] active:scale-[0.99] sm:px-3.5 sm:text-[13px]"
            >
              {label}
            </Link>
          );
        })}
      </CategoryLandingChipsRail>
    </div>
  );
}
