"use client";

import SectionShell from "@/app/clasificados/en-venta/shared/components/SectionShell";
import type { EnVentaProApplicationState } from "../schema/enVentaProFormState";
import type { EnVentaFreeSectionProps } from "../../../free/application/types/sectionProps";
import { inputClass, labelClass } from "../../../free/application/helpers/fieldCx";

const COPY = {
  es: {
    title: "Contacto y redes",
    desc: "Da más canales de contacto sin perder claridad.",
    web: "Sitio web",
    fb: "Facebook",
    ig: "Instagram",
    tt: "TikTok",
    yt: "YouTube",
    other: "Otro perfil / URL",
  },
  en: {
    title: "Business links",
    desc: "More ways to reach you — still En Venta, not a corporate portal.",
    web: "Website",
    fb: "Facebook",
    ig: "Instagram",
    tt: "TikTok",
    yt: "YouTube",
    other: "Other profile URL",
  },
} as const;

export function BusinessLinksSection({
  lang,
  state,
  setState,
}: EnVentaFreeSectionProps<EnVentaProApplicationState>) {
  const t = COPY[lang];
  return (
    <SectionShell lang={lang} title={t.title} description={t.desc}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass}>{t.web}</label>
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
