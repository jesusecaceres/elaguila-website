import Link from "next/link";
import type { TiendaCategory, Lang } from "../types/tienda";
import { tiendaCategoryCoverLiteral, tiendaCategoryCoverPrimary } from "../data/tiendaVisualAssets";
import type { TiendaCategorySlug } from "../data/tiendaCategories";
import { categoryMerchChips, merchTierForCategorySlug, type MerchTier } from "../data/tiendaMerchandising";
import { accentStyles } from "../utils/tiendaTheme";
import { withLang } from "../utils/tiendaRouting";
import { TiendaRemoteFillImage } from "./TiendaRemoteFillImage";

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none">
      <path
        d="M7.5 4.5L13.5 10l-6 5.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function tierMinHeight(tier: MerchTier): string {
  switch (tier) {
    case "flagship":
      return "min-h-[360px]";
    case "support":
      return "min-h-[260px] sm:min-h-[280px]";
    default:
      return "min-h-[320px]";
  }
}

export function TiendaCategoryCard(props: {
  category: TiendaCategory;
  lang: Lang;
  density?: MerchTier;
  /** Admin storefront override — must be https: or same-origin path. */
  coverPrimaryOverride?: string | null;
}) {
  const { category, lang, density: densityProp, coverPrimaryOverride } = props;
  const a = accentStyles(category.accent);
  const title = lang === "en" ? category.title.en : category.title.es;
  const desc = lang === "en" ? category.description.en : category.description.es;
  const eyebrow = category.eyebrow ? (lang === "en" ? category.eyebrow.en : category.eyebrow.es) : null;

  const slug = category.slug as TiendaCategorySlug;
  const coverPrimary = coverPrimaryOverride?.trim() || tiendaCategoryCoverPrimary(slug);
  const coverLiteral = tiendaCategoryCoverLiteral(slug);
  const isBusinessCards = slug === "business-cards";
  const tier = densityProp ?? merchTierForCategorySlug(slug);
  const chips = categoryMerchChips(lang, slug);

  return (
    <Link
      href={withLang(category.href, lang)}
      className={[
        "group flex flex-col overflow-hidden rounded-3xl",
        "bg-[color:var(--lx-card)] border border-[color:var(--lx-border)]",
        a.glow,
        "transition duration-300 ease-out",
        "hover:-translate-y-1 hover:border-[color:var(--lx-lion)]/40 hover:shadow-[0_18px_48px_rgba(201,120,47,0.14)]",
        tier === "flagship" ? "lg:min-h-[400px]" : "",
      ].join(" ")}
      aria-label={title}
    >
      {/* Image region */}
      <div className={[
        "relative overflow-hidden shrink-0",
        tier === "flagship" ? "aspect-[3/2]" : tier === "support" ? "aspect-[16/9]" : "aspect-[4/3]",
      ].join(" ")}>
        <TiendaRemoteFillImage
          primarySrc={coverPrimary}
          fallbackSrc={coverLiteral}
          alt={lang === "en" ? `${title} — category` : `${title} — categoría`}
          className="object-cover object-center transition duration-700 ease-out group-hover:scale-[1.03]"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
      </div>

      {/* Content region */}
      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <div className={["inline-flex self-start rounded-full border px-3 py-1 text-[11px] tracking-wide uppercase", a.chip].join(" ")}>
          {eyebrow ?? (lang === "en" ? "Category" : "Categoría")}
        </div>

        <div className="mt-4 flex items-start justify-between gap-6">
          <div className="min-w-0">
            <h3 className="text-lg sm:text-xl font-semibold tracking-tight text-[color:var(--lx-text)]">
              {title}
            </h3>
            <p
              className={[
                "mt-2 leading-relaxed text-[color:var(--lx-muted)] max-w-prose",
                tier === "support" ? "text-xs sm:text-sm line-clamp-3" : "text-sm",
              ].join(" ")}
            >
              {desc}
            </p>
          </div>

          <div className="mt-1 flex shrink-0 items-center gap-2 text-sm font-medium text-[color:var(--lx-muted)]">
            <span className="hidden sm:inline">
              {lang === "en" ? "Explore" : "Explorar"}
            </span>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--lx-border)] bg-[color:var(--lx-section)] text-[color:var(--lx-text)] transition group-hover:border-[color:var(--lx-lion)]/40 group-hover:bg-[color:var(--lx-lion)]/10">
              <ArrowIcon />
            </span>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {chips.map((c) => (
            <span
              key={c}
              className="inline-flex max-w-full rounded-full border border-[color:var(--lx-border)] bg-[color:var(--lx-section)] px-2.5 py-1 text-[10px] sm:text-[11px] font-medium tracking-wide text-[color:var(--lx-muted)]"
            >
              {c}
            </span>
          ))}
        </div>

        <div className="mt-6 h-[1px] w-full opacity-90">
          <div className={["h-full w-full", a.line].join(" ")} />
        </div>
      </div>
    </Link>
  );
}
