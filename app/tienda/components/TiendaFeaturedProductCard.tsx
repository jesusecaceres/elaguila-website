import Link from "next/link";
import type { Lang, TiendaFeaturedProduct } from "../types/tienda";
import { withLang } from "../utils/tiendaRouting";

function fmtStartingAt(amount: number, lang: Lang) {
  const money = new Intl.NumberFormat(lang === "en" ? "en-US" : "es-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
  return lang === "en" ? `Starting at ${money}` : `Desde ${money}`;
}

export function TiendaFeaturedProductCard(props: {
  product: TiendaFeaturedProduct;
  lang: Lang;
}) {
  const { product, lang } = props;
  const title = lang === "en" ? product.title.en : product.title.es;
  const desc = lang === "en" ? product.description.en : product.description.es;
  const badge = lang === "en" ? product.badge.en : product.badge.es;

  return (
    <Link
      href={withLang(product.href, lang)}
      className={[
        "group relative overflow-hidden rounded-3xl p-6 sm:p-7",
        "bg-[linear-gradient(180deg,rgba(255,252,247,0.96),rgba(255,252,247,0.90))]",
        "border border-[rgba(201,180,106,0.30)]",
        "shadow-[0_18px_60px_rgba(0,0,0,0.35)]",
        "transition duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_24px_80px_rgba(0,0,0,0.42)]",
      ].join(" ")}
      aria-label={title}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100">
        <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-[radial-gradient(circle_at_center,rgba(201,168,74,0.28),rgba(255,255,255,0))]" />
      </div>

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="inline-flex items-center gap-2">
            <span className="inline-flex rounded-full border border-[rgba(201,168,74,0.45)] bg-[rgba(201,168,74,0.14)] px-3 py-1 text-[11px] tracking-wide uppercase text-[color:rgba(30,24,16,0.86)]">
              {badge}
            </span>
            {product.uploadReady ? (
              <span className="hidden sm:inline-flex rounded-full border border-black/10 bg-white/70 px-3 py-1 text-[11px] tracking-wide text-[color:rgba(30,24,16,0.70)]">
                {lang === "en" ? "Easy online order" : "Orden en línea"}
              </span>
            ) : null}
          </div>

          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/70 text-[color:rgba(30,24,16,0.70)] transition group-hover:bg-[rgba(201,168,74,0.12)] group-hover:border-[rgba(201,168,74,0.35)]">
            <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none">
              <path
                d="M7.5 4.5L13.5 10l-6 5.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>

        <h3 className="mt-5 text-xl sm:text-2xl font-semibold tracking-tight text-[color:var(--lx-text)]">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-[color:rgba(61,52,40,0.86)]">
          {desc}
        </p>

        <div className="mt-5 flex items-end justify-between gap-6">
          <div>
            <div className="text-sm text-[color:rgba(61,52,40,0.76)]">
              {fmtStartingAt(product.startingPrice.amount, lang)}
            </div>
            <div className="mt-1 text-[11px] text-[color:rgba(61,52,40,0.66)]">
              {lang === "en" ? "Configurator coming next" : "Configurador próximamente"}
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-[color:var(--lx-text)]">
            {lang === "en" ? "View options" : "Ver opciones"}
          </div>
        </div>
      </div>
    </Link>
  );
}

