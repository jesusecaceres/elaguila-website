import type { Metadata } from "next";
import Link from "next/link";
import { tiendaCopy, pick } from "./data/tiendaCopy";
import { tiendaCategories } from "./data/tiendaCategories";
import { tiendaFeaturedProducts } from "./data/tiendaFeaturedProducts";
import { TiendaHero } from "./components/TiendaHero";
import { TiendaSectionHeading } from "./components/TiendaSectionHeading";
import { TiendaCategoryCard } from "./components/TiendaCategoryCard";
import { TiendaFeaturedProductCard } from "./components/TiendaFeaturedProductCard";
import { TiendaHowItWorks } from "./components/TiendaHowItWorks";
import { TiendaServiceSplit } from "./components/TiendaServiceSplit";
import { TiendaTrustStrip } from "./components/TiendaTrustStrip";
import { TiendaCTA } from "./components/TiendaCTA";
import { normalizeLang, withLang } from "./utils/tiendaRouting";

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

  return (
    <main className="min-h-screen bg-[#070708] text-white">
      <div className="mx-auto max-w-6xl px-6 pt-28 pb-20">
        {/* 1) HERO */}
        <TiendaHero
          lang={lang}
          eyebrow={pick(tiendaCopy.hero.eyebrow, lang)}
          headline={pick(tiendaCopy.hero.headline, lang)}
          subhead={pick(tiendaCopy.hero.subhead, lang)}
          ctaPrimary={{ label: pick(tiendaCopy.hero.ctaPrimary, lang), href: "#shop" }}
          ctaSecondary={{ label: pick(tiendaCopy.hero.ctaSecondary, lang), href: "/contacto" }}
          supportingLine={pick(tiendaCopy.hero.supportingLine, lang)}
        />

        {/* 2) SHOP BY CATEGORY */}
        <section id="shop" className="mt-16 sm:mt-20 scroll-mt-28">
          <TiendaSectionHeading
            eyebrow={pick(tiendaCopy.sections.categories.eyebrow, lang)}
            title={pick(tiendaCopy.sections.categories.title, lang)}
            description={pick(tiendaCopy.sections.categories.description, lang)}
            rightSlot={
              <Link
                href={withLang("/contacto", lang)}
                className="inline-flex items-center justify-center rounded-full border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.06)] px-5 py-2.5 text-sm font-semibold text-[rgba(255,255,255,0.86)] hover:bg-[rgba(255,255,255,0.10)] transition"
              >
                {lang === "en" ? "Custom request" : "Pedido especial"}
              </Link>
            }
          />

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {tiendaCategories.map((c) => (
              <TiendaCategoryCard key={c.id} category={c} lang={lang} />
            ))}
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

        {/* 5) SELF-SERVE VS CUSTOM HELP */}
        <section className="mt-16 sm:mt-20">
          <TiendaSectionHeading
            title={pick(tiendaCopy.sections.split.title, lang)}
            description={lang === "en" ? "Pick the right path for your job." : "Elige el camino correcto para tu pedido."}
          />
          <div className="mt-8">
            <TiendaServiceSplit
              lang={lang}
              left={{
                title: pick(tiendaCopy.sections.split.left.title, lang),
                body: pick(tiendaCopy.sections.split.left.body, lang),
                bullets: pick(tiendaCopy.sections.split.left.bullets, lang),
                ctaLabel: pick(tiendaCopy.sections.split.left.cta, lang),
                ctaHref: "#shop",
              }}
              right={{
                title: pick(tiendaCopy.sections.split.right.title, lang),
                body: pick(tiendaCopy.sections.split.right.body, lang),
                bullets: pick(tiendaCopy.sections.split.right.bullets, lang),
                ctaLabel: pick(tiendaCopy.sections.split.right.cta, lang),
                ctaHref: "/contacto",
              }}
            />
          </div>
        </section>

        {/* 6) TRUST / QUALITY SECTION */}
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

        {/* 7) FINAL CTA STRIP */}
        <section className="mt-16 sm:mt-20">
          <TiendaCTA
            lang={lang}
            title={pick(tiendaCopy.sections.finalCta.title, lang)}
            body={pick(tiendaCopy.sections.finalCta.body, lang)}
            primary={{ label: pick(tiendaCopy.sections.finalCta.primary, lang), href: "#shop" }}
            secondary={{ label: pick(tiendaCopy.sections.finalCta.secondary, lang), href: "/contacto" }}
          />
        </section>
      </div>
    </main>
  );
}
