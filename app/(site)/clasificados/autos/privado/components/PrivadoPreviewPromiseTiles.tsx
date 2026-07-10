"use client";

import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";

const TILE = "flex min-h-[44px] items-center gap-2 rounded-xl border border-[color:var(--lx-gold-border)] bg-[#FFFCF7] px-4 text-sm font-medium text-[color:var(--lx-text)]";

export function PrivadoPreviewPromiseTiles({ lang }: { lang: AutosNegociosLang }) {
  const isEs = lang === "es";

  const tiles = isEs
    ? [
        "Galería de fotos",
        "Precio y ubicación",
        "Detalles del vehículo",
        "Contacto del vendedor",
        "Descripción del anuncio",
        "ID Leonix del anuncio",
        "Vista clara para compradores",
      ]
    : [
        "Photo gallery",
        "Price and location",
        "Vehicle details",
        "Seller contact",
        "Listing description",
        "Leonix ad ID",
        "Clear buyer view",
      ];

  return (
    <section className="mx-auto mt-6 max-w-[1280px] px-4 md:px-5 lg:px-6">
      <div className="flex flex-wrap gap-2">
        {tiles.map((tile) => (
          <div key={tile} className={TILE}>
            ✓ {tile}
          </div>
        ))}
      </div>
      <p className="mt-4 text-center text-xs leading-relaxed text-[color:var(--lx-muted)]">
        {isEs
          ? "Representación visual basada en la experiencia real de Leonix. La información, botones y secciones aparecen según los datos completados por el anunciante."
          : "Visual representation based on the real Leonix experience. Information, buttons, and sections appear based on the advertiser's completed data."}
      </p>
    </section>
  );
}
