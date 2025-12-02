"use client";

import Navbar from "@/app/components/Navbar";

export default function ClasificadosPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="pt-28 flex flex-col items-center px-6">
        <h1 className="text-4xl font-bold text-yellow-400 mb-6">
          Clasificados (En Construcción)
        </h1>

        <p className="text-gray-300 text-lg text-center max-w-xl">
          Esta sección estará disponible pronto.  
          Aquí podrás publicar y ver anuncios clasificados.
        </p>

        <div className="mt-10 p-6 bg-gray-900 rounded-xl shadow-lg">
          <p className="text-yellow-300">Coming Soon...</p>
        </div>
      </div>
    </main>
  );
}
