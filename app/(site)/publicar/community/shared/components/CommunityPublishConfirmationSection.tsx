"use client";

import { useState } from "react";

import SectionShell from "@/app/clasificados/en-venta/shared/components/SectionShell";
import LeonixMarketplaceRulesDialog from "@/app/clasificados/en-venta/shared/components/LeonixMarketplaceRulesDialog";

import type { CommunityPublishConfirmations } from "../types/communityQuickDraft";

const COPY_CLASES = {
  es: {
    title: "Confirmación antes de publicar",
    desc: "Estas casillas ayudan a mantener Leonix claro y confiable para todos.",
    a: "Confirmo que la información de la clase es veraz y actualizada.",
    b: "Confirmo que las imágenes o archivos representan la clase que estoy publicando.",
    c: "Confirmo que mi anuncio respeta las reglas de la comunidad y del marketplace.",
    rulesLink: "Ver reglas de Leonix",
  },
  en: {
    title: "Confirmation before publishing",
    desc: "These checks help keep Leonix clear and trustworthy for everyone.",
    a: "I confirm the class information is truthful and up to date.",
    b: "I confirm the images or files represent the class I am publishing.",
    c: "I confirm my listing follows the community and marketplace rules.",
    rulesLink: "View Leonix rules",
  },
} as const;

const COPY_COMUNIDAD = {
  es: {
    title: "Confirmación antes de publicar",
    desc: "Estas casillas ayudan a mantener Leonix claro y confiable para todos.",
    a: "Confirmo que la información del evento es veraz y actualizada.",
    b: "Confirmo que las imágenes o archivos representan el evento que estoy publicando.",
    c: "Confirmo que mi anuncio respeta las reglas de la comunidad y del marketplace.",
    rulesLink: "Ver reglas de Leonix",
  },
  en: {
    title: "Confirmation before publishing",
    desc: "These checks help keep Leonix clear and trustworthy for everyone.",
    a: "I confirm the event information is truthful and up to date.",
    b: "I confirm the images or files represent the event I am publishing.",
    c: "I confirm my listing follows the community and marketplace rules.",
    rulesLink: "View Leonix rules",
  },
} as const;

type Props = {
  lang: "es" | "en";
  variant: "clases" | "comunidad";
  value: CommunityPublishConfirmations;
  onChange: (patch: Partial<CommunityPublishConfirmations>) => void;
};

export function CommunityPublishConfirmationSection({ lang, variant, value, onChange }: Props) {
  const [rulesOpen, setRulesOpen] = useState(false);
  const t = variant === "comunidad" ? COPY_COMUNIDAD[lang] : COPY_CLASES[lang];

  const row =
    "flex cursor-pointer items-start gap-3 rounded-xl border border-black/10 bg-[#FAFAFA] p-3 text-sm text-[color:var(--lx-text)]";

  const linkClass =
    "mt-3 inline-block text-sm font-semibold text-[color:var(--lx-text)] underline underline-offset-2 hover:opacity-90";

  return (
    <div id="community-publish-confirm" className="scroll-mt-28">
      <LeonixMarketplaceRulesDialog
        open={rulesOpen}
        onClose={() => setRulesOpen(false)}
        lang={lang}
        variant="light"
      />
      <SectionShell lang={lang} title={t.title} description={t.desc}>
        <button type="button" className={linkClass} onClick={() => setRulesOpen(true)}>
          {t.rulesLink}
        </button>
        <label className={`${row} mt-4`}>
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 shrink-0 rounded border-black/20"
            checked={value.infoTruthful}
            onChange={(e) => onChange({ infoTruthful: e.target.checked })}
          />
          <span>{t.a}</span>
        </label>
        <label className={row}>
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 shrink-0 rounded border-black/20"
            checked={value.mediaAccurate}
            onChange={(e) => onChange({ mediaAccurate: e.target.checked })}
          />
          <span>{t.b}</span>
        </label>
        <label className={row}>
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 shrink-0 rounded border-black/20"
            checked={value.rulesAccepted}
            onChange={(e) => onChange({ rulesAccepted: e.target.checked })}
          />
          <span>{t.c}</span>
        </label>
      </SectionShell>
    </div>
  );
}
