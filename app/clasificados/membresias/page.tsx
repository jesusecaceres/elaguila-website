"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import newLogo from "../../../public/logo.png";

type Lang = "es" | "en";

function withLang(href: string, lang: Lang) {
  // Preserve hash if present
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
        title: "Membresías: LEONIX Pro",
        subtitle:
          "Para vendedores personales que quieren vender con calma: más duración, mejor presentación y una ventana de visibilidad por anuncio — sin inventario ni lenguaje de tienda.",
        cta1: "Ver anuncios",
        href1: "/clasificados/lista",
        cta2: "Publicar anuncio",
        href2: "/clasificados/publicar",
        blocks: [
          [
            "ul",
            [
              "Duración extendida (~30 días)",
              "Mejor ranking que Gratis (sin ocultar anuncios gratis)",
              "Más fotos y presentación más limpia",
              "Estadísticas básicas (vistas / guardados)",
              "1 “ventana de visibilidad” por anuncio (5 días, sin rollover)",
              "Sin lenguaje de tienda, sin links externos, sin inventario",
            ],
          ],
          [
            "p",
            "Los precios se muestran después de iniciar sesión, para que el plan correcto se adapte a lo que publicas.",
          ],
        ],
      },
      en: {
        title: "Memberships: LEONIX Pro",
        subtitle:
          "For personal sellers who want to sell with ease: longer duration, cleaner presentation, and a visibility window per listing — no inventory, no storefront language.",
        cta1: "View listings",
        href1: "/clasificados/lista",
        cta2: "Post listing",
        href2: "/clasificados/publicar",
        blocks: [
          [
            "ul",
            [
              "Extended duration (~30 days)",
              "Higher ranking than Free (free listings are never hidden)",
              "More photos + cleaner presentation",
              "Basic stats (views / saves)",
              "1 “visibility window” per listing (5 days, no rollover)",
              "No storefront language, no external links, no inventory",
            ],
          ],
          [
            "p",
            "Pricing is shown after you sign in, so the plan matches what you post.",
          ],
        ],
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
              className="rounded-full bg-yellow-400 px-4 py-2 text-sm font-semibold text-black hover:opacity-95 transition"
            >
              {t.cta2}
            </Link>
          </div>
        </div>

        <section className="mt-10 grid gap-4">
          {t.blocks.map((b, i) => {
            const [type, value] = b as any;
            if (type === "ul") {
              return (
                <div
                  key={i}
                  className="rounded-2xl border border-yellow-600/20 bg-black/35 p-6"
                >
                  <ul className="list-disc pl-5 space-y-2 text-gray-200">
                    {(value as string[]).map((li, j) => (
                      <li key={j}>{li}</li>
                    ))}
                  </ul>
                </div>
              );
            }
            return (
              <div
                key={i}
                className="rounded-2xl border border-yellow-600/20 bg-black/25 p-6 text-gray-200"
              >
                {value as string}
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
}
