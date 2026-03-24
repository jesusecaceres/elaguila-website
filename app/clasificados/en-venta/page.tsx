"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import { EN_VENTA_DEPARTMENTS } from "./taxonomy/categories";

export default function EnVentaHubPage() {
  const sp = useSearchParams();
  const lang = sp?.get("lang") === "en" ? "en" : "es";

  const t = {
    es: {
      hero: "En Venta",
      sub: "Compra y vende artículos locales con claridad y confianza.",
      searchPh: "Buscar en En Venta…",
      shop: "Comprar por departamento",
      lista: "Ver todos los anuncios",
      publish: "Publicar artículo",
      trust: "Comunidad Leonix · anuncios moderados · contacto directo",
      search: "Buscar",
    },
    en: {
      hero: "For Sale",
      sub: "Buy and sell local items with clarity and trust.",
      searchPh: "Search For Sale…",
      shop: "Shop by department",
      lista: "Browse all listings",
      publish: "Post an item",
      trust: "Leonix community · moderated listings · direct contact",
      search: "Search",
    },
  }[lang];

  return (
    <div className="min-h-screen bg-[#D9D9D9] text-[#111111]">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-28">
        <div className="rounded-3xl border border-black/10 bg-[#F5F5F5] px-6 py-10 shadow-sm ring-1 ring-[#C9B46A]/20">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#111111]/50">Leonix Clasificados</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-[#111111] md:text-5xl">{t.hero}</h1>
          <p className="mt-3 max-w-2xl text-base text-[#111111]/75">{t.sub}</p>

          <form className="mt-8 flex flex-col gap-3 sm:flex-row" action="/clasificados/lista" method="get">
            <input type="hidden" name="cat" value="en-venta" />
            <input type="hidden" name="lang" value={lang} />
            <input
              name="q"
              placeholder={t.searchPh}
              className="min-w-0 flex-1 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm shadow-inner"
            />
            <button
              type="submit"
              className="rounded-2xl bg-[#111111] px-6 py-3 text-sm font-semibold text-white hover:opacity-95"
            >
              {t.search}
            </button>
          </form>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href={`/clasificados/publicar/en-venta?lang=${lang}`}
              className="rounded-full bg-[#111111] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-95"
            >
              {t.publish}
            </Link>
            <Link
              href={`/clasificados/lista?cat=en-venta&lang=${lang}`}
              className="rounded-full border border-black/15 bg-white px-5 py-2.5 text-sm font-semibold text-[#111111] hover:bg-[#EFEFEF]"
            >
              {t.lista}
            </Link>
          </div>
        </div>

        <section className="mt-12">
          <h2 className="text-lg font-bold text-[#111111]">{t.shop}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {EN_VENTA_DEPARTMENTS.map((d) => (
              <Link
                key={d.key}
                href={`/clasificados/lista?cat=en-venta&evDept=${encodeURIComponent(d.key)}&lang=${lang}`}
                className="rounded-2xl border border-black/10 bg-[#F5F5F5] p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="font-semibold text-[#111111]">{d.label[lang]}</div>
                <p className="mt-1 text-xs text-[#111111]/60">{d.browseHint[lang]}</p>
              </Link>
            ))}
          </div>
        </section>

        <p className="mt-12 text-center text-xs text-[#111111]/55">{t.trust}</p>
      </main>
    </div>
  );
}
