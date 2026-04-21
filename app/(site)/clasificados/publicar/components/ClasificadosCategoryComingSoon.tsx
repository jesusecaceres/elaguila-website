"use client";

import Link from "next/link";
import { categoryConfig, type CategoryKey } from "@/app/clasificados/config/categoryConfig";
import { LeonixApplicationDataLossNotice } from "@/app/clasificados/lib/leonixApplicationStandard/LeonixApplicationDataLossNotice";
import { LeonixCategoryApplicationHeader } from "@/app/clasificados/lib/leonixApplicationStandard/LeonixCategoryApplicationHeader";

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
          backClasificados: "Volver a Clasificados",
        }
      : {
          status: "Coming Soon",
          body: "This category is being rebuilt. Posting is not available yet.",
          backClasificados: "Back to Classifieds",
        };

  const clasificadosQs = new URLSearchParams();
  clasificadosQs.set("lang", lang);

  return (
    <main className="min-h-screen bg-[#F6F0E2] text-[#2C2416] pt-28 pb-16">
      <div className="mx-auto max-w-lg px-6">
        <LeonixCategoryApplicationHeader
          lang={lang}
          categoryTitle={`Leonix · ${title}`}
          headline={copy.status}
        />
        <LeonixApplicationDataLossNotice lang={lang} />
        <div className="mt-8 rounded-2xl border border-[#E8DFD0] bg-[#FFFBF7] p-6 sm:p-8 shadow-sm">
          <p className="text-center text-[#111111]/85 leading-relaxed">{copy.body}</p>

          <div className="mt-10 flex flex-col items-center gap-4">
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
