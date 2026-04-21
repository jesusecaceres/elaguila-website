"use client";

import Link from "next/link";
import { leonixClasificadosPublishHubHref } from "./leonixPublishHubHref";

export type LeonixCategoryApplicationHeaderProps = {
  lang: "es" | "en";
  /** Short category line, e.g. "Bienes Raíces · Privado" */
  categoryTitle: string;
  /** Main H1 */
  headline: string;
  hubHref?: string;
};

const ONE_STOP_ES =
  "Leonix Media reúne tu presencia en un solo lugar: sitio, redes, identidad y enlaces para que tu negocio se vea completo y profesional.";
const ONE_STOP_EN =
  "Leonix Media brings your whole business presence together in one place—website, social handles, brand, and supporting links—so customers see you clearly.";

export function LeonixCategoryApplicationHeader({
  lang,
  categoryTitle,
  headline,
  hubHref,
}: LeonixCategoryApplicationHeaderProps) {
  const hub = hubHref ?? leonixClasificadosPublishHubHref(lang);
  const statement = lang === "es" ? ONE_STOP_ES : ONE_STOP_EN;
  const cta = lang === "es" ? "Volver al hub" : "Back to hub";

  return (
    <header className="min-w-0 border-b border-black/10 pb-6">
      <p className="text-xs font-bold uppercase tracking-wide text-[#B8954A]">{categoryTitle}</p>
      <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#1E1810] sm:text-[1.65rem]">{headline}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#5C5346]">{statement}</p>
      <div className="mt-5">
        <Link
          href={hub}
          className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full border border-[#C9B46A]/60 bg-[#FFF6E7] px-6 text-sm font-semibold text-[#6E5418] transition hover:bg-[#FFEFD8] sm:w-auto sm:px-8"
        >
          {cta}
        </Link>
      </div>
    </header>
  );
}
