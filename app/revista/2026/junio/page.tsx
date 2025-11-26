export default function RevistaProximamente() {
  return (
    <main className="min-h-screen w-full bg-black text-white flex items-center justify-center px-6">
      <div className="max-w-xl text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-yellow-300 mb-4 drop-shadow">
          Revista Digital — Muy Pronto
        </h1>
        <p className="text-lg text-gray-200 mb-2">
          Esta edición todavía no está disponible.
        </p>
        <p className="text-sm text-gray-400">
          Cuando esté lista, duplica la carpeta de Enero 2026, actualiza las imágenes
          en <code className="text-xs">public/revista-covers</code> y{" "}
          <code className="text-xs">public/revista-pages</code>, y personaliza este texto.
        </p>
      </div>
    </main>
  );
}