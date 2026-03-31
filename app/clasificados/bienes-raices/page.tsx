import type { Metadata } from "next";
import Link from "next/link";
import {
  BR_PUBLICAR_HUB,
  BR_PREVIEW_NEGOCIO,
} from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";

export const metadata: Metadata = {
  title: "Bienes Raíces | Leonix Clasificados",
  description: "Explora y publica propiedades en Leonix.",
};

export default function BienesRaicesCategoryPage() {
  return (
    <main className="min-h-screen bg-[#F6F0E2] px-4 pb-20 pt-28 text-[#2C2416]">
      <div className="mx-auto max-w-xl">
        <h1 className="text-3xl font-extrabold text-[#1E1810]">Bienes Raíces</h1>
        <p className="mt-2 text-sm text-[#5C5346]/88">Punto de entrada de la categoría. Enlistado de resultados en siguiente fase.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href={BR_PUBLICAR_HUB}
            className="inline-flex justify-center rounded-xl border border-[#C9B46A]/50 bg-[#FFF6E7] px-4 py-3 text-sm font-semibold text-[#6E5418] hover:bg-[#FFEFD8]"
          >
            Publicar anuncio
          </Link>
          <Link
            href={BR_PREVIEW_NEGOCIO}
            className="inline-flex justify-center rounded-xl border border-[#E8DFD0] bg-white px-4 py-3 text-sm font-semibold text-[#2C2416] hover:bg-[#FFFCF7]"
          >
            Vista previa Negocio (borrador)
          </Link>
        </div>
      </div>
    </main>
  );
}
