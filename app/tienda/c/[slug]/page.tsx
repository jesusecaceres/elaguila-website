import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { pick, tiendaCopy } from "../../data/tiendaCopy";
import {
  getCategoryBySlug,
  getFamiliesForCategory,
  productFamilyToSummary,
  TIENDA_CATEGORY_SLUGS,
} from "../../data/tiendaRegistry";
import type { Lang } from "../../types/tienda";
import { normalizeLang } from "../../utils/tiendaRouting";
import { TiendaBackNav } from "../../components/TiendaBackNav";
import { TiendaCategoryHero } from "../../components/TiendaCategoryHero";
import { TiendaModeBadgeRow } from "../../components/TiendaModeBadge";
import { TiendaProductFamilyCard } from "../../components/TiendaProductFamilyCard";
import { TiendaInfoPanel } from "../../components/TiendaInfoPanel";
import { TiendaSupportPanel } from "../../components/TiendaSupportPanel";
import { TiendaCTA } from "../../components/TiendaCTA";

export function generateStaticParams() {
  return TIENDA_CATEGORY_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await props.params;
  const category = getCategoryBySlug(slug);
  if (!category) {
    return { title: "Tienda · Leonix" };
  }
  const title = `${category.title.en} · Leonix Tienda`;
  const description = `${category.description.en} — ${category.description.es}`;
  return {
    title,
    description,
    openGraph: { title, description },
    alternates: { canonical: `/tienda/c/${slug}` },
  };
}

export default async function TiendaCategoryPage(props: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ lang?: string }>;
}) {
  const { slug } = await props.params;
  const sp = (await props.searchParams) ?? {};
  const lang: Lang = normalizeLang(sp.lang);

  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  const families = getFamiliesForCategory(slug).map(productFamilyToSummary);
  const howWorks = lang === "en" ? category.howOrderingWorks.en : category.howOrderingWorks.es;
  const supportMsg = lang === "en" ? category.supportMessage.en : category.supportMessage.es;

  return (
    <main className="min-h-screen bg-[#070708] text-white">
      <div className="mx-auto max-w-6xl px-6 pt-28 pb-20">
        <TiendaBackNav
          lang={lang}
          href="/tienda"
          label={pick(tiendaCopy.sections.categoryPage.backToStore, lang)}
        />

        <TiendaCategoryHero category={category} lang={lang} />

        <section className="mt-8">
          <TiendaModeBadgeRow mode={category.productMode} lang={lang} />
          <p className="mt-3 text-sm text-[rgba(255,255,255,0.62)]">
            {lang === "en"
              ? "This badge reflects how most products in this category are ordered."
              : "Esta etiqueta refleja cómo se ordenan la mayoría de productos en esta categoría."}
          </p>
        </section>

        <section id="families" className="mt-12 scroll-mt-28">
          <h2 className="text-xl font-semibold tracking-tight text-white">
            {pick(tiendaCopy.sections.categoryPage.productFamilies, lang)}
          </h2>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {families.map((f) => (
              <TiendaProductFamilyCard key={f.id} family={f} lang={lang} />
            ))}
          </div>
        </section>

        <section className="mt-12">
          <TiendaInfoPanel title={pick(tiendaCopy.sections.categoryPage.categoryWorks, lang)}>
            <p>{howWorks}</p>
          </TiendaInfoPanel>
        </section>

        <section className="mt-10">
          <TiendaSupportPanel
            lang={lang}
            title={lang === "en" ? "Need help?" : "¿Necesitas ayuda?"}
            body={
              lang === "en"
                ? "Custom layouts, specialty stocks, or missing files—Leonix can guide you."
                : "Layouts especiales, papeles distintos o archivos faltantes—Leonix te orienta."
            }
            message={supportMsg}
          />
        </section>

        <section className="mt-12">
          <TiendaCTA
            lang={lang}
            title={pick(tiendaCopy.sections.categoryPage.closingTitle, lang)}
            body={pick(tiendaCopy.sections.categoryPage.closingBody, lang)}
            primary={{
              label: lang === "en" ? "Browse families" : "Ver familias",
              href: `${category.href}#families`,
            }}
            secondary={{ label: pick(tiendaCopy.sections.finalCta.secondary, lang), href: "/contacto" }}
          />
        </section>
      </div>
    </main>
  );
}
