"use client";

import { useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { LeonixEmailContactBlock } from "@/app/components/contact/LeonixEmailContactBlock";
import {
  CATALOG_CATEGORIES,
  CUSTOM_QUOTE_SERVICE_SLUG,
  type CategoryId,
  type Product,
  type CatalogCategory,
} from "./catalogData";

type Lang = "es" | "en";

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

function promoMailtoHref(lang: Lang): string {
  const subject =
    lang === "en"
      ? "Quote request — Promotional Products"
      : "Solicitud de cotización — Productos para Promoción";
  return `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}`;
}

function generalQuoteHref(lang: Lang): string {
  const params = new URLSearchParams({
    lang,
    service: "cotizacion-general",
    sourceCta: "promo_quote",
    sourcePage: "productos-promocion",
  });
  return `/tienda/contacto?${params.toString()}`;
}

function outlineBtnProps(): CSSProperties {
  return { background: "var(--lx-card)", color: "var(--lx-text)", borderColor: "var(--lx-border)" };
}

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
  const href = quoteHref(lang, product.slug);

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

function quoteHref(lang: Lang, slug: string): string {
  return `/tienda/contacto?lang=${lang}&service=${encodeURIComponent(slug)}`;
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

function HeroContactActions({ lang }: { lang: Lang }) {
  const quoteLabel = lang === "es" ? "Solicitar cotización" : "Request quote";
  const callLabel = lang === "es" ? "Llamar" : "Call";
  const mapLabel = lang === "es" ? "Abrir mapa" : "Open map";

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href={generalQuoteHref(lang)}
          className="inline-flex min-h-[2.75rem] items-center justify-center rounded-full bg-[#7A1E2C] px-8 py-2.5 text-sm font-bold text-[#FFFDF7] shadow-[0_10px_28px_-10px_rgba(122,30,44,0.45)] transition hover:bg-[#5e1721]"
        >
          {quoteLabel}
        </Link>
        <a
          href={CONTACT.phoneTel}
          className="inline-flex min-h-[2.75rem] items-center justify-center rounded-full border-2 border-[#C9A84A]/70 bg-[#FFFDF7] px-6 py-2.5 text-sm font-bold text-[#2A4536] transition hover:border-[#C9A84A] hover:bg-[#FBF7EF]"
        >
          {callLabel}
        </a>
        <a
          href={CONTACT.mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[2.75rem] items-center justify-center rounded-full border-2 border-[#C9A84A]/70 bg-[#FFFDF7] px-6 py-2.5 text-sm font-bold text-[#2A4536] transition hover:border-[#C9A84A] hover:bg-[#FBF7EF]"
        >
          {mapLabel}
        </a>
      </div>
      <LeonixEmailContactBlock
        email={CONTACT.email}
        mailtoHref={promoMailtoHref(lang)}
        lang={lang}
        shareTitle={CONTACT.businessName}
        showEmail={false}
        className="flex justify-center"
      />
    </div>
  );
}

function BottomContactBlock({ lang }: { lang: Lang }) {
  const heading = lang === "es" ? "¿Prefieres hablarlo en persona?" : "Prefer to talk in person?";
  const body =
    lang === "es"
      ? "Visítanos, llámanos o envíanos un correo. Te ayudamos a elegir los productos correctos para tu negocio."
      : "Visit us, call us, or send us an email. We can help you choose the right products for your business.";
  const mapLabel = lang === "es" ? "Abrir mapa" : "Open map";
  const callLabel = lang === "es" ? "Llamar" : "Call";

  return (
    <section
      className="px-4 py-10 sm:px-8 sm:py-14"
      style={{ background: "var(--lx-section)", borderTop: "1px solid var(--lx-border)" }}
    >
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-lg font-bold sm:text-xl" style={{ color: "var(--lx-text)" }}>
          {heading}
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed" style={{ color: "var(--lx-text-2)", opacity: 0.9 }}>
          {body}
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
              mailtoHref={promoMailtoHref(lang)}
              lang={lang}
              shareTitle={CONTACT.businessName}
              className="text-left sm:text-center [&_p]:sm:justify-center [&>div:last-child]:sm:justify-center"
            />
          </div>
        </address>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href={generalQuoteHref(lang)}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold transition"
            style={{ background: OLIVE_BG, color: OLIVE_FG }}
          >
            {lang === "es" ? "Solicitar cotización" : "Request quote"}
          </Link>
          <ContactActionLink href={CONTACT.mapUrl} label={mapLabel} external />
          <ContactActionLink href={CONTACT.phoneTel} label={callLabel} />
        </div>
      </div>
    </section>
  );
}

function AdditionalProductsSection({ products, lang }: { products: Product[]; lang: Lang }) {
  if (products.length === 0) return null;

  const heading = lang === "es" ? "También podemos cotizar" : "We can also quote";
  const helper =
    lang === "es"
      ? "Si no ves exactamente lo que necesitas, también podemos ayudarte a conseguirlo."
      : "If you do not see exactly what you need, we can still help you quote it.";

  return (
    <div
      className="mt-10 rounded-2xl border p-5 sm:p-6"
      style={{ background: "var(--lx-section)", borderColor: "var(--lx-border)" }}
    >
      <h3 className="text-base font-bold sm:text-lg" style={{ color: "var(--lx-text)" }}>
        {heading}
      </h3>
      <p className="mt-1.5 text-xs leading-relaxed sm:text-sm" style={{ color: "var(--lx-text-2)", opacity: 0.9 }}>
        {helper}
      </p>
      <ul className="mt-4 flex flex-wrap gap-2" role="list">
        {products.map((product) => (
          <li key={product.slug}>
            <Link
              href={quoteHref(lang, product.slug)}
              className="inline-flex max-w-full items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition hover:brightness-[0.97]"
              style={{
                background: "var(--lx-card)",
                borderColor: "var(--lx-border)",
                color: "var(--lx-text)",
              }}
            >
              <span className="truncate">{product[lang].title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TabCustomQuoteCta({ lang }: { lang: Lang }) {
  const callout =
    lang === "es"
      ? "¿No ves lo que necesitas? Te ayudamos a cotizarlo."
      : "Do not see what you need? We can help quote it.";
  const btnLabel = lang === "es" ? "Solicitar cotización personalizada" : "Request custom quote";

  return (
    <div
      className="mt-8 rounded-2xl border px-5 py-6 text-center sm:px-8"
      style={{ background: "var(--lx-card)", borderColor: "var(--lx-border)" }}
    >
      <p className="text-sm font-semibold leading-relaxed sm:text-base" style={{ color: "var(--lx-text)" }}>
        {callout}
      </p>
      <Link
        href={quoteHref(lang, CUSTOM_QUOTE_SERVICE_SLUG)}
        className="mt-4 inline-block rounded-xl px-6 py-3 text-sm font-semibold transition"
        style={{ background: OLIVE_BG, color: OLIVE_FG, boxShadow: "0 2px 12px rgba(85,107,62,0.22)" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = OLIVE_HOVER; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = OLIVE_BG; }}
      >
        {btnLabel}
      </Link>
    </div>
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

  const heroTitle = lang === "es" ? "Productos para Promoción" : "Promotional Products";
  const heroSubtitle =
    lang === "es"
      ? "Todo lo que necesitas para presentar, promocionar y hacer crecer tu negocio: tarjetas, volantes, letreros, banners, artículos promocionales y más."
      : "Everything you need to present, promote, and grow your business: cards, flyers, signs, banners, promotional items, and more.";
  const helperCopy =
    lang === "es"
      ? "Explora algunos de los productos que podemos ayudarte a conseguir. Si no lo ves aquí, también podemos cotizarlo."
      : "Explore some of the products we can help you source. If you do not see it here, we can still quote it.";
  return (
    <div style={{ background: "var(--lx-page)" }}>
      {/* ── HERO (header only — catalog grid below is unchanged) ─────── */}
      <section className="border-b border-[#D6C7AD] bg-[#FAF6EE] px-4 py-8 sm:px-8 sm:py-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#556B3E]">
            {lang === "es" ? "PRODUCTOS PROMOCIONALES · LEONIX" : "PROMOTIONAL PRODUCTS · LEONIX"}
          </p>
          <h1 className="mt-3 font-serif text-3xl font-bold leading-tight tracking-tight text-[#2A4536] sm:text-4xl">
            {heroTitle}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">
            {heroSubtitle}
          </p>
          <div className="mt-8">
            <HeroContactActions lang={lang} />
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

        <div role="tabpanel" aria-label={activeCategory[lang].label}>
          {activeCategory.featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeCategory.featuredProducts.map((product) => (
                <ProductCard key={product.slug} product={product} lang={lang} />
              ))}
            </div>
          ) : null}

          <AdditionalProductsSection products={activeCategory.additionalProducts} lang={lang} />
          <TabCustomQuoteCta lang={lang} />
        </div>
      </section>

      <BottomContactBlock lang={lang} />
    </div>
  );
}
