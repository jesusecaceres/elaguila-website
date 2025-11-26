const PAGINAS = [1, 2, 3];

export default function LectorRevistaEnero2026() {
  return (
    <main className="min-h-screen w-full bg-black text-white pt-28 pb-16 px-4 md:px-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-extrabold text-yellow-300 mb-6 drop-shadow">
          Enero 2026 — Lector Digital
        </h1>
        <p className="text-gray-300 mb-4">
          Reemplaza las imágenes de prueba en{" "}
          <code className="text-xs">public/revista-pages/2026/enero/</code>{" "}
          con las páginas exportadas de tu revista (page-01.jpg, page-02.jpg, etc.).
        </p>

        <div className="space-y-8">
          {PAGINAS.map((pagina) => (
            <div
              key={pagina}
              className="bg-neutral-900/80 border border-neutral-700/80 rounded-2xl shadow-2xl overflow-hidden"
            >
              <img
                src={`/revista-pages/2026/enero/page-${String(pagina).padStart(2, "0")}.jpg`}
                alt={`Revista Enero 2026 - Página ${pagina}`}
                className="w-full h-auto object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}