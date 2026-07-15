import Link from "next/link";
import type { ServiciosLang } from "@/app/servicios/types/serviciosBusinessProfile";
import { formatServiciosInternalGroupForDiscovery } from "./lib/serviciosInternalGroupDisplay";
import type { ServiciosResultsFilterQuery } from "./lib/serviciosResultsFilter";
import {
  buildServiciosResultsChipRemoveHref,
  SERVICIOS_CHIP_URL_KEY,
  serviciosLocationChipVisible,
} from "./lib/serviciosBrowseParams";

type ChipItem = { key: string; label: string; href: string };

/**
 * Human-readable active filter state for trust and recovery UX (URL-driven).
 */
export function ServiciosResultsActiveSummary({
  lang,
  query,
  perPage,
}: {
  lang: ServiciosLang;
  query: ServiciosResultsFilterQuery;
  perPage?: number;
}) {
  const items: ChipItem[] = [];
  const rm = (chipKey: string) =>
    buildServiciosResultsChipRemoveHref(lang, query, SERVICIOS_CHIP_URL_KEY[chipKey] ?? chipKey, perPage);
  const { showState, showCountry } = serviciosLocationChipVisible(query);

  if (query.q?.trim()) {
    items.push({
      key: "q",
      label:
        lang === "en"
          ? `Keywords: “${query.q.trim()}”`
          : `Palabras clave: «${query.q.trim()}»`,
      href: rm("q"),
    });
  }
  if (query.city?.trim()) {
    items.push({
      key: "city",
      label: lang === "en" ? `City: ${query.city.trim()}` : `Ciudad: ${query.city.trim()}`,
      href: rm("city"),
    });
  }
  if (showState && query.state?.trim()) {
    items.push({
      key: "state",
      label: lang === "en" ? `State: ${query.state.trim()}` : `Estado: ${query.state.trim()}`,
      href: rm("state"),
    });
  }
  if (query.zip?.trim()) {
    items.push({
      key: "zip",
      label: `ZIP: ${query.zip.trim()}`,
      href: rm("zip"),
    });
  }
  if (showCountry && query.country?.trim()) {
    items.push({
      key: "country",
      label: lang === "en" ? `Country: ${query.country.trim()}` : `País: ${query.country.trim()}`,
      href: rm("country"),
    });
  }
  if (query.group?.trim()) {
    const g = formatServiciosInternalGroupForDiscovery(query.group, lang) ?? query.group;
    items.push({
      key: "group",
      label: lang === "en" ? `Trade: ${g}` : `Giro: ${g}`,
      href: rm("group"),
    });
  }
  if (query.seller === "business") {
    items.push({
      key: "seller",
      label: lang === "en" ? "Seller: Business" : "Anunciante: Negocio",
      href: rm("seller"),
    });
  } else if (query.seller === "independent") {
    items.push({
      key: "seller",
      label: lang === "en" ? "Seller: Independent" : "Anunciante: Independiente",
      href: rm("seller"),
    });
  }
  if (query.sort === "name") {
    items.push({
      key: "sort",
      label: lang === "en" ? "Sort: Name A–Z" : "Orden: Nombre A–Z",
      href: rm("sort"),
    });
  }
  if (query.sort === "rating") {
    items.push({
      key: "sort",
      label: lang === "en" ? "Sort: Highest rated" : "Orden: Mejor calificados",
      href: rm("sort"),
    });
  }
  if (query.sort === "most_liked") {
    items.push({
      key: "sort",
      label: lang === "en" ? "Sort: Most liked" : "Orden: Más gustados",
      href: rm("sort"),
    });
  }
  if (query.sort === "most_saved") {
    items.push({
      key: "sort",
      label: lang === "en" ? "Sort: Most saved" : "Orden: Más guardados",
      href: rm("sort"),
    });
  }
  if (query.sort === "open_now") {
    items.push({
      key: "sort",
      label: lang === "en" ? "Sort: Open now" : "Orden: Abiertos ahora",
      href: rm("sort"),
    });
  }
  if (query.whatsapp === "1") {
    items.push({
      key: "wa",
      label: lang === "en" ? "Contact: WhatsApp listed" : "Contacto: WhatsApp en vitrina",
      href: rm("wa"),
    });
  }
  if (query.promo === "1") {
    items.push({
      key: "promo",
      label: lang === "en" ? "Offer: Has promo" : "Oferta: Con promoción",
      href: rm("promo"),
    });
  }
  if (query.call === "1") {
    items.push({
      key: "call",
      label: lang === "en" ? "Contact: Phone listed" : "Contacto: Teléfono en vitrina",
      href: rm("call"),
    });
  }
  if (query.verified === "1") {
    items.push({
      key: "verified",
      label: lang === "en" ? "Leonix verified only" : "Solo verificados Leonix",
      href: rm("verified"),
    });
  }
  if (query.licensed === "1") {
    items.push({
      key: "licensed",
      label: lang === "en" ? "Licensed" : "Licenciado",
      href: rm("licensed"),
    });
  }
  if (query.insured === "1") {
    items.push({
      key: "insured",
      label: lang === "en" ? "Insured" : "Asegurado",
      href: rm("insured"),
    });
  }
  if (query.freeEstimate === "1") {
    items.push({
      key: "freeEstimate",
      label: lang === "en" ? "Free estimate" : "Cotización gratis",
      href: rm("freeEstimate"),
    });
  }
  if (query.freeConsultation === "1") {
    items.push({
      key: "freeConsultation",
      label: lang === "en" ? "Free consultation" : "Consulta gratis",
      href: rm("freeConsultation"),
    });
  }
  if (query.hasPhotos === "1") {
    items.push({
      key: "hasPhotos",
      label: lang === "en" ? "Has photos" : "Tiene fotos",
      href: rm("hasPhotos"),
    });
  }
  if (query.hasVideos === "1") {
    items.push({
      key: "hasVideos",
      label: lang === "en" ? "Has videos" : "Tiene videos",
      href: rm("hasVideos"),
    });
  }
  if (query.hasOffers === "1") {
    items.push({
      key: "hasOffers",
      label: lang === "en" ? "Has offers" : "Tiene ofertas",
      href: rm("hasOffers"),
    });
  }
  if (query.web === "1") {
    items.push({
      key: "web",
      label: lang === "en" ? "Has website on profile" : "Con sitio web en vitrina",
      href: rm("web"),
    });
  }
  if (query.bilingual === "1") {
    items.push({
      key: "bilingual",
      label: lang === "en" ? "Bilingual quick-fact" : "Dato rápido bilingüe",
      href: rm("bilingual"),
    });
  }
  if (query.email === "1") {
    items.push({
      key: "email",
      label: lang === "en" ? "Email on profile" : "Correo en vitrina",
      href: rm("email"),
    });
  }
  if (query.emergency === "1") {
    items.push({
      key: "emergency",
      label: lang === "en" ? "Emergency / urgent signal" : "Señal de urgencia / emergencia",
      href: rm("emergency"),
    });
  }
  if (query.mobileSvc === "1") {
    items.push({
      key: "mobileSvc",
      label: lang === "en" ? "Mobile / on-site service signal" : "Señal de servicio móvil / a domicilio",
      href: rm("mobileSvc"),
    });
  }
  if (query.msg === "1") {
    items.push({ key: "msg", label: lang === "en" ? "In-app messaging on" : "Mensajes en app activados", href: rm("msg") });
  }
  if (query.phys === "1") {
    items.push({ key: "phys", label: lang === "en" ? "Physical address on file" : "Dirección física capturada", href: rm("phys") });
  }
  if (query.svcMulti === "1") {
    items.push({ key: "svcMulti", label: lang === "en" ? "Multi-area service coverage" : "Cobertura multi-zona", href: rm("svcMulti") });
  }
  if (query.offer === "1") {
    items.push({ key: "offer", label: lang === "en" ? "Offer / promo headline" : "Titular de oferta", href: rm("offer") });
  }
  if (query.legal === "1") {
    items.push({
      key: "legal",
      label: lang === "en" ? "Legal publish confirmations complete" : "Confirmaciones legales completas",
      href: rm("legal"),
    });
  }
  if (query.langEs === "1") {
    items.push({ key: "langEs", label: lang === "en" ? "Spanish language" : "Idioma: español", href: rm("langEs") });
  }
  if (query.langEn === "1") {
    items.push({ key: "langEn", label: lang === "en" ? "English language" : "Idioma: inglés", href: rm("langEn") });
  }
  if (query.langOt === "1") {
    items.push({ key: "langOt", label: lang === "en" ? "Other language" : "Otro idioma", href: rm("langOt") });
  }
  if (query.vint === "1") {
    items.push({
      key: "vint",
      label: lang === "en" ? "Requested Leonix verification" : "Solicitó verificación Leonix",
      href: rm("vint"),
    });
  }
  if (query.wknd === "1") {
    items.push({
      key: "wknd",
      label: lang === "en" ? "Weekend hours (Sat/Sun)" : "Horario fin de semana (sáb/dom)",
      href: rm("wknd"),
    });
  }
  if (query.openNow === "1") {
    items.push({
      key: "openNow",
      label: lang === "en" ? "Open now" : "Abierto ahora",
      href: rm("openNow"),
    });
  }
  if (query.sameDay === "1") {
    items.push({
      key: "sameDay",
      label: lang === "en" ? "Same-day service" : "Servicio el mismo día",
      href: rm("sameDay"),
    });
  }
  if (query.appointment === "1") {
    items.push({
      key: "appointment",
      label: lang === "en" ? "Appointments offered" : "Con citas",
      href: rm("appointment"),
    });
  }

  if (items.length === 0) return null;

  return (
    <div
      className="mb-3 rounded-xl border border-[#dfe6ef]/90 bg-white/95 px-3 py-2.5 shadow-sm sm:px-3.5"
      aria-label={lang === "en" ? "Active filters" : "Filtros activos"}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#3d5a73]/90">
        {lang === "en" ? "Active refinements" : "Refinamientos activos"}
      </p>
      <ul className="mt-1.5 flex flex-wrap gap-1.5">
        {items.map((it) => (
          <li key={it.key}>
            <Link
              href={it.href}
              className="inline-flex max-w-full items-center gap-1 rounded-full border border-[#1a3352]/12 bg-[#f8fafc] px-2.5 py-1 text-[11px] font-medium leading-snug text-[#142a42] hover:border-[#7A1E2C]/35 hover:bg-[#FFFDF7]"
            >
              <span>{it.label}</span>
              <span className="text-[#7A1E2C]" aria-hidden>
                ×
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
