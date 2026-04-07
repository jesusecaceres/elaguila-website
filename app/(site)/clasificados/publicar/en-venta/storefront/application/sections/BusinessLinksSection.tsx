"use client";

import SectionShell from "@/app/clasificados/en-venta/shared/components/SectionShell";
import type { EnVentaStorefrontApplicationState } from "../schema/enVentaStorefrontFormState";
import type { EnVentaFreeSectionProps } from "../../../free/application/types/sectionProps";
import { inputClass, labelClass } from "../../../free/application/helpers/fieldCx";

const COPY = {
  es: {
    title: "Contacto y redes",
    desc: "Enlaces públicos opcionales — ayudan a validar tu tienda sin llenar el formulario.",
    web: "Sitio web",
    webH: "Tu tienda o catálogo si ya existe.",
    fb: "Facebook",
    ig: "Instagram",
    tt: "TikTok",
    yt: "YouTube",
    other: "Otro perfil / URL",
    otherH: "Mercado, blog u otro enlace útil.",
  },
  en: {
    title: "Business links",
    desc: "Optional public links — they help buyers trust you without bloating the form.",
    web: "Website",
    webH: "Your shop or catalog if you already have one.",
    fb: "Facebook",
    ig: "Instagram",
    tt: "TikTok",
    yt: "YouTube",
    other: "Other profile URL",
    otherH: "Another useful public link.",
  },
} as const;

export function BusinessLinksSection({
  lang,
  state,
  setState,
}: EnVentaFreeSectionProps<EnVentaStorefrontApplicationState>) {
  const t = COPY[lang];
  return (
    <SectionShell lang={lang} title={t.title} description={t.desc}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass}>{t.web}</label>
          <p className="mt-1 text-xs text-white/55">{t.webH}</p>
          <input
            className={`${inputClass} mt-2`}
            value={state.website}
            onChange={(e) => setState((s) => ({ ...s, website: e.target.value }))}
          />
        </div>
        <div>
          <label className={labelClass}>{t.fb}</label>
          <input
            className={`${inputClass} mt-2`}
            value={state.facebookUrl}
            onChange={(e) => setState((s) => ({ ...s, facebookUrl: e.target.value }))}
          />
        </div>
        <div>
          <label className={labelClass}>{t.ig}</label>
          <input
            className={`${inputClass} mt-2`}
            value={state.instagramUrl}
            onChange={(e) => setState((s) => ({ ...s, instagramUrl: e.target.value }))}
          />
        </div>
        <div>
          <label className={labelClass}>{t.tt}</label>
          <input
            className={`${inputClass} mt-2`}
            value={state.tiktokUrl}
            onChange={(e) => setState((s) => ({ ...s, tiktokUrl: e.target.value }))}
          />
        </div>
        <div>
          <label className={labelClass}>{t.yt}</label>
          <input
            className={`${inputClass} mt-2`}
            value={state.youtubeUrl}
            onChange={(e) => setState((s) => ({ ...s, youtubeUrl: e.target.value }))}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>{t.other}</label>
          <p className="mt-1 text-xs text-white/55">{t.otherH}</p>
          <input
            className={`${inputClass} mt-2`}
            value={state.otherProfileUrl}
            onChange={(e) => setState((s) => ({ ...s, otherProfileUrl: e.target.value }))}
          />
        </div>
      </div>
    </SectionShell>
  );
}
