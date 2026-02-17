'use client';

export default function EmptyState() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24 text-center">
      <div className="rounded-2xl border border-yellow-600/20 bg-black/25 p-10">
        <h2 className="text-2xl md:text-3xl font-bold text-yellow-400">
          No hay anuncios todavía
        </h2>
        <p className="mt-4 text-gray-300">
          Pronto encontrarás rentas, empleos, autos, ventas y servicios locales.
          Este espacio está listo para recibir a los primeros anunciantes.
        </p>
      </div>
    </div>
  );
}
