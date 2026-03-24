"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SectionShell from "./SectionShell";

const COPY = {
  es: {
    title: "Confirmación antes de publicar",
    desc: "Estas casillas ayudan a mantener Leonix claro y confiable para todos.",
    a: "Confirmo que la información del artículo es veraz y actualizada.",
    b: "Confirmo que las fotos muestran el artículo real que estoy vendiendo.",
    c: "Confirmo que mi anuncio respeta las reglas de la comunidad y del marketplace.",
    rulesLink: "Ver reglas de Leonix",
  },
  en: {
    title: "Confirmation before posting",
    desc: "These checks help keep Leonix clear and trustworthy for everyone.",
    a: "I confirm the item information is accurate and up to date.",
    b: "I confirm the photos show the actual item I’m selling.",
    c: "I confirm this listing follows community and marketplace rules.",
    rulesLink: "View Leonix rules",
  },
} as const;

type Props = {
  lang: "es" | "en";
  variant?: "light" | "dark";
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
  confirmAccurate,
  confirmPhotos,
  confirmRules,
  onAccurate,
  onPhotos,
  onRules,
}: Props) {
  const t = COPY[lang];
  const pathname = usePathname() || "";
  const rulesHref = `/clasificados/reglas?lang=${lang}&return=${encodeURIComponent(pathname || "/clasificados/publicar/en-venta")}`;

  const row =
    variant === "dark"
      ? "flex cursor-pointer items-start gap-3 rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-white/90"
      : "flex cursor-pointer items-start gap-3 rounded-xl border border-black/10 bg-[#FAFAFA] p-3 text-sm text-[#111111]";

  const linkClass =
    variant === "dark"
      ? "mt-3 inline-block text-sm font-semibold text-[#C9B46A] underline underline-offset-2 hover:text-[#E4D4A8]"
      : "mt-3 inline-block text-sm font-semibold text-[#111111] underline underline-offset-2 hover:opacity-90";

  return (
    <SectionShell lang={lang} title={t.title} description={t.desc}>
      <Link href={rulesHref} className={linkClass}>
        {t.rulesLink}
      </Link>
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
  );
}
