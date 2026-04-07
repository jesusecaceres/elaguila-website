import type { Metadata } from "next";
import { pick } from "./data/tiendaCopy";
import { tiendaCategoryBySlug } from "./data/tiendaCategories";
import {
  merchTierForCategorySlug,
  storefrontGroupGridClass,
  tiendaStorefrontGroups,
} from "./data/tiendaMerchandising";
import { TiendaHero } from "./components/TiendaHero";
import { TiendaSectionHeading } from "./components/TiendaSectionHeading";
import { TiendaCategoryCard } from "./components/TiendaCategoryCard";
import { TiendaHowItWorks } from "./components/TiendaHowItWorks";
import { TiendaTrustStrip } from "./components/TiendaTrustStrip";
import { TiendaCTA } from "./components/TiendaCTA";
import { normalizeLang, tiendaPublicContactPath } from "./utils/tiendaRouting";
import { listTiendaCatalogItemsPublic, fetchPrimaryImageUrlForItems } from "@/app/lib/tienda/tiendaCatalogQueries";
import { TiendaCatalogItemCard } from "./components/catalog/TiendaCatalogItemCard";
import { getSiteSectionPayload } from "@/app/lib/siteSectionContent/siteSectionContentData";
import type { TiendaStorefrontPayload } from "@/app/lib/siteSectionContent/payloadTypes";
import {
  applyCategoryCardCopyOverrides,
  mergeTiendaStorefrontCopy,
} from "@/app/lib/tienda/mergeTiendaStorefrontCopy";
import { applyCategorySlugOrder } from "./utils/categorySlugOrder";

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

  const { payload: storefrontRaw } = await getSiteSectionPayload("tienda_storefront");
  const storefrontPatch = storefrontRaw as unknown as TiendaStorefrontPayload;
  const copy = mergeTiendaStorefrontCopy(storefrontPatch);

  const { items: featuredCatalog } = await listTiendaCatalogItemsPublic({ featuredStorefront: true });
  const featuredThumbs = await fetchPrimaryImageUrlForItems(featuredCatalog.map((i) => i.id));

  return (
    <main className="min-h-screen bg-[#070708] text-white [background-image:radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(201,168,74,0.12),transparent_50%),radial-gradient(ellipse_70%_50%_at_100%_50%,rgba(124,171,199,0.06),transparent_45%)]">
      <div className="mx-auto max-w-6xl px-6 pt-28 pb-20">
        {/* 1) HERO */}
        <TiendaHero
          lang={lang}
          eyebrow={pick(copy.hero.eyebrow, lang)}
          headline={pick(copy.hero.headline, lang)}
          subhead={pick(copy.hero.subhead, lang)}
          ctaPrimary={{ label: pick(copy.hero.ctaPrimary, lang), href: "#shop" }}
          ctaSecondary={{ label: pick(copy.hero.ctaSecondary, lang), href: tiendaPublicContactPath() }}
          supportingLine={pick(copy.hero.supportingLine, lang)}
          heroTileImages={storefrontPatch?.heroTileImages}
        />

        {(() => {
          const pe = storefrontPatch?.storefrontPromoStrip?.es?.trim();
          const pen = storefrontPatch?.storefrontPromoStrip?.en?.trim();
          const line = lang === "en" ? (pen || pe) : (pe || pen);
          return line ? (
            <div className="mt-8 rounded-2xl border border-[rgba(201,168,74,0.35)] bg-[rgba(201,168,74,0.08)] px-4 py-3 text-center text-sm text-[rgba(255,247,226,0.92)]">
              {line}
            </div>
          ) : null;
        })()}

        {/* 2) SHOP BY CATEGORY */}
        <section id="shop" className="mt-16 sm:mt-20 scroll-mt-28">
          <TiendaSectionHeading
            eyebrow={pick(copy.sections.categories.eyebrow, lang)}
            title={pick(copy.sections.categories.title, lang)}
            description={pick(copy.sections.categories.description, lang)}
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
                    {applyCategorySlugOrder(group.slugs, storefrontPatch?.homepageCategorySlugs).map((slug) => {
                      const c = tiendaCategoryBySlug[slug];
                      if (!c) return null;
                      const cat = applyCategoryCardCopyOverrides(c, storefrontPatch?.categoryCardCopy?.[slug]);
                      const coverUrl = storefrontPatch?.categoryCardCoverUrls?.[slug] ?? null;
                      return (
                        <TiendaCategoryCard
                          key={cat.id}
                          category={cat}
                          lang={lang}
                          density={merchTierForCategorySlug(slug)}
                          coverPrimaryOverride={coverUrl}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {featuredCatalog.length > 0 ? (
          <section className="mt-16 sm:mt-20">
            <TiendaSectionHeading
              eyebrow={pick(copy.sections.featured.eyebrow, lang)}
              title={pick(copy.sections.featured.title, lang)}
              description={pick(copy.sections.featured.description, lang)}
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

        {/* 3) HOW IT WORKS */}
        <section className="mt-16 sm:mt-20">
          <TiendaSectionHeading
            eyebrow={pick(copy.sections.howItWorks.eyebrow, lang)}
            title={pick(copy.sections.howItWorks.title, lang)}
            description={pick(copy.sections.howItWorks.description, lang)}
          />
          <div className="mt-8">
            <TiendaHowItWorks
              lang={lang}
              steps={copy.sections.howItWorks.steps.map((s) => ({
                title: pick(s.title, lang),
                body: pick(s.body, lang),
              }))}
              note={pick(copy.sections.howItWorks.note, lang)}
            />
          </div>
        </section>

        {/* 4) TRUST / QUALITY SECTION */}
        <section className="mt-16 sm:mt-20">
          <TiendaSectionHeading
            eyebrow={pick(copy.sections.trust.eyebrow, lang)}
            title={pick(copy.sections.trust.title, lang)}
          />
          <div className="mt-8">
            <TiendaTrustStrip
              lang={lang}
              items={pick(copy.sections.trust.items, lang)}
            />
          </div>
        </section>

        {/* 5) FINAL CTA STRIP */}
        <section className="mt-16 sm:mt-20">
          <TiendaCTA
            lang={lang}
            title={pick(copy.sections.finalCta.title, lang)}
            body={pick(copy.sections.finalCta.body, lang)}
            primary={{ label: pick(copy.sections.finalCta.primary, lang), href: "#shop" }}
            secondary={{ label: pick(copy.sections.finalCta.secondary, lang), href: tiendaPublicContactPath() }}
          />
        </section>
      </div>
    </main>
  );
}
