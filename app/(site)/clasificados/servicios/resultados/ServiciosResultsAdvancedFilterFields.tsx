import type { ReactNode } from "react";
import { useState } from "react";
import type { ServiciosLang } from "@/app/servicios/types/serviciosBusinessProfile";
import type { ServiciosResultsFilterQuery } from "../lib/serviciosResultsFilter";
import {
  formatServiciosInternalGroupForDiscovery,
  SERVICIOS_INTERNAL_GROUP_IDS,
} from "../lib/serviciosInternalGroupDisplay";
import {
  isLeonixLbUsCountry,
  LEONIX_LB_DEFAULT_COUNTRY,
  LEONIX_LB_DEFAULT_STATE,
  US_STATE_OPTIONS,
} from "@/app/(site)/clasificados/shared/constants/leonixLocalBusinessLocationContract";

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

const fieldClass =
  "min-h-[2.75rem] w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#3B66AD] focus:ring-1 focus:ring-[#3B66AD]";

const TOGGLE_GRID = "grid grid-cols-1 gap-2 sm:grid-cols-2";

function FilterToggle({
  name,
  label,
  defaultChecked,
  formAttrs,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
  formAttrs: { form?: string };
}) {
  return (
    <label className="inline-flex min-h-[2.5rem] cursor-pointer items-center gap-2.5 rounded-lg border border-[#dfe6ef] bg-[#f8fafc] px-3 py-2 text-sm font-medium text-[#142a42] hover:border-[#3B66AD]/35 hover:bg-white">
      <input
        type="checkbox"
        name={name}
        value="1"
        defaultChecked={defaultChecked}
        className="h-4 w-4 shrink-0 rounded border-[#c5d0dc] text-[#3B66AD] focus:ring-[#3B66AD]/30"
        {...formAttrs}
      />
      <span className="min-w-0 leading-snug">{label}</span>
    </label>
  );
}

/**
 * Servicios browse drawer — shared by landing + results. Boolean filters use checkboxes (unchecked = inactive).
 */
export function ServiciosResultsAdvancedFilterFields({
  lang,
  current,
  formId,
}: {
  lang: ServiciosLang;
  current: ServiciosResultsFilterQuery;
  formId?: string;
}) {
  const f = formId ? { form: formId } : {};
  const [country, setCountry] = useState(current.country ?? LEONIX_LB_DEFAULT_COUNTRY);
  const L = lang === "en";

  return (
    <div className="space-y-4">
      <GroupShell titleEs="Ubicación" titleEn="Location" lang={lang}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex min-w-0 flex-col gap-1 sm:col-span-2">
            <span className="text-xs font-semibold text-neutral-700">
              {L ? "City / service area" : "Ciudad / zona de servicio"}
            </span>
            <input
              name="city"
              defaultValue={current.city ?? ""}
              placeholder={L ? "City" : "Ciudad"}
              className={fieldClass}
              {...f}
            />
          </label>
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-semibold text-neutral-700">{L ? "State" : "Estado"}</span>
            {isLeonixLbUsCountry(country) ? (
              <select
                name="state"
                defaultValue={current.state ?? LEONIX_LB_DEFAULT_STATE}
                className={fieldClass}
                {...f}
              >
                {US_STATE_OPTIONS.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.code} — {lang === "es" && opt.code === "CA" ? "California" : opt.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                name="state"
                defaultValue={current.state ?? ""}
                placeholder={L ? "State" : "Estado"}
                className={fieldClass}
                {...f}
              />
            )}
          </label>
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-semibold text-neutral-700">ZIP</span>
            <input name="zip" defaultValue={current.zip ?? ""} className={fieldClass} {...f} />
          </label>
          <label className="flex min-w-0 flex-col gap-1 sm:col-span-2">
            <span className="text-xs font-semibold text-neutral-700">{L ? "Country" : "País"}</span>
            <input
              name="country"
              defaultValue={current.country ?? LEONIX_LB_DEFAULT_COUNTRY}
              onChange={(e) => setCountry(e.target.value)}
              className={fieldClass}
              {...f}
            />
          </label>
        </div>
        <div className={`mt-3 ${TOGGLE_GRID}`}>
          <FilterToggle
            name="mobileSvc"
            label={L ? "Travels to customer" : "Servicio a domicilio"}
            defaultChecked={current.mobileSvc === "1"}
            formAttrs={f}
          />
          <FilterToggle
            name="svcMulti"
            label={L ? "Serves multiple areas" : "Atiende varias zonas"}
            defaultChecked={current.svcMulti === "1"}
            formAttrs={f}
          />
        </div>
      </GroupShell>

      <GroupShell titleEs="Tipo de servicio" titleEn="Service type" lang={lang}>
        <div className="grid grid-cols-1 gap-3">
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-semibold text-neutral-700">
              {L ? "Seller presentation" : "Tipo de proveedor"}
            </span>
            <select name="seller" defaultValue={current.seller ?? "all"} className={fieldClass} {...f}>
              <option value="all">{L ? "All" : "Todos"}</option>
              <option value="business">{L ? "Business" : "Negocio"}</option>
              <option value="independent">{L ? "Independent professional" : "Profesional independiente"}</option>
            </select>
          </label>
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-semibold text-neutral-700">{L ? "Category" : "Categoría"}</span>
            <select name="group" defaultValue={current.group ?? ""} className={fieldClass} {...f}>
              <option value="">{L ? "All categories" : "Todas las categorías"}</option>
              {SERVICIOS_INTERNAL_GROUP_IDS.map((id) => (
                <option key={id} value={id}>
                  {formatServiciosInternalGroupForDiscovery(id, lang) ?? id}
                </option>
              ))}
            </select>
          </label>
        </div>
      </GroupShell>

      <GroupShell titleEs="Disponibilidad" titleEn="Availability" lang={lang}>
        <div className={TOGGLE_GRID}>
          <FilterToggle
            name="same_day"
            label={L ? "Same day" : "Mismo día"}
            defaultChecked={current.sameDay === "1"}
            formAttrs={f}
          />
          <FilterToggle
            name="appointment"
            label={L ? "By appointment" : "Con cita"}
            defaultChecked={current.appointment === "1"}
            formAttrs={f}
          />
          <FilterToggle
            name="emergency"
            label={L ? "Emergency" : "Emergencia"}
            defaultChecked={current.emergency === "1"}
            formAttrs={f}
          />
          <FilterToggle
            name="wknd"
            label={L ? "Weekend" : "Fin de semana"}
            defaultChecked={current.wknd === "1"}
            formAttrs={f}
          />
          <FilterToggle
            name="open_now"
            label={L ? "Open now" : "Abierto ahora"}
            defaultChecked={current.openNow === "1"}
            formAttrs={f}
          />
        </div>
      </GroupShell>

      <GroupShell titleEs="Confianza" titleEn="Trust" lang={lang}>
        <div className={TOGGLE_GRID}>
          <FilterToggle
            name="verified"
            label={L ? "Leonix verified" : "Verificado Leonix"}
            defaultChecked={current.verified === "1"}
            formAttrs={f}
          />
          <FilterToggle
            name="licensed"
            label={L ? "Licensed" : "Licenciado"}
            defaultChecked={current.licensed === "1"}
            formAttrs={f}
          />
          <FilterToggle
            name="insured"
            label={L ? "Insured" : "Asegurado"}
            defaultChecked={current.insured === "1"}
            formAttrs={f}
          />
          <FilterToggle
            name="free_estimate"
            label={L ? "Free estimate" : "Cotización gratis"}
            defaultChecked={current.freeEstimate === "1"}
            formAttrs={f}
          />
          <FilterToggle
            name="free_consultation"
            label={L ? "Free consultation" : "Consulta gratis"}
            defaultChecked={current.freeConsultation === "1"}
            formAttrs={f}
          />
        </div>
      </GroupShell>

      <GroupShell titleEs="Contacto" titleEn="Contact" lang={lang}>
        <div className={TOGGLE_GRID}>
          <FilterToggle
            name="call"
            label={L ? "Phone" : "Teléfono"}
            defaultChecked={current.call === "1"}
            formAttrs={f}
          />
          <FilterToggle
            name="whatsapp"
            label="WhatsApp"
            defaultChecked={current.whatsapp === "1"}
            formAttrs={f}
          />
          <FilterToggle
            name="email"
            label={L ? "Email" : "Correo"}
            defaultChecked={current.email === "1"}
            formAttrs={f}
          />
          <FilterToggle
            name="web"
            label={L ? "Website" : "Sitio web"}
            defaultChecked={current.web === "1"}
            formAttrs={f}
          />
          <FilterToggle
            name="msg"
            label={L ? "In-app messages" : "Mensajes en app"}
            defaultChecked={current.msg === "1"}
            formAttrs={f}
          />
          <FilterToggle
            name="phys"
            label={L ? "Physical location" : "Dirección física"}
            defaultChecked={current.phys === "1"}
            formAttrs={f}
          />
        </div>
      </GroupShell>

      <GroupShell titleEs="Idiomas" titleEn="Languages" lang={lang}>
        <div className={TOGGLE_GRID}>
          <FilterToggle
            name="langEs"
            label={L ? "Spanish" : "Español"}
            defaultChecked={current.langEs === "1"}
            formAttrs={f}
          />
          <FilterToggle
            name="langEn"
            label="English"
            defaultChecked={current.langEn === "1"}
            formAttrs={f}
          />
          <FilterToggle
            name="langOt"
            label={L ? "Other language" : "Otro idioma"}
            defaultChecked={current.langOt === "1"}
            formAttrs={f}
          />
          <FilterToggle
            name="bilingual"
            label={L ? "Bilingual" : "Bilingüe"}
            defaultChecked={current.bilingual === "1"}
            formAttrs={f}
          />
        </div>
      </GroupShell>

      <GroupShell titleEs="Medios y visibilidad" titleEn="Media & visibility" lang={lang}>
        <div className={TOGGLE_GRID}>
          <FilterToggle
            name="has_photos"
            label={L ? "Has photos" : "Tiene fotos"}
            defaultChecked={current.hasPhotos === "1"}
            formAttrs={f}
          />
          <FilterToggle
            name="has_videos"
            label={L ? "Has videos" : "Tiene videos"}
            defaultChecked={current.hasVideos === "1"}
            formAttrs={f}
          />
          <FilterToggle
            name="has_offers"
            label={L ? "Has offers" : "Tiene ofertas"}
            defaultChecked={current.hasOffers === "1"}
            formAttrs={f}
          />
        </div>
      </GroupShell>
    </div>
  );
}
