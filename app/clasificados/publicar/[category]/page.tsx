"use client";

import { useParams, useSearchParams } from "next/navigation";
import { categoryConfig, type CategoryKey } from "@/app/clasificados/config/categoryConfig";
import { EnVentaComingSoon } from "@/app/clasificados/en-venta/EnVentaComingSoon";
import PublicarCategoryApplication from "@/app/clasificados/publicar/PublicarCategoryApplication";
import BienesRaicesPublicarPage from "@/app/clasificados/bienes-raices/publish/BienesRaicesPublicarPage";
import RentasPublicarPage from "@/app/clasificados/rentas/publish/RentasPublicarPage";
import AutosPublicarPage from "@/app/clasificados/autos/publish/AutosPublicarPage";

type Lang = "es" | "en";

function normalizeCategory(raw: string): CategoryKey | "" {
  const v = (raw ?? "").trim().toLowerCase();
  if (!v) return "";
  const mapped = v === "viajes" ? "travel" : v;
  const keys = Object.keys(categoryConfig) as CategoryKey[];
  return keys.includes(mapped as CategoryKey) ? (mapped as CategoryKey) : "";
}

/**
 * Thin dispatcher: parse slug, optional En Venta gate, then hand off to category-owned publish entry
 * or the legacy shared application for remaining categories.
 */
export default function PublicarCategoryPage() {
  const params = useParams<{ category?: string }>();
  const searchParams = useSearchParams();
  const slug = (params?.category ?? "").trim().toLowerCase();
  const categoryFromUrl = normalizeCategory(params?.category ?? "") || "bienes-raices";
  const lang: Lang = searchParams?.get("lang") === "en" ? "en" : "es";

  if (slug === "en-venta" || categoryFromUrl === "en-venta") {
    return <EnVentaComingSoon variant="publish" lang={lang} />;
  }

  switch (categoryFromUrl) {
    case "bienes-raices":
      return <BienesRaicesPublicarPage />;
    case "rentas":
      return <RentasPublicarPage />;
    case "autos":
      return <AutosPublicarPage />;
    default:
      return <PublicarCategoryApplication />;
  }
}
