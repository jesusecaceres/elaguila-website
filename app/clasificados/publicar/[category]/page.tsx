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
  const normalized = normalizeCategory(params?.category ?? "");
  const categoryFromUrl = normalized === "all" ? ("" as const) : normalized;

  useEffect(() => {
    if (!categoryFromUrl) {
      router.replace(`/clasificados/publicar?lang=${lang}`);
    }
  }, [categoryFromUrl, lang, router]);

  if (!categoryFromUrl) {
    return (
      <main className="min-h-[50vh] pt-28 flex items-center justify-center text-[#111111]/70 text-sm">
        {lang === "es" ? "Redirigiendo…" : "Redirecting…"}
      </main>
    );
  }

  return <ClasificadosCategoryComingSoon categorySlug={categoryFromUrl} lang={lang} />;
}
