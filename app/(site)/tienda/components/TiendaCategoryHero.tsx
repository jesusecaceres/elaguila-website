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
        "relative overflow-hidden rounded-[2rem] border shadow-[0_12px_48px_rgba(42,36,22,0.12)]",
        isPromo
          ? "border-[color:var(--lx-lion)]/30 bg-[color:var(--lx-card)]"
          : "border-[color:var(--lx-border)] bg-[color:var(--lx-card)]",
      ].join(" ")}
    >
      <div className="grid gap-0 lg:grid-cols-[1.05fr_0.75fr] lg:gap-0">
        <div className="relative z-10 p-7 sm:p-10 lg:p-11 lg:pr-8">
          <div className="pointer-events-none absolute inset-0 lg:hidden">
            <div className="absolute -top-32 -right-24 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(201,168,74,0.10),transparent)]" />
          </div>
          <div className="relative">
            <div className={["inline-flex rounded-full border px-3 py-1 text-[11px] tracking-wide uppercase", a.chip].join(" ")}>
              {eyebrow ?? (lang === "en" ? "Category" : "Categoría")}
            </div>
            <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-[color:var(--lx-text)]">{title}</h1>
            <p className="mt-3 max-w-3xl text-base sm:text-lg leading-relaxed text-[color:var(--lx-muted)]">{desc}</p>
            <p className="mt-5 max-w-3xl text-sm sm:text-base leading-relaxed text-[color:var(--lx-text)]/80 border-l-2 border-[color:var(--lx-lion)]/55 pl-4">
              {hero}
            </p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {hints.map((line) => (
                <li
                  key={line}
                  className="rounded-full border border-[color:var(--lx-border)] bg-[color:var(--lx-section)] px-3 py-1.5 text-xs text-[color:var(--lx-muted)]"
                >
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="relative min-h-[260px] lg:min-h-[340px] border-t border-[color:var(--lx-border)] lg:border-t-0 lg:border-l">
          <TiendaRemoteFillImage
            primarySrc={coverPrimary}
            fallbackSrc={coverLiteral}
            alt={lang === "en" ? `${title} — category visual` : `${title} — imagen de categoría`}
            className="object-cover object-center"
            sizes="(max-width: 1024px) 100vw, 38vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(255,252,247,0.90)] via-[rgba(255,252,247,0.12)] to-transparent lg:bg-gradient-to-l lg:from-transparent lg:via-[rgba(255,252,247,0.10)] lg:to-[rgba(255,252,247,0.94)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,rgba(201,168,74,0.08),transparent_50%)]" />
          {isPromo ? (
            <div className="pointer-events-none absolute inset-0 opacity-25 mix-blend-soft-light bg-[linear-gradient(135deg,rgba(251,191,36,0.25),transparent_40%,rgba(56,189,248,0.2),transparent_70%,rgba(167,139,250,0.22))]" />
          ) : null}
        </div>
      </div>
    </header>
  );
}
