import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { pick, tiendaCopy } from "../../data/tiendaCopy";
import { tiendaProductFamilyCoverLiteral, tiendaProductFamilyCoverPrimary } from "../../data/tiendaVisualAssets";
import {
  getCategoryBySlug,
  getProductFamilyBySlug,
  TIENDA_PRODUCT_FAMILY_SLUGS,
} from "../../data/tiendaRegistry";
import { isPrintUploadProductSlug } from "../../product-configurators/print-upload/productConfigs";
import type { Lang } from "../../types/tienda";
import { normalizeLang, printUploadConfigurePath, tiendaPublicContactPath, withLang } from "../../utils/tiendaRouting";
import { TiendaBackNav } from "../../components/TiendaBackNav";
import { TiendaProductHero } from "../../components/TiendaProductHero";
import { TiendaSpecList } from "../../components/TiendaSpecList";
import { TiendaInfoPanel } from "../../components/TiendaInfoPanel";
import { TiendaSupportPanel } from "../../components/TiendaSupportPanel";
import { BusinessCardProductGateway } from "../../components/business-cards/BusinessCardProductGateway";
import { BusinessCardSpecialtyPanel } from "../../components/business-cards/BusinessCardSpecialtyPanel";
import { TiendaPromoCatalogPanel } from "../../components/TiendaPromoCatalogPanel";

function isBusinessCardSelfServeProductSlug(slug: string): boolean {
  return slug === "standard-business-cards" || slug === "two-sided-business-cards";
}

export function generateStaticParams() {
  return TIENDA_PRODUCT_FAMILY_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await props.params;
  const product = getProductFamilyBySlug(slug);
  if (!product) {
    return { title: "Tienda · Leonix" };
  }
  const title = `${product.title.en} · Leonix Tienda`;
  const description = `${product.description.en} — ${product.description.es}`;
  return {
    title,
    description,
    openGraph: { title, description },
    alternates: { canonical: `/tienda/p/${slug}` },
  };
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
  const showcaseCover = tiendaProductFamilyCoverPrimary(product.slug, product.categorySlug);
  const showcaseCoverFallback = tiendaProductFamilyCoverLiteral(product.slug, product.categorySlug);

  return (
    <main className="min-h-screen bg-[#070708] text-white">
      <div className="mx-auto max-w-6xl px-6 pt-28 pb-20">
        <TiendaBackNav
          lang={lang}
          href={categoryHref}
          label={pick(tiendaCopy.sections.productPage.backToCategory, lang)}
        />

        <TiendaProductHero product={product} lang={lang} />

        {product.categorySlug === "promo-products" ? (
          <TiendaPromoCatalogPanel
            lang={lang}
            product={product}
            coverImageUrl={showcaseCover}
            coverFallbackUrl={showcaseCoverFallback}
            tone="promo"
          />
        ) : null}

        {product.categorySlug === "marketing-materials" ? (
          <TiendaPromoCatalogPanel
            lang={lang}
            product={product}
            coverImageUrl={showcaseCover}
            coverFallbackUrl={showcaseCoverFallback}
            tone="marketing"
            secondaryCta={
              isPrintUploadProductSlug(product.slug)
                ? {
                    href: printUploadConfigurePath(product.slug),
                    label: { es: "Abrir configurador de subida", en: "Open upload configurator" },
                  }
                : null
            }
          />
        ) : null}

        {isBusinessCardSelfServeProductSlug(product.slug) ? (
          <div className="mt-10 space-y-10">
            <BusinessCardProductGateway lang={lang} productSlug={product.slug} />
            <BusinessCardSpecialtyPanel lang={lang} />
          </div>
        ) : null}

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
              {product.futureConfiguratorType === "business-card-builder" && !isBusinessCardSelfServeProductSlug(product.slug) ? (
                <Link
                  href={withLang(`/tienda/configure/business-cards/${product.slug}`, lang)}
                  className="inline-flex items-center justify-center rounded-full bg-[color:var(--lx-gold)] px-5 py-2.5 text-sm font-semibold text-[color:var(--lx-text)] hover:brightness-95 transition shadow-[0_12px_34px_rgba(201,168,74,0.22)]"
                >
                  {pick(tiendaCopy.sections.productPage.futureCtaButtonDesigner, lang)}
                </Link>
              ) : null}
              {product.futureConfiguratorType === "print-upload" && isPrintUploadProductSlug(product.slug) ? (
                <Link
                  href={withLang(printUploadConfigurePath(product.slug), lang)}
                  className="inline-flex items-center justify-center rounded-full border border-[rgba(255,252,247,0.35)] bg-[rgba(255,252,247,0.94)] px-5 py-2.5 text-sm font-semibold text-[color:var(--lx-text)] hover:brightness-95 transition shadow-[0_12px_34px_rgba(201,168,74,0.15)]"
                >
                  {pick(tiendaCopy.sections.productPage.futureCtaButtonUpload, lang)}
                </Link>
              ) : product.futureConfiguratorType === "print-upload" ? (
                <span className="text-sm text-[rgba(255,255,255,0.65)]">
                  {lang === "en"
                    ? "Upload configurator for this product is coming next."
                    : "El configurador de subida para este producto llegará pronto."}
                </span>
              ) : null}
              {product.futureConfiguratorType === "none" ? (
                <span className="text-sm text-[rgba(255,255,255,0.70)]">
                  {lang === "en"
                    ? "This product starts with a Leonix quote and coordination."
                    : "Este producto inicia con cotización y coordinación con Leonix."}
                </span>
              ) : null}
              <Link
                href={withLang(tiendaPublicContactPath(), lang)}
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
