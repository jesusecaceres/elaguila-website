import type { ReactNode } from "react";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { CategoryStandardMark } from "./CategoryStandardMark";
import {
  CATEGORY_STANDARD_THEME,
  categoryStandardDescription,
  categoryStandardTitle,
  type CategoryStandardKey,
} from "./categoryStandardTheme";

export type CategoryCompactHeroProps = {
  category: CategoryStandardKey;
  lang: Lang;
  /** Overrides standard gate copy when category page has legacy eyebrow */
  eyebrow?: string;
  title?: string;
  description?: string;
  /** Optional subtle photo — muted, not full-bleed takeover */
  imageSrc?: string;
  imageAlt?: string;
  children?: ReactNode;
};

/**
 * Compact Leonix category hero — gradient + mark by default; optional muted image band.
 */
export function CategoryCompactHero({
  category,
  lang,
  eyebrow,
  title,
  description,
  imageSrc,
  imageAlt = "",
  children,
}: CategoryCompactHeroProps) {
  const theme = CATEGORY_STANDARD_THEME[category];
  const displayTitle = title ?? categoryStandardTitle(category, lang);
  const displayDesc = description ?? categoryStandardDescription(category, lang);
  const displayEyebrow =
    eyebrow ?? (lang === "es" ? "Leonix Clasificados" : "Leonix Classifieds");

  return (
    <section
      className={`relative overflow-hidden rounded-xl border ${theme.accentBorder} bg-[#FFFDF7] shadow-[0_10px_32px_-20px_rgba(31,36,28,0.2)]`}
      aria-labelledby="category-compact-hero-title"
    >
      {imageSrc ? (
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          aria-hidden
          style={{
            backgroundImage: `url(${imageSrc})`,
            backgroundSize: "cover",
            backgroundPosition: "center 40%",
          }}
        />
      ) : null}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: theme.gradient }}
        aria-hidden
      />
      <div className="relative flex flex-col gap-4 px-4 py-5 sm:flex-row sm:items-start sm:gap-5 sm:px-6 sm:py-6">
        <span
          className={`inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border bg-[#FAF6EE]/90 ${theme.accentBorder}`}
        >
          <CategoryStandardMark category={category} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#556B3E]">{displayEyebrow}</p>
          <h1
            id="category-compact-hero-title"
            className="mt-2 font-serif text-2xl font-bold leading-tight text-[#2A4536] sm:text-[1.75rem]"
          >
            {displayTitle}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">{displayDesc}</p>
          {imageAlt && imageSrc ? <span className="sr-only">{imageAlt}</span> : null}
          {children ? <div className="mt-4 min-w-0">{children}</div> : null}
        </div>
      </div>
    </section>
  );
}
