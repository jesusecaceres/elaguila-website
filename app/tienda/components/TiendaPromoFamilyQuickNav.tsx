import Link from "next/link";
import type { Lang, TiendaProductFamilySummary } from "../types/tienda";
import { tiendaProductFamilyCoverLiteral, tiendaProductFamilyCoverPrimary } from "../data/tiendaVisualAssets";
import { promoFamilyLane } from "../data/tiendaMerchandising";
import { withLang } from "../utils/tiendaRouting";
import { TiendaRemoteFillImage } from "./TiendaRemoteFillImage";

/**
 * Horizontal “showroom lanes” for promo-products — quick jump before the main family grid.
 */
export function TiendaPromoFamilyQuickNav(props: { families: TiendaProductFamilySummary[]; lang: Lang }) {
  const { families, lang } = props;

  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-[rgba(201,168,74,0.22)] bg-[linear-gradient(135deg,rgba(201,168,74,0.08),rgba(0,0,0,0.35))] p-4 sm:p-5 shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[rgba(201,168,74,0.88)]">
        {lang === "en" ? "Promo lanes — pick a category" : "Familias promo — elige una"}
      </p>
      <p className="mt-1 max-w-3xl text-sm text-[rgba(255,255,255,0.62)]">
        {lang === "en"
          ? "Each lane is a different vendor-backed product family — Leonix can quote and coordinate production."
          : "Cada carril es una familia distinta con proveedor — Leonix cotiza y coordina la producción."}
      </p>
      <div className="mt-4 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:thin]">
        {families.map((f) => {
          const title = lang === "en" ? f.title.en : f.title.es;
          const lane = promoFamilyLane(f.slug);
          const primary = tiendaProductFamilyCoverPrimary(f.slug, f.categorySlug);
          const literal = tiendaProductFamilyCoverLiteral(f.slug, f.categorySlug);
          return (
            <Link
              key={f.id}
              href={withLang(f.href, lang)}
              className={[
                "group flex w-[132px] shrink-0 flex-col overflow-hidden rounded-xl border border-[rgba(255,255,255,0.10)] bg-[rgba(0,0,0,0.35)] shadow-[0_12px_36px_rgba(0,0,0,0.4)] transition hover:border-[rgba(201,168,74,0.45)] hover:-translate-y-0.5",
                lane?.leftBar ?? "",
              ].join(" ")}
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden border-b border-[rgba(255,255,255,0.06)]">
                <TiendaRemoteFillImage
                  primarySrc={primary}
                  fallbackSrc={literal}
                  alt={title}
                  className="object-cover object-center transition duration-500 group-hover:scale-[1.05]"
                  sizes="132px"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
              </div>
              <div className="p-2.5">
                <div className="line-clamp-2 text-[11px] font-semibold leading-snug text-[rgba(255,247,226,0.95)]">{title}</div>
                {lane ? (
                  <div className="mt-1 text-[9px] font-medium uppercase tracking-wide text-[rgba(255,255,255,0.5)]">
                    {lang === "en" ? lane.label.en : lane.label.es}
                  </div>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
