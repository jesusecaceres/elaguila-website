"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BR_PUBLICAR_NEGOCIO } from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";

export function BrPagoCanceladoClient() {
  const sp = useSearchParams();
  const qs = sp ?? new URLSearchParams();
  const lang = qs.get("lang") === "en" ? "en" : "es";
  const listingId = qs.get("listing_id")?.trim() ?? "";

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="font-serif text-2xl font-bold text-[#1E1810]">
        {lang === "es" ? "Pago cancelado" : "Payment canceled"}
      </h1>
      <p className="mt-4 text-sm text-[#5C5346]">
        {lang === "es"
          ? "Tu borrador sigue guardado. Puedes volver a la vista previa para intentar de nuevo."
          : "Your draft is still saved. Return to preview to try again."}
      </p>
      {listingId ? (
        <p className="mt-2 text-xs text-[#7A7164]">
          {lang === "es" ? "Anuncio pendiente:" : "Pending listing:"} {listingId}
        </p>
      ) : null}
      <Link
        href={`${BR_PUBLICAR_NEGOCIO}?lang=${lang}`}
        className="mt-8 inline-flex min-h-[48px] items-center justify-center rounded-full border border-[#C9B46A]/55 bg-[#FFF6E7] px-8 text-sm font-bold text-[#6E5418]"
      >
        {lang === "es" ? "Volver a publicar" : "Back to publish"}
      </Link>
    </div>
  );
}
