"use client";

import { useParams } from "next/navigation";
import { categoryConfig, type CategoryKey } from "@/app/clasificados/config/categoryConfig";
import PublicarCategoryApplication from "@/app/clasificados/publicar/PublicarCategoryApplication";
import EnVentaPublicarPage from "@/app/clasificados/en-venta/publish/EnVentaPublicarPage";
import BienesRaicesPublicarPage from "@/app/clasificados/bienes-raices/publish/BienesRaicesPublicarPage";
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
 * Dispatcher only: map slug → category-owned publish entry. No wizard logic here.
 * Fallback to shared application for `all` or unexpected keys only.
 */
export default function PublicarCategoryPage() {
  const params = useParams<{ category?: string }>();
  const categoryFromUrl = normalizeCategory(params?.category ?? "") || "bienes-raices";

  switch (categoryFromUrl) {
    case "en-venta":
      return <EnVentaPublicarPage />;
    case "bienes-raices":
      return <BienesRaicesPublicarPage />;
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
      return <PublicarCategoryApplication />;
  }
}
