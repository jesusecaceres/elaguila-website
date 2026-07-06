"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { EN_VENTA_PUBLICAR_HUB } from "@/app/clasificados/en-venta/shared/constants/enVentaPublishRoutes";
import { enVentaPublicLabel } from "@/app/clasificados/en-venta/shared/constants/enVentaPublicLabels";
import {
  resolveClasificadosPublishLang,
  withClasificadosPublishLang,
} from "@/app/lib/clasificados/clasificadosPublishLang";

/**
 * Storefront lane — public surface is Coming Soon.
 * Full intake lives in `application/LeonixEnVentaStorefrontApplication.tsx` for a future launch.
 */

export default function EnVentaStorefrontComingSoonPage() {
  const searchParams = useSearchParams();
  const { routeLang, copyLang: lang } = useMemo(
    () => resolveClasificadosPublishLang(searchParams?.get("lang")),
    [searchParams],
  );
  const other = lang === "es" ? "en" : "es";
  const toggleHref = withClasificadosPublishLang("/clasificados/publicar/en-venta/storefront", other);
  const hubHref = withClasificadosPublishLang(EN_VENTA_PUBLICAR_HUB, routeLang);

  const varios = enVentaPublicLabel(lang);
  const copy =
    lang === "es"
      ? {
          title: "Storefront — próximamente",
          body: "Un producto futuro para tiendas, vendedores frecuentes y presencia de negocio en Leonix (perfil de vendedor, logo, enlaces y más). No sustituye al anuncio Pro: es una capa aparte.",
          hub: `Volver a ${varios}`,
          langToggle: "English",
        }
      : {
          title: "Storefront — coming soon",
          body: "A future product for shops, frequent sellers, and business presence on Leonix (seller profile, logo, links, and depth). It is not the Pro listing upgrade — it is a separate layer.",
          hub: `Back to ${varios}`,
          langToggle: "Español",
        };

  return (
    <main className="min-h-screen bg-[#D9D9D9] text-[#111111] pt-28 pb-16">
      <div className="mx-auto max-w-lg px-6">
        <div className="rounded-2xl border border-black/10 bg-[#F5F5F5] p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-[#A98C2A]">Leonix · {varios}</p>
              <h1 className="mt-1 text-2xl font-extrabold">{copy.title}</h1>
              <p className="mt-3 text-[#111111]/80">{copy.body}</p>
            </div>
            <Link
              href={toggleHref}
              className="shrink-0 self-center sm:self-start rounded-xl border border-black/15 bg-white px-4 py-2 text-sm font-semibold text-[#111111] hover:bg-[#E8E8E8]"
            >
              {copy.langToggle}
            </Link>
          </div>
          <div className="mt-8 flex justify-center">
            <Link
              href={hubHref}
              className="text-sm font-semibold text-[#111111]/80 underline hover:text-[#111111]"
            >
              {copy.hub}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
