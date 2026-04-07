"use client";

import Link from "next/link";
import { categoryConfig, type CategoryKey } from "@/app/clasificados/config/categoryConfig";

export type ClasificadosComingSoonLang = "es" | "en";

export type ClasificadosCategoryComingSoonProps = {
  /** Slug from the URL; must be a real category key (not `all`). */
  categorySlug: Exclude<CategoryKey, "all">;
  lang: ClasificadosComingSoonLang;
};

export default function ClasificadosCategoryComingSoon({
  categorySlug,
  lang,
}: ClasificadosCategoryComingSoonProps) {
  const title = categoryConfig[categorySlug].label[lang];
  const copy =
    lang === "es"
      ? {
          status: "Próximamente",
          body: "Esta categoría se está reconstruyendo. La publicación aún no está disponible.",
          backCategories: "Volver a categorías",
          backClasificados: "Volver a Clasificados",
        }
      : {
          status: "Coming Soon",
          body: "This category is being rebuilt. Posting is not available yet.",
          backCategories: "Back to categories",
          backClasificados: "Back to Classifieds",
        };

  const publicarQs = new URLSearchParams();
  publicarQs.set("lang", lang);
  const clasificadosQs = new URLSearchParams();
  clasificadosQs.set("lang", lang);

  return (
    <main className="min-h-screen bg-[#D9D9D9] text-[#111111] pt-28 pb-16">
      <div className="max-w-lg mx-auto px-6">
        <div className="rounded-2xl border border-black/10 bg-[#F5F5F5] p-6 sm:p-8 shadow-sm">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111111] text-center">{title}</h1>
          <p className="mt-2 text-center text-lg font-semibold text-[#A98C2A]">{copy.status}</p>
          <p className="mt-4 text-center text-[#111111]/85 leading-relaxed">{copy.body}</p>

          <div className="mt-10 flex flex-col items-center gap-4">
            <Link
              href={`/clasificados/publicar?${publicarQs.toString()}`}
              className="text-sm font-semibold text-[#111111]/80 underline hover:text-[#111111]"
            >
              {copy.backCategories}
            </Link>
            <Link
              href={`/clasificados?${clasificadosQs.toString()}`}
              className="text-sm font-semibold text-[#111111]/60 underline hover:text-[#111111]/90"
            >
              {copy.backClasificados}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
