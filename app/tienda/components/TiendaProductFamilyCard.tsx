import Link from "next/link";
import type { Lang, TiendaProductFamilySummary } from "../types/tienda";
import { withLang } from "../utils/tiendaRouting";
import { TiendaModeBadge } from "./TiendaModeBadge";

function fmtPrice(amount: number, lang: Lang) {
  return new Intl.NumberFormat(lang === "en" ? "en-US" : "es-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function TiendaProductFamilyCard(props: {
  family: TiendaProductFamilySummary;
  lang: Lang;
}) {
  const { family, lang } = props;
  const title = lang === "en" ? family.title.en : family.title.es;
  const desc = lang === "en" ? family.description.en : family.description.es;

  return (
    <Link
      href={withLang(family.href, lang)}
      className={[
        "group relative overflow-hidden rounded-3xl p-6 sm:p-7",
        "bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]",
        "border border-[rgba(255,255,255,0.10)]",
        "shadow-[0_18px_60px_rgba(0,0,0,0.35)]",
        "transition duration-300 ease-out hover:-translate-y-0.5 hover:border-[rgba(201,168,74,0.35)]",
      ].join(" ")}
    >
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
    </Link>
  );
}
