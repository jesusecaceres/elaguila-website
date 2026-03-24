"use client";

import SectionShell from "@/app/clasificados/en-venta/shared/components/SectionShell";
import type { EnVentaFreeApplicationState } from "../schema/enVentaFreeFormState";
import type { EnVentaFreeSectionProps } from "../types/sectionProps";
import { inputClass, labelClass } from "../helpers/fieldCx";

const COPY = {
  es: {
    title: "Vendedor y contacto",
    desc: "Datos de contacto claros generan más respuestas serias. Marca lo opcional sin miedo.",
    kind: "Tipo de vendedor",
    ind: "Persona",
    biz: "Negocio",
    name: "Nombre para mostrar",
    nameH: "Cómo quieres aparecer frente a los compradores.",
    phone: "Teléfono",
    email: "Correo",
    wa: "WhatsApp (opcional)",
    waH: "Si lo dejas, los compradores pueden escribirte por WhatsApp.",
    pref: "Método de contacto preferido",
    pPhone: "Teléfono",
    pEmail: "Correo",
    pBoth: "Teléfono y correo",
    pWa: "WhatsApp",
  },
  en: {
    title: "Seller & contact",
    desc: "Clear contact details get more serious replies. Optional fields can stay blank.",
    kind: "Seller type",
    ind: "Individual",
    biz: "Business",
    name: "Display name",
    nameH: "How you want to appear to buyers.",
    phone: "Phone",
    email: "Email",
    wa: "WhatsApp (optional)",
    waH: "If provided, buyers can reach you on WhatsApp.",
    pref: "Preferred contact method",
    pPhone: "Phone",
    pEmail: "Email",
    pBoth: "Phone & email",
    pWa: "WhatsApp",
  },
} as const;

export function SellerContactSection<S extends EnVentaFreeApplicationState>({
  lang,
  state,
  setState,
}: EnVentaFreeSectionProps<S>) {
  const t = COPY[lang];
  return (
    <SectionShell lang={lang} title={t.title} description={t.desc}>
      <div>
        <label className={labelClass}>{t.kind}</label>
        <select
          className={`${inputClass} mt-2`}
          value={state.seller_kind}
          onChange={(e) =>
            setState((s) => ({
              ...s,
              seller_kind: e.target.value as EnVentaFreeApplicationState["seller_kind"],
            }))
          }
        >
          <option value="">{lang === "es" ? "Selecciona…" : "Choose…"}</option>
          <option value="individual">{t.ind}</option>
          <option value="business">{t.biz}</option>
        </select>
      </div>
      <div>
        <label className={labelClass}>{t.name}</label>
        <p className="mt-1 text-xs text-[#111111]/60">{t.nameH}</p>
        <input
          className={`${inputClass} mt-2`}
          value={state.displayName}
          onChange={(e) => setState((s) => ({ ...s, displayName: e.target.value }))}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>{t.phone}</label>
          <input
            className={`${inputClass} mt-2`}
            inputMode="tel"
            value={state.phone}
            onChange={(e) => setState((s) => ({ ...s, phone: e.target.value }))}
          />
        </div>
        <div>
          <label className={labelClass}>{t.email}</label>
          <input
            className={`${inputClass} mt-2`}
            type="email"
            autoComplete="email"
            value={state.email}
            onChange={(e) => setState((s) => ({ ...s, email: e.target.value }))}
          />
        </div>
      </div>
      <div>
        <label className={labelClass}>{t.wa}</label>
        <p className="mt-1 text-xs text-[#111111]/60">{t.waH}</p>
        <input
          className={`${inputClass} mt-2`}
          inputMode="tel"
          value={state.whatsapp}
          onChange={(e) => setState((s) => ({ ...s, whatsapp: e.target.value }))}
        />
      </div>
      <div>
        <label className={labelClass}>{t.pref}</label>
        <p className="mt-1 text-xs text-[#111111]/60">
          {lang === "es"
            ? "Elige cómo prefieres que te contacten primero."
            : "Choose how buyers should reach you first."}
        </p>
        <select
          className={`${inputClass} mt-2`}
          value={state.contactMethod}
          onChange={(e) =>
            setState((s) => ({
              ...s,
              contactMethod: e.target.value as EnVentaFreeApplicationState["contactMethod"],
            }))
          }
        >
          <option value="phone">{t.pPhone}</option>
          <option value="email">{t.pEmail}</option>
          <option value="both">{t.pBoth}</option>
          <option value="whatsapp">{t.pWa}</option>
        </select>
      </div>
    </SectionShell>
  );
}
