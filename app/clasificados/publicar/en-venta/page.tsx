"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  EN_VENTA_PUBLICAR_FREE,
  EN_VENTA_PUBLICAR_PRO,
  EN_VENTA_PUBLICAR_STOREFRONT,
} from "@/app/clasificados/en-venta/shared/constants/enVentaPublishRoutes";

type Lang = "es" | "en";

/**
 * En Venta publish hub — choose Free vs Pro (thin route; no form brain).
 */
export default function EnVentaPublishHubPage() {
  const searchParams = useSearchParams();
  const lang: Lang = searchParams?.get("lang") === "en" ? "en" : "es";
  const other: Lang = lang === "es" ? "en" : "es";
  const qs = new URLSearchParams(searchParams?.toString() ?? "");
  qs.set("lang", other);
  const toggleHref = `/clasificados/publicar/en-venta?${qs.toString()}`;

  const copy =
    lang === "es"
      ? {
          title: "En Venta — elige tu plan",
          subtitle: "Gratis para publicar rápido. Pro mejora un anuncio concreto. Storefront (próximamente) será para tiendas y presencia de vendedor.",
          freeTitle: "Gratis",
          freeDesc: "Listado básico y flujo corto. Ideal para ventas ocasionales.",
          proTitle: "Pro",
          proDesc: "Anuncio premium: más fotos, video y mejor presentación por listado.",
          sfTitle: "Storefront",
          sfDesc: "Próximamente — perfil de tienda y capa de negocio para vendedores frecuentes.",
          back: "Todas las categorías",
          langToggle: "English",
        }
      : {
          title: "For sale — pick your lane",
          subtitle: "Free for quick posts. Pro upgrades a single listing. Storefront (coming soon) is for shop-style seller presence.",
          freeTitle: "Free",
          freeDesc: "Basic listing and a short flow. Best for occasional sellers.",
          proTitle: "Pro",
          proDesc: "Premium listing: more photos, video, and stronger presentation per ad.",
          sfTitle: "Storefront",
          sfDesc: "Coming soon — store profile and business layer for frequent sellers.",
          back: "All categories",
          langToggle: "Español",
        };

  const laneQs = new URLSearchParams(searchParams?.toString() ?? "");
  if (!laneQs.get("lang")) laneQs.set("lang", lang);

  return (
    <main className="min-h-screen bg-[#D9D9D9] text-[#111111] pt-28 pb-16">
      <div className="mx-auto max-w-lg px-6">
        <div className="rounded-2xl border border-black/10 bg-[#F5F5F5] p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold">{copy.title}</h1>
              <p className="mt-2 text-[#111111]/80">{copy.subtitle}</p>
            </div>
            <Link
              href={toggleHref}
              className="shrink-0 self-center sm:self-start rounded-xl border border-black/15 bg-white px-4 py-2 text-sm font-semibold text-[#111111] hover:bg-[#E8E8E8]"
            >
              {copy.langToggle}
            </Link>
          </div>

          <div className="mt-8 grid gap-3">
            <Link
              href={`${EN_VENTA_PUBLICAR_FREE}?${laneQs.toString()}`}
              className="flex flex-col rounded-xl border border-black/10 bg-white px-4 py-5 text-left transition hover:bg-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30"
            >
              <span className="text-lg font-bold text-[#111111]">{copy.freeTitle}</span>
              <span className="mt-1 text-sm text-[#111111]/70">{copy.freeDesc}</span>
            </Link>
            <Link
              href={`${EN_VENTA_PUBLICAR_PRO}?${laneQs.toString()}`}
              className="flex flex-col rounded-xl border border-[#A98C2A]/35 bg-[#111111] px-4 py-5 text-left text-[#F5F5F5] transition hover:bg-black focus:outline-none focus:ring-2 focus:ring-[#C9B46A]/40"
            >
              <span className="text-lg font-bold text-[#C9B46A]">{copy.proTitle}</span>
              <span className="mt-1 text-sm text-white/80">{copy.proDesc}</span>
            </Link>
            <Link
              href={`${EN_VENTA_PUBLICAR_STOREFRONT}?${laneQs.toString()}`}
              className="flex flex-col rounded-xl border border-black/15 bg-white/90 px-4 py-5 text-left transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30"
            >
              <span className="text-lg font-bold text-[#111111]">{copy.sfTitle}</span>
              <span className="mt-1 text-sm text-[#111111]/70">{copy.sfDesc}</span>
            </Link>
          </div>

          <div className="mt-8 flex justify-center">
            <Link
              href={`/clasificados/publicar?lang=${lang}`}
              className="text-sm font-semibold text-[#111111]/80 underline hover:text-[#111111]"
            >
              {copy.back}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
