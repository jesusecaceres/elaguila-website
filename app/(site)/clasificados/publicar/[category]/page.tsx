"use client";

import { useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { categoryConfig, type CategoryKey } from "@/app/clasificados/config/categoryConfig";
import ClasificadosCategoryComingSoon from "@/app/clasificados/publicar/components/ClasificadosCategoryComingSoon";

function normalizeCategory(raw: string): CategoryKey | "" {
  const v = (raw ?? "").trim().toLowerCase();
  if (!v) return "";
  const mapped = v === "viajes" ? "travel" : v;
  const keys = Object.keys(categoryConfig) as CategoryKey[];
  return keys.includes(mapped as CategoryKey) ? (mapped as CategoryKey) : "";
}

/**
 * Category terminal: Coming Soon only. Invalid slug or `all` → chooser.
 */
export default function PublicarCategoryPage() {
  const params = useParams<{ category?: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = searchParams?.get("lang") === "en" ? "en" : "es";
  const slug = (params?.category ?? "").trim().toLowerCase();
  const normalized = normalizeCategory(params?.category ?? "");
  const categoryFromUrl = normalized === "all" ? ("" as const) : normalized;

  useEffect(() => {
    if (slug === "bienes-raices" || slug === "br") {
      router.replace(`/clasificados/publicar/bienes-raices?lang=${lang}`);
      return;
    }
    if (categoryFromUrl === "en-venta") {
      router.replace(`/clasificados/publicar/en-venta?lang=${lang}`);
      return;
    }
    if (categoryFromUrl === "autos") {
      router.replace(`/publicar/autos?lang=${lang}`);
      return;
    }
    if (categoryFromUrl === "servicios") {
      router.replace(`/clasificados/publicar/servicios?lang=${lang}`);
      return;
    }
    if (categoryFromUrl === "restaurantes") {
      router.replace(`/publicar/restaurantes?lang=${lang}`);
      return;
    }
    if (categoryFromUrl === "empleos") {
      router.replace(`/clasificados/publicar/empleos?lang=${lang}`);
      return;
    }
    if (!categoryFromUrl) {
      router.replace(`/clasificados/publicar?lang=${lang}`);
    }
  }, [slug, categoryFromUrl, lang, router]);

  if (
    slug === "bienes-raices" ||
    slug === "br" ||
    !categoryFromUrl ||
    categoryFromUrl === "en-venta" ||
    categoryFromUrl === "autos" ||
    categoryFromUrl === "servicios" ||
    categoryFromUrl === "restaurantes" ||
    categoryFromUrl === "empleos"
  ) {
    return (
      <main className="min-h-[50vh] pt-28 flex items-center justify-center text-[#111111]/70 text-sm">
        {lang === "es" ? "Redirigiendo…" : "Redirecting…"}
      </main>
    );
  }

  return <ClasificadosCategoryComingSoon categorySlug={categoryFromUrl} lang={lang} />;
}
