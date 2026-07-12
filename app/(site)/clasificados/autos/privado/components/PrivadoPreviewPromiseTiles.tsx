"use client";

import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";

const TILE = "flex min-h-[48px] items-center gap-3 rounded-xl border border-[color:var(--lx-gold-border)] bg-[#FFFCF7] px-5 text-sm font-medium text-[color:var(--lx-text)] shadow-sm transition hover:border-[color:var(--lx-gold)] hover:bg-[color:var(--lx-nav-hover)]";

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
    <section className="mx-auto mt-8 max-w-[1440px] px-4 md:px-5 lg:px-6">
      <div className="flex flex-wrap gap-3">
        {tiles.map((tile, index) => (
          <div key={tile} className={`${TILE} ${index === 3 ? "border-[#7A1E2C] bg-[#7A1E2C] text-[#FFFCF7]" : ""}`}>
            ✓ {tile}
          </div>
        ))}
      </div>
      <p className="mt-6 text-center text-sm leading-relaxed text-[color:var(--lx-text-2)]">
        {isEs
          ? "Representación visual basada en la experiencia real de Leonix. La información, botones y secciones aparecen según los datos completados por el anunciante."
          : "Visual representation based on the real Leonix experience. Information, buttons, and sections appear based on the advertiser's completed data."}
      </p>
    </section>
  );
}
