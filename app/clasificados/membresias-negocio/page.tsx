"use client";

import Image from "next/image";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import newLogo from "../../../public/logo.png";

type Lang = "es" | "en";

export default function Page() {
  const params = useSearchParams();
  const lang = ((params.get("lang") || "es") as Lang) === "en" ? "en" : "es";

  const t = useMemo(() => {
    const ui = {
      es: {
        title: "Membresías de negocio",
        subtitle: "Para negocios que publican seguido: más anuncios, más confianza, y herramientas para convertir — sin cupones ni sorteos (eso es Print Ads).",
        cta1: "Ver directorio de negocios",
        href1: "/clasificados/negocios",
        cta2: "Volver a Clasificados",
        href2: "/clasificados",
        blocks: [["p", "Business Lite: $89/mes (Bronze: $59/mes)"], ["ul", ["Insignia de negocio", "Múltiples anuncios activos", "Mayor visibilidad que perfiles personales", "Analíticas básicas"]], ["p", "Business Premium: $149/mes (Bronze: $99/mes)"], ["ul", ["Todo lo de Lite", "Prioridad en ranking", "Perfil mejorado", "Herramientas de leads por anuncio (llamar, mensaje, pedir info, agendar cita, subir foto opcional)"]], ["p", "Regla ética: nunca ocultamos anuncios gratis. Solo cambiamos ranking/visibilidad por tiempo y agregamos herramientas premium."]],
      },
      en: {
        title: "Business memberships",
        subtitle: "For businesses that post often: more listings, more trust, and conversion tools — no coupons or sweepstakes (that’s Print Ads).",
        cta1: "View business directory",
        href1: "/clasificados/negocios",
        cta2: "Back to Classifieds",
        href2: "/clasificados",
        blocks: [["p", "Business Lite: $89/month (Bronze: $59/month)"], ["ul", ["Business badge", "Multiple active listings", "Higher visibility than personal profiles", "Basic analytics"]], ["p", "Business Premium: $149/month (Bronze: $99/month)"], ["ul", ["Everything in Lite", "Priority ranking", "Enhanced profile", "Lead tools per listing (call, message, request info, book appointment, optional photo upload)"]], ["p", "Ethical rule: we never hide free listings. We only affect ranking/time-limited visibility and add premium tools."]],
      },
    } as const;

    return ui[lang];
  }, [lang]);

  return (
    <div className="bg-black min-h-screen text-white pb-32">
      <Navbar />

      <section className="max-w-6xl mx-auto px-6 pt-28">
        <div className="text-center mb-12">
          <Image src={newLogo} alt="LEONIX" width={320} className="mx-auto mb-6" />
          <h1 className="text-5xl md:text-6xl font-bold text-yellow-400">{t.title}</h1>
          <p className="mt-4 text-gray-300 max-w-3xl mx-auto text-lg md:text-xl">{t.subtitle}</p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href={`${t.href1}?lang=${lang}`}
              className="px-7 py-3 rounded-full bg-yellow-400 text-black font-semibold hover:opacity-95 transition"
            >
              {t.cta1}
            </a>

            {t.cta2 && t.href2 ? (
              <a
                href={`${t.href2}?lang=${lang}`}
                className="px-7 py-3 rounded-full border border-white/10 bg-black/30 text-gray-100 font-semibold hover:bg-black/45 transition"
              >
                {t.cta2}
              </a>
            ) : null}
          </div>
        </div>

        <div className="border border-yellow-600/20 rounded-2xl p-8 bg-black/30">
          <div className="space-y-5 text-gray-200 leading-relaxed">
            {t.blocks.map((b, idx) => {
              if (b[0] === "p") {
                return (
                  <p key={idx} className="text-gray-200">
                    {b[1]}
                  </p>
                );
              }
              if (b[0] === "ul") {
                return (
                  <ul key={idx} className="space-y-2">
                    {(b[1] as string[]).map((li, j) => (
                      <li key={j} className="text-gray-300">
                        • {li}
                      </li>
                    ))}
                  </ul>
                );
              }
              return null;
            })}
          </div>
        </div>

        <div className="mt-10 text-center">
          <a
            href={`/clasificados?lang=${lang}`}
            className="inline-flex px-6 py-3 rounded-full border border-white/10 bg-black/30 text-gray-100 font-semibold hover:bg-black/45 transition"
          >
            {lang === "es" ? "Volver a Clasificados" : "Back to Classifieds"}
          </a>
        </div>
      </section>
    </div>
  );
}