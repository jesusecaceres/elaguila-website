"use client";

import Image from "next/image";

export default function RevistaPage() {
  return (
    <main className="relative z-10 flex flex-col items-center justify-start min-h-screen text-white px-6 pt-40 pb-20">
      {/* PAGE TITLE */}
      <h1 className="text-6xl font-bold text-center drop-shadow-2xl mb-10">
        El Águila Revista Digital
      </h1>

      {/* DESCRIPTION */}
      <p className="text-2xl text-center max-w-3xl mb-16 leading-relaxed">
        Bienvenido a la revista digital oficial de <strong>El Águila</strong>.  
        Aquí podrás leer nuestras ediciones en formato digital, diseñadas para  
        brindar noticias, cultura, inspiración, y contenido visual de alta calidad.
      </p>

      {/* MAGAZINE IFRAME OR IMAGE */}
      {/* For now, this is a placeholder image until the Publuu version is ready */}
      <div className="w-full max-w-5xl flex justify-center">
        <Image
          src="/magazine-placeholder.jpg"
          alt="Revista Digital"
          width={1600}
          height={900}
          className="rounded-2xl shadow-2xl border-4 border-white/40"
        />
      </div>

      {/* FOOTER NOTE */}
      <p className="mt-14 text-xl text-center opacity-80">
        Edición: Enero 2026 — Versión de prueba
      </p>
    </main>
  );
}
