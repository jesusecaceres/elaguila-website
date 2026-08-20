import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicPillarJsonLd } from "@/app/components/PublicPillarJsonLd";
import { RecursosFilterForm } from "@/app/components/recursos/RecursosFilterForm";
import { RecursosLangSwitch } from "@/app/components/recursos/RecursosLangSwitch";
import { ResourceResultsGrid } from "@/app/components/recursos/ResourceResultsGrid";
import { navCopyLang, normalizeLang } from "@/app/lib/language";
import { LEONIX_MEDIA_SITE_NAME, LEONIX_SITE_ORIGIN, leonixPageTitle } from "@/app/lib/leonixBrand";
import { getPrimaryCategory, PRIMARY_CATEGORIES } from "@/app/lib/recursos/categories";
import { filterResources } from "@/app/lib/recursos/resourceFilters";
import { recursosCategoryHref, recursosCategoryPath, RECURSOS_BASE_PATH } from "@/app/lib/recursos/recursosUrls";
import { listPublicCommunityResources } from "@/app/lib/recursos/server/communityResourcesPublicQueries";
import type { PrimaryCategorySlug, UrgencyLevel } from "@/app/lib/recursos/types";

function isValidUrgency(v: string | undefined): v is UrgencyLevel {
  return v === "help-now" || v === "i-need-help" || v === "want-to-connect";
}

export async function generateMetadata(props: {
  params: Promise<{ category: string }>;
  searchParams?: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const { category: raw } = await props.params;
  const sp = (await props.searchParams) ?? {};
  const lang = normalizeLang(sp.lang);
  const category = getPrimaryCategory(raw as PrimaryCategorySlug);
  if (!category) return {};

  const title = lang === "en" ? `${category.labelEn} — Community Resources` : `${category.labelEs} — Recursos Comunitarios`;
  const description = lang === "en" ? category.descriptionEn : category.descriptionEs;
  const path = recursosCategoryPath(category.slug);
  const ogTitle = leonixPageTitle(title);

  return {
    title,
    description,
    alternates: { canonical: path },
    robots: { index: true, follow: true },
    openGraph: {
      title: ogTitle,
      description,
      url: path,
      siteName: LEONIX_MEDIA_SITE_NAME,
      type: "website",
      locale: lang === "en" ? "en_US" : "es_ES",
    },
    twitter: { card: "summary_large_image", title: ogTitle, description },
  };
}

export default async function CategoryPage(props: {
  params: Promise<{ category: string }>;
  searchParams?: Promise<{ lang?: string; q?: string; urgency?: string }>;
}) {
  const { category: rawCategory } = await props.params;
  const sp = (await props.searchParams) ?? {};
  const lang = normalizeLang(sp.lang);
  const recursosLang = navCopyLang(lang);

  const category = getPrimaryCategory(rawCategory as PrimaryCategorySlug);
  if (!category) notFound();

  const urgency = isValidUrgency(sp.urgency) ? sp.urgency : undefined;
  const q = sp.q?.trim() || "";

  // Gate 1/7: the ONLY approved public data path — never a direct Supabase query here.
  const { resources: eligible } = await listPublicCommunityResources({ category: category.slug, urgencyLevel: urgency });
  const results = q ? filterResources(eligible, { query: q }) : eligible;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: lang === "en" ? category.labelEn : category.labelEs,
    description: lang === "en" ? category.descriptionEn : category.descriptionEs,
    url: `${LEONIX_SITE_ORIGIN}${recursosCategoryPath(category.slug)}`,
    inLanguage: lang,
    isPartOf: { "@type": "WebSite", name: LEONIX_MEDIA_SITE_NAME, url: LEONIX_SITE_ORIGIN },
  };

  return (
    <main className="min-h-screen bg-[#FAF6EE] px-4 pb-20 pt-24 text-[#1F241C] sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PublicPillarJsonLd id="recursos-comunitarios" lang={lang} />
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-3">
          <Link href={`${RECURSOS_BASE_PATH}?lang=${recursosLang}`} className="text-xs font-bold text-[#556B3E] hover:underline">
            {recursosLang === "en" ? "← All resources" : "← Todos los recursos"}
          </Link>
          <RecursosLangSwitch compact />
        </div>

        <h1 className="mt-4 font-serif text-3xl font-bold leading-snug text-[#2A4536] sm:text-4xl">
          {recursosLang === "en" ? category.labelEn : category.labelEs}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#3D3428]">
          {recursosLang === "en" ? category.descriptionEn : category.descriptionEs}
        </p>

        <div className="mt-6 rounded-xl border border-[#D6C7AD] bg-[#FFFDF7] p-4 sm:p-5">
          <RecursosFilterForm
            lang={recursosLang}
            actionPath={recursosCategoryPath(category.slug)}
            defaultQuery={q}
            defaultUrgency={urgency ?? ""}
            lockedCategory={category.slug}
          />
        </div>

        <div className="mt-8">
          <ResourceResultsGrid resources={results} lang={recursosLang} />
        </div>

        <nav className="mt-10 flex flex-wrap gap-2" aria-label={recursosLang === "en" ? "Other categories" : "Otras categorías"}>
          {PRIMARY_CATEGORIES.filter((c) => c.slug !== category.slug).map((c) => (
            <Link
              key={c.slug}
              href={recursosCategoryHref(c.slug, lang)}
              className="inline-flex min-h-[2rem] items-center rounded-full border border-[#C9A84A]/50 bg-[#FFFDF7] px-3.5 text-xs font-semibold text-[#2A4536] transition hover:border-[#C9A84A]"
            >
              {recursosLang === "en" ? c.labelEn : c.labelEs}
            </Link>
          ))}
        </nav>
      </div>
    </main>
  );
}
