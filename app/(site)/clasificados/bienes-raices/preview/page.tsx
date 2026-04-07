import Link from "next/link";
import {
  BR_PREVIEW_NEGOCIO,
  BR_PREVIEW_PRIVADO,
  BR_PUBLICAR_NEGOCIO,
  BR_PUBLICAR_PRIVADO,
} from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";

export default function BienesRaicesPreviewHubPage() {
  return (
    <main className="min-h-screen bg-[#F4EFE6] px-4 pb-16 pt-28 text-[#2C2416]">
      <div className="mx-auto max-w-lg">
        <p className="text-xs font-bold uppercase tracking-wide text-[#B8954A]">Leonix Clasificados</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold text-[#1E1810]">Vista previa Bienes Raíces</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#5C5346]/88">
          El preview toma el borrador que guardaste al publicar. Negocio usa el diseño premium aprobado; Privado se conectará al
          mismo patrón cuando el flujo esté listo.
        </p>
        <ul className="mt-8 space-y-3">
          <li>
            <Link
              href={BR_PREVIEW_NEGOCIO}
              className="block rounded-2xl border border-[#C9B46A]/45 bg-[#FFF6E7] p-4 font-semibold text-[#6E5418] shadow-sm hover:bg-[#FFEFD8]"
            >
              Vista previa Negocio
            </Link>
            <p className="mt-1 px-1 text-xs text-[#5C5346]/75">Desde Publicar Negocio → Ver vista previa.</p>
          </li>
          <li>
            <Link
              href={BR_PREVIEW_PRIVADO}
              className="block rounded-2xl border border-[#E8DFD0] bg-[#FDFBF7] p-4 font-semibold text-[#3D3630] hover:border-[#D4C4A8]"
            >
              Vista previa Privado
            </Link>
            <p className="mt-1 px-1 text-xs text-[#5C5346]/75">Próximamente enlazado al formulario particular.</p>
          </li>
        </ul>
        <div className="mt-10 flex flex-col gap-2 border-t border-[#E8DFD0]/80 pt-6 text-sm">
          <Link href={BR_PUBLICAR_NEGOCIO} className="font-medium text-[#B8954A] underline decoration-[#C9B46A]/50 underline-offset-4">
            Volver a Publicar Negocio
          </Link>
          <Link href={BR_PUBLICAR_PRIVADO} className="font-medium text-[#5C5346] underline decoration-[#C9B46A]/40 underline-offset-4">
            Publicar Privado
          </Link>
        </div>
      </div>
    </main>
  );
}
