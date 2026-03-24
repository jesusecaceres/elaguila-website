"use client";

import SectionShell from "@/app/clasificados/en-venta/shared/components/SectionShell";
import type { EnVentaProApplicationState } from "../schema/enVentaProFormState";
import type { EnVentaFreeSectionProps } from "../../../free/application/types/sectionProps";
import { inputClass, labelClass } from "../../../free/application/helpers/fieldCx";

const COPY = {
  es: {
    title: "Identidad del vendedor / negocio",
    desc: "Refuerza confianza con nombre, logo y una línea clara de tu tienda.",
    bizName: "Nombre comercial",
    legal: "Razón social (opcional)",
    logo: "URL del logo (próximo: subida)",
    avatar: "Foto de perfil / vendedor (URL)",
    tag: "Eslogan corto",
    store: "Descripción de la tienda",
  },
  en: {
    title: "Seller & business identity",
    desc: "Build trust with display name, logo, and a clear store line.",
    bizName: "Business display name",
    legal: "Legal name (optional)",
    logo: "Logo URL (upload next)",
    avatar: "Seller avatar URL",
    tag: "Short tagline",
    store: "Store description",
  },
} as const;

export function SellerBusinessSection({
  lang,
  state,
  setState,
}: EnVentaFreeSectionProps<EnVentaProApplicationState>) {
  const t = COPY[lang];
  return (
    <SectionShell lang={lang} title={t.title} description={t.desc}>
      <div>
        <label className={labelClass}>{t.bizName}</label>
        <input
          className={`${inputClass} mt-2`}
          value={state.businessDisplayName}
          onChange={(e) => setState((s) => ({ ...s, businessDisplayName: e.target.value }))}
        />
      </div>
      <div>
        <label className={labelClass}>{t.legal}</label>
        <input
          className={`${inputClass} mt-2`}
          value={state.legalBusinessName}
          onChange={(e) => setState((s) => ({ ...s, legalBusinessName: e.target.value }))}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>{t.logo}</label>
          <input
            className={`${inputClass} mt-2`}
            value={state.logoUrl}
            onChange={(e) => setState((s) => ({ ...s, logoUrl: e.target.value }))}
          />
        </div>
        <div>
          <label className={labelClass}>{t.avatar}</label>
          <input
            className={`${inputClass} mt-2`}
            value={state.sellerAvatarUrl}
            onChange={(e) => setState((s) => ({ ...s, sellerAvatarUrl: e.target.value }))}
          />
        </div>
      </div>
      <div>
        <label className={labelClass}>{t.tag}</label>
        <input
          className={`${inputClass} mt-2`}
          value={state.tagline}
          onChange={(e) => setState((s) => ({ ...s, tagline: e.target.value }))}
        />
      </div>
      <div>
        <label className={labelClass}>{t.store}</label>
        <textarea
          className={`${inputClass} mt-2 min-h-[96px]`}
          value={state.storeDescription}
          onChange={(e) => setState((s) => ({ ...s, storeDescription: e.target.value }))}
        />
      </div>
    </SectionShell>
  );
}
