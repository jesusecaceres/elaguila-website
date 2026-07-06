"use client";

import { useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { categoryConfig, type CategoryKey } from "@/app/clasificados/config/categoryConfig";
import ClasificadosCategoryComingSoon from "@/app/clasificados/publicar/components/ClasificadosCategoryComingSoon";
import { RENTAS_PUBLICAR_HUB } from "@/app/clasificados/rentas/shared/utils/rentasPublishRoutes";
import { resolveClasificadosPublishLang } from "@/app/lib/clasificados/clasificadosPublishLang";

function normalizeCategory(raw: string): CategoryKey | "" {
  const v = (raw ?? "").trim().toLowerCase();
  if (!v) return "";
  const mapped = v === "viajes" ? "travel" : v;
  const keys = Object.keys(categoryConfig) as CategoryKey[];
  return keys.includes(mapped as CategoryKey) ? (mapped as CategoryKey) : "";
}

/**
 * Dispatcher: known categories with dedicated publish routes redirect there; `rentas` → Rentas publish hub
 * (Privado vs Negocio). Other valid slugs fall back to Coming Soon. Invalid slug or `all` → chooser.
 */
export default function PublicarCategoryPage() {
  const params = useParams<{ category?: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { routeLang, copyLang } = resolveClasificadosPublishLang(searchParams?.get("lang"));
  const slug = (params?.category ?? "").trim().toLowerCase();
  const normalized = normalizeCategory(params?.category ?? "");
  const categoryFromUrl = normalized === "all" ? ("" as const) : normalized;

  useEffect(() => {
    if (slug === "bienes-raices" || slug === "br") {
      router.replace(`/clasificados/publicar/bienes-raices?lang=${routeLang}`);
      return;
    }
    if (categoryFromUrl === "en-venta") {
      router.replace(`/clasificados/publicar/en-venta?lang=${routeLang}`);
      return;
    }
    if (categoryFromUrl === "autos") {
      router.replace(`/publicar/autos?lang=${routeLang}`);
      return;
    }
    if (categoryFromUrl === "servicios") {
      router.replace(`/clasificados/publicar/servicios/checkpoint?lang=${routeLang}`);
      return;
    }
    if (categoryFromUrl === "restaurantes") {
      router.replace(`/publicar/restaurantes?lang=${routeLang}`);
      return;
    }
    if (categoryFromUrl === "travel") {
      router.replace(`/publicar/viajes?lang=${routeLang}`);
      return;
    }
    if (categoryFromUrl === "empleos") {
      router.replace(`/clasificados/publicar/empleos?lang=${routeLang}`);
      return;
    }
    if (categoryFromUrl === "rentas") {
      const p = new URLSearchParams(searchParams?.toString() ?? "");
      p.delete("cat");
      p.delete("categoria");
      if (!p.get("lang")) p.set("lang", routeLang);
      const qs = p.toString();
      router.replace(qs ? `${RENTAS_PUBLICAR_HUB}?${qs}` : `${RENTAS_PUBLICAR_HUB}?lang=${routeLang}`);
      return;
    }
    if (!categoryFromUrl) {
      router.replace(`/clasificados/publicar?lang=${routeLang}`);
    }
  }, [slug, categoryFromUrl, routeLang, router, searchParams]);

  if (
    slug === "bienes-raices" ||
    slug === "br" ||
    !categoryFromUrl ||
    categoryFromUrl === "en-venta" ||
    categoryFromUrl === "autos" ||
    categoryFromUrl === "servicios" ||
    categoryFromUrl === "restaurantes" ||
    categoryFromUrl === "travel" ||
    categoryFromUrl === "empleos" ||
    categoryFromUrl === "rentas"
  ) {
    return (
      <main className="min-h-[50vh] pt-28 flex items-center justify-center text-[#111111]/70 text-sm">
        {copyLang === "es" ? "Redirigiendo…" : "Redirecting…"}
      </main>
    );
  }

  return <ClasificadosCategoryComingSoon categorySlug={categoryFromUrl} lang={copyLang} />;
}
