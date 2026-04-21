"use client";

import { useSearchParams } from "next/navigation";
import { LEONIX_GLOBAL_EMAIL, LEONIX_MEDIA_BRAND } from "@/app/data/leonixGlobalContact";
import { LEONIX_GLOBAL_LLC, LEONIX_MEDIA_DESCRIPTOR_EN } from "@/app/lib/leonixBrand";

function ContactContent() {
  const params = useSearchParams()!;
  const lang = params.get("lang") || "en";

  return (
    <main className="min-h-screen w-full bg-[color:var(--lx-page)] text-[color:var(--lx-text)]">
      <div className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-[color:var(--lx-text)] text-center mb-4">
          {lang === "es" ? "Contacto" : "Contact"}
        </h1>

        <p className="text-center text-[color:var(--lx-text-2)]/85 mb-4 max-w-2xl mx-auto">
          {lang === "es"
            ? `Comunícate con ${LEONIX_MEDIA_BRAND} para publicidad, alianzas, eventos o soporte. Operamos bajo ${LEONIX_GLOBAL_LLC}.`
            : `Reach ${LEONIX_MEDIA_BRAND} for advertising, partnerships, events, or support. We operate under ${LEONIX_GLOBAL_LLC}.`}
        </p>
        <p className="text-center text-sm text-[color:var(--lx-muted)] mb-12 max-w-2xl mx-auto">{LEONIX_MEDIA_DESCRIPTOR_EN}</p>

        <div className="bg-[color:var(--lx-card)] p-6 rounded-2xl shadow-[0_18px_48px_rgba(42,36,22,0.10)] mb-12 border border-[color:var(--lx-nav-border)]">
          <h2 className="text-2xl font-semibold text-[color:var(--lx-text)] mb-4">
            {lang === "es" ? "Información del negocio" : "Business information"}
          </h2>

          <div className="space-y-3 text-[color:var(--lx-text-2)]/90">
            <p>
              <span className="font-semibold text-[color:var(--lx-text)]">Email:</span>{" "}
              <a className="underline" href={`mailto:${LEONIX_GLOBAL_EMAIL}`}>
                {LEONIX_GLOBAL_EMAIL}
              </a>
            </p>

            <p>
              <span className="font-semibold text-[color:var(--lx-text)]">{lang === "es" ? "Teléfono" : "Phone"}:</span>{" "}
              (408) 937-1063
            </p>

            <p>
              <span className="font-semibold text-[color:var(--lx-text)]">{lang === "es" ? "Horario" : "Hours"}:</span>{" "}
              {lang === "es" ? "Lunes a viernes, 9:00 – 17:00" : "Monday – Friday, 9:00 AM – 5:00 PM"}
            </p>

            <p className="italic text-[color:var(--lx-muted)]">
              * {lang === "es" ? "Dirección física próximamente." : "Physical business address will be added soon."}
            </p>
          </div>
        </div>

        <div className="bg-[color:var(--lx-card)] p-8 rounded-2xl shadow-[0_18px_48px_rgba(42,36,22,0.10)] border border-[color:var(--lx-nav-border)]">
          <h2 className="text-2xl font-semibold text-[color:var(--lx-text)] mb-6">
            {lang === "es" ? "Envíanos un mensaje" : "Send us a message"}
          </h2>

          <form className="space-y-6">
            <div>
              <label className="block mb-1 text-[color:var(--lx-text-2)]/90">
                {lang === "es" ? "Nombre completo" : "Full name"}
              </label>
              <input
                type="text"
                className="w-full p-3 rounded-lg bg-white/70 border border-[color:var(--lx-nav-border)] text-[color:var(--lx-text)] placeholder:text-[color:var(--lx-muted)] focus:outline-none"
                placeholder={lang === "es" ? "Tu nombre" : "Your name"}
              />
            </div>

            <div>
              <label className="block mb-1 text-[color:var(--lx-text-2)]/90">Email</label>
              <input
                type="email"
                className="w-full p-3 rounded-lg bg-white/70 border border-[color:var(--lx-nav-border)] text-[color:var(--lx-text)] placeholder:text-[color:var(--lx-muted)] focus:outline-none"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block mb-1 text-[color:var(--lx-text-2)]/90">{lang === "es" ? "Mensaje" : "Message"}</label>
              <textarea
                rows={5}
                className="w-full p-3 rounded-lg bg-white/70 border border-[color:var(--lx-nav-border)] text-[color:var(--lx-text)] placeholder:text-[color:var(--lx-muted)] focus:outline-none"
                placeholder={lang === "es" ? "Escribe tu mensaje" : "Write your message here"}
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl text-lg font-semibold bg-[color:var(--lx-cta-dark)] text-[color:var(--lx-cta-light)] shadow-[0_10px_28px_rgba(42,36,22,0.18)] hover:bg-[color:var(--lx-cta-dark-hover)] transition"
            >
              {lang === "es" ? "Enviar mensaje" : "Send message"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function ContactPage() {
  return <ContactContent />;
}
