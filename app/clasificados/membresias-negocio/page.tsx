"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import newLogo from "../../../public/logo.png";

type Lang = "es" | "en";

function withLang(href: string, lang: Lang) {
  const [base, hash] = href.split("#");
  const hasQuery = base.includes("?");
  const joined = `${base}${hasQuery ? "&" : "?"}lang=${lang}`;
  return hash ? `${joined}#${hash}` : joined;
}

export default function Page() {
  const sp = useSearchParams();
  const params = sp ?? new URLSearchParams();

  const lang = ((params.get("lang") || "es") as Lang) === "en" ? "en" : "es";

  const t = useMemo(() => {
    const ui = {
      es: {
        title: "Membresías de negocio (próximamente)",
        subtitle:
          "Estamos preparando planes para negocios que publican seguido (más anuncios, más confianza y herramientas de conversión).",
        note:
          "Por ahora, todos los anuncios se publican como vendedor personal (Gratis / LEONIX Pro). Los precios y planes de negocio se verán después de iniciar sesión cuando estén listos.",
        cta1: "Ver anuncios",
        href1: "/clasificados/lista",
        cta2: "Volver a Clasificados",
        href2: "/clasificados#memberships",
      },
      en: {
        title: "Business memberships (coming soon)",
        subtitle:
          "We’re preparing plans for businesses who post frequently (more listings, more trust, and conversion tools).",
        note:
          "For now, listings publish as personal seller (Free / LEONIX Pro). Business pricing and plans will appear after sign-in when they’re ready.",
        cta1: "View listings",
        href1: "/clasificados/lista",
        cta2: "Back to Classifieds",
        href2: "/clasificados#memberships",
      },
    };
    return ui[lang];
  }, [lang]);

  return (
    <div className="min-h-screen bg-black text-gray-100">
      <Navbar />

      <main className="mx-auto max-w-6xl px-6 pt-28 pb-16">
        <div className="text-center">
          <Image
            src={newLogo}
            alt="LEONIX"
            width={220}
            className="mx-auto mb-6"
            priority
          />
          <h1 className="text-4xl md:text-5xl font-bold text-yellow-400">
            {t.title}
          </h1>
          <p className="mt-4 text-gray-300 max-w-3xl mx-auto">
            {t.subtitle}
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href={withLang(t.href1, lang)}
              className="rounded-full border border-yellow-600/20 bg-black/25 px-4 py-2 text-sm font-semibold text-gray-100 hover:bg-black/30 transition"
            >
              {t.cta1}
            </Link>
            <Link
              href={withLang(t.href2, lang)}
              className="rounded-full border border-yellow-600/20 bg-black/25 px-4 py-2 text-sm font-semibold text-gray-100 hover:bg-black/30 transition"
            >
              {t.cta2}
            </Link>
          </div>
        </div>

        <section className="mt-10 rounded-2xl border border-yellow-600/20 bg-black/35 p-6 text-gray-200">
          {t.note}
        </section>
      </main>
    </div>
  );
}
