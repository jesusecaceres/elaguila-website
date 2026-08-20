import Link from "next/link";
import { PRIMARY_CATEGORIES } from "@/app/lib/recursos/categories";
import { recursosCategoryHref } from "@/app/lib/recursos/recursosUrls";
import type { PrimaryCategorySlug, RecursosLang } from "@/app/lib/recursos/types";
import type { SupportedLang } from "@/app/lib/language";

const COPY: Record<RecursosLang, { comingSoon: string; countOne: string; countMany: (n: number) => string }> = {
  es: {
    comingSoon: "Próximamente",
    countOne: "1 recurso verificado",
    countMany: (n) => `${n} recursos verificados`,
  },
  en: {
    comingSoon: "Coming soon",
    countOne: "1 verified resource",
    countMany: (n) => `${n} verified resources`,
  },
};

/**
 * 12 fixed, locked categories — need-first labels, never redesigned here. Counts are always
 * truthful (derived from the currently-eligible dataset the caller fetched); a category with
 * zero verified resources shows an honest "coming soon" state, never a broken-looking "0".
 */
export function CategoryGrid({
  lang,
  counts,
}: {
  lang: RecursosLang;
  counts: Record<PrimaryCategorySlug, number>;
}) {
  const t = COPY[lang];
  const routeLang = lang as SupportedLang;

  return (
    <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {PRIMARY_CATEGORIES.map((category) => {
        const count = counts[category.slug] ?? 0;
        return (
          <li key={category.slug}>
            <Link
              href={recursosCategoryHref(category.slug, routeLang)}
              className="flex h-full flex-col rounded-xl border border-[#D6C7AD] bg-[#FFFDF7] p-4 shadow-[0_8px_24px_-16px_rgba(31,36,28,0.15)] transition hover:border-[#C9A84A] hover:shadow-[0_10px_28px_-16px_rgba(31,36,28,0.22)]"
            >
              <h3 className="text-sm font-bold text-[#1F241C]">{lang === "en" ? category.labelEn : category.labelEs}</h3>
              <p className="mt-2 flex-1 text-xs leading-relaxed text-[#3D3428]">
                {lang === "en" ? category.descriptionEn : category.descriptionEs}
              </p>
              <p className="mt-3 text-xs font-bold uppercase tracking-wide text-[#556B3E]">
                {count > 0 ? (count === 1 ? t.countOne : t.countMany(count)) : t.comingSoon}
              </p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
