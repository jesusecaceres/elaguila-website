import Link from "next/link";
import { CategoryLandingChipsRail } from "@/app/(site)/clasificados/components/categoryLanding/CategoryLandingChipsRail";
import { CATEGORY_STANDARD_CHIP } from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardTheme";
import type { ServiciosQuickChip } from "./serviciosLandingSampleData";

export function ServiciosQuickChips({
  lang,
  chips,
  variant = "legacy",
}: {
  lang: "es" | "en";
  chips: ServiciosQuickChip[];
  variant?: "legacy" | "standard";
}) {
  const base = "/clasificados/servicios/results";
  const railLabel = lang === "en" ? "Quick filters" : "Filtros rápidos";

  return (
    <CategoryLandingChipsRail label={railLabel}>
      {chips.map((c) => {
        const label = lang === "en" ? c.labelEn : c.labelEs;
        const qRaw = (lang === "en" ? c.resultsQueryEn : c.resultsQueryEs).trim();
        const params = new URLSearchParams({ lang });
        if (c.resultsGroup) params.set("group", c.resultsGroup);
        if (qRaw) params.set("q", qRaw);
        if (c.resultsParams) {
          for (const [k, v] of Object.entries(c.resultsParams)) {
            if (v) params.set(k, v);
          }
        }
        const href = `${base}?${params.toString()}`;
        const standardClass = CATEGORY_STANDARD_CHIP;
        const legacyChipClass =
          "inline-flex min-h-[44px] shrink-0 snap-start items-center rounded-full bg-[#1a3352] px-3.5 py-2 text-[12px] font-semibold text-[#F8FAFC] shadow-[0_8px_22px_-12px_rgba(26,51,82,0.55)] transition hover:bg-[#152a45] hover:brightness-[1.02] active:scale-[0.99] sm:px-4 sm:text-[13px]";
        const className = variant === "standard" ? standardClass : legacyChipClass;

        return (
          <Link key={c.id} href={href} className={className}>
            {label}
          </Link>
        );
      })}
    </CategoryLandingChipsRail>
  );
}
