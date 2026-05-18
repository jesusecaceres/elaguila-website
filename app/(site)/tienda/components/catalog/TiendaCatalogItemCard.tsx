import Link from "next/link";
import type { Lang } from "../../types/tienda";
import type { TiendaCatalogItemRow } from "@/app/lib/tienda/tiendaCatalogTypes";
import { catalogItemPriceSummary } from "@/app/lib/tienda/tiendaCatalogPricing";
import { tiendaCatalogCoverLiteral, tiendaCatalogCoverPrimary } from "../../data/tiendaVisualAssets";
import { withLang, tiendaCatalogProductPath } from "../../utils/tiendaRouting";
import { TiendaRemoteFillImage } from "../TiendaRemoteFillImage";

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
  const categoryLiteral = tiendaCatalogCoverLiteral(item.category_slug);
  const displaySrc = imageUrl?.trim() ? imageUrl.trim() : tiendaCatalogCoverPrimary(item.category_slug);
  const fallbackSrc = categoryLiteral;
  const imgUnoptimized = !displaySrc.includes("images.unsplash.com");

  return (
    <Link
      href={href}
      className={[
        "group flex flex-col overflow-hidden rounded-3xl",
        "border border-[color:var(--lx-border)] bg-[color:var(--lx-card)]",
        "shadow-[0_18px_48px_rgba(42,36,22,0.10)] transition duration-300 hover:-translate-y-0.5 hover:border-[color:var(--lx-lion)] hover:shadow-[0_22px_60px_rgba(201,120,47,0.12)]",
      ].join(" ")}
    >
      <div className="aspect-[16/10] bg-[color:var(--lx-canvas)] relative overflow-hidden">
        <TiendaRemoteFillImage
          primarySrc={displaySrc}
          fallbackSrc={fallbackSrc}
          alt={lang === "en" ? `${title} — catalog` : `${title} — catálogo`}
          className="object-cover object-center opacity-[0.96] transition duration-300 group-hover:opacity-100 group-hover:scale-[1.02]"
          sizes="(max-width: 768px) 100vw, 50vw"
          unoptimized={imgUnoptimized}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-[rgba(201,168,74,0.06)]" />
        {!imageUrl?.trim() ? (
          <span className="absolute bottom-2 left-3 right-3 text-[10px] font-medium uppercase tracking-wide text-white/75">
            {lang === "en" ? "Representative preview" : "Vista representativa"}
          </span>
        ) : null}
        {item.badge_label ? (
          <span className="absolute left-3 top-3 rounded-full border border-[rgba(201,168,74,0.5)] bg-[rgba(0,0,0,0.55)] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[rgba(201,168,74,0.95)]">
            {item.badge_label}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h3 className="text-lg font-semibold text-[color:var(--lx-text)]">{title}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-[color:var(--lx-text-2)]/85 line-clamp-3">{desc}</p>
        <div className="mt-4 flex items-end justify-between gap-3 text-sm">
          <span className="text-[color:var(--lx-lion)] font-medium">{priceLine}</span>
          <span className="text-[color:var(--lx-text-2)]">{lang === "en" ? "Details →" : "Detalles →"}</span>
        </div>
      </div>
    </Link>
  );
}
