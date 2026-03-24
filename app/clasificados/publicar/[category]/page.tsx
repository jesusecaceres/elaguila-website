"use client";

import { useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { categoryConfig, type CategoryKey } from "@/app/clasificados/config/categoryConfig";
import EnVentaPublicarPage from "@/app/clasificados/en-venta/publish/EnVentaPublicarPage";
import RentasPublicarPage from "@/app/clasificados/rentas/publish/RentasPublicarPage";
import AutosPublicarPage from "@/app/clasificados/autos/publish/AutosPublicarPage";
import RestaurantesPublicarPage from "@/app/clasificados/restaurantes/publish/RestaurantesPublicarPage";
import ServiciosPublicarPage from "@/app/clasificados/servicios/publish/ServiciosPublicarPage";
import EmpleosPublicarPage from "@/app/clasificados/empleos/publish/EmpleosPublicarPage";
import ClasesPublicarPage from "@/app/clasificados/clases/publish/ClasesPublicarPage";
import ComunidadPublicarPage from "@/app/clasificados/comunidad/publish/ComunidadPublicarPage";
import TravelPublicarPage from "@/app/clasificados/travel/publish/TravelPublicarPage";

function normalizeCategory(raw: string): CategoryKey | "" {
  const v = (raw ?? "").trim().toLowerCase();
  if (!v) return "";
  const mapped = v === "viajes" ? "travel" : v;
  const keys = Object.keys(categoryConfig) as CategoryKey[];
  return keys.includes(mapped as CategoryKey) ? (mapped as CategoryKey) : "";
}

/**
 * Dispatcher only: slug → category-owned publish entry.
 * Invalid slug, empty slug, or `all` → redirect to `/clasificados/publicar` (chooser). No shared wizard here.
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

  /** BR publish lives under `/clasificados/bienes-raices/publicar` — keep old `/publicar/bienes-raices` URLs working. */
  useEffect(() => {
    if (categoryFromUrl !== "bienes-raices") return;
    const p = new URLSearchParams(searchParams?.toString() ?? "");
    router.replace(`/clasificados/bienes-raices/publicar?${p.toString()}`);
  }, [categoryFromUrl, router, searchParams]);

  if (!categoryFromUrl) {
    return (
      <main className="min-h-[50vh] pt-28 flex items-center justify-center text-[#111111]/70 text-sm">
        {lang === "es" ? "Redirigiendo…" : "Redirecting…"}
      </main>
    );
  }

  if (categoryFromUrl === "bienes-raices") {
    return (
      <main className="min-h-[50vh] pt-28 flex items-center justify-center text-[#111111]/70 text-sm">
        {lang === "es" ? "Redirigiendo…" : "Redirecting…"}
      </main>
    );
  }

  switch (categoryFromUrl) {
    case "en-venta":
      return <EnVentaPublicarPage />;
    case "rentas":
      return <RentasPublicarPage />;
    case "autos":
      return <AutosPublicarPage />;
    case "restaurantes":
      return <RestaurantesPublicarPage />;
    case "servicios":
      return <ServiciosPublicarPage />;
    case "empleos":
      return <EmpleosPublicarPage />;
    case "clases":
      return <ClasesPublicarPage />;
    case "comunidad":
      return <ComunidadPublicarPage />;
    case "travel":
      return <TravelPublicarPage />;
    default:
      return null;
  }
}
