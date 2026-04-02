import Link from "next/link";
import type { Lang, TiendaProductFamilySummary } from "../types/tienda";
import { tiendaProductFamilyCoverLiteral, tiendaProductFamilyCoverPrimary } from "../data/tiendaVisualAssets";
import { withLang } from "../utils/tiendaRouting";
import { TiendaModeBadge } from "./TiendaModeBadge";
import { TiendaRemoteFillImage } from "./TiendaRemoteFillImage";

function fmtPrice(amount: number, lang: Lang) {
  return new Intl.NumberFormat(lang === "en" ? "en-US" : "es-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function TiendaProductFamilyCard(props: { family: TiendaProductFamilySummary; lang: Lang }) {
  const { family, lang } = props;
  const title = lang === "en" ? family.title.en : family.title.es;
  const desc = lang === "en" ? family.description.en : family.description.es;
  const coverPrimary = tiendaProductFamilyCoverPrimary(family.slug, family.categorySlug);
  const coverLiteral = tiendaProductFamilyCoverLiteral(family.slug, family.categorySlug);

  return (
    <Link
      href={withLang(family.href, lang)}
      className={[
        "group relative flex flex-col overflow-hidden rounded-3xl",
        "bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]",
        "border border-[rgba(255,255,255,0.10)]",
        "shadow-[0_18px_60px_rgba(0,0,0,0.35)]",
        "transition duration-300 ease-out hover:-translate-y-1 hover:border-[rgba(201,168,74,0.4)] hover:shadow-[0_24px_70px_rgba(0,0,0,0.45)]",
      ].join(" ")}
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-[rgba(255,255,255,0.06)]">
        <TiendaRemoteFillImage
          primarySrc={coverPrimary}
          fallbackSrc={coverLiteral}
          alt={lang === "en" ? `${title} — product family` : `${title} — familia de producto`}
          className="object-cover object-center transition duration-500 group-hover:scale-[1.04]"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070708]/92 via-[#070708]/30 to-[rgba(201,168,74,0.06)]" />
      </div>

      <div className="relative flex flex-1 flex-col p-6 sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <TiendaModeBadge mode={family.productMode} lang={lang} />
          {family.comingSoon ? (
            <span className="inline-flex rounded-full border border-[rgba(255,255,255,0.14)] px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[rgba(255,255,255,0.72)]">
              {lang === "en" ? "Soon" : "Pronto"}
            </span>
          ) : null}
        </div>
        <h3 className="mt-4 text-xl font-semibold tracking-tight text-white">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-[rgba(255,255,255,0.70)]">{desc}</p>
        <div className="mt-5 flex items-end justify-between gap-4">
          <div className="text-sm text-[rgba(255,247,226,0.80)] tabular-nums">
            {lang === "en" ? "From " : "Desde "}
            {fmtPrice(family.startingPrice.amount, lang)}
          </div>
          <span className="text-sm font-medium text-[rgba(255,247,226,0.88)]">
            {lang === "en" ? "View →" : "Ver →"}
          </span>
        </div>
      </div>
    </Link>
  );
}
