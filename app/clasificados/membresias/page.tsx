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
        title: "Membresías: LEONIX Pro",
        subtitle: "Todo lo necesario para vender con calma: más duración, mejor presentación y visibilidad temporal — sin convertirte en negocio.",
        cta1: "Ver anuncios",
        href1: "/clasificados",
        cta2: "Membres\u00edas de negocio",
        href2: "/clasificados/membresias-negocio",
        blocks: [["p", "Precio: $16.99/mes"], ["p", "Para: vendedores personales (sin inventario, sin lenguaje de tienda)."], ["ul", ["Duración extendida (~30 días)", "Mejor ranking que Gratis (pero siempre debajo de negocios)", "Más fotos + mejor presentación", "Analíticas básicas: vistas y guardados", "1 “asistencia de visibilidad” por anuncio (5 días) — controlada por el usuario", "Reglas claras anti-spam (sin repost infinito; sin enlaces externos; sin lenguaje de tienda)"]], ["p", "Nota: Cupones y sorteos son beneficios exclusivos de Print Ads (no de membresías de clasificados)."]],
      },
      en: {
        title: "Memberships: LEONIX Pro",
        subtitle: "Everything you need to sell smoothly: longer duration, better presentation, and time-limited visibility — without becoming a business.",
        cta1: "View listings",
        href1: "/clasificados",
        cta2: "Business memberships",
        href2: "/clasificados/membresias-negocio",
        blocks: [["p", "Price: $16.99/month"], ["p", "For: personal sellers (no inventory, no storefront language)."], ["ul", ["Extended duration (~30 days)", "Higher ranking than Free (but always below businesses)", "More photos + cleaner presentation", "Basic analytics: views and saves", "1 “visibility assist” per listing (5 days) — user-controlled", "Clear anti-spam rules (no endless reposting; no external links; no storefront language)"]], ["p", "Note: Coupons and sweepstakes are Print Ads-only benefits (not included in classifieds memberships)."]],
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