'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { classifieds } from '@/app/data/classifieds';

type Lang = 'es' | 'en';

type ClassifiedListing = {
  id: string;
  category: string;
  title: string;
  description: string;
  phone?: string;
  email?: string;
  image?: string;
  featured?: boolean;
  created?: string; // ISO date string
};

const CATEGORIES = [
  { key: 'Servicios', es: 'Servicios', en: 'Services', hrefEs: '/clasificados/servicios?lang=es', hrefEn: '/clasificados/services?lang=en' },
  { key: 'Empleos', es: 'Empleos', en: 'Jobs', hrefEs: '/clasificados/empleos?lang=es', hrefEn: '/clasificados/jobs?lang=en' },
  { key: 'Rentas', es: 'Rentas', en: 'Rentals', hrefEs: '/clasificados/rentas?lang=es', hrefEn: '/clasificados/rentals?lang=en' },
  { key: 'En Venta', es: 'En Venta', en: 'For Sale', hrefEs: '/clasificados/en-venta?lang=es', hrefEn: '/clasificados/for-sale?lang=en' },
  { key: 'Autos', es: 'Autos', en: 'Cars', hrefEs: '/clasificados/autos?lang=es', hrefEn: '/clasificados/cars?lang=en' },
  { key: 'Clases', es: 'Clases', en: 'Classes', hrefEs: '/clasificados/clases?lang=es', hrefEn: '/clasificados/classes?lang=en' },
  { key: 'Comunidad', es: 'Comunidad', en: 'Community', hrefEs: '/clasificados/comunidad?lang=es', hrefEn: '/clasificados/community?lang=en' },
] as const;

const COPY = {
  es: {
    title: 'Clasificados',
    subtitle:
      'Encuentra lo que necesitas y publica fácil — con un sistema justo: acceso libre para la comunidad y ventajas claras para quienes invierten.',
    searchPlaceholder: 'Buscar (ej: “renta”, “trabajo”, “plomero”, “Toyota”)',
    categoryLabel: 'Categoría',
    all: 'Todas',
    sortLabel: 'Ordenar',
    sortNewest: 'Más reciente',
    sortFeatured: 'Destacados primero',
    sortAZ: 'A–Z',
    featuredTitle: 'Destacados',
    featuredTag: 'Destacado',
    newTag: 'Nuevo',
    viewDetails: 'Ver',
    call: 'Llamar',
    email: 'Email',
    postListing: 'Publicar anuncio',
    boostListing: 'Impulsar anuncio',
    jumpToListings: 'Ver anuncios',
    destinationsTitle: 'Explora por categoría',
    destinationsHint:
      'Estamos construyendo el marketplace latino #1 en San José — cada categoría tendrá su propio formato estilo “top plataformas”.',
    listingsTitle: 'Anuncios',
    emptyTitle: 'No encontramos anuncios con esos filtros.',
    emptyHint: 'Prueba con otra categoría o una búsqueda más corta.',
    howTitle: 'Cómo funciona',
    howIntro:
      'Clasificados es servicio a la comunidad y motor de ingresos — sin esconder anuncios gratis. Lo premium aumenta visibilidad y confianza.',
    pricingTitle: 'Precios claros',
    pricingBullets: [
      'Impulso: $9.99 (1 vez) o $14.99/mes — sube tu visibilidad; nunca baja a otros.',
      'Membresías (à la carte): para quienes publican seguido y quieren ahorro + herramientas.',
      'Regla de conversión: si lo que pagas al mes por publicar supera una membresía, la membresía te conviene.',
    ],
    freeVsPaidTitle: '¿Qué es gratis y qué se cobra?',
    freeVsPaidNote:
      'Esto se afina en logística final, pero el principio es permanente: gratis nunca se bloquea; cobrar solo agrega ventajas.',
    examplesTitle: 'Ejemplos (para que tenga sentido)',
    examples: [
      {
        title: 'Rentas (usuario frecuente)',
        body:
          'Si publicas 3 rentas al mes que normalmente serían de pago, te conviene membresía porque te sale más barato y evitas pagos sueltos.',
      },
      {
        title: 'Negocio (inventario / repost)',
        body:
          'Si tienes inventario o repites anuncios como negocio, el sistema te sugiere un plan Business por orden, ahorro y credibilidad — nunca como castigo.',
      },
      {
        title: 'Urgencia',
        body:
          '¿Necesitas vender rápido o rentar ya? Impulso aumenta exposición (más arriba / más destacado) sin tapar a nadie.',
      },
    ],
    rulesTitle: 'Reglas justas (resumen)',
    rulesBullets: [
      'Anuncios gratis nunca se bloquean ni se esconden.',
      'Ventaja para miembros = mejor colocación y presentación, no castigo al gratuito.',
      'Si el comportamiento parece de negocio (inventario / repost constante), se sugiere cuenta Business por ahorro y limpieza.',
      'Contenido debe ser familiar, real, local y confiable (moderación activa).',
    ],
    footerHint:
      'Meta: ser el #1 marketplace latino — SEO fuerte, confianza, y experiencia móvil impecable.',
  },
  en: {
    title: 'Classifieds',
    subtitle:
      'Find what you need and post fast — with a fair system: free access for the community and clear advantages for those who invest.',
    searchPlaceholder: 'Search (ex: “rent”, “job”, “plumber”, “Toyota”)',
    categoryLabel: 'Category',
    all: 'All',
    sortLabel: 'Sort',
    sortNewest: 'Newest',
    sortFeatured: 'Featured first',
    sortAZ: 'A–Z',
    featuredTitle: 'Featured',
    featuredTag: 'Featured',
    newTag: 'New',
    viewDetails: 'View',
    call: 'Call',
    email: 'Email',
    postListing: 'Post a listing',
    boostListing: 'Boost a listing',
    jumpToListings: 'View listings',
    destinationsTitle: 'Browse by category',
    destinationsHint:
      'We’re building the #1 Latino marketplace in San José — each category will get its own “top-platform style” layout.',
    listingsTitle: 'Listings',
    emptyTitle: 'No listings match your filters.',
    emptyHint: 'Try a different category or a shorter search.',
    howTitle: 'How it works',
    howIntro:
      'Classifieds is community service + revenue engine — without hiding free listings. Premium only adds visibility and trust.',
    pricingTitle: 'Clear pricing',
    pricingBullets: [
      'Boost: $9.99 one-time or $14.99/month — raises visibility; never pushes others down unfairly.',
      'Memberships (à la carte): for frequent posters who want savings + tools.',
      'Conversion rule: if your monthly posting spend exceeds a membership, membership wins.',
    ],
    freeVsPaidTitle: 'What’s free vs paid?',
    freeVsPaidNote:
      'We’ll finalize logistics, but the permanent principle stands: free is never blocked; charging only adds advantages.',
    examplesTitle: 'Examples (so it makes sense)',
    examples: [
      {
        title: 'Rentals (frequent poster)',
        body:
          'If you post 3 paid rentals per month, membership becomes cheaper and removes fragmented payments.',
      },
      {
        title: 'Business (inventory / reposting)',
        body:
          'If behavior looks like a business, the system suggests a Business plan for order, savings, and credibility — never as a penalty.',
      },
      {
        title: 'Urgency',
        body:
          'Need it rented or sold fast? Boost increases exposure (higher / more highlighted) without hiding anyone.',
      },
    ],
    rulesTitle: 'Fair rules (summary)',
    rulesBullets: [
      'Free listings are never blocked or hidden.',
      'Member advantage = better placement + presentation, not penalizing free users.',
      'If behavior looks like a business (inventory / repeated reposting), we suggest a Business plan for savings and cleanliness.',
      'Content must be family-safe, real, local, and trustworthy (active moderation).',
    ],
    footerHint:
      'Goal: become the #1 Latino marketplace — strong SEO, trust, and a flawless mobile experience.',
  },
} satisfies Record<Lang, any>;

function safeParseDate(iso?: string): number {
  if (!iso) return 0;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : 0;
}

function isNew(iso?: string): boolean {
  const t = safeParseDate(iso);
  if (!t) return false;
  const now = Date.now();
  const days = (now - t) / (1000 * 60 * 60 * 24);
  return days <= 7;
}

export default function ClasificadosPage() {
  const params = useSearchParams();
  const lang = ((params.get('lang') as Lang) || 'es') === 'en' ? 'en' : 'es';
  const t = COPY[lang];

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('ALL');
  const [sort, setSort] = useState<'newest' | 'featured' | 'az'>('featured');

  const rawListings = (classifieds as unknown as ClassifiedListing[]) || [];

  const featured = useMemo(() => {
    const items = rawListings.filter((x) => !!x.featured);
    return items.slice(0, 3);
  }, [rawListings]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let items = rawListings.slice();

    if (category !== 'ALL') {
      items = items.filter((x) => (x.category || '').toLowerCase() === category.toLowerCase());
    }

    if (q) {
      items = items.filter((x) => {
        const hay = `${x.title ?? ''} ${x.description ?? ''} ${x.category ?? ''}`.toLowerCase();
        return hay.includes(q);
      });
    }

    if (sort === 'featured') {
      items.sort((a, b) => {
        const fa = a.featured ? 1 : 0;
        const fb = b.featured ? 1 : 0;
        if (fb !== fa) return fb - fa;
        return safeParseDate(b.created) - safeParseDate(a.created);
      });
    } else if (sort === 'newest') {
      items.sort((a, b) => safeParseDate(b.created) - safeParseDate(a.created));
    } else {
      items.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }

    return items;
  }, [rawListings, query, category, sort]);

  const langToggleHref = lang === 'es' ? '/clasificados?lang=en' : '/clasificados?lang=es';

  return (
    <div className="min-h-screen w-full bg-black text-white">
      {/* HERO — About-style rhythm */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-[#7a5a12]/35 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.55)_55%,rgba(0,0,0,0.9)_100%)]" />

        <div className="relative mx-auto max-w-6xl px-6 pt-16 pb-10 md:pt-20 md:pb-14">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-white/70">
              <span className="font-semibold text-white/80">El Águila</span>
              <span className="mx-2 text-white/40">•</span>
              <span>{lang === 'es' ? 'Orgullo Latino Sin Fronteras' : 'Latino Pride Without Borders'}</span>
            </div>

            <Link
              href={langToggleHref}
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/85 hover:bg-white/10"
            >
              {lang === 'es' ? 'EN' : 'ES'}
            </Link>
          </div>

          <div className="mt-10 flex flex-col items-center text-center">
            <div className="relative h-20 w-20 md:h-24 md:w-24">
              <Image src="/logo.png" alt="El Águila" fill className="object-contain drop-shadow-[0_10px_25px_rgba(0,0,0,0.65)]" />
            </div>

            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-[#FFD700] md:text-6xl">
              {t.title}
            </h1>

            <p className="mt-4 max-w-3xl text-base leading-relaxed text-white/80 md:text-lg">
              {t.subtitle}
            </p>

            {/* Hero CTAs (cleaner, less policy) */}
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
              <Link
                href={lang === 'es' ? '/clasificados/publicar?lang=es' : '/clasificados/post?lang=en'}
                className="rounded-full bg-gradient-to-r from-[#FFD700] via-[#FFC107] to-[#B8860B] px-6 py-3 text-sm font-semibold text-black shadow-[0_12px_30px_rgba(0,0,0,0.55)] hover:brightness-110"
              >
                {t.postListing}
              </Link>

              <a
                href="#listings"
                className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white/90 hover:bg-white/10"
              >
                {t.jumpToListings}
              </a>

              <Link
                href={lang === 'es' ? '/clasificados/impulsar?lang=es' : '/clasificados/boost?lang=en'}
                className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white/90 hover:bg-white/10"
              >
                {t.boostListing}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-10 md:pt-12">
        {/* Destination cards (future subpages) */}
        <div className="mb-10">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-2xl font-semibold text-white/95">{t.destinationsTitle}</h2>
            <p className="text-sm text-white/60">{t.destinationsHint}</p>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {CATEGORIES.slice(0, 4).map((c) => (
              <CategoryCard key={c.key} lang={lang} title={lang === 'es' ? c.es : c.en} href={lang === 'es' ? c.hrefEs : c.hrefEn} />
            ))}
            {CATEGORIES.slice(4).map((c) => (
              <CategoryCard key={c.key} lang={lang} title={lang === 'es' ? c.es : c.en} href={lang === 'es' ? c.hrefEs : c.hrefEn} />
            ))}
          </div>
        </div>

        {/* Featured (visual value first; no disclaimers here) */}
        <div className="mb-10">
          <h2 className="text-2xl font-semibold text-white/95">{t.featuredTitle}</h2>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {featured.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
                {lang === 'es'
                  ? 'Aún no hay destacados. Próximamente: anuncios verificados, aliados y “Alas de Oro”.'
                  : 'No featured listings yet. Coming soon: verified listings, supporters, and “Golden Wings”.'}
              </div>
            ) : (
              featured.map((x) => (
                <ListingCard
                  key={x.id}
                  x={x}
                  lang={lang}
                  featuredLabel={t.featuredTag}
                  newLabel={t.newTag}
                  viewLabel={t.viewDetails}
                  callLabel={t.call}
                  emailLabel={t.email}
                />
              ))
            )}
          </div>
        </div>

        {/* FILTER BOX (kept because you love it) */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="grid gap-4 md:grid-cols-12 md:items-end">
            <div className="md:col-span-6">
              <label className="mb-2 block text-sm text-white/70">{t.searchPlaceholder}</label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-white/20"
              />
            </div>

            <div className="md:col-span-3">
              <label className="mb-2 block text-sm text-white/70">{t.categoryLabel}</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-white/20"
              >
                <option value="ALL">{t.all}</option>
                {CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {lang === 'es' ? c.es : c.en}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="mb-2 block text-sm text-white/70">{t.sortLabel}</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as any)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-white/20"
              >
                <option value="featured">{t.sortFeatured}</option>
                <option value="newest">{t.sortNewest}</option>
                <option value="az">{t.sortAZ}</option>
              </select>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={() => setCategory('ALL')}
              className={`rounded-full px-4 py-2 text-sm transition ${
                category === 'ALL'
                  ? 'bg-gradient-to-r from-[#FFD700] via-[#FFC107] to-[#B8860B] text-black'
                  : 'border border-white/10 bg-black/30 text-white/80 hover:bg-black/40'
              }`}
            >
              {t.all}
            </button>

            {CATEGORIES.map((c) => {
              const active = category.toLowerCase() === c.key.toLowerCase();
              return (
                <button
                  key={c.key}
                  onClick={() => setCategory(c.key)}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    active
                      ? 'bg-gradient-to-r from-[#FFD700] via-[#FFC107] to-[#B8860B] text-black'
                      : 'border border-white/10 bg-black/30 text-white/80 hover:bg-black/40'
                  }`}
                >
                  {lang === 'es' ? c.es : c.en}
                </button>
              );
            })}
          </div>
        </div>

        {/* LISTINGS GRID */}
        <div id="listings" className="mt-10">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-2xl font-semibold text-white/95">{t.listingsTitle}</h2>
          </div>

          <div className="mt-4">
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
                <div className="text-xl font-semibold text-white/90">{t.emptyTitle}</div>
                <div className="mt-2 text-sm text-white/65">{t.emptyHint}</div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((x) => (
                  <ListingCard
                    key={x.id}
                    x={x}
                    lang={lang}
                    featuredLabel={t.featuredTag}
                    newLabel={t.newTag}
                    viewLabel={t.viewDetails}
                    callLabel={t.call}
                    emailLabel={t.email}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* HOW IT WORKS (moved to bottom — your request) */}
        <div className="mt-14 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-semibold text-white/95">{t.howTitle}</h2>
          <p className="mt-2 max-w-4xl text-sm text-white/70">{t.howIntro}</p>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <InfoCard title={t.pricingTitle}>
              <ul className="list-disc space-y-2 pl-5 text-sm text-white/75">
                {t.pricingBullets.map((b: string) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </InfoCard>

            <InfoCard title={t.freeVsPaidTitle}>
              <p className="text-sm text-white/75">{t.freeVsPaidNote}</p>
              <div className="mt-3 flex flex-col gap-2 text-sm text-white/70">
                <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                  <div className="font-semibold text-white/85">{lang === 'es' ? 'Gratis' : 'Free'}</div>
                  <div className="mt-1 text-white/70">
                    {lang === 'es'
                      ? 'Publicaciones comunitarias y vendedores privados (base) — siempre visibles y buscables.'
                      : 'Community posts and private-seller baseline — always visible and searchable.'}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                  <div className="font-semibold text-white/85">{lang === 'es' ? 'De pago (agrega ventajas)' : 'Paid (adds advantages)'}</div>
                  <div className="mt-1 text-white/70">
                    {lang === 'es'
                      ? 'Boost, membresías, verificación, mejor colocación, más fotos, perfil de negocio, y herramientas.'
                      : 'Boost, memberships, verification, better placement, more photos, business profile, and tools.'}
                  </div>
                </div>
              </div>
            </InfoCard>

            <InfoCard title={t.examplesTitle}>
              <div className="space-y-3">
                {t.examples.map((ex: any) => (
                  <div key={ex.title} className="rounded-xl border border-white/10 bg-black/30 p-3">
                    <div className="text-sm font-semibold text-white/90">{ex.title}</div>
                    <div className="mt-1 text-sm text-white/70">{ex.body}</div>
                  </div>
                ))}
              </div>
            </InfoCard>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-5">
            <div className="font-semibold text-white/90">{t.rulesTitle}</div>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-white/75">
              {t.rulesBullets.map((b: string) => (
                <li key={b}>{b}</li>
              ))}
            </ul>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link
                href={lang === 'es' ? '/clasificados/membresias?lang=es' : '/clasificados/memberships?lang=en'}
                className="rounded-full bg-gradient-to-r from-[#FFD700] via-[#FFC107] to-[#B8860B] px-6 py-3 text-sm font-semibold text-black hover:brightness-110"
              >
                {lang === 'es' ? 'Ver Membresías y Beneficios' : 'See Memberships & Benefits'}
              </Link>

              <Link
                href={lang === 'es' ? '/clasificados/impulsar?lang=es' : '/clasificados/boost?lang=en'}
                className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white/90 hover:bg-white/10"
              >
                {lang === 'es' ? 'Impulsar con Boost' : 'Boost a Listing'}
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 text-center text-sm text-white/55">{t.footerHint}</div>
      </section>
    </div>
  );
}

function CategoryCard({ title, href, lang }: { title: string; href: string; lang: Lang }) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-white/15 hover:bg-white/7"
    >
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-white/90">{title}</div>
        <div className="text-xs text-white/55 group-hover:text-white/75">
          {lang === 'es' ? 'Entrar' : 'Enter'}
        </div>
      </div>
      <div className="mt-2 text-sm text-white/65">
        {lang === 'es'
          ? 'Formato especializado + SEO fuerte.'
          : 'Specialized layout + strong SEO.'}
      </div>
    </Link>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="text-base font-semibold text-white/90">{title}</div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function ListingCard({
  x,
  lang,
  featuredLabel,
  newLabel,
  viewLabel,
  callLabel,
  emailLabel,
}: {
  x: ClassifiedListing;
  lang: Lang;
  featuredLabel: string;
  newLabel: string;
  viewLabel: string;
  callLabel: string;
  emailLabel: string;
}) {
  const hasImage = !!x.image;
  const href = `/clasificados/${encodeURIComponent(x.id)}?lang=${lang}`;

  return (
    <div className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:border-white/15">
      <div className="relative h-44 w-full bg-black/30">
        {hasImage ? (
          <Image src={x.image!} alt={x.title} fill className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/35">
            <span className="text-sm">{lang === 'es' ? 'Sin imagen' : 'No image'}</span>
          </div>
        )}

        <div className="absolute left-3 top-3 flex gap-2">
          {x.featured ? (
            <span className="rounded-full bg-gradient-to-r from-[#FFD700] via-[#FFC107] to-[#B8860B] px-3 py-1 text-xs font-semibold text-black">
              {featuredLabel}
            </span>
          ) : null}

          {isNew(x.created) ? (
            <span className="rounded-full border border-white/15 bg-black/40 px-3 py-1 text-xs font-semibold text-white/90">
              {newLabel}
            </span>
          ) : null}
        </div>
      </div>

      <div className="p-5">
        <div className="text-xs text-white/55">{x.category}</div>
        <div className="mt-1 line-clamp-2 text-lg font-semibold text-white/95">{x.title}</div>
        <p className="mt-2 line-clamp-3 text-sm text-white/70">{x.description}</p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link
            href={href}
            className="rounded-full bg-gradient-to-r from-[#FFD700] via-[#FFC107] to-[#B8860B] px-4 py-2 text-xs font-semibold text-black hover:brightness-110"
          >
            {viewLabel}
          </Link>

          {x.phone ? (
            <a
              href={`tel:${x.phone}`}
              className="rounded-full border border-white/12 bg-black/30 px-4 py-2 text-xs font-semibold text-white/90 hover:bg-black/40"
            >
              {callLabel}
            </a>
          ) : null}

          {x.email ? (
            <a
              href={`mailto:${x.email}`}
              className="rounded-full border border-white/12 bg-black/30 px-4 py-2 text-xs font-semibold text-white/90 hover:bg-black/40"
            >
              {emailLabel}
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
