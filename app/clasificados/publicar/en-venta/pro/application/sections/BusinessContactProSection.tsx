"use client";

import SectionShell from "@/app/clasificados/en-venta/shared/components/SectionShell";
import type { EnVentaProApplicationState } from "../schema/enVentaProFormState";
import type { EnVentaFreeSectionProps } from "../../../free/application/types/sectionProps";
import { inputClass, labelClass } from "../../../free/application/helpers/fieldCx";

const COPY = {
  es: {
    title: "Contacto comercial",
    desc: "Teléfono, WhatsApp y zona de servicio para compradores serios.",
    phone: "Teléfono comercial",
    email: "Correo comercial",
    wa: "WhatsApp comercial",
    area: "Zona de servicio / cobertura",
    pickup: "Dirección o zona de recogida",
    resp: "Tiempo de respuesta típico",
  },
  en: {
    title: "Business contact",
    desc: "Phone, WhatsApp, and service area for serious buyers.",
    phone: "Business phone",
    email: "Business email",
    wa: "Business WhatsApp",
    area: "Service area / coverage",
    pickup: "Pickup address or zone",
    resp: "Typical response time",
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
          <input
            className={`${inputClass} mt-2`}
            inputMode="tel"
            value={state.businessPhone}
            onChange={(e) => setState((s) => ({ ...s, businessPhone: e.target.value }))}
          />
        </div>
        <div>
          <label className={labelClass}>{t.email}</label>
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
        <input
          className={`${inputClass} mt-2`}
          inputMode="tel"
          value={state.businessWhatsapp}
          onChange={(e) => setState((s) => ({ ...s, businessWhatsapp: e.target.value }))}
        />
      </div>
      <div>
        <label className={labelClass}>{t.area}</label>
        <input
          className={`${inputClass} mt-2`}
          value={state.serviceArea}
          onChange={(e) => setState((s) => ({ ...s, serviceArea: e.target.value }))}
        />
      </div>
      <div>
        <label className={labelClass}>{t.pickup}</label>
        <input
          className={`${inputClass} mt-2`}
          value={state.pickupAddressOrZone}
          onChange={(e) => setState((s) => ({ ...s, pickupAddressOrZone: e.target.value }))}
        />
      </div>
      <div>
        <label className={labelClass}>{t.resp}</label>
        <input
          className={`${inputClass} mt-2`}
          value={state.responseTimeNotes}
          onChange={(e) => setState((s) => ({ ...s, responseTimeNotes: e.target.value }))}
        />
      </div>
    </SectionShell>
  );
}
