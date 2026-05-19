import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTiendaCatalogItemPublicBySlug } from "@/app/lib/tienda/tiendaCatalogQueries";
import { catalogItemPriceSummary } from "@/app/lib/tienda/tiendaCatalogPricing";
import type { Lang } from "../../types/tienda";
import { pick, tiendaCopy } from "../../data/tiendaCopy";
import { tiendaCatalogCoverLiteral, tiendaCatalogCoverPrimary } from "../../data/tiendaVisualAssets";
import { TiendaRemoteFillImage } from "../../components/TiendaRemoteFillImage";
import { normalizeLang, withLang } from "../../utils/tiendaRouting";
import { catalogItemPrimaryAction } from "../../utils/tiendaCatalogLinks";
import { TiendaBackNav } from "../../components/TiendaBackNav";
import { TiendaCatalogContactBlock } from "../../components/catalog/TiendaCatalogContactBlock";
import { getCategoryBySlug } from "../../data/tiendaRegistry";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const { item } = await getTiendaCatalogItemPublicBySlug(slug);
  if (!item) return { title: "Tienda · Leonix" };
  const title = `${item.title_en} · Leonix Tienda`;
  const description = `${item.short_description_en} — ${item.short_description_es}`;
  return { title, description, openGraph: { title, description } };
}

export default async function TiendaCatalogProductPage(props: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ lang?: string }>;
}) {
  const { slug } = await props.params;
  const sp = (await props.searchParams) ?? {};
  const lang: Lang = normalizeLang(sp.lang);

  const { item, error } = await getTiendaCatalogItemPublicBySlug(slug);
  if (error || !item) {
    if (error && !item) {
      return (
        <main className="min-h-screen bg-[color:var(--lx-page)] text-[color:var(--lx-text)]">
          <div className="mx-auto max-w-3xl px-6 pt-28 pb-20 text-sm text-rose-700/90">
            Catalog unavailable ({error}). If migrations are not applied, run Supabase migration for{" "}
            <code className="text-[color:var(--lx-text)]/80">tienda_catalog_items</code>.
          </div>
        </main>
      );
    }
    notFound();
  }

  const title = lang === "en" ? item.title_en : item.title_es;
  const longDesc = lang === "en" ? item.description_en : item.description_es;
  const priceLine = catalogItemPriceSummary(item, lang);
  const category = getCategoryBySlug(item.category_slug);
  const categoryHref = category?.href ?? "/tienda";
  const primaryCta = catalogItemPrimaryAction(item, lang);

  const gallery = item.images.slice().sort((a, b) => a.sort_order - b.sort_order);
  const fallbackHeroPrimary = tiendaCatalogCoverPrimary(item.category_slug);
  const fallbackHeroLiteral = tiendaCatalogCoverLiteral(item.category_slug);
  const heroImage = gallery[0];

  return (
    <main className="min-h-screen bg-[color:var(--lx-page)] text-[color:var(--lx-text)]">
      <div className="mx-auto max-w-6xl px-6 pt-28 pb-20">
        <TiendaBackNav lang={lang} href={withLang(categoryHref, lang)} label={pick(tiendaCopy.sections.productPage.backToCategory, lang)} />

        <header className="mt-6 space-y-3">
          <div className="flex flex-wrap gap-2">
            {item.badge_label ? (
              <span className="rounded-full border border-[color:var(--lx-lion)]/45 bg-[color:var(--lx-lion)]/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[color:var(--lx-text)]">
                {item.badge_label}
              </span>
            ) : null}
            {item.specialty_flag ? (
              <span className="rounded-full border border-[color:var(--lx-border)] px-3 py-1 text-[11px] text-[color:var(--lx-muted)]">
                {lang === "en" ? "Specialty / sourced" : "Especial / surtido"}
              </span>
            ) : null}
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[color:var(--lx-text)]">{title}</h1>
          <p className="text-lg text-[color:var(--lx-lion)]">{priceLine}</p>
          {item.price_note ? (
            <p className="text-sm text-[color:var(--lx-muted)] max-w-prose">{item.price_note}</p>
          ) : null}
        </header>

        <section className="mt-10 space-y-4">
          {heroImage ? (
            <>
              <figure className="relative overflow-hidden rounded-2xl border border-[color:var(--lx-border)] bg-[color:var(--lx-canvas)] shadow-[0_24px_80px_rgba(42,36,22,0.10)]">
                <div className="relative aspect-[16/10] w-full max-h-[min(560px,78vh)]">
                  <Image
                    src={heroImage.image_url}
                    alt={lang === "en" ? heroImage.alt_en || title : heroImage.alt_es || title}
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="(max-width: 1152px) 100vw, 1100px"
                    priority
                  />
                </div>
                {gallery.length > 1 ? (
                  <figcaption className="border-t border-[color:var(--lx-border)] px-4 py-2 text-[11px] text-[color:var(--lx-muted)]">
                    {lang === "en"
                      ? `${gallery.length} photos — swipe thumbnails below on mobile.`
                      : `${gallery.length} fotos — desliza miniaturas abajo en móvil.`}
                  </figcaption>
                ) : null}
              </figure>
              {gallery.length > 1 ? (
                <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:thin]">
                  {gallery.map((im) => {
                    const active = im.id === heroImage.id;
                    return (
                      <div
                        key={im.id}
                        className={[
                          "relative h-[72px] w-[104px] shrink-0 overflow-hidden rounded-xl border bg-[color:var(--lx-canvas)] transition",
                          active
                            ? "border-[color:var(--lx-lion)]/65 ring-2 ring-[color:var(--lx-lion)]/35"
                            : "border-[color:var(--lx-border)] opacity-[0.82]",
                        ].join(" ")}
                      >
                        <Image
                          src={im.image_url}
                          alt={lang === "en" ? im.alt_en || title : im.alt_es || title}
                          fill
                          unoptimized
                          className="object-cover"
                          sizes="120px"
                        />
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </>
          ) : (
            <figure className="overflow-hidden rounded-2xl border border-[color:var(--lx-border)] bg-[color:var(--lx-canvas)]">
              <div className="relative aspect-[16/10] w-full max-h-[480px]">
                <TiendaRemoteFillImage
                  primarySrc={fallbackHeroPrimary}
                  fallbackSrc={fallbackHeroLiteral}
                  alt={lang === "en" ? `${title} — representative preview` : `${title} — vista representativa`}
                  className="object-cover object-center"
                  sizes="(max-width: 1152px) 100vw, 1100px"
                  priority
                />
              </div>
              <figcaption className="border-t border-[color:var(--lx-border)] px-4 py-3 text-xs leading-relaxed text-[color:var(--lx-muted)]">
                {lang === "en"
                  ? "Representative scene for this category — add product photography anytime in the admin catalog."
                  : "Escena representativa para esta categoría — puedes añadir fotografía del producto en el catálogo admin."}
              </figcaption>
            </figure>
          )}
        </section>

        <section className="mt-10 max-w-3xl space-y-4 text-sm leading-relaxed text-[color:var(--lx-text)]/80">
          {longDesc.split("\n").map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </section>

        <section className="mt-10 flex flex-col sm:flex-row gap-3">
          <Link
            href={primaryCta.href}
            className="inline-flex items-center justify-center rounded-full bg-[color:var(--lx-gold)] px-6 py-3 text-sm font-semibold text-[color:var(--lx-text)] hover:brightness-95 shadow-[0_12px_34px_rgba(201,168,74,0.22)]"
          >
            {primaryCta.label}
          </Link>
        </section>

        {item.pricing_mode === "calculated_ready" && item.pricing_rules.length > 0 ? (
          <section className="mt-10 rounded-2xl border border-[color:var(--lx-border)] bg-[color:var(--lx-section)] p-5">
            <h2 className="text-sm font-semibold text-[color:var(--lx-lion)]">
              {lang === "en" ? "Reference pricing (admin-managed)" : "Precios de referencia (admin)"}
            </h2>
            <p className="mt-1 text-xs text-[color:var(--lx-muted)]">
              {lang === "en"
                ? "Final totals will match the live configurator at checkout when applicable."
                : "Los totales finales siguen el configurador activo al pagar cuando aplique."}
            </p>
            <ul className="mt-3 space-y-2 text-sm text-[color:var(--lx-text)]/80">
              {item.pricing_rules.map((r) => (
                <li key={r.id} className="flex flex-wrap justify-between gap-2 border-b border-[color:var(--lx-border)]/30 py-1">
                  <span>
                    {r.rule_type}
                    {r.quantity_min != null ? ` · qty ${r.quantity_min}` : ""}
                    {r.quantity_max != null ? `–${r.quantity_max}` : ""}
                  </span>
                  <span className="tabular-nums">${Number(r.price).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="mt-10">
          <TiendaCatalogContactBlock item={item} lang={lang} />
        </div>
      </div>
    </main>
  );
}
