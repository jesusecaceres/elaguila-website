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
    <div className="relative mt-8 overflow-hidden rounded-2xl border border-[rgba(201,168,74,0.28)] p-4 sm:p-5 shadow-[0_22px_70px_rgba(0,0,0,0.45)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,rgba(201,168,74,0.12),rgba(40,32,24,0.55),rgba(0,0,0,0.55))]" />
      <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.2),transparent_65%)]" />
      <div className="pointer-events-none absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-[radial-gradient(circle_at_center,rgba(167,139,250,0.18),transparent_60%)]" />
      <div className="pointer-events-none absolute right-1/3 bottom-0 h-32 w-32 rounded-full bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.15),transparent_55%)]" />
      <div className="relative">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[rgba(201,168,74,0.9)]">
        {lang === "en" ? "Promo showroom — pick a lane" : "Showroom promo — elige un carril"}
      </p>
      <p className="mt-1 max-w-3xl text-sm text-[rgba(255,255,255,0.68)]">
        {lang === "en"
          ? "Drinkware, bags, pens, desk, giveaways, apparel — Leonix sources and quotes real vendor options."
          : "Drinkware, bolsas, bolígrafos, escritorio, regalos, apparel — Leonix cotiza opciones reales de proveedor."}
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
                "group flex w-[132px] shrink-0 flex-col overflow-hidden rounded-xl border border-[rgba(255,255,255,0.14)] bg-[rgba(12,12,16,0.65)] shadow-[0_12px_36px_rgba(0,0,0,0.45)] backdrop-blur-[2px] transition hover:border-[rgba(201,168,74,0.5)] hover:-translate-y-0.5",
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
    </div>
  );
}
