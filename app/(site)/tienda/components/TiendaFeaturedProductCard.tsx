import Link from "next/link";
import type { Lang, TiendaFeaturedProduct } from "../types/tienda";
import {
  tiendaProductFamilyCoverLiteral,
  tiendaProductFamilyCoverPrimary,
  tiendaProductFamilyImageClass,
} from "../data/tiendaVisualAssets";
import { withLang } from "../utils/tiendaRouting";
import { TiendaRemoteFillImage } from "./TiendaRemoteFillImage";

function fmtStartingAt(amount: number, lang: Lang) {
  const money = new Intl.NumberFormat(lang === "en" ? "en-US" : "es-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
  return lang === "en" ? `Starting at ${money}` : `Desde ${money}`;
}

export function TiendaFeaturedProductCard(props: { product: TiendaFeaturedProduct; lang: Lang }) {
  const { product, lang } = props;
  const title = lang === "en" ? product.title.en : product.title.es;
  const desc = lang === "en" ? product.description.en : product.description.es;
  const badge = lang === "en" ? product.badge.en : product.badge.es;
  const coverPrimary = tiendaProductFamilyCoverPrimary(product.slug, product.categorySlug);
  const coverLiteral = tiendaProductFamilyCoverLiteral(product.slug, product.categorySlug);

  return (
    <Link
      href={withLang(product.href, lang)}
      className={[
        "group relative flex flex-col overflow-hidden rounded-3xl",
        "border border-[rgba(201,180,106,0.32)]",
        "bg-[linear-gradient(180deg,rgba(255,252,247,0.97),rgba(255,250,240,0.93))]",
        "shadow-[0_18px_60px_rgba(0,0,0,0.35)]",
        "transition duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_26px_85px_rgba(201,168,74,0.18)] hover:border-[rgba(201,168,74,0.4)]",
      ].join(" ")}
      aria-label={title}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-[rgba(30,24,16,0.08)]">
        <TiendaRemoteFillImage
          primarySrc={coverPrimary}
          fallbackSrc={coverLiteral}
          alt={lang === "en" ? `${title} — product` : `${title} — producto`}
          className={[
            tiendaProductFamilyImageClass(product.slug),
            "transition duration-500 group-hover:scale-[1.04]",
          ].join(" ")}
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div
          className={
            product.slug === "two-sided-business-cards"
              ? "absolute inset-0 bg-gradient-to-t from-[rgba(30,24,16,0.38)] via-transparent to-transparent opacity-95"
              : "absolute inset-0 bg-gradient-to-t from-[rgba(30,24,16,0.5)] via-transparent to-[rgba(201,168,74,0.08)] opacity-90"
          }
        />
      </div>

      <div className="pointer-events-none absolute left-3 right-3 top-3 opacity-0 transition duration-300 group-hover:opacity-100 sm:opacity-100">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(201,168,74,0.45)] bg-[rgba(255,252,247,0.92)] px-3 py-1 text-[11px] tracking-wide uppercase text-[color:rgba(30,24,16,0.86)] shadow-sm backdrop-blur-sm">
            {badge}
          </span>
          {product.uploadReady ? (
            <span className="hidden sm:inline-flex rounded-full border border-black/10 bg-black/55 px-3 py-1 text-[11px] tracking-wide text-white backdrop-blur-sm">
              {lang === "en" ? "Upload-ready path" : "Ruta con subida"}
            </span>
          ) : null}
        </div>
      </div>

      <div className="relative flex flex-1 flex-col p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 sm:hidden">
            <span className="inline-flex rounded-full border border-[rgba(201,168,74,0.45)] bg-[rgba(201,168,74,0.12)] px-3 py-1 text-[11px] tracking-wide uppercase text-[color:rgba(30,24,16,0.86)]">
              {badge}
            </span>
          </div>

          <span className="ml-auto inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white/80 text-[color:rgba(30,24,16,0.70)] transition group-hover:bg-[rgba(201,168,74,0.14)] group-hover:border-[rgba(201,168,74,0.35)]">
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

        <h3 className="mt-4 text-xl sm:text-2xl font-semibold tracking-tight text-[color:var(--lx-text)]">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-[color:rgba(61,52,40,0.86)]">{desc}</p>

        <div className="mt-5 flex flex-1 flex-col justify-end gap-1 border-t border-black/5 pt-4">
          <div className="text-sm text-[color:rgba(61,52,40,0.76)]">{fmtStartingAt(product.startingPrice.amount, lang)}</div>
          <div className="text-[11px] leading-relaxed text-[color:rgba(61,52,40,0.62)]">
            {lang === "en"
              ? "Reference pricing — final total confirmed with Leonix on your order review."
              : "Precio de referencia — el total final lo confirma Leonix al revisar tu pedido."}
          </div>
        </div>
      </div>
    </Link>
  );
}
