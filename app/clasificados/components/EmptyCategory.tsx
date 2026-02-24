
'use client';

export default function EmptyCategory() {
  return (
    <div className="text-center py-32">
      <h2 className="text-2xl font-semibold mb-4">
        No hay anuncios todavía
      </h2>
      <p className="text-white/70 max-w-xl mx-auto">
        Esta categoría estará disponible pronto.
        Los primeros anunciantes aparecerán aquí.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <a href="/clasificados/lista" className="inline-flex items-center justify-center rounded-xl border border-white/12 bg-white/8 px-5 py-2.5 text-sm font-semibold text-gray-100 hover:bg-white/12">Ver anuncios</a>
        <a href="/clasificados/publicar" className="inline-flex items-center justify-center rounded-xl border border-yellow-500/30 bg-yellow-500/12 px-5 py-2.5 text-sm font-semibold text-yellow-200 hover:bg-yellow-500/18">Publicar anuncio</a>
        <a href="/clasificados" className="inline-flex items-center justify-center rounded-xl border border-white/12 bg-black/20 px-5 py-2.5 text-sm font-semibold text-gray-200 hover:bg-black/30">Membresías</a>
      </div>
    </div>
  );
}
