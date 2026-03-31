import Image from "next/image";
import type { Lang, TiendaProductFamily } from "../types/tienda";
import { tiendaProductFamilyCoverImage } from "../data/tiendaVisualAssets";
import { TiendaModeBadge } from "./TiendaModeBadge";

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
  const coverSrc = tiendaProductFamilyCoverImage(product.slug, product.categorySlug);

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
        <div className="relative flex min-h-[240px] flex-col border-t border-[rgba(255,255,255,0.08)] lg:min-h-0 lg:border-t-0 lg:border-l">
          <div className="relative min-h-[200px] flex-1 lg:min-h-[280px]">
            <Image
              src={coverSrc}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 400px"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#070708]/85 via-transparent to-transparent lg:bg-gradient-to-l" />
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
