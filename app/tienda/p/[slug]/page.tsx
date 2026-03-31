import { notFound } from "next/navigation";
import Link from "next/link";
import { pick, tiendaCopy } from "../../data/tiendaCopy";
import {
  getCategoryBySlug,
  getProductFamilyBySlug,
  TIENDA_PRODUCT_FAMILY_SLUGS,
} from "../../data/tiendaRegistry";
import type { Lang } from "../../types/tienda";
import { businessCardConfigurePath, normalizeLang, withLang } from "../../utils/tiendaRouting";
import { TiendaBackNav } from "../../components/TiendaBackNav";
import { TiendaProductHero } from "../../components/TiendaProductHero";
import { TiendaSpecList } from "../../components/TiendaSpecList";
import { TiendaInfoPanel } from "../../components/TiendaInfoPanel";
import { TiendaSupportPanel } from "../../components/TiendaSupportPanel";

export function generateStaticParams() {
  return TIENDA_PRODUCT_FAMILY_SLUGS.map((slug) => ({ slug }));
}

export default async function TiendaProductPage(props: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ lang?: string }>;
}) {
  const { slug } = await props.params;
  const sp = (await props.searchParams) ?? {};
  const lang: Lang = normalizeLang(sp.lang);

  const product = getProductFamilyBySlug(slug);
  if (!product) notFound();

  const category = getCategoryBySlug(product.categorySlug);
  const categoryHref = category?.href ?? "/tienda";

  const howOrdered = lang === "en" ? product.howOrdered.en : product.howOrdered.es;
  const bullets = product.responsibilityBullets.map((b) => (lang === "en" ? b.en : b.es));

  return (
    <main className="min-h-screen bg-[#070708] text-white">
      <div className="mx-auto max-w-6xl px-6 pt-28 pb-20">
        <TiendaBackNav
          lang={lang}
          href={categoryHref}
          label={pick(tiendaCopy.sections.productPage.backToCategory, lang)}
        />

        <TiendaProductHero product={product} lang={lang} />

        <section className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <TiendaSpecList
            lang={lang}
            title={pick(tiendaCopy.sections.productPage.specs, lang)}
            items={product.specs}
          />
          <TiendaSpecList
            lang={lang}
            title={pick(tiendaCopy.sections.productPage.options, lang)}
            items={product.optionsSummary}
          />
        </section>

        <section className="mt-10">
          <TiendaInfoPanel title={pick(tiendaCopy.sections.productPage.howOrdered, lang)}>
            <p>{howOrdered}</p>
          </TiendaInfoPanel>
        </section>

        <section className="mt-10">
          <TiendaInfoPanel title={pick(tiendaCopy.sections.productPage.fileQuality, lang)} variant="cream">
            <ul className="space-y-3">
              {bullets.map((text, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[rgba(201,168,74,0.75)]" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </TiendaInfoPanel>
        </section>

        <section className="mt-10">
          <TiendaSupportPanel
            lang={lang}
            title={pick(tiendaCopy.sections.productPage.needHelp, lang)}
            body={
              lang === "en"
                ? "Visit the office or reach out for design, retouching, or specialty production."
                : "Visita la oficina o escríbenos para diseño, retoque o producción especial."
            }
          />
        </section>

        <section className="mt-10">
          <TiendaInfoPanel title={pick(tiendaCopy.sections.productPage.futureCtaTitle, lang)}>
            <p>{pick(tiendaCopy.sections.productPage.futureCtaBody, lang)}</p>
            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              {product.futureConfiguratorType === "business-card-builder" ? (
                <Link
                  href={withLang(businessCardConfigurePath(product.slug), lang)}
                  className="inline-flex items-center justify-center rounded-full bg-[color:var(--lx-gold)] px-5 py-2.5 text-sm font-semibold text-[color:var(--lx-text)] hover:brightness-95 transition shadow-[0_12px_34px_rgba(201,168,74,0.22)]"
                >
                  {pick(tiendaCopy.sections.productPage.futureCtaButtonDesigner, lang)}
                </Link>
              ) : null}
              {product.futureConfiguratorType === "print-upload" ? (
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center justify-center rounded-full border border-[rgba(30,24,16,0.18)] bg-white/80 px-5 py-2.5 text-sm font-semibold text-[color:var(--lx-text)] opacity-55 cursor-not-allowed"
                >
                  {pick(tiendaCopy.sections.productPage.futureCtaButtonUpload, lang)}
                </button>
              ) : null}
              {product.futureConfiguratorType === "none" ? (
                <span className="text-sm text-[rgba(255,255,255,0.70)]">
                  {lang === "en"
                    ? "This product starts with a Leonix quote and coordination."
                    : "Este producto inicia con cotización y coordinación con Leonix."}
                </span>
              ) : null}
              <Link
                href={withLang("/contacto", lang)}
                className="inline-flex items-center justify-center rounded-full border border-[rgba(255,255,255,0.18)] px-5 py-2.5 text-sm font-semibold text-[rgba(255,247,226,0.92)] hover:bg-[rgba(255,255,255,0.08)] transition"
              >
                {pick(tiendaCopy.sections.productPage.futureCtaButtonContact, lang)}
              </Link>
            </div>
          </TiendaInfoPanel>
        </section>
      </div>
    </main>
  );
}
