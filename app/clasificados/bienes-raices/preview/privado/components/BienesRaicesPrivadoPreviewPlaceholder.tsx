import Link from "next/link";
import { BR_PUBLICAR_PRIVADO } from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";

export function BienesRaicesPrivadoPreviewPlaceholder() {
  return (
    <main className="min-h-screen bg-[#F9F6F1] px-4 pb-16 pt-28 text-[#2C2416]">
      <div className="mx-auto max-w-lg rounded-2xl border border-[#E8DFD0] bg-[#FDFBF7] p-8 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-[#B8954A]">Leonix · Bienes Raíces</p>
        <h1 className="mt-2 font-serif text-2xl font-semibold text-[#1E1810]">Vista previa — Privado</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#5C5346]/88">
          Aquí conectaremos el formulario de particulares con su vista previa, igual que en Negocio. Por ahora publica desde el
          flujo privado y vuelve cuando esté enlazado.
        </p>
        <Link
          href={BR_PUBLICAR_PRIVADO}
          className="mt-6 inline-flex rounded-xl border border-[#C9B46A]/50 bg-[#FFF6E7] px-4 py-2.5 text-sm font-semibold text-[#6E5418] hover:bg-[#FFEFD8]"
        >
          Ir a Publicar — Privado
        </Link>
      </div>
    </main>
  );
}
