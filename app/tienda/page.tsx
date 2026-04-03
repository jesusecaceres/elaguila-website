import type { Metadata } from "next";
import Link from "next/link";
import { tiendaCopy, pick } from "./data/tiendaCopy";
import { tiendaCategoryBySlug } from "./data/tiendaCategories";
import {
  merchTierForCategorySlug,
  storefrontGroupGridClass,
  tiendaStorefrontGroups,
} from "./data/tiendaMerchandising";
import { tiendaFeaturedProducts } from "./data/tiendaFeaturedProducts";
import { TiendaHero } from "./components/TiendaHero";
import { TiendaSectionHeading } from "./components/TiendaSectionHeading";
import { TiendaCategoryCard } from "./components/TiendaCategoryCard";
import { TiendaFeaturedProductCard } from "./components/TiendaFeaturedProductCard";
import { TiendaHowItWorks } from "./components/TiendaHowItWorks";
import { TiendaTrustStrip } from "./components/TiendaTrustStrip";
import { TiendaCTA } from "./components/TiendaCTA";
import { normalizeLang, tiendaPublicContactPath } from "./utils/tiendaRouting";
import { listTiendaCatalogItemsPublic, fetchPrimaryImageUrlForItems } from "@/app/lib/tienda/tiendaCatalogQueries";
import { TiendaCatalogItemCard } from "./components/catalog/TiendaCatalogItemCard";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: {
  searchParams?: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const sp = (await props.searchParams) ?? {};
  const lang = normalizeLang(sp.lang);
  const title =
    lang === "en" ? "Leonix Tienda — business print & promo" : "Leonix Tienda — impresión y productos para negocios";
  const description =
    lang === "en"
      ? "Upload-ready print, online business cards, and promo catalog requests with Leonix fulfillment."
      : "Impresión con subida de archivos, tarjetas en línea y catálogo promo con Leonix.";
  return {
    title,
    description,
    openGraph: { title, description },
  };
}

export default async function TiendaPage(props: {
  searchParams?: Promise<{ lang?: string }>;
}) {
  const sp = (await props.searchParams) ?? {};
  const lang = normalizeLang(sp.lang);

  const { items: featuredCatalog } = await listTiendaCatalogItemsPublic({ featuredStorefront: true });
  const featuredThumbs = await fetchPrimaryImageUrlForItems(featuredCatalog.map((i) => i.id));

  return (
    <main className="min-h-screen bg-[#070708] text-white [background-image:radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(201,168,74,0.12),transparent_50%),radial-gradient(ellipse_70%_50%_at_100%_50%,rgba(124,171,199,0.06),transparent_45%)]">
      <div className="mx-auto max-w-6xl px-6 pt-28 pb-20">
        {/* 1) HERO */}
        <TiendaHero
          lang={lang}
          eyebrow={pick(tiendaCopy.hero.eyebrow, lang)}
          headline={pick(tiendaCopy.hero.headline, lang)}
          subhead={pick(tiendaCopy.hero.subhead, lang)}
          ctaPrimary={{ label: pick(tiendaCopy.hero.ctaPrimary, lang), href: "#shop" }}
          ctaSecondary={{ label: pick(tiendaCopy.hero.ctaSecondary, lang), href: tiendaPublicContactPath() }}
          supportingLine={pick(tiendaCopy.hero.supportingLine, lang)}
        />

        {/* 2) SHOP BY CATEGORY */}
        <section id="shop" className="mt-16 sm:mt-20 scroll-mt-28">
          <TiendaSectionHeading
            eyebrow={pick(tiendaCopy.sections.categories.eyebrow, lang)}
            title={pick(tiendaCopy.sections.categories.title, lang)}
            description={pick(tiendaCopy.sections.categories.description, lang)}
          />

          <div className="mt-10 space-y-14">
            {tiendaStorefrontGroups.map((group) => {
              const title = lang === "en" ? group.title.en : group.title.es;
              const desc = group.description ? (lang === "en" ? group.description.en : group.description.es) : null;
              const gridClass = storefrontGroupGridClass(group.id);

              return (
                <div key={group.id}>
                  <div className="border-b border-[rgba(255,255,255,0.08)] pb-4">
                    <h3 className="text-sm font-semibold tracking-tight text-[rgba(255,247,226,0.95)]">{title}</h3>
                    {desc ? <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[rgba(255,255,255,0.58)]">{desc}</p> : null}
                  </div>
                  <div className={`mt-6 ${gridClass}`}>
                    {group.slugs.map((slug) => {
                      const c = tiendaCategoryBySlug[slug];
                      if (!c) return null;
                      return (
                        <TiendaCategoryCard
                          key={c.id}
                          category={c}
                          lang={lang}
                          density={merchTierForCategorySlug(slug)}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3) BEST SELLERS / READY TO ORDER */}
        <section className="mt-16 sm:mt-20">
          <TiendaSectionHeading
            eyebrow={pick(tiendaCopy.sections.featured.eyebrow, lang)}
            title={pick(tiendaCopy.sections.featured.title, lang)}
            description={pick(tiendaCopy.sections.featured.description, lang)}
          />
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tiendaFeaturedProducts.map((p) => (
              <TiendaFeaturedProductCard key={p.id} product={p} lang={lang} />
            ))}
          </div>
        </section>

        {featuredCatalog.length > 0 ? (
          <section className="mt-16 sm:mt-20">
            <TiendaSectionHeading
              eyebrow={lang === "en" ? "Catalog" : "Catálogo"}
              title={lang === "en" ? "Featured sourced & promo picks" : "Surtido promo y destacados"}
              description={
                lang === "en"
                  ? "Sourced or specialty picks from the Leonix admin catalog — every card shows imagery and honest pricing notes."
                  : "Surtido especial desde el catálogo admin de Leonix — cada tarjeta muestra imagen y notas honestas de precio."
              }
            />
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCatalog.map((item) => (
                <TiendaCatalogItemCard
                  key={item.id}
                  item={item}
                  lang={lang}
                  imageUrl={featuredThumbs.get(item.id)}
                />
              ))}
            </div>
          </section>
        ) : null}

        {/* 4) HOW IT WORKS */}
        <section className="mt-16 sm:mt-20">
          <TiendaSectionHeading
            eyebrow={pick(tiendaCopy.sections.howItWorks.eyebrow, lang)}
            title={pick(tiendaCopy.sections.howItWorks.title, lang)}
            description={pick(tiendaCopy.sections.howItWorks.description, lang)}
          />
          <div className="mt-8">
            <TiendaHowItWorks
              lang={lang}
              steps={tiendaCopy.sections.howItWorks.steps.map((s) => ({
                title: pick(s.title, lang),
                body: pick(s.body, lang),
              }))}
              note={pick(tiendaCopy.sections.howItWorks.note, lang)}
            />
          </div>
        </section>

        {/* 5) TRUST / QUALITY SECTION */}
        <section className="mt-16 sm:mt-20">
          <TiendaSectionHeading
            eyebrow={pick(tiendaCopy.sections.trust.eyebrow, lang)}
            title={pick(tiendaCopy.sections.trust.title, lang)}
          />
          <div className="mt-8">
            <TiendaTrustStrip
              lang={lang}
              items={pick(tiendaCopy.sections.trust.items, lang)}
            />
          </div>
        </section>

        {/* 6) FINAL CTA STRIP */}
        <section className="mt-16 sm:mt-20">
          <TiendaCTA
            lang={lang}
            title={pick(tiendaCopy.sections.finalCta.title, lang)}
            body={pick(tiendaCopy.sections.finalCta.body, lang)}
            primary={{ label: pick(tiendaCopy.sections.finalCta.primary, lang), href: "#shop" }}
            secondary={{ label: pick(tiendaCopy.sections.finalCta.secondary, lang), href: tiendaPublicContactPath() }}
          />
        </section>
      </div>
    </main>
  );
}
