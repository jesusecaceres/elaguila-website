"use client";

import SectionShell from "@/app/clasificados/en-venta/shared/components/SectionShell";
import type { EnVentaFreeApplicationState } from "../schema/enVentaFreeFormState";
import type { EnVentaFreeSectionProps } from "../types/sectionProps";
import { inputClass, labelClass } from "../helpers/fieldCx";

const COPY = {
  es: {
    title: "Vendedor y contacto",
    desc: "Elige cómo quieres que te contacten los compradores.",
    kind: "Tipo de vendedor",
    ind: "Persona",
    biz: "Negocio",
    name: "Nombre para mostrar",
    phone: "Teléfono",
    email: "Correo",
    wa: "WhatsApp (opcional)",
    pref: "Método preferido",
    pPhone: "Teléfono",
    pEmail: "Correo",
    pBoth: "Ambos",
  },
  en: {
    title: "Seller & contact",
    desc: "Choose how buyers should reach you.",
    kind: "Seller type",
    ind: "Individual",
    biz: "Business",
    name: "Display name",
    phone: "Phone",
    email: "Email",
    wa: "WhatsApp (optional)",
    pref: "Preferred method",
    pPhone: "Phone",
    pEmail: "Email",
    pBoth: "Both",
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
        <input
          className={`${inputClass} mt-2`}
          inputMode="tel"
          value={state.whatsapp}
          onChange={(e) => setState((s) => ({ ...s, whatsapp: e.target.value }))}
        />
      </div>
      <div>
        <label className={labelClass}>{t.pref}</label>
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
        </select>
      </div>
    </SectionShell>
  );
}
