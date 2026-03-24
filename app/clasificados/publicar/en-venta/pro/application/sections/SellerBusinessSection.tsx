"use client";

import SectionShell from "@/app/clasificados/en-venta/shared/components/SectionShell";
import type { EnVentaProApplicationState } from "../schema/enVentaProFormState";
import type { EnVentaFreeSectionProps } from "../../../free/application/types/sectionProps";
import { inputClass, labelClass } from "../../../free/application/helpers/fieldCx";

const COPY = {
  es: {
    title: "Identidad del vendedor / negocio",
    desc: "Nombre visible, logo y una línea clara ayudan a que compren con confianza — sin parecer otro vertical.",
    bizName: "Nombre comercial / para mostrar",
    bizNameH: "Así te verán en el anuncio; mantenlo reconocible.",
    legal: "Razón social (opcional)",
    legalH: "Si no aplica o prefieres no mostrarla, déjala en blanco.",
    logo: "URL del logo (próximo: subida)",
    logoH: "Cuadrado o horizontal claro se ve mejor en listados.",
    avatar: "Foto de perfil / vendedor (URL)",
    avatarH: "Opcional — humaniza la tienda.",
    tag: "Eslogan corto",
    tagH: "Una frase que diga qué vendes o qué te diferencia.",
    store: "Descripción de la tienda",
    storeH: "Qué ofreces, horarios aproximados o qué esperar al comprar.",
  },
  en: {
    title: "Seller & business identity",
    desc: "Clear display name, logo, and tagline build trust — still En Venta, not a corporate portal.",
    bizName: "Business display name",
    bizNameH: "How you show up on the listing; keep it recognizable.",
    legal: "Legal name (optional)",
    legalH: "Skip if it doesn’t apply or you prefer not to show it.",
    logo: "Logo URL (upload next)",
    logoH: "Square or wide logos read best in feeds.",
    avatar: "Seller avatar URL",
    avatarH: "Optional — adds a human face to the shop.",
    tag: "Short tagline",
    tagH: "One line on what you sell or what makes you different.",
    store: "Store description",
    storeH: "What you offer, rough hours, or what buyers should expect.",
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
        <p className="mt-1 text-xs text-white/55">{t.bizNameH}</p>
        <input
          className={`${inputClass} mt-2`}
          value={state.businessDisplayName}
          onChange={(e) => setState((s) => ({ ...s, businessDisplayName: e.target.value }))}
        />
      </div>
      <div>
        <label className={labelClass}>{t.legal}</label>
        <p className="mt-1 text-xs text-white/55">{t.legalH}</p>
        <input
          className={`${inputClass} mt-2`}
          value={state.legalBusinessName}
          onChange={(e) => setState((s) => ({ ...s, legalBusinessName: e.target.value }))}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>{t.logo}</label>
          <p className="mt-1 text-xs text-white/55">{t.logoH}</p>
          <input
            className={`${inputClass} mt-2`}
            value={state.logoUrl}
            onChange={(e) => setState((s) => ({ ...s, logoUrl: e.target.value }))}
          />
        </div>
        <div>
          <label className={labelClass}>{t.avatar}</label>
          <p className="mt-1 text-xs text-white/55">{t.avatarH}</p>
          <input
            className={`${inputClass} mt-2`}
            value={state.sellerAvatarUrl}
            onChange={(e) => setState((s) => ({ ...s, sellerAvatarUrl: e.target.value }))}
          />
        </div>
      </div>
      <div>
        <label className={labelClass}>{t.tag}</label>
        <p className="mt-1 text-xs text-white/55">{t.tagH}</p>
        <input
          className={`${inputClass} mt-2`}
          value={state.tagline}
          onChange={(e) => setState((s) => ({ ...s, tagline: e.target.value }))}
        />
      </div>
      <div>
        <label className={labelClass}>{t.store}</label>
        <p className="mt-1 text-xs text-white/55">{t.storeH}</p>
        <textarea
          className={`${inputClass} mt-2 min-h-[96px]`}
          value={state.storeDescription}
          onChange={(e) => setState((s) => ({ ...s, storeDescription: e.target.value }))}
        />
      </div>
    </SectionShell>
  );
}
