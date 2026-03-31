"use client";

import { useSearchParams } from "next/navigation";

export default function ContactoPage() {
  const params = useSearchParams()!;
  const lang = params.get("lang") || "es"; // Spanish default

  return (
    <main className="min-h-screen w-full bg-[color:var(--lx-page)] text-[color:var(--lx-text)]">
      <div className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
        {/* HEADER */}
        <h1 className="text-4xl font-bold text-[color:var(--lx-text)] text-center mb-4">
          Contáctanos
        </h1>

        <p className="text-center text-[color:var(--lx-text-2)]/85 mb-12">
          Comunícate con El Águila para publicidad, colaboraciones, envíos para
          la revista, eventos o asistencia general.
        </p>

        {/* BUSINESS INFO */}
        <div className="bg-[color:var(--lx-card)] p-6 rounded-2xl shadow-[0_18px_48px_rgba(42,36,22,0.10)] mb-12 border border-[color:var(--lx-nav-border)]">
          <h2 className="text-2xl font-semibold text-[color:var(--lx-text)] mb-4">
            Información del Negocio
          </h2>

          <div className="space-y-3 text-[color:var(--lx-text-2)]/90">
            <p>
              <span className="font-semibold text-[color:var(--lx-text)]">Correo:</span>{" "}
              info@elaguilamedia.com
            </p>

            <p>
              <span className="font-semibold text-[color:var(--lx-text)]">Teléfono:</span>{" "}
              (408) 937-1063
            </p>

            <p>
              <span className="font-semibold text-[color:var(--lx-text)]">Horario:</span> Lunes a
              Viernes, 9:00 AM – 5:00 PM
            </p>

            <p className="italic text-[color:var(--lx-muted)]">
              * La dirección física será agregada próximamente.
            </p>
          </div>
        </div>

        {/* CONTACT FORM */}
        <div className="bg-[color:var(--lx-card)] p-8 rounded-2xl shadow-[0_18px_48px_rgba(42,36,22,0.10)] border border-[color:var(--lx-nav-border)]">
          <h2 className="text-2xl font-semibold text-[color:var(--lx-text)] mb-6">
            Envíanos un Mensaje
          </h2>

          <form className="space-y-6">
            {/* NAME */}
            <div>
              <label className="block mb-1 text-[color:var(--lx-text-2)]/90">Nombre Completo</label>
              <input
                type="text"
                className="w-full p-3 rounded-lg bg-white/70 border border-[color:var(--lx-nav-border)] text-[color:var(--lx-text)] placeholder:text-[color:var(--lx-muted)] focus:outline-none"
                placeholder="Tu nombre"
              />
            </div>

            {/* EMAIL */}
            <div>
              <label className="block mb-1 text-[color:var(--lx-text-2)]/90">Correo Electrónico</label>
              <input
                type="email"
                className="w-full p-3 rounded-lg bg-white/70 border border-[color:var(--lx-nav-border)] text-[color:var(--lx-text)] placeholder:text-[color:var(--lx-muted)] focus:outline-none"
                placeholder="tu@ejemplo.com"
              />
            </div>

            {/* MESSAGE */}
            <div>
              <label className="block mb-1 text-[color:var(--lx-text-2)]/90">Mensaje</label>
              <textarea
                rows={5}
                className="w-full p-3 rounded-lg bg-white/70 border border-[color:var(--lx-nav-border)] text-[color:var(--lx-text)] placeholder:text-[color:var(--lx-muted)] focus:outline-none"
                placeholder="Escribe tu mensaje aquí"
              ></textarea>
            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              className="w-full py-3 rounded-xl text-lg font-semibold bg-[color:var(--lx-cta-dark)] text-[color:var(--lx-cta-light)] shadow-[0_10px_28px_rgba(42,36,22,0.18)] hover:bg-[color:var(--lx-cta-dark-hover)] transition"
            >
              Enviar Mensaje
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
