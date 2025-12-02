"use client";

import Navbar from "@/app/components/Navbar";
import { useSearchParams } from "next/navigation";

export default function ContactoPage() {
  const params = useSearchParams();
  const lang = params.get("lang") || "es"; // Spanish default

  return (
    <main className="min-h-screen w-full bg-black text-white">
      {/* NAVBAR */}
      <Navbar />

      <div className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
        {/* HEADER */}
        <h1 className="text-4xl font-bold text-yellow-400 text-center mb-6">
          Contáctanos
        </h1>

        <p className="text-center text-gray-300 mb-12">
          Comunícate con El Águila para publicidad, colaboraciones, envíos para
          la revista, eventos o asistencia general.
        </p>

        {/* BUSINESS INFO */}
        <div className="bg-neutral-900 p-6 rounded-2xl shadow-lg mb-12 border border-neutral-700">
          <h2 className="text-2xl font-semibold text-yellow-400 mb-4">
            Información del Negocio
          </h2>

          <div className="space-y-3 text-gray-300">
            <p>
              <span className="font-semibold text-white">Correo:</span>{" "}
              info@elaguilamedia.com
            </p>

            <p>
              <span className="font-semibold text-white">Teléfono:</span>{" "}
              (408) 937-1063
            </p>

            <p>
              <span className="font-semibold text-white">Horario:</span> Lunes a
              Viernes, 9:00 AM – 5:00 PM
            </p>

            <p className="italic text-gray-400">
              * La dirección física será agregada próximamente.
            </p>
          </div>
        </div>

        {/* CONTACT FORM */}
        <div className="bg-neutral-900 p-8 rounded-2xl shadow-lg border border-neutral-700">
          <h2 className="text-2xl font-semibold text-yellow-400 mb-6">
            Envíanos un Mensaje
          </h2>

          <form className="space-y-6">
            {/* NAME */}
            <div>
              <label className="block mb-1 text-gray-300">Nombre Completo</label>
              <input
                type="text"
                className="w-full p-3 rounded-lg bg-black border border-neutral-700 text-white focus:outline-none focus:border-yellow-400"
                placeholder="Tu nombre"
              />
            </div>

            {/* EMAIL */}
            <div>
              <label className="block mb-1 text-gray-300">Correo Electrónico</label>
              <input
                type="email"
                className="w-full p-3 rounded-lg bg-black border border-neutral-700 text-white focus:outline-none focus:border-yellow-400"
                placeholder="tu@ejemplo.com"
              />
            </div>

            {/* MESSAGE */}
            <div>
              <label className="block mb-1 text-gray-300">Mensaje</label>
              <textarea
                rows={5}
                className="w-full p-3 rounded-lg bg-black border border-neutral-700 text-white focus:outline-none focus:border-yellow-400"
                placeholder="Escribe tu mensaje aquí"
              ></textarea>
            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              className="
                w-full py-3 rounded-lg text-lg font-semibold
                bg-gradient-to-r from-yellow-500 to-yellow-700
                text-black shadow-lg hover:opacity-90 transition
              "
            >
              Enviar Mensaje
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
