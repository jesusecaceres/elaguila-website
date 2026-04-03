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

export function TiendaCategoryCard(props: { category: TiendaCategory; lang: Lang; density?: MerchTier }) {
  const { category, lang, density: densityProp } = props;
  const a = accentStyles(category.accent);
  const title = lang === "en" ? category.title.en : category.title.es;
  const desc = lang === "en" ? category.description.en : category.description.es;
  const eyebrow = category.eyebrow ? (lang === "en" ? category.eyebrow.en : category.eyebrow.es) : null;

  const slug = category.slug as TiendaCategorySlug;
  const coverPrimary = tiendaCategoryCoverPrimary(slug);
  const coverLiteral = tiendaCategoryCoverLiteral(slug);
  const isBusinessCards = slug === "business-cards";
  const tier = densityProp ?? merchTierForCategorySlug(slug);
  const chips = categoryMerchChips(lang, slug);

  return (
    <Link
      href={withLang(category.href, lang)}
      className={[
        "group relative flex flex-col justify-end overflow-hidden rounded-3xl",
        tierMinHeight(tier),
        "ring-1",
        a.ring,
        "transition duration-500 ease-out",
        "hover:-translate-y-1 hover:ring-[color:rgba(201,168,74,0.45)] hover:shadow-[0_28px_90px_rgba(0,0,0,0.5)]",
        a.glow,
        tier === "flagship" ? "lg:min-h-[400px]" : "",
      ].join(" ")}
      aria-label={title}
    >
      <div className="absolute inset-0">
        <TiendaRemoteFillImage
          primarySrc={coverPrimary}
          fallbackSrc={coverLiteral}
          alt={lang === "en" ? `${title} — category` : `${title} — categoría`}
          className="object-cover object-center transition duration-700 ease-out group-hover:scale-[1.03]"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <div
          className={
            isBusinessCards
              ? "absolute inset-0 bg-gradient-to-t from-[#070708] via-[#070708]/62 to-[#070708]/12"
              : tier === "support"
                ? "absolute inset-0 bg-gradient-to-t from-[#070708] via-[#070708]/72 to-[#070708]/18"
                : "absolute inset-0 bg-gradient-to-t from-[#070708] via-[#070708]/75 to-[#070708]/20"
          }
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(201,168,74,0.14),transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100">
          <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-[radial-gradient(circle_at_center,rgba(201,168,74,0.35),rgba(0,0,0,0))]" />
        </div>
      </div>

      <div className="relative z-10 p-6 sm:p-7">
        <div className={["inline-flex rounded-full border px-3 py-1 text-[11px] tracking-wide uppercase backdrop-blur-sm", a.chip].join(" ")}>
          {eyebrow ?? (lang === "en" ? "Category" : "Categoría")}
        </div>

        <div className="mt-4 flex items-start justify-between gap-6">
          <div className="min-w-0">
            <h3 className="text-lg sm:text-xl font-semibold tracking-tight text-[rgba(255,247,226,0.98)] drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
              {title}
            </h3>
            <p
              className={[
                "mt-2 leading-relaxed text-[rgba(255,247,226,0.88)] drop-shadow-[0_1px_8px_rgba(0,0,0,0.55)] max-w-prose",
                tier === "support" ? "text-xs sm:text-sm line-clamp-3" : "text-sm",
              ].join(" ")}
            >
              {desc}
            </p>
          </div>

          <div className="mt-1 flex shrink-0 items-center gap-2 text-sm font-medium text-[rgba(255,247,226,0.92)]">
            <span className="hidden sm:inline drop-shadow-[0_1px_6px_rgba(0,0,0,0.65)]">
              {lang === "en" ? "Explore" : "Explorar"}
            </span>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(255,247,226,0.35)] bg-[rgba(0,0,0,0.35)] backdrop-blur-sm text-[rgba(255,247,226,0.95)] transition group-hover:border-[rgba(201,168,74,0.55)] group-hover:bg-[rgba(201,168,74,0.2)]">
              <ArrowIcon />
            </span>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {chips.map((c) => (
            <span
              key={c}
              className="inline-flex max-w-full rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(0,0,0,0.35)] px-2.5 py-1 text-[10px] sm:text-[11px] font-medium tracking-wide text-[rgba(255,247,226,0.88)] backdrop-blur-sm"
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
