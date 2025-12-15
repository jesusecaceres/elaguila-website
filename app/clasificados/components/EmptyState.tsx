'use client';

export default function EmptyState() {
  return (
    <div className="text-center py-24">
      <h2 className="text-2xl font-semibold text-white mb-4">
        No hay anuncios todavía
      </h2>
      <p className="text-white/70 max-w-xl mx-auto">
        Pronto encontrarás rentas, empleos, autos, ventas y servicios locales.
        Este espacio está listo para recibir a los primeros anunciantes.
      </p>
    </div>
  );
}