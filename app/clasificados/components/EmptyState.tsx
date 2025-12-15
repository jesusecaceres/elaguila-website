'use client';

export default function EmptyState() {
  return (
    <div className="text-center py-24">
      <h2 className="text-2xl font-semibold text-white mb-4">
        No hay anuncios todavía
      </h2>
      <p className="text-white/70 max-w-xl mx-auto">
        Muy pronto podrás encontrar servicios, empleos, rentas, autos y más.
        Este espacio está listo para recibir a los primeros anunciantes.
      </p>
    </div>
  );
}