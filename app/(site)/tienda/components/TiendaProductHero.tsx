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
    <header className="relative overflow-hidden rounded-[2rem] border border-[rgba(255,255,255,0.10)] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] shadow-[0_28px_100px_rgba(0,0,0,0.45)]">
      <div className="grid gap-0 lg:grid-cols-[1fr_min(38%,420px)]">
        <div className="relative p-7 sm:p-10 lg:p-11">
          <div className="pointer-events-none absolute inset-0 lg:hidden">
            <div className="absolute -bottom-36 -left-20 h-96 w-96 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,252,247,0.10),rgba(0,0,0,0))]" />
          </div>
          <div className="relative flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <TiendaModeBadge mode={product.productMode} lang={lang} />
              {product.comingSoon ? (
                <span className="inline-flex rounded-full border border-[rgba(255,255,255,0.16)] bg-[rgba(255,255,255,0.06)] px-3 py-1 text-[11px] font-semibold tracking-wide uppercase text-[rgba(255,255,255,0.78)]">
                  {lang === "en" ? "Coming soon" : "Próximamente"}
                </span>
              ) : null}
              {product.badges.slice(0, 2).map((b, i) => (
                <span
                  key={i}
                  className="inline-flex rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(0,0,0,0.18)] px-3 py-1 text-[11px] tracking-wide text-[rgba(255,247,226,0.78)]"
                >
                  {lang === "en" ? b.en : b.es}
                </span>
              ))}
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white">{title}</h1>
            <p className="text-base sm:text-lg leading-relaxed text-[rgba(255,255,255,0.72)] max-w-3xl">{desc}</p>
            <p className="text-sm sm:text-base leading-relaxed text-[rgba(255,255,255,0.68)] max-w-3xl">{longDesc}</p>
            {product.specs.length > 0 ? (
              <ul className="mt-5 flex flex-wrap gap-2">
                {product.specs.slice(0, 5).map((s, i) => (
                  <li
                    key={i}
                    className="rounded-full border border-[rgba(201,168,74,0.28)] bg-[rgba(201,168,74,0.08)] px-3 py-1.5 text-xs text-[rgba(255,247,226,0.88)]"
                  >
                    {lang === "en" ? s.en : s.es}
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="mt-2 inline-flex flex-wrap items-center gap-3 lg:hidden">
              <div className="rounded-2xl border border-[rgba(201,168,74,0.28)] bg-[rgba(201,168,74,0.10)] px-5 py-3">
                <div className="text-[11px] tracking-[0.14em] uppercase text-[rgba(255,247,226,0.72)]">
                  {lang === "en" ? "Starting at" : "Desde"}
                </div>
                <div className="mt-0.5 text-2xl font-semibold text-[rgba(255,247,226,0.95)] tabular-nums">
                  {fmtPrice(product.startingPrice.amount, lang)}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="relative flex min-h-[260px] flex-col border-t border-[rgba(255,255,255,0.08)] lg:min-h-0 lg:border-t-0 lg:border-l">
          <div className="relative min-h-[240px] flex-1 lg:min-h-[340px]">
            <TiendaRemoteFillImage
              primarySrc={coverPrimary}
              fallbackSrc={coverLiteral}
              alt={lang === "en" ? `${title} — product` : `${title} — producto`}
              className={tiendaProductFamilyImageClass(product.slug)}
              sizes="(max-width: 1024px) 100vw, 400px"
              priority
            />
            <div
              className={
                product.slug === "two-sided-business-cards"
                  ? "absolute inset-0 bg-gradient-to-r from-[#070708]/72 via-[#070708]/08 to-transparent lg:bg-gradient-to-l lg:from-transparent lg:via-[#070708]/10 lg:to-[#070708]/82"
                  : "absolute inset-0 bg-gradient-to-r from-[#070708]/88 via-[#070708]/15 to-transparent lg:bg-gradient-to-l lg:from-transparent lg:via-[#070708]/20 lg:to-[#070708]/88"
              }
            />
            <div
              className={
                product.slug === "two-sided-business-cards"
                  ? "pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,rgba(201,168,74,0.08),transparent_55%)]"
                  : "pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,rgba(201,168,74,0.14),transparent_55%)]"
              }
            />
          </div>
          <div className="relative hidden border-t border-[rgba(201,168,74,0.2)] bg-[rgba(0,0,0,0.35)] px-6 py-5 lg:block">
            <div className="text-[11px] tracking-[0.14em] uppercase text-[rgba(255,247,226,0.72)]">
              {lang === "en" ? "Starting at" : "Desde"}
            </div>
            <div className="mt-1 text-3xl font-semibold text-[rgba(255,247,226,0.95)] tabular-nums text-right">
              {fmtPrice(product.startingPrice.amount, lang)}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
