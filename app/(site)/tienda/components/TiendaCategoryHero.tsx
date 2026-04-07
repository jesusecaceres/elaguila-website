import type { Lang, TiendaCategory } from "../types/tienda";
import { tiendaCategoryCoverLiteral, tiendaCategoryCoverPrimary } from "../data/tiendaVisualAssets";
import type { TiendaCategorySlug } from "../data/tiendaCategories";
import { categoryHeroHints } from "../data/tiendaMerchandising";
import { accentStyles } from "../utils/tiendaTheme";
import { TiendaRemoteFillImage } from "./TiendaRemoteFillImage";

export function TiendaCategoryHero(props: { category: TiendaCategory; lang: Lang }) {
  const { category, lang } = props;
  const a = accentStyles(category.accent);
  const title = lang === "en" ? category.title.en : category.title.es;
  const desc = lang === "en" ? category.description.en : category.description.es;
  const hero = lang === "en" ? category.heroSummary.en : category.heroSummary.es;
  const eyebrow = category.eyebrow ? (lang === "en" ? category.eyebrow.en : category.eyebrow.es) : null;
  const slug = category.slug as TiendaCategorySlug;
  const coverPrimary = tiendaCategoryCoverPrimary(slug);
  const coverLiteral = tiendaCategoryCoverLiteral(slug);
  const isBusinessCards = slug === "business-cards";
  const isPromo = slug === "promo-products";
  const hints = categoryHeroHints(lang, slug);

  return (
    <header
      className={[
        "relative overflow-hidden rounded-[2rem] border shadow-[0_28px_100px_rgba(0,0,0,0.45)]",
        isPromo
          ? "border-[rgba(201,168,74,0.35)] bg-[linear-gradient(165deg,rgba(201,168,74,0.10),rgba(255,255,255,0.04),rgba(255,255,255,0.02))]"
          : "border-[rgba(255,255,255,0.10)] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))]",
      ].join(" ")}
    >
      <div className="grid gap-0 lg:grid-cols-[1.05fr_0.75fr] lg:gap-0">
        <div className="relative z-10 p-7 sm:p-10 lg:p-11 lg:pr-8">
          <div className="pointer-events-none absolute inset-0 lg:hidden">
            <div className="absolute -top-32 -right-24 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(201,168,74,0.18),rgba(0,0,0,0))]" />
          </div>
          <div className="relative">
            <div className={["inline-flex rounded-full border px-3 py-1 text-[11px] tracking-wide uppercase", a.chip].join(" ")}>
              {eyebrow ?? (lang === "en" ? "Category" : "Categoría")}
            </div>
            <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white">{title}</h1>
            <p className="mt-3 max-w-3xl text-base sm:text-lg leading-relaxed text-[rgba(255,255,255,0.72)]">{desc}</p>
            <p className="mt-5 max-w-3xl text-sm sm:text-base leading-relaxed text-[rgba(255,247,226,0.82)] border-l-2 border-[rgba(201,168,74,0.55)] pl-4">
              {hero}
            </p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {hints.map((line) => (
                <li
                  key={line}
                  className="rounded-full border border-[rgba(255,255,255,0.10)] bg-[rgba(0,0,0,0.22)] px-3 py-1.5 text-xs text-[rgba(255,247,226,0.82)]"
                >
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="relative min-h-[260px] lg:min-h-[340px] border-t border-[rgba(255,255,255,0.08)] lg:border-t-0 lg:border-l">
          <TiendaRemoteFillImage
            primarySrc={coverPrimary}
            fallbackSrc={coverLiteral}
            alt={lang === "en" ? `${title} — category visual` : `${title} — imagen de categoría`}
            className="object-cover object-center"
            sizes="(max-width: 1024px) 100vw, 38vw"
            priority
          />
          <div
            className={
              isBusinessCards
                ? "absolute inset-0 bg-gradient-to-t from-[#070708] via-[#070708]/15 to-transparent lg:bg-gradient-to-l lg:from-transparent lg:via-[#070708]/10 lg:to-[#070708]/88"
                : "absolute inset-0 bg-gradient-to-t from-[#070708] via-[#070708]/20 to-transparent lg:bg-gradient-to-l lg:from-transparent lg:via-[#070708]/15 lg:to-[#070708]/92"
            }
          />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,rgba(201,168,74,0.12),transparent_50%)]" />
          {isPromo ? (
            <div className="pointer-events-none absolute inset-0 opacity-40 mix-blend-soft-light bg-[linear-gradient(135deg,rgba(251,191,36,0.25),transparent_40%,rgba(56,189,248,0.2),transparent_70%,rgba(167,139,250,0.22))]" />
          ) : null}
        </div>
      </div>
    </header>
  );
}
