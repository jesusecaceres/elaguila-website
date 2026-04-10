import type { ServiciosLang } from "@/app/servicios/types/serviciosBusinessProfile";
import { formatServiciosInternalGroupForDiscovery } from "./lib/serviciosInternalGroupDisplay";
import type { ServiciosResultsFilterQuery } from "./lib/serviciosResultsFilter";

/**
 * Human-readable active filter state for trust and recovery UX (URL-driven).
 */
export function ServiciosResultsActiveSummary({
  lang,
  query,
}: {
  lang: ServiciosLang;
  query: ServiciosResultsFilterQuery;
}) {
  const items: { key: string; label: string }[] = [];

  if (query.q?.trim()) {
    items.push({
      key: "q",
      label:
        lang === "en"
          ? `Keywords: “${query.q.trim()}”`
          : `Palabras clave: «${query.q.trim()}»`,
    });
  }
  if (query.city?.trim()) {
    items.push({
      key: "city",
      label: lang === "en" ? `Area: ${query.city.trim()}` : `Zona: ${query.city.trim()}`,
    });
  }
  if (query.group?.trim()) {
    const g = formatServiciosInternalGroupForDiscovery(query.group, lang) ?? query.group;
    items.push({
      key: "group",
      label: lang === "en" ? `Trade: ${g}` : `Giro: ${g}`,
    });
  }
  if (query.seller === "business") {
    items.push({
      key: "seller",
      label: lang === "en" ? "Seller: Business" : "Anunciante: Negocio",
    });
  } else if (query.seller === "independent") {
    items.push({
      key: "seller",
      label: lang === "en" ? "Seller: Independent" : "Anunciante: Independiente",
    });
  }
  if (query.sort === "name") {
    items.push({
      key: "sort",
      label: lang === "en" ? "Sort: Name A–Z" : "Orden: Nombre A–Z",
    });
  }
  if (query.whatsapp === "1") {
    items.push({
      key: "wa",
      label: lang === "en" ? "Contact: WhatsApp listed" : "Contacto: WhatsApp en vitrina",
    });
  }
  if (query.promo === "1") {
    items.push({
      key: "promo",
      label: lang === "en" ? "Offer: Has promo" : "Oferta: Con promoción",
    });
  }
  if (query.call === "1") {
    items.push({
      key: "call",
      label: lang === "en" ? "Contact: Phone listed" : "Contacto: Teléfono en vitrina",
    });
  }
  if (query.verified === "1") {
    items.push({
      key: "verified",
      label: lang === "en" ? "Leonix verified only" : "Solo verificados Leonix",
    });
  }
  if (query.web === "1") {
    items.push({
      key: "web",
      label: lang === "en" ? "Has website on profile" : "Con sitio web en vitrina",
    });
  }
  if (query.bilingual === "1") {
    items.push({
      key: "bilingual",
      label: lang === "en" ? "Bilingual quick-fact" : "Dato rápido bilingüe",
    });
  }

  if (items.length === 0) return null;

  return (
    <div
      className="mb-4 rounded-xl border border-[#dfe6ef]/90 bg-white/95 px-3 py-3 shadow-sm sm:px-4"
      aria-label={lang === "en" ? "Active filters" : "Filtros activos"}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#3d5a73]/90">
        {lang === "en" ? "Active refinements" : "Refinamientos activos"}
      </p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {items.map((it, idx) => (
          <li
            key={`${it.key}-${idx}`}
            className="inline-flex max-w-full items-center rounded-full border border-[#1a3352]/12 bg-[#f8fafc] px-3 py-1.5 text-[12px] font-medium leading-snug text-[#142a42]"
          >
            {it.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
