"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BR_PUBLICAR_NEGOCIO_SELECTOR } from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";
import { withClasificadosPublishLang, resolveClasificadosPublishLang } from "@/app/lib/clasificados/clasificadosPublishLang";
import { brAgenteApplicationPricingCopy, type BrAgentePricingLang } from "./shared/brAgenteApplicationPricingCopy";
import { BrAgenteShowcaseSeeMoreDrawer } from "./shared/BrAgenteShowcaseSeeMoreDrawer";

const HUB_COPY = {
  es: {
    title: "Publicar en Bienes Raíces",
    body: "Dos caminos claros: particular (privado) o perfil profesional (negocio). Ambos pagan por publicación en este lanzamiento.",
    particularKicker: "Particular",
    particularTitle: "Privado",
    particularBody: "Para dueños y anuncios personales.",
    privadoHref: "/clasificados/publicar/bienes-raices/privado",
  },
  en: {
    title: "Publish in Real Estate",
    body: "Two clear paths: individual (private) or professional profile (business). Both are paid per listing in this launch.",
    particularKicker: "Individual",
    particularTitle: "Private",
    particularBody: "For owners and personal listings.",
    privadoHref: "/clasificados/publicar/bienes-raices/privado",
  },
} as const;

type Props = {
  lang: BrAgentePricingLang;
};

export function BienesRaicesPublicarHubClient({ lang }: Props) {
  const searchParams = useSearchParams();
  const routeLang = useMemo(
    () => resolveClasificadosPublishLang(searchParams?.get("lang")).routeLang,
    [searchParams],
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const hub = HUB_COPY[lang];
  const pricing = brAgenteApplicationPricingCopy(lang);

  const withLang = (path: string) => withClasificadosPublishLang(path, routeLang);

  return (
    <>
      <main className="min-h-screen bg-[#F6F0E2] px-4 pb-20 pt-28 text-[#2C2416]">
        <div className="mx-auto max-w-lg">
          <h1 className="text-3xl font-extrabold text-[#1E1810]">{hub.title}</h1>
          <p className="mt-2 text-sm text-[#5C5346]/88">{hub.body}</p>
          <div className="mt-8 space-y-4">
            <Link
              href={withLang(hub.privadoHref)}
              className="block rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7] p-5 shadow-sm transition hover:border-[#C9B46A]/50"
            >
              <p className="text-xs font-bold uppercase tracking-wide text-[#B8954A]">{hub.particularKicker}</p>
              <p className="mt-1 text-lg font-bold text-[#1E1810]">{hub.particularTitle}</p>
              <p className="mt-1 text-sm text-[#5C5346]/85">{hub.particularBody}</p>
            </Link>

            <div className="rounded-2xl border border-[#C9B46A]/45 bg-gradient-to-br from-[#FFF6E7] to-[#FFFCF7] p-5 shadow-md">
              <p className="text-xs font-bold uppercase tracking-wide text-[#B8954A]">{pricing.startProKicker}</p>
              <p className="mt-1 text-lg font-bold text-[#1E1810]">{pricing.startProTitle}</p>
              <p className="mt-2 text-sm font-bold text-[#6E5418]">
                {pricing.startShowcaseTitle} · {pricing.startShowcasePrice}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[#5C5346]/90">{pricing.startShowcaseBody}</p>
              <p className="mt-3 text-sm font-semibold text-[#6E5418]">{pricing.startInventoryOptional}</p>
              <p className="mt-0.5 text-xs text-[#5C5346]/85">{pricing.startInventoryOptionalDetail}</p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Link
                  href={withLang(BR_PUBLICAR_NEGOCIO_SELECTOR)}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#1E1810] px-5 py-2.5 text-center text-sm font-bold text-[#F9F6F1] hover:bg-[#2C2416]"
                >
                  {pricing.startPublishCta}
                </Link>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#C9B46A]/60 bg-white px-5 py-2.5 text-sm font-semibold text-[#6E5418] hover:bg-[#FFF6E7]"
                >
                  {pricing.startSeeMore}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <BrAgenteShowcaseSeeMoreDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} lang={lang} />
    </>
  );
}
