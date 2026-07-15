"use client";

import { useState } from "react";
import SectionShell from "@/app/clasificados/en-venta/shared/components/SectionShell";
import LeonixMarketplaceRulesDialog from "@/app/clasificados/en-venta/shared/components/LeonixMarketplaceRulesDialog";
import { getLaunchUiMessages } from "@/app/lib/i18n/launchUiDictionaries";
import type { OfficialLocale } from "@/app/lib/language";

const esConfirmTitle = getLaunchUiMessages("es").rentas.confirmations.title;
const enConfirmTitle = getLaunchUiMessages("en").rentas.confirmations.title;
const ptConfirmTitle = getLaunchUiMessages("pt").rentas.confirmations.title;
const tlConfirmTitle = getLaunchUiMessages("tl").rentas.confirmations.title;

const COPY_ITEM = {
  es: {
    title: esConfirmTitle,
    desc: "Estas casillas ayudan a mantener Leonix claro y confiable para todos.",
    a: "Confirmo que la información del artículo es veraz y actualizada.",
    b: "Confirmo que las fotos muestran el artículo real que estoy vendiendo.",
    c: "Confirmo que mi anuncio cumple con las reglas de Varios y que soy responsable por la información publicada.",
    rulesLink: "Ver reglas de Leonix",
  },
  en: {
    title: enConfirmTitle,
    desc: "These checks help keep Leonix clear and trustworthy for everyone.",
    a: "I confirm the item information is accurate and up to date.",
    b: "I confirm the photos show the actual item I’m selling.",
    c: "I confirm my listing follows Varios rules and that I am responsible for the information posted.",
    rulesLink: "View Leonix rules",
  },
  pt: {
    title: ptConfirmTitle,
    desc: "Estas caixas ajudam a manter o Leonix claro e confiável para todos.",
    a: "Confirmo que as informações do artigo são verdadeiras e atualizadas.",
    b: "Confirmo que as fotos mostram o artigo real que estou vendendo.",
    c: "Confirmo que meu anúncio segue as regras de Varios e que sou responsável pelas informações publicadas.",
    rulesLink: "Ver regras do Leonix",
  },
  tl: {
    title: tlConfirmTitle,
    desc: "Nakakatulong ang mga checkbox na ito para panatilihing malinaw at mapagkakatiwalaan ang Leonix para sa lahat.",
    a: "Kinukumpirma ko na tumpak at updated ang impormasyon ng item.",
    b: "Kinukumpirma ko na ang mga larawan ay nagpapakita ng aktwal na item na ibinebenta ko.",
    c: "Kinukumpirma ko na sinusunod ng listing ko ang mga patakaran ng Varios at ako ang responsable sa inilathalang impormasyon.",
    rulesLink: "Tingnan ang mga patakaran ng Leonix",
  },
} as const;

const COPY_SERVICIOS = {
  es: {
    title: esConfirmTitle,
    desc: "Estas casillas ayudan a mantener Leonix claro y confiable para todos.",
    a: "Confirmo que la información de mi servicio o negocio es veraz y actualizada.",
    b: "Confirmo que las imágenes, videos o documentos que subí pertenecen a mi servicio o negocio.",
    c: "Confirmo que mi perfil de servicio cumple con las reglas de Leonix y que soy responsable por la información publicada.",
    rulesLink: "Ver reglas de Leonix",
  },
  en: {
    title: enConfirmTitle,
    desc: "These checks help keep Leonix clear and trustworthy for everyone.",
    a: "I confirm that my service or business information is accurate and up to date.",
    b: "I confirm that the images, videos, or documents I uploaded belong to my service or business.",
    c: "I confirm that my service profile follows Leonix rules and that I am responsible for the information published.",
    rulesLink: "View Leonix rules",
  },
  pt: {
    title: ptConfirmTitle,
    desc: "Estas caixas ajudam a manter o Leonix claro e confiável para todos.",
    a: "Confirmo que as informações do meu serviço ou negócio são verdadeiras e atualizadas.",
    b: "Confirmo que as imagens, vídeos ou documentos que enviei pertencem ao meu serviço ou negócio.",
    c: "Confirmo que meu perfil de serviço segue as regras do Leonix e que sou responsável pelas informações publicadas.",
    rulesLink: "Ver regras do Leonix",
  },
  tl: {
    title: tlConfirmTitle,
    desc: "Nakakatulong ang mga checkbox na ito para panatilihing malinaw at mapagkakatiwalaan ang Leonix para sa lahat.",
    a: "Kinukumpirma ko na tumpak at updated ang impormasyon ng aking serbisyo o negosyo.",
    b: "Kinukumpirma ko na ang mga larawan, video, o dokumentong in-upload ko ay pag-aari ng aking serbisyo o negosyo.",
    c: "Kinukumpirma ko na sinusunod ng service profile ko ang mga patakaran ng Leonix at ako ang responsable sa inilathalang impormasyon.",
    rulesLink: "Tingnan ang mga patakaran ng Leonix",
  },
} as const;

type Props = {
  lang: OfficialLocale;
  variant?: "light" | "dark";
  /** Marketplace item (En Venta) vs Servicios business profile vs Bienes Raíces / Rentas property */
  subject?: "item" | "servicios" | "property";
  confirmAccurate: boolean;
  confirmPhotos: boolean;
  confirmRules: boolean;
  onAccurate: (v: boolean) => void;
  onPhotos: (v: boolean) => void;
  onRules: (v: boolean) => void;
};

export default function ListingRulesConfirmationSection({
  lang,
  variant = "light",
  subject = "item",
  confirmAccurate,
  confirmPhotos,
  confirmRules,
  onAccurate,
  onPhotos,
  onRules,
}: Props) {
  const [rulesOpen, setRulesOpen] = useState(false);
  const confirmations = getLaunchUiMessages(lang).rentas.confirmations;
  const t =
    subject === "property"
      ? {
          title: confirmations.title,
          desc: confirmations.desc,
          a: confirmations.accurate,
          b: confirmations.photos,
          c: confirmations.rules,
          rulesLink: confirmations.rulesLink,
        }
      : subject === "servicios"
        ? COPY_SERVICIOS[lang]
        : COPY_ITEM[lang];

  const rulesDialogLang = ({ en: "en", es: "es", pt: "es", tl: "es" } as const)[lang];

  const row =
    variant === "dark"
      ? "flex cursor-pointer items-start gap-3 rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-white/90"
      : "flex cursor-pointer items-start gap-3 rounded-xl border border-black/10 bg-[#FAFAFA] p-3 text-sm text-[#111111]";

  const linkClass =
    variant === "dark"
      ? "mt-3 inline-block text-sm font-semibold text-[#C9B46A] underline underline-offset-2 hover:text-[#E4D4A8]"
      : "mt-3 inline-block text-sm font-semibold text-[#111111] underline underline-offset-2 hover:opacity-90";

  return (
    <div id="listing-publish" className="scroll-mt-28">
      <LeonixMarketplaceRulesDialog
        open={rulesOpen}
        onClose={() => setRulesOpen(false)}
        lang={rulesDialogLang}
        variant={variant}
      />
      <SectionShell lang={rulesDialogLang} title={t.title} description={t.desc}>
        <button type="button" className={linkClass} onClick={() => setRulesOpen(true)}>
          {t.rulesLink}
        </button>
        <label className={`${row} mt-4`}>
          <input
            type="checkbox"
            className="mt-1 shrink-0"
            checked={confirmAccurate}
            onChange={(e) => onAccurate(e.target.checked)}
          />
          <span>{t.a}</span>
        </label>
        <label className={row}>
          <input
            type="checkbox"
            className="mt-1 shrink-0"
            checked={confirmPhotos}
            onChange={(e) => onPhotos(e.target.checked)}
          />
          <span>{t.b}</span>
        </label>
        <label className={row}>
          <input
            type="checkbox"
            className="mt-1 shrink-0"
            checked={confirmRules}
            onChange={(e) => onRules(e.target.checked)}
          />
          <span>{t.c}</span>
        </label>
      </SectionShell>
    </div>
  );
}
