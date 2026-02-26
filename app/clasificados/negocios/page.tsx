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
        title: "Directorio de negocios (próximamente)",
        subtitle:
          "Aquí vivirá el directorio de negocios verificados: perfiles, categorías y señales de confianza.",
        cta1: "Ver anuncios",
        href1: "/clasificados/lista",
        cta2: "Membresías",
        href2: "/clasificados#memberships",
        bullets: [
          "Próximo: perfiles de negocio (logo, horarios, enlaces, reseñas)",
          "Próximo: filtros por ciudad / categoría",
          "Próximo: verificación y señales de confianza",
        ],
        note:
          "Por ahora: usa Clasificados para ver anuncios de negocios dentro de cada categoría (marcados como vendedor de negocio).",
      },
      en: {
        title: "Business directory (coming soon)",
        subtitle:
          "This will host verified business profiles, categories, and trust signals.",
        cta1: "View listings",
        href1: "/clasificados/lista",
        cta2: "Memberships",
        href2: "/clasificados#memberships",
        bullets: [
          "Next: business profiles (logo, hours, links, reviews)",
          "Next: city/category filters",
          "Next: verification + trust signals",
        ],
        note:
          "For now: use Classifieds to browse business listings inside each category (marked as business seller).",
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

        <section className="mt-10 rounded-2xl border border-yellow-600/20 bg-black/35 p-6">
          <ul className="list-disc pl-5 space-y-2 text-gray-200">
            {t.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
          <p className="mt-5 text-gray-200">{t.note}</p>
        </section>
      </main>
    </div>
  );
}
