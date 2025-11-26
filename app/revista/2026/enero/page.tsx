"use client";

import Image from "next/image";
import Link from "next/link";

export default function RevistaEnero2026() {
  return (
    <main className="relative min-h-screen w-full pb-32">

      {/* TOP CINEMATIC HEADER */}
      <section
        className="w-full py-20 px-6 text-white"
        style={{
          background: "linear-gradient(135deg, #F5C542, #D4A017, #A6781C)",
        }}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">

          {/* COVER IMAGE */}
          <div className="w-full md:w-1/2">
            <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20">
              <Image
                src="/revista-covers/enero-2026-cover-placeholder.jpg"
                alt="Revista Enero 2026 Cover"
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* TITLE + BUTTONS */}
          <div className="w-full md:w-1/2 text-center md:text-left">
            <h1 className="text-5xl font-extrabold mb-4 drop-shadow-xl">
              Revista Enero 2026 – El Águila
            </h1>

            <p className="text-xl leading-relaxed mb-10 opacity-90">
              Bienvenido a la edición digital de enero.  
              Explora videos exclusivos, cupones especiales y participa  
              en el sorteo semanal para ganar premios increíbles.
            </p>

            {/* BUTTONS */}
            <div className="flex flex-col sm:flex-row gap-6">
              <Link
                href="/revista/2026/enero/leer"
                className="px-10 py-4 rounded-full text-xl font-bold bg-black/80 hover:bg-black transition shadow-xl"
              >
                Leer Revista →
              </Link>

              <Link
                href="/sorteos/january-2026"
                className="px-10 py-4 rounded-full text-xl font-bold bg-white/90 text-black hover:bg-white transition shadow-xl"
              >
                ¡Gana +1 Entrada!
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* HIGHLIGHT CARDS */}
      <section className="max-w-6xl mx-auto mt-20 px-6">
        <h2 className="text-4xl font-bold text-white mb-8 text-center">
          Destacados de esta edición
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* FEATURED VIDEO */}
          <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-lg shadow-xl">
            <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-4">
              <Image
                src="/placeholders/featured-video.jpg"
                alt="Video Destacado"
                fill
                className="object-cover"
              />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Video destacado</h3>
            <Link
              href="#"
              className="text-lg font-semibold text-yellow-300 hover:underline"
            >
              Ver video →
            </Link>
          </div>

          {/* FEATURED COUPON */}
          <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-lg shadow-xl">
            <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-4">
              <Image
                src="/placeholders/featured-coupon.jpg"
                alt="Cupón Destacado"
                fill
                className="object-cover"
              />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Cupón destacado</h3>
            <Link
              href="#"
              className="text-lg font-semibold text-yellow-300 hover:underline"
            >
              Ver cupón →
            </Link>
          </div>

          {/* FEATURED SWEEPSTAKES */}
          <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-lg shadow-xl">
            <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-4">
              <Image
                src="/placeholders/featured-sweepstakes.jpg"
                alt="Sorteo"
                fill
                className="object-cover"
              />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Sorteo de la semana</h3>
            <Link
              href="/sorteos/january-2026"
              className="text-lg font-semibold text-yellow-300 hover:underline"
            >
              Entrar ahora →
            </Link>
          </div>
        </div>
      </section>

      {/* ISSUE ARCHIVE */}
      <section className="max-w-6xl mx-auto mt-24 px-6">
        <h2 className="text-4xl font-bold text-white mb-6">Archivo de Ediciones</h2>

        <div className="flex gap-6 overflow-x-auto pb-4">
          {/* Placeholder future issues */}
          <div className="min-w-[200px]">
            <div className="relative w-[200px] aspect-[3/4] rounded-xl overflow-hidden shadow-xl">
              <Image
                src="/revista-covers/febrero-2026-cover-placeholder.jpg"
                alt="Febrero"
                fill
                className="object-cover"
              />
            </div>
            <p className="text-white text-center mt-2 font-semibold">Febrero 2026</p>
          </div>
        </div>
      </section>

      {/* SPONSORS BAR */}
      <section className="w-full mt-24 py-10 bg-black/40 backdrop-blur-xl">
        <h2 className="text-center text-white text-2xl font-semibold mb-4">
          Patrocinadores de esta edición
        </h2>

        <div className="flex justify-center gap-10 opacity-80">
          <Image
            src="/sponsors/sample1.png"
            alt="Sponsor"
            width={120}
            height={60}
          />
          <Image
            src="/sponsors/sample2.png"
            alt="Sponsor"
            width={120}
            height={60}
          />
          <Image
            src="/sponsors/sample3.png"
            alt="Sponsor"
            width={120}
            height={60}
          />
        </div>
      </section>

    </main>
  );
}
