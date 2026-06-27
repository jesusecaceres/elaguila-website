import type { ReactNode } from "react";
import type { ServiciosLang } from "@/app/servicios/types/serviciosBusinessProfile";
import type { ServiciosResultsFilterQuery } from "../lib/serviciosResultsFilter";
import {
  formatServiciosInternalGroupForDiscovery,
  SERVICIOS_INTERNAL_GROUP_IDS,
} from "../lib/serviciosInternalGroupDisplay";

function GroupShell({
  titleEs,
  titleEn,
  lang,
  children,
}: {
  titleEs: string;
  titleEn: string;
  lang: ServiciosLang;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#dfe6ef]/90 bg-white/[0.97] p-4 shadow-[0_10px_32px_-24px_rgba(20,38,58,0.25)] sm:p-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#3d5a73]/90">
        {lang === "en" ? titleEn : titleEs}
      </p>
      <div className="mt-3.5">{children}</div>
    </div>
  );
}

const selectClass =
  "min-h-[48px] w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#3B66AD] focus:ring-1 focus:ring-[#3B66AD]";

/**
 * Advanced Servicios results filters (everything after sort) — shared by desktop and mobile drawer.
 */
export function ServiciosResultsAdvancedFilterFields({
  lang,
  current,
}: {
  lang: ServiciosLang;
  current: ServiciosResultsFilterQuery;
}) {
  return (
    <>
      <GroupShell titleEs="Tipo de servicio" titleEn="Provider type" lang={lang}>
        <label className="flex min-w-0 flex-col gap-1">
          <span className="text-xs font-semibold text-neutral-700">
            {lang === "en" ? "Seller presentation" : "Tipo de proveedor"}
          </span>
          <select name="seller" defaultValue={current.seller ?? "all"} className={selectClass}>
            <option value="all">{lang === "en" ? "All" : "Todos"}</option>
            <option value="business">{lang === "en" ? "Business (web or address)" : "Negocio (web o dirección)"}</option>
            <option value="independent">{lang === "en" ? "Independent professional" : "Profesional independiente"}</option>
          </select>
        </label>
      </GroupShell>

      <GroupShell titleEs="Categoría" titleEn="Category / trade" lang={lang}>
        <label className="flex min-w-0 flex-col gap-1">
          <span className="text-xs font-semibold text-neutral-700">{lang === "en" ? "Category family" : "Categoría"}</span>
          <select name="group" defaultValue={current.group ?? ""} className={selectClass}>
            <option value="">{lang === "en" ? "Any" : "Cualquiera"}</option>
            {SERVICIOS_INTERNAL_GROUP_IDS.map((id) => (
              <option key={id} value={id}>
                {formatServiciosInternalGroupForDiscovery(id, lang) ?? id}
              </option>
            ))}
          </select>
        </label>
      </GroupShell>

      <GroupShell titleEs="Confianza y alcance" titleEn="Trust & reach" lang={lang}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-semibold text-neutral-700">{lang === "en" ? "Open now" : "Abierto ahora"}</span>
            <select name="open_now" defaultValue={current.openNow === "1" ? "1" : ""} className={selectClass}>
              <option value="">{lang === "en" ? "Any" : "Cualquiera"}</option>
              <option value="1">{lang === "en" ? "Open now (by hours)" : "Abierto ahora (por horario)"}</option>
            </select>
          </label>
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-semibold text-neutral-700">{lang === "en" ? "Leonix verified" : "Verificado Leonix"}</span>
            <select name="verified" defaultValue={current.verified === "1" ? "1" : ""} className={selectClass}>
              <option value="">{lang === "en" ? "Any" : "Cualquiera"}</option>
              <option value="1">{lang === "en" ? "Verified listings only" : "Solo anuncios verificados"}</option>
            </select>
          </label>
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-semibold text-neutral-700">{lang === "en" ? "Licensed" : "Licenciado"}</span>
            <select name="licensed" defaultValue={current.licensed === "1" ? "1" : ""} className={selectClass}>
              <option value="">{lang === "en" ? "Any" : "Cualquiera"}</option>
              <option value="1">{lang === "en" ? "Licensed only" : "Solo licenciados"}</option>
            </select>
          </label>
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-semibold text-neutral-700">{lang === "en" ? "Insured" : "Asegurado"}</span>
            <select name="insured" defaultValue={current.insured === "1" ? "1" : ""} className={selectClass}>
              <option value="">{lang === "en" ? "Any" : "Cualquiera"}</option>
              <option value="1">{lang === "en" ? "Insured only" : "Solo asegurados"}</option>
            </select>
          </label>
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-semibold text-neutral-700">{lang === "en" ? "Free estimate" : "Cotización gratis"}</span>
            <select name="free_estimate" defaultValue={current.freeEstimate === "1" ? "1" : ""} className={selectClass}>
              <option value="">{lang === "en" ? "Any" : "Cualquiera"}</option>
              <option value="1">{lang === "en" ? "Free estimate offered" : "Con cotización gratis"}</option>
            </select>
          </label>
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-semibold text-neutral-700">{lang === "en" ? "Free consultation" : "Consulta gratis"}</span>
            <select name="free_consultation" defaultValue={current.freeConsultation === "1" ? "1" : ""} className={selectClass}>
              <option value="">{lang === "en" ? "Any" : "Cualquiera"}</option>
              <option value="1">{lang === "en" ? "Free consultation offered" : "Con consulta gratis"}</option>
            </select>
          </label>
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-semibold text-neutral-700">{lang === "en" ? "Has photos" : "Tiene fotos"}</span>
            <select name="has_photos" defaultValue={current.hasPhotos === "1" ? "1" : ""} className={selectClass}>
              <option value="">{lang === "en" ? "Any" : "Cualquiera"}</option>
              <option value="1">{lang === "en" ? "Public photos on profile" : "Con fotos en vitrina"}</option>
            </select>
          </label>
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-semibold text-neutral-700">{lang === "en" ? "Has videos" : "Tiene videos"}</span>
            <select name="has_videos" defaultValue={current.hasVideos === "1" ? "1" : ""} className={selectClass}>
              <option value="">{lang === "en" ? "Any" : "Cualquiera"}</option>
              <option value="1">{lang === "en" ? "Playable gallery video" : "Con video reproducible"}</option>
            </select>
          </label>
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-semibold text-neutral-700">{lang === "en" ? "Has offers" : "Tiene ofertas"}</span>
            <select name="has_offers" defaultValue={current.hasOffers === "1" ? "1" : ""} className={selectClass}>
              <option value="">{lang === "en" ? "Any" : "Cualquiera"}</option>
              <option value="1">{lang === "en" ? "Offers / promotions" : "Con ofertas o promociones"}</option>
            </select>
          </label>
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-semibold text-neutral-700">{lang === "en" ? "Website on profile" : "Sitio web en vitrina"}</span>
            <select name="web" defaultValue={current.web === "1" ? "1" : ""} className={selectClass}>
              <option value="">{lang === "en" ? "Any" : "Cualquiera"}</option>
              <option value="1">{lang === "en" ? "Has website link" : "Con enlace a web"}</option>
            </select>
          </label>
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-semibold text-neutral-700">{lang === "en" ? "Bilingual signal" : "Señal bilingüe"}</span>
            <select name="bilingual" defaultValue={current.bilingual === "1" ? "1" : ""} className={selectClass}>
              <option value="">{lang === "en" ? "Any" : "Cualquiera"}</option>
              <option value="1">{lang === "en" ? "Bilingual quick-fact" : "Dato rápido bilingüe"}</option>
            </select>
          </label>
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-semibold text-neutral-700">{lang === "en" ? "Email on profile" : "Correo en vitrina"}</span>
            <select name="email" defaultValue={current.email === "1" ? "1" : ""} className={selectClass}>
              <option value="">{lang === "en" ? "Any" : "Cualquiera"}</option>
              <option value="1">{lang === "en" ? "Shows email" : "Muestra correo"}</option>
            </select>
          </label>
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-semibold text-neutral-700">{lang === "en" ? "Emergency / urgent" : "Emergencia / urgente"}</span>
            <select name="emergency" defaultValue={current.emergency === "1" ? "1" : ""} className={selectClass}>
              <option value="">{lang === "en" ? "Any" : "Cualquiera"}</option>
              <option value="1">{lang === "en" ? "Emergency quick-fact" : "Dato rápido emergencia"}</option>
            </select>
          </label>
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-semibold text-neutral-700">{lang === "en" ? "Mobile / on-site" : "Móvil / a domicilio"}</span>
            <select name="mobileSvc" defaultValue={current.mobileSvc === "1" ? "1" : ""} className={selectClass}>
              <option value="">{lang === "en" ? "Any" : "Cualquiera"}</option>
              <option value="1">{lang === "en" ? "Mobile-service quick-fact" : "Dato rápido servicio móvil"}</option>
            </select>
          </label>
        </div>
      </GroupShell>

      <GroupShell titleEs="Formas de contacto" titleEn="Contact options" lang={lang}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-semibold text-neutral-700">WhatsApp</span>
            <select name="whatsapp" defaultValue={current.whatsapp === "1" ? "1" : ""} className={selectClass}>
              <option value="">{lang === "en" ? "Any" : "Cualquiera"}</option>
              <option value="1">{lang === "en" ? "WhatsApp shown" : "Con WhatsApp visible"}</option>
            </select>
          </label>
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-semibold text-neutral-700">{lang === "en" ? "Offer / promo" : "Oferta"}</span>
            <select name="promo" defaultValue={current.promo === "1" ? "1" : ""} className={selectClass}>
              <option value="">{lang === "en" ? "Any" : "Cualquiera"}</option>
              <option value="1">{lang === "en" ? "Has offer line" : "Con línea de oferta"}</option>
            </select>
          </label>
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-semibold text-neutral-700">{lang === "en" ? "Phone" : "Teléfono"}</span>
            <select name="call" defaultValue={current.call === "1" ? "1" : ""} className={selectClass}>
              <option value="">{lang === "en" ? "Any" : "Cualquiera"}</option>
              <option value="1">{lang === "en" ? "Phone shown" : "Con teléfono visible"}</option>
            </select>
          </label>
        </div>
      </GroupShell>

      <GroupShell titleEs="Datos del formulario de publicación" titleEn="Publish-application signals" lang={lang}>
        <p className="mb-3 text-[11px] leading-relaxed text-neutral-600">
          {lang === "en"
            ? "These align with fields captured in Clasificados Servicios — stored on each listing profile for discovery."
            : "Coinciden con campos del formulario Servicios en Clasificados, guardados en el perfil de cada anuncio."}
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-semibold text-neutral-700">{lang === "en" ? "In-app messages" : "Mensajes en app"}</span>
            <select name="msg" defaultValue={current.msg === "1" ? "1" : ""} className={selectClass}>
              <option value="">{lang === "en" ? "Any" : "Cualquiera"}</option>
              <option value="1">{lang === "en" ? "Messaging enabled" : "Mensajes activados"}</option>
            </select>
          </label>
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-semibold text-neutral-700">{lang === "en" ? "Physical address" : "Dirección física"}</span>
            <select name="phys" defaultValue={current.phys === "1" ? "1" : ""} className={selectClass}>
              <option value="">{lang === "en" ? "Any" : "Cualquiera"}</option>
              <option value="1">{lang === "en" ? "Has storefront / mailing address" : "Con dirección publicada"}</option>
            </select>
          </label>
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-semibold text-neutral-700">{lang === "en" ? "Multi-area coverage" : "Cobertura multi-zona"}</span>
            <select name="svcMulti" defaultValue={current.svcMulti === "1" ? "1" : ""} className={selectClass}>
              <option value="">{lang === "en" ? "Any" : "Cualquiera"}</option>
              <option value="1">{lang === "en" ? "Multiple service areas" : "Varias zonas de servicio"}</option>
            </select>
          </label>
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-semibold text-neutral-700">{lang === "en" ? "Offer headline" : "Titular de oferta"}</span>
            <select name="offer" defaultValue={current.offer === "1" ? "1" : ""} className={selectClass}>
              <option value="">{lang === "en" ? "Any" : "Cualquiera"}</option>
              <option value="1">{lang === "en" ? "Has offer / promo line" : "Con oferta / promoción"}</option>
            </select>
          </label>
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-semibold text-neutral-700">{lang === "en" ? "Legal attestations" : "Confirmaciones legales"}</span>
            <select name="legal" defaultValue={current.legal === "1" ? "1" : ""} className={selectClass}>
              <option value="">{lang === "en" ? "Any" : "Cualquiera"}</option>
              <option value="1">{lang === "en" ? "All publish confirmations on file" : "Todas las confirmaciones al publicar"}</option>
            </select>
          </label>
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-semibold text-neutral-700">Español</span>
            <select name="langEs" defaultValue={current.langEs === "1" ? "1" : ""} className={selectClass}>
              <option value="">{lang === "en" ? "Any" : "Cualquiera"}</option>
              <option value="1">{lang === "en" ? "Spanish offered" : "Ofrece español"}</option>
            </select>
          </label>
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-semibold text-neutral-700">English</span>
            <select name="langEn" defaultValue={current.langEn === "1" ? "1" : ""} className={selectClass}>
              <option value="">{lang === "en" ? "Any" : "Cualquiera"}</option>
              <option value="1">{lang === "en" ? "English offered" : "Ofrece inglés"}</option>
            </select>
          </label>
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-semibold text-neutral-700">{lang === "en" ? "Other language" : "Otro idioma"}</span>
            <select name="langOt" defaultValue={current.langOt === "1" ? "1" : ""} className={selectClass}>
              <option value="">{lang === "en" ? "Any" : "Cualquiera"}</option>
              <option value="1">{lang === "en" ? "Other language flagged" : "Otro idioma marcado"}</option>
            </select>
          </label>
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-semibold text-neutral-700">{lang === "en" ? "Verification interest" : "Interés verificación"}</span>
            <select name="vint" defaultValue={current.vint === "1" ? "1" : ""} className={selectClass}>
              <option value="">{lang === "en" ? "Any" : "Cualquiera"}</option>
              <option value="1">{lang === "en" ? "Requested Leonix review" : "Solicitó revisión Leonix"}</option>
            </select>
          </label>
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-semibold text-neutral-700">{lang === "en" ? "Weekend hours" : "Fin de semana"}</span>
            <select name="wknd" defaultValue={current.wknd === "1" ? "1" : ""} className={selectClass}>
              <option value="">{lang === "en" ? "Any" : "Cualquiera"}</option>
              <option value="1">{lang === "en" ? "Sat/Sun not all closed" : "Sáb/Dom con horario"}</option>
            </select>
          </label>
        </div>
      </GroupShell>
    </>
  );
}
