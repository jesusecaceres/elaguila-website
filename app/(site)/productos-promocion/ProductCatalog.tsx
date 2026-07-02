"use client";

import { useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { LeonixEmailContactBlock } from "@/app/components/contact/LeonixEmailContactBlock";
import type { SupportedLang } from "@/app/lib/language";
import { getProductosPromocionPageCopy, type ProductosPromocionPageCopy } from "@/app/lib/leonix/productosPromocionPageCopy";
import {
  CATALOG_CATEGORIES,
  CUSTOM_QUOTE_SERVICE_SLUG,
  type CategoryId,
  type Product,
  type CatalogCategory,
} from "./catalogData";
import { resolvePromoProductFields } from "./promoProductCopy";

const CATEGORY_ICONS: Record<CategoryId, string> = {
  "business-cards": "🪪",
  marketing: "📄",
  signs: "📋",
  promo: "🎁",
  essentials: "📦",
};

const OLIVE_BG = "var(--lx-cta-secondary-bg)";
const OLIVE_FG = "var(--lx-cta-secondary-fg)";
const OLIVE_HOVER = "#4d5e30";

const CONTACT = {
  businessName: "Leonix Media",
  email: "info@leonixmedia.com",
  phoneDisplay: "(408) 360-6500",
  phoneTel: "tel:+14083606500",
  address: "871 Coleman Ave, Suite 201, San Jose, CA 95110",
  mapUrl:
    "https://www.google.com/maps/search/?api=1&query=871%20Coleman%20Ave%20Suite%20201%20San%20Jose%20CA%2095110",
} as const;

function promoMailtoHref(subject: string): string {
  return `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}`;
}

function generalQuoteHref(routeLang: SupportedLang): string {
  const params = new URLSearchParams({
    lang: routeLang,
    service: "cotizacion-general",
    sourceCta: "promo_quote",
    sourcePage: "productos-promocion",
  });
  return `/tienda/contacto?${params.toString()}`;
}

function outlineBtnProps(): CSSProperties {
  return { background: "var(--lx-card)", color: "var(--lx-text)", borderColor: "var(--lx-border)" };
}

function productImageAlt(product: Product, routeLang: SupportedLang, title: string): string {
  if (routeLang === "es") return product.imageAltEs ?? title;
  return product.imageAltEn ?? title;
}

function ProductCardImage({ product, routeLang }: { product: Product; routeLang: SupportedLang }) {
  const [loadFailed, setLoadFailed] = useState(false);
  const { title } = resolvePromoProductFields(product, routeLang);
  const alt = productImageAlt(product, routeLang, title);

  if (!product.imageSrc || loadFailed) {
    return <ProductImagePlaceholder product={product} routeLang={routeLang} />;
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

function ProductImagePlaceholder({ product, routeLang }: { product: Product; routeLang: SupportedLang }) {
  const { title } = resolvePromoProductFields(product, routeLang);
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

function ProductCard({
  product,
  pageCopy,
  routeLang,
}: {
  product: Product;
  pageCopy: ProductosPromocionPageCopy;
  routeLang: SupportedLang;
}) {
  const { title, subtitle } = resolvePromoProductFields(product, routeLang);
  const href = quoteHref(routeLang, product.slug);

  return (
    <article
      className="flex flex-col overflow-hidden rounded-2xl border"
      style={{ background: "var(--lx-card)", borderColor: "var(--lx-border)", boxShadow: "0 2px 8px rgba(42,36,22,0.07)" }}
    >
      <ProductCardImage product={product} routeLang={routeLang} />
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
            {pageCopy.requestQuote}
          </Link>
        </div>
      </div>
    </article>
  );
}

function quoteHref(routeLang: SupportedLang, slug: string): string {
  const params = new URLSearchParams({
    lang: routeLang,
    service: slug,
    sourcePage: "productos-promocion",
    sourceCta: slug === CUSTOM_QUOTE_SERVICE_SLUG ? "custom_quote" : "product_quote",
  });
  return `/tienda/contacto?${params.toString()}`;
}

function ContactActionLink({
  href,
  label,
  external,
  className = "",
}: {
  href: string;
  label: string;
  external?: boolean;
  className?: string;
}) {
  const base =
    "inline-flex min-h-[44px] items-center justify-center rounded-xl border px-5 py-3 text-sm font-semibold transition";
  const style = outlineBtnProps();

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        className={`${base} ${className}`}
        style={style}
        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--lx-section)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "var(--lx-card)"; }}
      >
        {label}
      </a>
    );
  }

  return (
    <a
      href={href}
      aria-label={label}
      className={`${base} ${className}`}
      style={style}
      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--lx-section)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "var(--lx-card)"; }}
    >
      {label}
    </a>
  );
}

function HeroContactActions({
  pageCopy,
  routeLang,
}: {
  pageCopy: ProductosPromocionPageCopy;
  routeLang: SupportedLang;
}) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href={generalQuoteHref(routeLang)}
          className="inline-flex min-h-[2.75rem] items-center justify-center rounded-full bg-[#7A1E2C] px-8 py-2.5 text-sm font-bold text-[#FFFDF7] shadow-[0_10px_28px_-10px_rgba(122,30,44,0.45)] transition hover:bg-[#5e1721]"
        >
          {pageCopy.requestQuote}
        </Link>
        <a
          href={CONTACT.phoneTel}
          className="inline-flex min-h-[2.75rem] items-center justify-center rounded-full border-2 border-[#C9A84A]/70 bg-[#FFFDF7] px-6 py-2.5 text-sm font-bold text-[#2A4536] transition hover:border-[#C9A84A] hover:bg-[#FBF7EF]"
        >
          {pageCopy.call}
        </a>
        <a
          href={CONTACT.mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[2.75rem] items-center justify-center rounded-full border-2 border-[#C9A84A]/70 bg-[#FFFDF7] px-6 py-2.5 text-sm font-bold text-[#2A4536] transition hover:border-[#C9A84A] hover:bg-[#FBF7EF]"
        >
          {pageCopy.openMap}
        </a>
      </div>
      <LeonixEmailContactBlock
        email={CONTACT.email}
        mailtoHref={promoMailtoHref(pageCopy.mailtoSubject)}
        lang={routeLang}
        shareTitle={CONTACT.businessName}
        showEmail={false}
        className="flex justify-center"
      />
    </div>
  );
}

function BottomContactBlock({
  pageCopy,
  routeLang,
}: {
  pageCopy: ProductosPromocionPageCopy;
  routeLang: SupportedLang;
}) {
  return (
    <section
      className="px-4 py-10 sm:px-8 sm:py-14"
      style={{ background: "var(--lx-section)", borderTop: "1px solid var(--lx-border)" }}
    >
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-lg font-bold sm:text-xl" style={{ color: "var(--lx-text)" }}>
          {pageCopy.bottomHeading}
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed" style={{ color: "var(--lx-text-2)", opacity: 0.9 }}>
          {pageCopy.bottomBody}
        </p>

        <address
          className="mx-auto mt-6 max-w-md not-italic text-sm leading-relaxed"
          style={{ color: "var(--lx-text)" }}
        >
          <p className="font-semibold">{CONTACT.businessName}</p>
          <p className="mt-2 break-words">{CONTACT.address}</p>
          <p className="mt-2">
            <a href={CONTACT.phoneTel} className="font-medium underline-offset-2 hover:underline">
              {CONTACT.phoneDisplay}
            </a>
          </p>
          <div className="mt-3">
            <LeonixEmailContactBlock
              email={CONTACT.email}
              mailtoHref={promoMailtoHref(pageCopy.mailtoSubject)}
              lang={routeLang}
              shareTitle={CONTACT.businessName}
              className="text-left sm:text-center [&_p]:sm:justify-center [&>div:last-child]:sm:justify-center"
            />
          </div>
        </address>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href={generalQuoteHref(routeLang)}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold transition"
            style={{ background: OLIVE_BG, color: OLIVE_FG }}
          >
            {pageCopy.requestQuote}
          </Link>
          <ContactActionLink href={CONTACT.mapUrl} label={pageCopy.openMap} external />
          <ContactActionLink href={CONTACT.phoneTel} label={pageCopy.call} />
        </div>
      </div>
    </section>
  );
}

function AdditionalProductsSection({
  products,
  pageCopy,
  routeLang,
}: {
  products: Product[];
  pageCopy: ProductosPromocionPageCopy;
  routeLang: SupportedLang;
}) {
  if (products.length === 0) return null;

  return (
    <div
      className="mt-10 rounded-2xl border p-5 sm:p-6"
      style={{ background: "var(--lx-section)", borderColor: "var(--lx-border)" }}
    >
      <h3 className="text-base font-bold sm:text-lg" style={{ color: "var(--lx-text)" }}>
        {pageCopy.additionalHeading}
      </h3>
      <p className="mt-1.5 text-xs leading-relaxed sm:text-sm" style={{ color: "var(--lx-text-2)", opacity: 0.9 }}>
        {pageCopy.additionalHelper}
      </p>
      <ul className="mt-4 flex flex-wrap gap-2" role="list">
        {products.map((product) => (
          <li key={product.slug}>
            <Link
              href={quoteHref(routeLang, product.slug)}
              className="inline-flex max-w-full items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition hover:brightness-[0.97]"
              style={{
                background: "var(--lx-card)",
                borderColor: "var(--lx-border)",
                color: "var(--lx-text)",
              }}
            >
              <span className="truncate">{resolvePromoProductFields(product, routeLang).title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TabCustomQuoteCta({
  pageCopy,
  routeLang,
}: {
  pageCopy: ProductosPromocionPageCopy;
  routeLang: SupportedLang;
}) {
  return (
    <div
      className="mt-8 rounded-2xl border px-5 py-6 text-center sm:px-8"
      style={{ background: "var(--lx-card)", borderColor: "var(--lx-border)" }}
    >
      <p className="text-sm font-semibold leading-relaxed sm:text-base" style={{ color: "var(--lx-text)" }}>
        {pageCopy.customQuoteCallout}
      </p>
      <Link
        href={quoteHref(routeLang, CUSTOM_QUOTE_SERVICE_SLUG)}
        className="mt-4 inline-block rounded-xl px-6 py-3 text-sm font-semibold transition"
        style={{ background: OLIVE_BG, color: OLIVE_FG, boxShadow: "0 2px 12px rgba(85,107,62,0.22)" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = OLIVE_HOVER; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = OLIVE_BG; }}
      >
        {pageCopy.customQuoteBtn}
      </Link>
    </div>
  );
}

function CategoryTabs({
  categories,
  active,
  pageCopy,
  onSelect,
}: {
  categories: CatalogCategory[];
  active: CategoryId;
  pageCopy: ProductosPromocionPageCopy;
  onSelect: (id: CategoryId) => void;
}) {
  return (
    <div
      className="flex gap-1 overflow-x-auto pb-1"
      style={{ scrollbarWidth: "none" }}
      role="tablist"
      aria-label={pageCopy.categoryTabsAria}
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
            {pageCopy.categories[cat.id].label}
          </button>
        );
      })}
    </div>
  );
}

export function ProductCatalog({ routeLang }: { routeLang: SupportedLang }) {
  const pageCopy = getProductosPromocionPageCopy(routeLang);
  const [activeId, setActiveId] = useState<CategoryId>("business-cards");

  const activeCategory = CATALOG_CATEGORIES.find((c) => c.id === activeId) ?? CATALOG_CATEGORIES[0];
  const activeCategoryCopy = pageCopy.categories[activeId];

  return (
    <div lang={routeLang} style={{ background: "var(--lx-page)" }}>
      <section className="border-b border-[#D6C7AD] bg-[#FAF6EE] px-4 py-8 sm:px-8 sm:py-10">
        <div className="relative mx-auto max-w-3xl text-center">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#556B3E]">
            {pageCopy.heroEyebrow}
          </p>
          <h1 className="mt-3 font-serif text-3xl font-bold leading-tight tracking-tight text-[#2A4536] sm:text-4xl">
            {pageCopy.heroTitle}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">
            {pageCopy.heroSubtitle}
          </p>
          <div className="mt-8">
            <HeroContactActions pageCopy={pageCopy} routeLang={routeLang} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8">
          <CategoryTabs
            categories={CATALOG_CATEGORIES}
            active={activeId}
            pageCopy={pageCopy}
            onSelect={setActiveId}
          />
          <p className="mt-3 text-xs" style={{ color: "var(--lx-muted)" }}>
            {activeCategoryCopy.description}
          </p>
          <p className="mt-1 text-xs italic" style={{ color: "var(--lx-muted)", opacity: 0.8 }}>
            {pageCopy.helperCopy}
          </p>
        </div>

        <div role="tabpanel" aria-label={activeCategoryCopy.label}>
          {activeCategory.featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeCategory.featuredProducts.map((product) => (
                <ProductCard key={product.slug} product={product} pageCopy={pageCopy} routeLang={routeLang} />
              ))}
            </div>
          ) : null}

          <AdditionalProductsSection
            products={activeCategory.additionalProducts}
            pageCopy={pageCopy}
            routeLang={routeLang}
          />
          <TabCustomQuoteCta pageCopy={pageCopy} routeLang={routeLang} />
        </div>
      </section>

      <BottomContactBlock pageCopy={pageCopy} routeLang={routeLang} />
    </div>
  );
}
