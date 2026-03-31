import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTiendaCatalogItemPublicBySlug } from "@/app/lib/tienda/tiendaCatalogQueries";
import { catalogItemPriceSummary } from "@/app/lib/tienda/tiendaCatalogPricing";
import type { Lang } from "../../types/tienda";
import { pick, tiendaCopy } from "../../data/tiendaCopy";
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
        <main className="min-h-screen bg-[#070708] text-white">
          <div className="mx-auto max-w-3xl px-6 pt-28 pb-20 text-sm text-rose-200/90">
            Catalog unavailable ({error}). If migrations are not applied, run Supabase migration for{" "}
            <code className="text-white/80">tienda_catalog_items</code>.
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
  const primary = catalogItemPrimaryAction(item, lang);

  const gallery = item.images.slice().sort((a, b) => a.sort_order - b.sort_order);

  return (
    <main className="min-h-screen bg-[#070708] text-white">
      <div className="mx-auto max-w-6xl px-6 pt-28 pb-20">
        <TiendaBackNav lang={lang} href={withLang(categoryHref, lang)} label={pick(tiendaCopy.sections.productPage.backToCategory, lang)} />

        <header className="mt-6 space-y-3">
          <div className="flex flex-wrap gap-2">
            {item.badge_label ? (
              <span className="rounded-full border border-[rgba(201,168,74,0.45)] bg-[rgba(201,168,74,0.12)] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[rgba(201,168,74,0.95)]">
                {item.badge_label}
              </span>
            ) : null}
            {item.specialty_flag ? (
              <span className="rounded-full border border-[rgba(255,255,255,0.14)] px-3 py-1 text-[11px] text-[rgba(255,247,226,0.75)]">
                {lang === "en" ? "Specialty / sourced" : "Especial / surtido"}
              </span>
            ) : null}
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[rgba(255,247,226,0.96)]">{title}</h1>
          <p className="text-lg text-[rgba(201,168,74,0.88)]">{priceLine}</p>
          {item.price_note ? (
            <p className="text-sm text-[rgba(255,255,255,0.55)] max-w-prose">{item.price_note}</p>
          ) : null}
        </header>

        {gallery.length > 0 ? (
          <section className="mt-10 grid gap-4 sm:grid-cols-2">
            {gallery.map((im) => (
              <figure key={im.id} className="overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)] bg-black/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={im.image_url}
                  alt={lang === "en" ? im.alt_en || title : im.alt_es || title}
                  className="w-full object-cover max-h-[420px]"
                />
              </figure>
            ))}
          </section>
        ) : null}

        <section className="mt-10 max-w-3xl space-y-4 text-sm leading-relaxed text-[rgba(255,255,255,0.75)]">
          {longDesc.split("\n").map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </section>

        <section className="mt-10 flex flex-col sm:flex-row gap-3">
          <Link
            href={primary.href}
            className="inline-flex items-center justify-center rounded-full bg-[color:var(--lx-gold)] px-6 py-3 text-sm font-semibold text-[color:var(--lx-text)] hover:brightness-95 shadow-[0_12px_34px_rgba(201,168,74,0.22)]"
          >
            {primary.label}
          </Link>
        </section>

        {item.pricing_mode === "calculated_ready" && item.pricing_rules.length > 0 ? (
          <section className="mt-10 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-5">
            <h2 className="text-sm font-semibold text-[rgba(201,168,74,0.9)]">
              {lang === "en" ? "Reference pricing (admin-managed)" : "Precios de referencia (admin)"}
            </h2>
            <p className="mt-1 text-xs text-[rgba(255,255,255,0.5)]">
              {lang === "en"
                ? "Final totals will match the live configurator at checkout when applicable."
                : "Los totales finales siguen el configurador activo al pagar cuando aplique."}
            </p>
            <ul className="mt-3 space-y-2 text-sm text-[rgba(255,247,226,0.85)]">
              {item.pricing_rules.map((r) => (
                <li key={r.id} className="flex flex-wrap justify-between gap-2 border-b border-white/5 py-1">
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
