"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  resolveClasificadosPublishLang,
  withClasificadosPublishLang,
} from "@/app/lib/clasificados/clasificadosPublishLang";
import {
  EN_VENTA_PUBLICAR_PRO,
  EN_VENTA_PUBLICAR_STOREFRONT,
} from "@/app/clasificados/en-venta/shared/constants/enVentaPublishRoutes";
import type { EnVentaPublishHubResolved } from "@/app/lib/clasificados/mergeClasificadosCategoryContent";
import newLogo from "../../../../../public/logo.png";

type Lang = "es" | "en";

/** Fallback hub UI if server redirect is bypassed — single Pro-included CTA (Free lane not shown). */
export function EnVentaPublishHubClient({ hub }: { hub: EnVentaPublishHubResolved }) {
  const searchParams = useSearchParams();
  const { routeLang, copyLang: lang } = useMemo(
    () => resolveClasificadosPublishLang(searchParams?.get("lang")),
    [searchParams],
  );
  const other: Lang = lang === "es" ? "en" : "es";
  const toggleHref = withClasificadosPublishLang("/clasificados/publicar/en-venta", other);

  const langToggleLabel = lang === "es" ? hub.langToggleEs : hub.langToggleEn;

  const backBase = hub.backHref.startsWith("/") ? hub.backHref : "/clasificados/publicar";
  const backLink = withClasificadosPublishLang(backBase, routeLang);
  const proHref = withClasificadosPublishLang(EN_VENTA_PUBLICAR_PRO, routeLang);
  const storefrontHref = withClasificadosPublishLang(EN_VENTA_PUBLICAR_STOREFRONT, routeLang);

  const copy = hub;

  return (
    <main className="min-h-screen bg-[#F6F0E2] text-[#3D2C12] pt-28 pb-16">
      <div className="mx-auto max-w-5xl px-6">
        <section className="rounded-3xl border border-[#D8C79A]/70 bg-[#FFFDF7] p-6 shadow-[0_18px_48px_rgba(113,84,22,0.10)] sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <Image src={newLogo} alt="LEONIX" width={170} className="h-auto w-[145px] sm:w-[170px]" />
              <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[#3D2C12] sm:text-5xl">{copy.title}</h1>
              <p className="mt-2 max-w-2xl text-base text-[#5D4A25]/85 sm:text-lg">{copy.subtitle}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 self-start rounded-xl border border-[#D8C79A]/65 bg-[#FFF6E7] p-1.5 shadow-sm">
              <Link
                href={toggleHref}
                className="rounded-lg border border-[#D8C79A]/70 bg-[#FFFCF4] px-4 py-2 text-sm font-semibold text-[#3D2C12] hover:bg-[#FFF0DA]"
              >
                {langToggleLabel}
              </Link>
              <Link
                href={backLink}
                className="rounded-lg border border-[#B28A2F]/45 bg-[#B28A2F]/12 px-4 py-2 text-sm font-semibold text-[#6E4E18] hover:bg-[#B28A2F]/20"
              >
                {copy.back}
              </Link>
            </div>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <Link
              href={proHref}
              className="group relative overflow-hidden rounded-2xl border border-[#C9B46A]/55 bg-gradient-to-br from-[#2B261C] to-[#17140F] px-5 py-6 text-left text-[#F5F5F5] shadow-[0_12px_28px_rgba(42,36,22,0.25)] transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#C9B46A]/40 sm:col-span-2"
            >
              <span className="inline-flex w-fit items-center rounded-full border border-[#C9B46A]/45 bg-[#C9B46A]/14 px-2.5 py-1 text-[11px] font-semibold text-[#E4D4A8]">
                {copy.laneProBadge}
              </span>
              <span className="mt-2 block text-xl font-bold text-[#E4D4A8]">{copy.proTitle}</span>
              <span className="mt-1 block text-sm text-white/85">{copy.proDesc}</span>
              <span className="mt-3 inline-flex rounded-lg bg-[#C9B46A]/20 px-3 py-1.5 text-sm font-semibold text-[#F5EED4]">
                {lang === "es" ? "Continuar a publicar →" : "Continue to post →"}
              </span>
            </Link>
            <Link
              href={storefrontHref}
              className="group relative overflow-hidden rounded-2xl border border-[#D8C79A]/65 bg-gradient-to-br from-[#FFF8EA] to-[#FFFDF7] px-4 py-5 text-left shadow-sm transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30 sm:col-span-2"
            >
              <span className="inline-flex w-fit items-center rounded-full bg-[#F6E2B4] px-2.5 py-1 text-[11px] font-semibold text-[#3D2C12]">
                {copy.laneSfEmoji}
              </span>
              <span className="mt-2 block text-lg font-bold text-[#3D2C12]">{copy.sfTitle}</span>
              <span className="mt-1 block text-sm text-[#5D4A25]/80">{copy.sfDesc}</span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
