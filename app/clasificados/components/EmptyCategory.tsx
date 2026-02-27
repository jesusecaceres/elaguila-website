'use client';

import Link from "next/link";

export default function EmptyCategory() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24 text-center">
      <div className="rounded-2xl border border-white/12 bg-white/6 p-10">
      <h2 className="text-2xl font-semibold mb-4 text-gray-100">
        No hay anuncios todavía
      </h2>
      <p className="text-white/70 max-w-xl mx-auto">
        Esta categoría está lista para arrancar. Publica el primero y tu anuncio
        aparecerá aquí.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/clasificados/lista"
          className="inline-flex items-center justify-center rounded-xl border border-white/12 bg-white/8 px-5 py-2.5 text-sm font-semibold text-gray-100 hover:bg-white/12"
        >
          Ver anuncios
        </Link>
        <Link
          href="/clasificados/publicar"
          className="inline-flex items-center justify-center rounded-xl border border-yellow-500/30 bg-yellow-500/12 px-5 py-2.5 text-sm font-semibold text-yellow-200 hover:bg-yellow-500/18"
        >
          Publicar anuncio
        </Link>
        <Link
          href="/clasificados#memberships"
          className="inline-flex items-center justify-center rounded-xl border border-white/12 bg-white/5 px-5 py-2.5 text-sm font-semibold text-gray-200 hover:bg-white/7"
        >
          Ver membresías
        </Link>
      </div>
        <p className="mt-6 text-xs text-gray-400">
          Consejo: fotos claras + descripción honesta ayudan a vender más rápido. Protección anti‑spam activa.
        </p>
      </div>
    </div>
  );
}
