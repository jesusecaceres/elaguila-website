import type { Metadata } from "next";
import Link from "next/link";
import {
  BR_PUBLICAR_NEGOCIO,
  BR_PUBLICAR_PRIVADO,
} from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";

export const metadata: Metadata = {
  title: "Publicar Bienes Raíces | Leonix Clasificados",
  description: "Elige si publicas como particular o negocio profesional.",
};

export default function BienesRaicesPublicarHubPage() {
  return (
    <main className="min-h-screen bg-[#F6F0E2] px-4 pb-20 pt-28 text-[#2C2416]">
      <div className="mx-auto max-w-lg">
        <h1 className="text-3xl font-extrabold text-[#1E1810]">Publicar en Bienes Raíces</h1>
        <p className="mt-2 text-sm text-[#5C5346]/88">
          Dos caminos claros: particular (privado) o perfil profesional (negocio). Ambos pagan por publicación en este
          lanzamiento.
        </p>
        <div className="mt-8 space-y-4">
          <Link
            href={BR_PUBLICAR_PRIVADO}
            className="block rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7] p-5 shadow-sm transition hover:border-[#C9B46A]/50"
          >
            <p className="text-xs font-bold uppercase tracking-wide text-[#B8954A]">Particular</p>
            <p className="mt-1 text-lg font-bold text-[#1E1810]">Privado</p>
            <p className="mt-1 text-sm text-[#5C5346]/85">Para dueños y anuncios personales.</p>
          </Link>
          <Link
            href={BR_PUBLICAR_NEGOCIO}
            className="block rounded-2xl border border-[#C9B46A]/45 bg-gradient-to-br from-[#FFF6E7] to-[#FFFCF7] p-5 shadow-md transition hover:border-[#B8954A]"
          >
            <p className="text-xs font-bold uppercase tracking-wide text-[#B8954A]">Profesional</p>
            <p className="mt-1 text-lg font-bold text-[#1E1810]">Negocio</p>
            <p className="mt-1 text-sm text-[#5C5346]/85">Agentes, equipos, oficinas y desarrolladores.</p>
          </Link>
        </div>
      </div>
    </main>
  );
}
