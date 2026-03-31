import type { Lang, TiendaProductFamily } from "../types/tienda";
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

  return (
    <header className="relative overflow-hidden rounded-[2rem] border border-[rgba(255,255,255,0.10)] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-7 sm:p-10 lg:p-11 shadow-[0_28px_100px_rgba(0,0,0,0.45)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -bottom-36 -left-20 h-96 w-96 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,252,247,0.10),rgba(0,0,0,0))]" />
      </div>
      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
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
          <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white">{title}</h1>
          <p className="mt-3 text-base sm:text-lg leading-relaxed text-[rgba(255,255,255,0.72)]">{desc}</p>
          <p className="mt-4 text-sm sm:text-base leading-relaxed text-[rgba(255,255,255,0.68)]">{longDesc}</p>
        </div>
        <div className="rounded-2xl border border-[rgba(201,168,74,0.28)] bg-[rgba(201,168,74,0.10)] px-6 py-5 text-right shrink-0">
          <div className="text-[11px] tracking-[0.14em] uppercase text-[rgba(255,247,226,0.72)]">
            {lang === "en" ? "Starting at" : "Desde"}
          </div>
          <div className="mt-1 text-3xl font-semibold text-[rgba(255,247,226,0.95)] tabular-nums">
            {fmtPrice(product.startingPrice.amount, lang)}
          </div>
        </div>
      </div>
    </header>
  );
}
