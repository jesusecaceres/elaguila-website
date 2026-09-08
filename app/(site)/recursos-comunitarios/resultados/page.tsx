import type { Metadata } from "next";
import Link from "next/link";
import { PublicPillarJsonLd } from "@/app/components/PublicPillarJsonLd";
import { RecursosFilterForm } from "@/app/components/recursos/RecursosFilterForm";
import { RecursosLangSwitch } from "@/app/components/recursos/RecursosLangSwitch";
import { ResourceResultsGrid } from "@/app/components/recursos/ResourceResultsGrid";
import { navCopyLang, normalizeLang } from "@/app/lib/language";
import { leonixPageTitle } from "@/app/lib/leonixBrand";
import { getPrimaryCategory } from "@/app/lib/recursos/categories";
import { filterResources } from "@/app/lib/recursos/resourceFilters";
import { RECURSOS_BASE_PATH, RECURSOS_RESULTS_PATH } from "@/app/lib/recursos/recursosUrls";
import { listPublicCommunityResources } from "@/app/lib/recursos/server/communityResourcesPublicQueries";
import type { PrimaryCategorySlug, UrgencyLevel } from "@/app/lib/recursos/types";

function isValidUrgency(v: string | undefined): v is UrgencyLevel {
  return v === "help-now" || v === "i-need-help" || v === "want-to-connect";
}

const TITLE = { es: "Resultados de búsqueda — Recursos Comunitarios", en: "Search results — Community Resources" };
const DESC = {
  es: "Busca en el directorio verificado de recursos comunitarios de Leonix por palabra clave, categoría o urgencia.",
  en: "Search Leonix's verified community resources directory by keyword, category, or urgency.",
};

export async function generateMetadata(props: { searchParams?: Promise<{ lang?: string }> }): Promise<Metadata> {
  const sp = (await props.searchParams) ?? {};
  const lang = normalizeLang(sp.lang);
  const title = lang === "en" ? TITLE.en : TITLE.es;
  const description = lang === "en" ? DESC.en : DESC.es;
  return {
    title,
    description,
    alternates: { canonical: RECURSOS_RESULTS_PATH },
    robots: { index: false, follow: true },
    openGraph: { title: leonixPageTitle(title), description, url: RECURSOS_RESULTS_PATH, type: "website" },
  };
}

export default async function ResultadosPage(props: {
  searchParams?: Promise<{ lang?: string; q?: string; category?: string; urgency?: string }>;
}) {
  const sp = (await props.searchParams) ?? {};
  const lang = normalizeLang(sp.lang);
  const recursosLang = navCopyLang(lang);

  const category = sp.category ? getPrimaryCategory(sp.category as PrimaryCategorySlug) : undefined;
  const urgency = isValidUrgency(sp.urgency) ? sp.urgency : undefined;
  const q = sp.q?.trim() || "";

  // Gate 1/7: the ONLY approved public data path — never a direct Supabase query here.
  const { resources: eligible } = await listPublicCommunityResources({ category: category?.slug, urgencyLevel: urgency });
  const results = q ? filterResources(eligible, { query: q }) : eligible;

  return (
    <main className="min-h-screen bg-[#FAF6EE] px-4 pb-20 pt-24 text-[#1F241C] sm:px-6 lg:px-8">
      <PublicPillarJsonLd id="recursos-comunitarios" lang={lang} />
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-3">
          <Link href={`${RECURSOS_BASE_PATH}?lang=${recursosLang}`} className="text-xs font-bold text-[#556B3E] hover:underline">
            {recursosLang === "en" ? "← All resources" : "← Todos los recursos"}
          </Link>
          <RecursosLangSwitch compact />
        </div>

        <h1 className="mt-4 font-serif text-3xl font-bold leading-snug text-[#2A4536] sm:text-4xl">
          {recursosLang === "en" ? TITLE.en : TITLE.es}
        </h1>

        <div className="mt-6 rounded-xl border border-[#D6C7AD] bg-[#FFFDF7] p-4 sm:p-5">
          <RecursosFilterForm
            lang={recursosLang}
            actionPath={RECURSOS_RESULTS_PATH}
            defaultQuery={q}
            defaultUrgency={urgency ?? ""}
            defaultCategory={category?.slug ?? ""}
            showCategorySelect
          />
        </div>

        <p className="mt-6 text-xs font-semibold text-[#5C564E]">
          {recursosLang === "en"
            ? `${results.length} result${results.length === 1 ? "" : "s"}`
            : `${results.length} resultado${results.length === 1 ? "" : "s"}`}
        </p>

        <div className="mt-4">
          <ResourceResultsGrid resources={results} lang={recursosLang} />
        </div>
      </div>
    </main>
  );
}
