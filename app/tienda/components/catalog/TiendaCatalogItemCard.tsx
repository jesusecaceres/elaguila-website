import Link from "next/link";
import type { Lang } from "../../types/tienda";
import type { TiendaCatalogItemRow } from "@/app/lib/tienda/tiendaCatalogTypes";
import { catalogItemPriceSummary } from "@/app/lib/tienda/tiendaCatalogPricing";
import { withLang, tiendaCatalogProductPath } from "../../utils/tiendaRouting";

export function TiendaCatalogItemCard(props: {
  item: TiendaCatalogItemRow;
  lang: Lang;
  imageUrl?: string | null;
}) {
  const { item, lang, imageUrl } = props;
  const title = lang === "en" ? item.title_en : item.title_es;
  const desc = lang === "en" ? item.short_description_en : item.short_description_es;
  const priceLine = catalogItemPriceSummary(item, lang);
  const href = withLang(tiendaCatalogProductPath(item.slug), lang);

  return (
    <Link
      href={href}
      className={[
        "group flex flex-col overflow-hidden rounded-3xl",
        "border border-[rgba(255,255,255,0.10)] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(0,0,0,0.2))]",
        "shadow-[0_18px_60px_rgba(0,0,0,0.35)] transition duration-300 hover:-translate-y-0.5 hover:border-[rgba(201,168,74,0.35)]",
      ].join(" ")}
    >
      <div className="aspect-[16/10] bg-[rgba(0,0,0,0.25)] relative overflow-hidden">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote CMS URLs
          <img src={imageUrl} alt="" className="h-full w-full object-cover opacity-95 group-hover:opacity-100 transition" />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl opacity-40" aria-hidden>
            ◆
          </div>
        )}
        {item.badge_label ? (
          <span className="absolute left-3 top-3 rounded-full border border-[rgba(201,168,74,0.5)] bg-[rgba(0,0,0,0.55)] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[rgba(201,168,74,0.95)]">
            {item.badge_label}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-[rgba(255,255,255,0.68)] line-clamp-3">{desc}</p>
        <div className="mt-4 flex items-end justify-between gap-3 text-sm">
          <span className="text-[rgba(201,168,74,0.9)] font-medium">{priceLine}</span>
          <span className="text-[rgba(255,247,226,0.88)]">{lang === "en" ? "Details →" : "Detalles →"}</span>
        </div>
      </div>
    </Link>
  );
}
