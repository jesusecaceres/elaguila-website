"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CATALOG_CATEGORIES, type CategoryId, type Product, type CatalogCategory } from "./catalogData";

type Lang = "es" | "en";

const CATEGORY_ICONS: Record<CategoryId, string> = {
  "business-cards": "🪪",
  marketing: "📄",
  signs: "📋",
  promo: "🎁",
  essentials: "�",
};

const OLIVE_BG = "var(--lx-cta-secondary-bg)";
const OLIVE_FG = "var(--lx-cta-secondary-fg)";
const OLIVE_HOVER = "#4d5e30";

function ProductCardImage({ product, lang }: { product: Product; lang: Lang }) {
  const [loadFailed, setLoadFailed] = useState(false);
  const title = product[lang].title;
  const alt = lang === "es" ? (product.imageAltEs ?? title) : (product.imageAltEn ?? title);

  if (!product.imageSrc || loadFailed) {
    return <ProductImagePlaceholder product={product} lang={lang} />;
  }

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl" style={{ background: "var(--lx-canvas)" }}>
      <Image
        src={product.imageSrc}
        alt={alt}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="object-cover object-center"
        onError={() => setLoadFailed(true)}
      />
    </div>
  );
}

function ProductImagePlaceholder({ product, lang }: { product: Product; lang: Lang }) {
  const title = product[lang].title;
  const initials = title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  return (
    <div
      className="relative flex aspect-[4/3] w-full flex-col items-center justify-center overflow-hidden rounded-xl"
      style={{ background: "var(--lx-canvas)" }}
      aria-label={title}
    >
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.06]"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <pattern id={`grid-${product.slug}`} width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1F241C" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#grid-${product.slug})`} />
      </svg>
      <div className="relative flex flex-col items-center gap-1.5 px-4">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl text-xl font-bold shadow-sm"
          style={{ background: "var(--lx-section)", color: "var(--lx-text-2)", border: "1.5px solid var(--lx-border)" }}
        >
          {initials}
        </div>
        <span
          className="max-w-[120px] text-center text-[10px] font-semibold uppercase tracking-wide leading-tight"
          style={{ color: "var(--lx-text-2)", opacity: 0.7 }}
        >
          {title}
        </span>
      </div>
    </div>
  );
}

function ProductCard({ product, lang }: { product: Product; lang: Lang }) {
  const title = product[lang].title;
  const subtitle = product[lang].subtitle;
  const ctaLabel = lang === "es" ? "Solicitar cotización" : "Request Quote";
  const href = `/tienda/contacto?lang=${lang}&service=${encodeURIComponent(product.slug)}`;

  return (
    <article
      className="flex flex-col overflow-hidden rounded-2xl border"
      style={{ background: "var(--lx-card)", borderColor: "var(--lx-border)", boxShadow: "0 2px 8px rgba(42,36,22,0.07)" }}
    >
      <ProductCardImage product={product} lang={lang} />
      <div className="flex flex-1 flex-col gap-3 p-4">
        {product.subcategory ? (
          <span
            className="self-start rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{ background: "var(--lx-canvas)", color: "var(--lx-muted)" }}
          >
            {product.subcategory}
          </span>
        ) : null}
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-bold leading-snug" style={{ color: "var(--lx-text)" }}>{title}</h3>
          <p className="text-xs leading-relaxed" style={{ color: "var(--lx-text-2)", opacity: 0.85 }}>{subtitle}</p>
        </div>
        <div className="mt-auto">
          <Link
            href={href}
            className="block w-full rounded-xl px-3 py-2.5 text-center text-xs font-semibold transition"
            style={{ background: OLIVE_BG, color: OLIVE_FG }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = OLIVE_HOVER; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = OLIVE_BG; }}
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </article>
  );
}

function CategoryTabs({
  categories, active, lang, onSelect,
}: {
  categories: CatalogCategory[];
  active: CategoryId;
  lang: Lang;
  onSelect: (id: CategoryId) => void;
}) {
  return (
    <div
      className="flex gap-1 overflow-x-auto pb-1"
      style={{ scrollbarWidth: "none" }}
      role="tablist"
      aria-label={lang === "es" ? "Categorías de productos" : "Product categories"}
    >
      {categories.map((cat) => {
        const isActive = cat.id === active;
        return (
          <button
            key={cat.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(cat.id)}
            className="flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition"
            style={
              isActive
                ? { background: OLIVE_BG, color: OLIVE_FG, boxShadow: "0 2px 8px rgba(85,107,62,0.28)" }
                : { background: "var(--lx-section)", color: "var(--lx-text-2)", border: "1px solid var(--lx-border)" }
            }
          >
            <span aria-hidden="true">{CATEGORY_ICONS[cat.id]}</span>
            {cat[lang].label}
          </button>
        );
      })}
    </div>
  );
}

export function ProductCatalog({ lang }: { lang: Lang }) {
  const [activeId, setActiveId] = useState<CategoryId>("business-cards");

  const activeCategory = CATALOG_CATEGORIES.find((c) => c.id === activeId) ?? CATALOG_CATEGORIES[0];

  const heroPrimary = lang === "es" ? "Solicitar cotización" : "Request a Quote";
  const heroSecondary = lang === "es" ? "Hablar con Leonix" : "Talk to Leonix";
  const heroTitle = lang === "es" ? "Productos para Promoción" : "Promotional Products";
  const heroSubtitle =
    lang === "es"
      ? "Todo lo que necesitas para presentar, promocionar y hacer crecer tu negocio: tarjetas, volantes, letreros, banners, artículos promocionales y más."
      : "Everything you need to present, promote, and grow your business: cards, flyers, signs, banners, promotional items, and more.";
  const helperCopy =
    lang === "es"
      ? "Explora algunos de los productos que podemos ayudarte a conseguir. Si no lo ves aquí, también podemos cotizarlo."
      : "Explore some of the products we can help you source. If you do not see it here, we can still quote it.";
  const bottomCallout =
    lang === "es"
      ? "¿No ves lo que necesitas? Te ayudamos a cotizarlo."
      : "Don't see what you need? We can still quote it.";
  const bottomCTA = lang === "es" ? "Contactar a Leonix" : "Contact Leonix";

  return (
    <div style={{ background: "var(--lx-page)" }}>
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section
        className="px-4 py-10 sm:px-8 sm:py-14"
        style={{ background: "linear-gradient(160deg, var(--lx-section) 0%, var(--lx-page) 100%)", borderBottom: "1px solid var(--lx-border)" }}
      >
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--lx-lion)" }}>
            Leonix Media
          </p>
          <h1 className="mb-4 text-3xl font-bold leading-tight sm:text-4xl" style={{ color: "var(--lx-text)" }}>
            {heroTitle}
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-sm leading-relaxed sm:text-base" style={{ color: "var(--lx-text-2)", opacity: 0.9 }}>
            {heroSubtitle}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href={`/tienda/contacto?service=cotizacion-general&lang=${lang}`}
              className="rounded-xl px-6 py-3 text-sm font-semibold transition"
              style={{ background: OLIVE_BG, color: OLIVE_FG }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = OLIVE_HOVER; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = OLIVE_BG; }}
            >
              {heroPrimary}
            </Link>
            <Link
              href={`/tienda/contacto?lang=${lang}`}
              className="rounded-xl border px-6 py-3 text-sm font-semibold transition"
              style={{ background: "var(--lx-card)", color: "var(--lx-text)", borderColor: "var(--lx-border)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "var(--lx-section)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "var(--lx-card)"; }}
            >
              {heroSecondary}
            </Link>
          </div>
        </div>
      </section>

      {/* ── CATALOG BODY ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8">
          <CategoryTabs categories={CATALOG_CATEGORIES} active={activeId} lang={lang} onSelect={setActiveId} />
          <p className="mt-3 text-xs" style={{ color: "var(--lx-muted)" }}>
            {activeCategory[lang].description}
          </p>
          <p className="mt-1 text-xs italic" style={{ color: "var(--lx-muted)", opacity: 0.8 }}>
            {helperCopy}
          </p>
        </div>

        <div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          role="tabpanel"
          aria-label={activeCategory[lang].label}
        >
          {activeCategory.products.map((product) => (
            <ProductCard key={product.slug} product={product} lang={lang} />
          ))}
        </div>
      </section>

      {/* ── BOTTOM CTA ───────────────────────────────────────────────── */}
      <section
        className="px-4 py-10 sm:px-8 sm:py-14"
        style={{ background: "var(--lx-section)", borderTop: "1px solid var(--lx-border)" }}
      >
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-5 text-base font-semibold leading-relaxed sm:text-lg" style={{ color: "var(--lx-text)" }}>
            {bottomCallout}
          </p>
          <Link
            href={`/tienda/contacto?lang=${lang}`}
            className="inline-block rounded-xl px-8 py-3.5 text-sm font-semibold transition"
            style={{ background: OLIVE_BG, color: OLIVE_FG, boxShadow: "0 2px 12px rgba(85,107,62,0.22)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = OLIVE_HOVER; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = OLIVE_BG; }}
          >
            {bottomCTA}
          </Link>
        </div>
      </section>
    </div>
  );
}
