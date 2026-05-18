import {
  resolveCategoryListingMonetization,
  type CategoryListingMonetizationSummary,
  type ToolState,
} from "@/app/lib/listingPlans/categoryListingMonetization";

type Lang = "es" | "en";

type Props = {
  category?: string | null;
  source?: string | null;
  listing: Record<string, unknown>;
  detailPairs?: unknown;
  lang?: Lang;
};

const TOOL_ORDER: Array<{
  key: keyof CategoryListingMonetizationSummary["tools"];
  label: Record<Lang, string>;
}> = [
  { key: "republish", label: { es: "Refrescado", en: "Republish" } },
  { key: "moveToTop", label: { es: "Subir", en: "Move top" } },
  { key: "featured", label: { es: "Destacado", en: "Featured" } },
  { key: "verified", label: { es: "Verificar", en: "Verify" } },
  { key: "boost", label: { es: "Impulsado", en: "Boost" } },
  { key: "autoRefresh", label: { es: "Auto refresh", en: "Auto Refresh" } },
  { key: "analytics", label: { es: "Analytics", en: "Analytics" } },
  { key: "leads", label: { es: "Leads", en: "Leads" } },
  { key: "concierge", label: { es: "Concierge", en: "Concierge" } },
  { key: "expirationRenewal", label: { es: "Expira/renueva", en: "Expire/renew" } },
];

function boolText(value: boolean | null | undefined, lang: Lang): string | null {
  if (value == null) return null;
  if (lang === "es") return value ? "si" : "no";
  return value ? "yes" : "no";
}

function statusClass(status: ToolState["status"]): string {
  switch (status) {
    case "available":
      return "border-emerald-200 bg-emerald-50 text-emerald-950";
    case "locked":
      return "border-stone-200 bg-stone-50 text-stone-700";
    case "unsupported":
      return "border-slate-200 bg-slate-50 text-slate-700";
    case "future":
      return "border-amber-200 bg-amber-50 text-amber-950";
    case "unknown":
    default:
      return "border-[#E8DFD0] bg-white text-[#5C5346]";
  }
}

function compactDate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const d = new Date(raw);
  if (!Number.isFinite(d.getTime())) return raw;
  return d.toISOString().slice(0, 10);
}

export function AdminListingMonetizationSummary({
  category,
  source = "listings",
  listing,
  detailPairs,
  lang = "es",
}: Props) {
  const summary = resolveCategoryListingMonetization({
    category,
    source,
    listing,
    detailPairs,
  });
  const meta = summary.metadata;
  const metadataBits = [
    meta.leonixAdId ? `LX ${meta.leonixAdId}` : null,
    meta.sourceId ? `id ${meta.sourceId.slice(0, 8)}` : null,
    meta.slug ? `slug ${meta.slug}` : null,
    meta.republishedAt ? `ref ${compactDate(meta.republishedAt)}` : null,
    meta.republishCount != null ? `ref# ${meta.republishCount}` : null,
    meta.expiresAt ? `exp ${compactDate(meta.expiresAt)}` : null,
    boolText(meta.promoted, lang) ? `${lang === "es" ? "promovido" : "promoted"} ${boolText(meta.promoted, lang)}` : null,
    boolText(meta.featured, lang) ? `${lang === "es" ? "featured" : "featured"} ${boolText(meta.featured, lang)}` : null,
    boolText(meta.verified, lang) ? `${lang === "es" ? "verif" : "verified"} ${boolText(meta.verified, lang)}` : null,
  ].filter((bit): bit is string => Boolean(bit));

  return (
    <div
      className="min-w-[16rem] max-w-[24rem] rounded-xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/90 p-2 text-[10px] leading-snug text-[#5C5346]"
      title={lang === "es" ? "Solo lectura: no activa monetizacion ni herramientas." : "Read-only: does not activate monetization or tools."}
    >
      <div className="flex flex-wrap items-center gap-1">
        <span className="rounded-full bg-[#2A2620] px-2 py-0.5 font-bold text-[#FAF7F2]">
          {summary.planLabel || (lang === "es" ? "Plan no especificado" : "Unspecified plan")}
        </span>
        <span className="rounded-full border border-[#E8DFD0] bg-white px-2 py-0.5 font-semibold text-[#5C5346]">
          {summary.category}
        </span>
      </div>
      <p className="mt-1 text-[10px] text-[#7A7164]">
        {lang === "es" ? "Fuente" : "Source"}: {summary.planSource}
      </p>
      {summary.accountTierIgnored ? (
        <p className="mt-1 font-semibold text-[#7A7164]">
          {lang === "es" ? "Cuenta ignorada: usa metadata del anuncio." : "Account tier ignored: listing metadata only."}
        </p>
      ) : null}
      {metadataBits.length ? (
        <p className="mt-1 text-[#5C5346]">{metadataBits.join(" · ")}</p>
      ) : (
        <p className="mt-1 text-[#9A9084]">{lang === "es" ? "Sin metadata segura en la fila." : "No safe row metadata."}</p>
      )}
      <div className="mt-2 flex flex-wrap gap-1">
        {TOOL_ORDER.map(({ key, label }) => {
          const state = summary.tools[key];
          return (
            <span
              key={key}
              className={`rounded-full border px-1.5 py-0.5 font-semibold ${statusClass(state.status)}`}
              title={state.reason ? `${state.label}: ${state.reason}` : state.label}
            >
              {label[lang]}: {state.status}
            </span>
          );
        })}
      </div>
      {summary.warnings.length ? (
        <div className="mt-2 space-y-0.5 text-[10px] text-amber-950">
          {summary.warnings.slice(0, 3).map((warning) => (
            <p key={warning}>Gap: {warning}</p>
          ))}
          {summary.warnings.length > 3 ? <p>Gap: +{summary.warnings.length - 3}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
