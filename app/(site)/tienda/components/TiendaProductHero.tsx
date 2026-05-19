import type { Lang, TiendaProductFamily } from "../types/tienda";
import {
  tiendaProductFamilyCoverLiteral,
  tiendaProductFamilyCoverPrimary,
  tiendaProductFamilyImageClass,
} from "../data/tiendaVisualAssets";
import { TiendaModeBadge } from "./TiendaModeBadge";
import { TiendaRemoteFillImage } from "./TiendaRemoteFillImage";

function fmtPrice(amount: number, lang: Lang) {
  return new Intl.NumberFormat(lang === "en" ? "en-US" : "es-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function TiendaProductHero(props: { product: TiendaProductFamily; lang: Lang }) {
  const { product, lang } = props;
  const title = lang === "en" ? product.title.en : product.title.es;
  const desc = lang === "en" ? product.description.en : product.description.es;
  const longDesc = lang === "en" ? product.longDescription.en : product.longDescription.es;
  const coverPrimary = tiendaProductFamilyCoverPrimary(product.slug, product.categorySlug);
  const coverLiteral = tiendaProductFamilyCoverLiteral(product.slug, product.categorySlug);

  return (
    <header className="relative overflow-hidden rounded-[2rem] border border-[color:var(--lx-border)] bg-[color:var(--lx-card)] shadow-[0_12px_48px_rgba(42,36,22,0.12)]">
      <div className="grid gap-0 lg:grid-cols-[1fr_min(38%,420px)]">
        <div className="relative p-7 sm:p-10 lg:p-11">
          <div className="relative flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <TiendaModeBadge mode={product.productMode} lang={lang} />
              {product.comingSoon ? (
                <span className="inline-flex rounded-full border border-[color:var(--lx-border)] bg-[color:var(--lx-section)] px-3 py-1 text-[11px] font-semibold tracking-wide uppercase text-[color:var(--lx-muted)]">
                  {lang === "en" ? "Coming soon" : "Próximamente"}
                </span>
              ) : null}
              {product.badges.slice(0, 2).map((b, i) => (
                <span
                  key={i}
                  className="inline-flex rounded-full border border-[color:var(--lx-border)] bg-[color:var(--lx-section)] px-3 py-1 text-[11px] tracking-wide text-[color:var(--lx-muted)]"
                >
                  {lang === "en" ? b.en : b.es}
                </span>
              ))}
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-[color:var(--lx-text)]">{title}</h1>
            <p className="text-base sm:text-lg leading-relaxed text-[color:var(--lx-muted)] max-w-3xl">{desc}</p>
            <p className="text-sm sm:text-base leading-relaxed text-[color:var(--lx-muted)] max-w-3xl">{longDesc}</p>
            {product.specs.length > 0 ? (
              <ul className="mt-5 flex flex-wrap gap-2">
                {product.specs.slice(0, 5).map((s, i) => (
                  <li
                    key={i}
                    className="rounded-full border border-[color:var(--lx-lion)]/30 bg-[color:var(--lx-lion)]/10 px-3 py-1.5 text-xs text-[color:var(--lx-text)]"
                  >
                    {lang === "en" ? s.en : s.es}
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="mt-2 inline-flex flex-wrap items-center gap-3 lg:hidden">
              <div className="rounded-2xl border border-[color:var(--lx-border)] bg-[color:var(--lx-section)] px-5 py-3">
                <div className="text-[11px] tracking-[0.14em] uppercase text-[color:var(--lx-muted)]">
                  {lang === "en" ? "Starting at" : "Desde"}
                </div>
                <div className="mt-0.5 text-2xl font-semibold text-[color:var(--lx-text)] tabular-nums">
                  {fmtPrice(product.startingPrice.amount, lang)}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="relative flex min-h-[260px] flex-col border-t border-[color:var(--lx-border)] lg:min-h-0 lg:border-t-0 lg:border-l">
          <div className="relative min-h-[240px] flex-1 lg:min-h-[340px]">
            <TiendaRemoteFillImage
              primarySrc={coverPrimary}
              fallbackSrc={coverLiteral}
              alt={lang === "en" ? `${title} — product` : `${title} — producto`}
              className={tiendaProductFamilyImageClass(product.slug)}
              sizes="(max-width: 1024px) 100vw, 400px"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[rgba(255,252,247,0.92)] via-[rgba(255,252,247,0.12)] to-transparent lg:bg-gradient-to-l lg:from-transparent lg:via-[rgba(255,252,247,0.10)] lg:to-[rgba(255,252,247,0.94)]" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,rgba(201,168,74,0.08),transparent_55%)]" />
          </div>
          <div className="relative hidden border-t border-[color:var(--lx-border)] bg-[color:var(--lx-canvas)] px-6 py-5 lg:block">
            <div className="text-[11px] tracking-[0.14em] uppercase text-[color:var(--lx-muted)]">
              {lang === "en" ? "Starting at" : "Desde"}
            </div>
            <div className="mt-1 text-3xl font-semibold text-[color:var(--lx-text)] tabular-nums text-right">
              {fmtPrice(product.startingPrice.amount, lang)}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
