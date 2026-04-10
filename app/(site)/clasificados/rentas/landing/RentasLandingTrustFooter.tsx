import Link from "next/link";
import { RENTAS_RESULTS } from "@/app/clasificados/rentas/shared/utils/rentasPublishRoutes";

export function RentasLandingTrustFooter() {
  return (
    <footer className="mt-16 border-t border-[#E8DFD0]/80 pt-10">
      <p className="text-center text-[13px] leading-relaxed text-[#5C5346]/88">
        Comunidad Leonix · Anuncios moderados ·{" "}
        <Link href="/contact" className="font-semibold text-[#B8954A] underline decoration-[#C9B46A]/50 underline-offset-4">
          Contacto directo
        </Link>
      </p>
      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-6">
        <Link
          href={RENTAS_RESULTS}
          className="rounded-full bg-[#4A7C59] px-6 py-2.5 text-sm font-semibold text-[#FAF7F2] shadow-sm transition hover:bg-[#3d6a4b]"
        >
          Ver resultados
        </Link>
        <Link
          href="/clasificados"
          className="text-sm font-semibold text-[#B8954A] underline decoration-[#C9B46A]/50 underline-offset-4"
        >
          Volver a Clasificados
        </Link>
      </div>
    </footer>
  );
}
