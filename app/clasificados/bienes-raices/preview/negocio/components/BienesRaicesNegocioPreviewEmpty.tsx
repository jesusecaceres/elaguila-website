import Link from "next/link";
import { BR_PUBLICAR_NEGOCIO } from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";
import { markPublishFlowReturningToEdit } from "@/app/clasificados/lib/publishFlowLifecycleClient";

/**
 * Hook-free empty state for BRT Negocio preview (no draft in session).
 * Kept separate so the preview client stays a minimal hooks surface.
 */
export function BienesRaicesNegocioPreviewEmpty() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#F9F6F1] px-6 py-16 text-center text-[#5C5346]">
      <div className="max-w-md space-y-2">
        <p className="text-sm font-bold uppercase tracking-wide text-[#B8954A]">Leonix · BRT Negocio</p>
        <h1 className="text-xl font-extrabold text-[#2A2620]">No hay borrador de vista previa en esta sesión</h1>
        <p className="text-sm leading-relaxed">
          Abre la vista previa desde “Publicar Bienes Raíces — Negocio” (paso Vista previa) para generar el borrador.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          className="rounded-xl border border-[#E8DFD0] bg-white px-4 py-2.5 text-sm font-semibold text-[#2C2416] hover:bg-[#FFFCF7]"
          onClick={() => window.location.reload()}
        >
          Recargar vista previa
        </button>
        <Link
          href={BR_PUBLICAR_NEGOCIO}
          className="rounded-xl bg-gradient-to-r from-[#C9A85A] to-[#B8954A] px-4 py-2.5 text-sm font-bold text-[#1E1810] shadow-md hover:opacity-95"
          prefetch={false}
          onClick={() => {
            markPublishFlowReturningToEdit();
          }}
        >
          Volver a editar
        </Link>
      </div>
    </div>
  );
}
