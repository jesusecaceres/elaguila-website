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
    <div className="relative mt-8 overflow-hidden rounded-2xl border border-[color:var(--lx-border)] bg-[color:var(--lx-section)] p-4 sm:p-5 shadow-[0_22px_70px_rgba(42,36,22,0.08)]">
      <div className="relative">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--lx-lion)]">
        {lang === "en" ? "Promo showroom — pick a lane" : "Showroom promo — elige un carril"}
      </p>
      <p className="mt-1 max-w-3xl text-sm text-[color:var(--lx-muted)]">
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
                "group flex w-[132px] shrink-0 flex-col overflow-hidden rounded-xl border border-[color:var(--lx-border)] bg-[color:var(--lx-card)] shadow-[0_4px_16px_rgba(42,36,22,0.08)] transition hover:border-[color:var(--lx-lion)]/40 hover:-translate-y-0.5",
                lane?.leftBar ?? "",
              ].join(" ")}
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden border-b border-[color:var(--lx-border)]/30">
                <TiendaRemoteFillImage
                  primarySrc={primary}
                  fallbackSrc={literal}
                  alt={title}
                  className="object-cover object-center transition duration-500 group-hover:scale-[1.05]"
                  sizes="132px"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
              </div>
              <div className="p-2.5">
                <div className="line-clamp-2 text-[11px] font-semibold leading-snug text-[color:var(--lx-text)]">{title}</div>
                {lane ? (
                  <div className="mt-1 text-[9px] font-medium uppercase tracking-wide text-[color:var(--lx-muted)]">
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
