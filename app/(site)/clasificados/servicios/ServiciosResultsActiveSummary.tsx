import Link from "next/link";
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
  const resultsPath = "/clasificados/servicios/results";

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
      label: lang === "en" ? `Category: ${g}` : `Categoría: ${g}`,
    });
  }
  if (query.seller === "business") {
    items.push({
      key: "seller",
      label: lang === "en" ? "Provider: Business" : "Proveedor: Negocio",
    });
  } else if (query.seller === "independent") {
    items.push({
      key: "seller",
      label: lang === "en" ? "Provider: Independent" : "Proveedor: Independiente",
    });
  }
  if (query.sort === "name") {
    items.push({
      key: "sort",
      label: lang === "en" ? "Sort: Name A–Z" : "Orden: Nombre A–Z",
    });
  }
  if (query.sort === "rating") {
    items.push({
      key: "sort",
      label: lang === "en" ? "Sort: Highest rated" : "Orden: Mejor calificados",
    });
  }
  if (query.sort === "most_liked") {
    items.push({
      key: "sort",
      label: lang === "en" ? "Sort: Most liked" : "Orden: Más gustados",
    });
  }
  if (query.sort === "most_saved") {
    items.push({
      key: "sort",
      label: lang === "en" ? "Sort: Most saved" : "Orden: Más guardados",
    });
  }
  if (query.sort === "open_now") {
    items.push({
      key: "sort",
      label: lang === "en" ? "Sort: Open now" : "Orden: Abiertos ahora",
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
  if (query.licensed === "1") {
    items.push({
      key: "licensed",
      label: lang === "en" ? "Licensed" : "Licenciado",
    });
  }
  if (query.insured === "1") {
    items.push({
      key: "insured",
      label: lang === "en" ? "Insured" : "Asegurado",
    });
  }
  if (query.freeEstimate === "1") {
    items.push({
      key: "freeEstimate",
      label: lang === "en" ? "Free estimate" : "Cotización gratis",
    });
  }
  if (query.freeConsultation === "1") {
    items.push({
      key: "freeConsultation",
      label: lang === "en" ? "Free consultation" : "Consulta gratis",
    });
  }
  if (query.hasPhotos === "1") {
    items.push({
      key: "hasPhotos",
      label: lang === "en" ? "Has photos" : "Tiene fotos",
    });
  }
  if (query.hasVideos === "1") {
    items.push({
      key: "hasVideos",
      label: lang === "en" ? "Has videos" : "Tiene videos",
    });
  }
  if (query.hasOffers === "1") {
    items.push({
      key: "hasOffers",
      label: lang === "en" ? "Has offers" : "Tiene ofertas",
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
  if (query.email === "1") {
    items.push({
      key: "email",
      label: lang === "en" ? "Email on profile" : "Correo en vitrina",
    });
  }
  if (query.emergency === "1") {
    items.push({
      key: "emergency",
      label: lang === "en" ? "Emergency / urgent signal" : "Señal de urgencia / emergencia",
    });
  }
  if (query.mobileSvc === "1") {
    items.push({
      key: "mobileSvc",
      label: lang === "en" ? "Mobile / on-site service signal" : "Señal de servicio móvil / a domicilio",
    });
  }
  if (query.msg === "1") {
    items.push({ key: "msg", label: lang === "en" ? "In-app messaging on" : "Mensajes en app activados" });
  }
  if (query.phys === "1") {
    items.push({ key: "phys", label: lang === "en" ? "Physical address on file" : "Dirección física capturada" });
  }
  if (query.svcMulti === "1") {
    items.push({ key: "svcMulti", label: lang === "en" ? "Multi-area service coverage" : "Cobertura multi-zona" });
  }
  if (query.offer === "1") {
    items.push({ key: "offer", label: lang === "en" ? "Offer / promo headline" : "Titular de oferta" });
  }
  if (query.legal === "1") {
    items.push({
      key: "legal",
      label: lang === "en" ? "Legal publish confirmations complete" : "Confirmaciones legales completas",
    });
  }
  if (query.langEs === "1") {
    items.push({ key: "langEs", label: lang === "en" ? "Spanish language" : "Idioma: español" });
  }
  if (query.langEn === "1") {
    items.push({ key: "langEn", label: lang === "en" ? "English language" : "Idioma: inglés" });
  }
  if (query.langOt === "1") {
    items.push({ key: "langOt", label: lang === "en" ? "Other language" : "Otro idioma" });
  }
  if (query.vint === "1") {
    items.push({
      key: "vint",
      label: lang === "en" ? "Requested Leonix verification" : "Solicitó verificación Leonix",
    });
  }
  if (query.wknd === "1") {
    items.push({
      key: "wknd",
      label: lang === "en" ? "Weekend hours (Sat/Sun)" : "Horario fin de semana (sáb/dom)",
    });
  }
  if (query.openNow === "1") {
    items.push({
      key: "openNow",
      label: lang === "en" ? "Open now" : "Abierto ahora",
    });
  }

  if (items.length === 0) return null;

  const buildCurrentParams = () => {
    const params = new URLSearchParams();
    params.set("lang", lang);
    if (query.q?.trim()) params.set("q", query.q.trim());
    if (query.city?.trim()) params.set("city", query.city.trim());
    if (query.group?.trim()) params.set("group", query.group.trim());
    if (query.seller && query.seller !== "all") params.set("seller", query.seller);
    if (query.sort && query.sort !== "newest") params.set("sort", query.sort);
    if (query.whatsapp === "1") params.set("whatsapp", "1");
    if (query.promo === "1") params.set("promo", "1");
    if (query.call === "1") params.set("call", "1");
    if (query.verified === "1") params.set("verified", "1");
    if (query.web === "1") params.set("web", "1");
    if (query.bilingual === "1") params.set("bilingual", "1");
    if (query.email === "1") params.set("email", "1");
    if (query.emergency === "1") params.set("emergency", "1");
    if (query.mobileSvc === "1") params.set("mobileSvc", "1");
    if (query.msg === "1") params.set("msg", "1");
    if (query.phys === "1") params.set("phys", "1");
    if (query.svcMulti === "1") params.set("svcMulti", "1");
    if (query.offer === "1") params.set("offer", "1");
    if (query.legal === "1") params.set("legal", "1");
    if (query.langEs === "1") params.set("langEs", "1");
    if (query.langEn === "1") params.set("langEn", "1");
    if (query.langOt === "1") params.set("langOt", "1");
    if (query.vint === "1") params.set("vint", "1");
    if (query.wknd === "1") params.set("wknd", "1");
    if (query.openNow === "1") params.set("open_now", "1");
    if (query.licensed === "1") params.set("licensed", "1");
    if (query.insured === "1") params.set("insured", "1");
    if (query.freeEstimate === "1") params.set("free_estimate", "1");
    if (query.freeConsultation === "1") params.set("free_consultation", "1");
    if (query.hasPhotos === "1") params.set("has_photos", "1");
    if (query.hasVideos === "1") params.set("has_videos", "1");
    if (query.hasOffers === "1") params.set("has_offers", "1");
    return params;
  };

  const removeParamByChipKey: Record<string, string[]> = {
    freeEstimate: ["free_estimate"],
    freeConsultation: ["free_consultation"],
    hasPhotos: ["has_photos"],
    hasVideos: ["has_videos"],
    hasOffers: ["has_offers"],
    mobileSvc: ["mobileSvc"],
    openNow: ["open_now"],
    wa: ["whatsapp"],
  };

  const removeHrefForItem = (key: string) => {
    const params = buildCurrentParams();
    for (const param of removeParamByChipKey[key] ?? [key]) {
      params.delete(param);
    }
    params.delete("page");
    return `${resultsPath}?${params.toString()}`;
  };

  return (
    <div
      className="mb-3 rounded-xl border border-[#dfe6ef]/90 bg-white/95 px-3 py-2.5 shadow-sm sm:px-3.5"
      aria-label={lang === "en" ? "Active filters" : "Filtros activos"}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#3d5a73]/90">
        {lang === "en" ? "Active refinements" : "Refinamientos activos"}
      </p>
      <ul className="mt-1.5 flex flex-wrap gap-1.5">
        {items.map((it, idx) => (
          <li
            key={`${it.key}-${idx}`}
            className="inline-flex max-w-full items-center gap-1 rounded-full border border-[#1a3352]/12 bg-[#f8fafc] px-2.5 py-1 text-[11px] font-medium leading-snug text-[#142a42]"
          >
            <span className="min-w-0 truncate">{it.label}</span>
            <Link
              href={removeHrefForItem(it.key)}
              className="ml-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-[#64748b] hover:bg-white hover:text-[#7A1E2C]"
              aria-label={lang === "en" ? `Remove ${it.label}` : `Quitar ${it.label}`}
            >
              ×
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
