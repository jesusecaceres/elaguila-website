"use client";

import SectionShell from "@/app/clasificados/en-venta/shared/components/SectionShell";
import type { EnVentaProApplicationState } from "../schema/enVentaProFormState";
import type { EnVentaFreeSectionProps } from "../../../free/application/types/sectionProps";
import { inputClass, labelClass } from "../../../free/application/helpers/fieldCx";

const COPY = {
  es: {
    title: "Contacto comercial",
    desc: "Canales claros y expectativas de respuesta reducen fricción — sin convertirse en call center.",
    phone: "Teléfono comercial",
    phoneH: "El que atiendes tú o tu equipo.",
    email: "Correo comercial",
    emailH: "Para pedidos o facturas si aplica.",
    wa: "WhatsApp comercial",
    waH: "Opcional — muy usado en Leonix.",
    area: "Zona de servicio / cobertura",
    areaH: "Ciudad, radio o “solo local” si aplica.",
    pickup: "Dirección o zona de recogida",
    pickupH: "Opcional — evita el domicilio exacto si prefieres zona.",
    resp: "Tiempo de respuesta típico",
    respH: "Ej.: “mismo día”, “24–48 h”, “fines de semana”.",
  },
  en: {
    title: "Business contact",
    desc: "Clear channels and response expectations reduce friction — still lean marketplace contact.",
    phone: "Business phone",
    phoneH: "The line you or your team actually answers.",
    email: "Business email",
    emailH: "For orders or invoices if relevant.",
    wa: "Business WhatsApp",
    waH: "Optional — common on Leonix.",
    area: "Service area / coverage",
    areaH: "City, radius, or “local only” if that’s the rule.",
    pickup: "Pickup address or zone",
    pickupH: "Optional — use a zone instead of exact street if you prefer.",
    resp: "Typical response time",
    respH: 'e.g. “same day”, “24–48h”, “weekends”.',
  },
} as const;

export function BusinessContactProSection({
  lang,
  state,
  setState,
}: EnVentaFreeSectionProps<EnVentaProApplicationState>) {
  const t = COPY[lang];
  return (
    <SectionShell lang={lang} title={t.title} description={t.desc}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>{t.phone}</label>
          <p className="mt-1 text-xs text-white/55">{t.phoneH}</p>
          <input
            className={`${inputClass} mt-2`}
            inputMode="tel"
            value={state.businessPhone}
            onChange={(e) => setState((s) => ({ ...s, businessPhone: e.target.value }))}
          />
        </div>
        <div>
          <label className={labelClass}>{t.email}</label>
          <p className="mt-1 text-xs text-white/55">{t.emailH}</p>
          <input
            className={`${inputClass} mt-2`}
            type="email"
            value={state.businessEmail}
            onChange={(e) => setState((s) => ({ ...s, businessEmail: e.target.value }))}
          />
        </div>
      </div>
      <div>
        <label className={labelClass}>{t.wa}</label>
        <p className="mt-1 text-xs text-white/55">{t.waH}</p>
        <input
          className={`${inputClass} mt-2`}
          inputMode="tel"
          value={state.businessWhatsapp}
          onChange={(e) => setState((s) => ({ ...s, businessWhatsapp: e.target.value }))}
        />
      </div>
      <div>
        <label className={labelClass}>{t.area}</label>
        <p className="mt-1 text-xs text-white/55">{t.areaH}</p>
        <input
          className={`${inputClass} mt-2`}
          value={state.serviceArea}
          onChange={(e) => setState((s) => ({ ...s, serviceArea: e.target.value }))}
        />
      </div>
      <div>
        <label className={labelClass}>{t.pickup}</label>
        <p className="mt-1 text-xs text-white/55">{t.pickupH}</p>
        <input
          className={`${inputClass} mt-2`}
          value={state.pickupAddressOrZone}
          onChange={(e) => setState((s) => ({ ...s, pickupAddressOrZone: e.target.value }))}
        />
      </div>
      <div>
        <label className={labelClass}>{t.resp}</label>
        <p className="mt-1 text-xs text-white/55">{t.respH}</p>
        <input
          className={`${inputClass} mt-2`}
          value={state.responseTimeNotes}
          onChange={(e) => setState((s) => ({ ...s, responseTimeNotes: e.target.value }))}
        />
      </div>
    </SectionShell>
  );
}
