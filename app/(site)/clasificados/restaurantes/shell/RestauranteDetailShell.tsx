"use client";

import Image from "next/image";
import { FiExternalLink, FiMail, FiMapPin, FiPhone, FiInstagram, FiFacebook, FiYoutube } from "react-icons/fi";
import { FaTiktok, FaWhatsapp } from "react-icons/fa";
import type { RestaurantDetailShellData } from "./restaurantDetailShellTypes";
import { RestauranteShellInlineDataAssetButton } from "./RestauranteShellInlineDataAssetButton";
import { RestauranteShellInteractiveCtas } from "./RestauranteShellInteractiveCtas";
import { RestauranteShellGalleryBlock } from "./RestauranteShellGalleryBlock";
import { RestauranteShellPlatillosBlock } from "./RestauranteShellPlatillosBlock";
import { RestauranteShellVenueGalleryBlock } from "./RestauranteShellVenueGalleryBlock";
import { RestauranteShellDestacadosSection } from "./RestauranteShellDestacadosSection";
import { RestauranteGroupedFeaturesSection } from "./RestauranteGroupedFeaturesSection";

const CARD =
  "rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] shadow-[0_8px_32px_-8px_rgba(42,36,22,0.1)]";

function StarRow({ rating }: { rating: number }) {
  return (
    <div
      className="flex items-center gap-0.5"
      role="img"
      aria-label={`${rating.toFixed(1)} de 5 estrellas`}
    >
      {Array.from({ length: 5 }, (_, i) => {
        const v = rating - i;
        const pct = Math.round(Math.min(1, Math.max(0, v)) * 100);
        return (
          <span key={i} className="relative h-4 w-[1.05em] text-[15px] leading-none">
            <span className="absolute text-white/35" aria-hidden>
              ★
            </span>
            <span className="absolute overflow-hidden text-[#f0d78c]" style={{ width: `${pct}%` }} aria-hidden>
              ★
            </span>
          </span>
        );
      })}
    </div>
  );
}

function HeroTaxonomyLine({
  chips,
  maxVisible,
  light,
}: {
  chips: NonNullable<RestaurantDetailShellData["taxonomyChips"]>;
  maxVisible: number;
  light: boolean;
}) {
  const rest = Math.max(0, chips.length - maxVisible);
  const visible = chips.slice(0, maxVisible);
  const textMuted = light ? "text-white/55" : "text-[color:var(--lx-muted)]";
  const chipClass = light
    ? "rounded-full border border-white/20 bg-white/[0.07] px-2.5 py-0.5 text-[11px] font-medium text-white/90 sm:text-xs"
    : "rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] px-2.5 py-0.5 text-[11px] font-medium text-[color:var(--lx-text-2)] sm:text-xs";

  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5" aria-label="Detalles de categoría">
      {visible.map((c) => (
        <span key={c.key} title={c.label} className={`max-w-full min-w-0 ${chipClass}`}>
          <span className="line-clamp-2 break-words">{c.label}</span>
        </span>
      ))}
      {rest > 0 ? (
        <span className={`text-[11px] font-medium ${textMuted}`}>+{rest} más</span>
      ) : null}
    </div>
  );
}

function mapsHref(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function hasContactContent(c: RestaurantDetailShellData["contact"]): boolean {
  if (!c) return false;
  return Boolean(
    c.addressLine1 ||
      c.mapsSearchQuery ||
      c.phoneDisplay ||
      c.email ||
      c.websiteHref ||
      c.instagramHref ||
      c.facebookHref ||
      c.tiktokHref ||
      c.youtubeHref ||
      c.whatsappHref ||
      c.menuFileHref ||
      c.brochureFileHref
  );
}

function ContactSection({ data }: { data: RestaurantDetailShellData }) {
  const c = data.contact!;
  return (
    <section aria-labelledby="contact-access-heading" className="scroll-mt-24">
      <div className="mb-4 max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--lx-muted)]">Acceso</p>
        <h2 id="contact-access-heading" className="mt-1 text-2xl font-bold tracking-tight text-[color:var(--lx-text)]">
          Contacto y ubicación
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[color:var(--lx-text-2)]">
          Reserva mesa, ruta y canales directos — en un solo lugar.
        </p>
      </div>
      <div className={`${CARD} space-y-5 p-5 sm:p-6`}>
        <div className="space-y-3 text-sm">
          {c.addressLine1 || c.mapsSearchQuery ? (
            <div className="flex gap-3 text-[color:var(--lx-text-2)]">
              <FiMapPin className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--lx-gold)]" aria-hidden />
              <div>
                {c.addressLine1 ? <p className="text-[color:var(--lx-text)]">{c.addressLine1}</p> : null}
                {c.addressLine2 ? <p>{c.addressLine2}</p> : null}
                {c.mapsSearchQuery ? (
                  <a
                    href={mapsHref(c.mapsSearchQuery)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 font-semibold text-[color:var(--lx-text)] underline decoration-[color:var(--lx-gold-border)] underline-offset-4 hover:text-[color:var(--lx-gold)]"
                  >
                    Cómo llegar
                    <FiExternalLink className="h-3.5 w-3.5 opacity-70" aria-hidden />
                  </a>
                ) : null}
              </div>
            </div>
          ) : null}
          {c.phoneDisplay && c.phoneTelHref ? (
            <a
              href={c.phoneTelHref}
              className="flex items-center gap-2 font-medium text-[color:var(--lx-text)] hover:text-[color:var(--lx-gold)]"
            >
              <FiPhone className="h-4 w-4 text-[color:var(--lx-gold)]" aria-hidden />
              {c.phoneDisplay}
            </a>
          ) : null}
          {c.email ? (
            <a
              href={`mailto:${c.email}`}
              className="flex items-center gap-2 font-medium text-[color:var(--lx-text)] hover:text-[color:var(--lx-gold)]"
            >
              <FiMail className="h-4 w-4 text-[color:var(--lx-gold)]" aria-hidden />
              {c.email}
            </a>
          ) : null}
          {c.websiteHref && c.websiteDisplay ? (
            <a
              href={c.websiteHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 break-all font-medium text-[color:var(--lx-text)] hover:text-[color:var(--lx-gold)]"
            >
              <span className="text-[color:var(--lx-gold)]" aria-hidden>
                ◆
              </span>
              {c.websiteDisplay}
            </a>
          ) : null}
        </div>

        {c.instagramHref || c.facebookHref || c.tiktokHref || c.youtubeHref || c.whatsappHref ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--lx-muted)]">Redes</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {c.instagramHref ? (
                <a
                  href={c.instagramHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)]"
                  aria-label="Instagram"
                >
                  <FiInstagram className="h-[1.15rem] w-[1.15rem]" />
                </a>
              ) : null}
              {c.facebookHref ? (
                <a
                  href={c.facebookHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)]"
                  aria-label="Facebook"
                >
                  <FiFacebook className="h-[1.15rem] w-[1.15rem]" />
                </a>
              ) : null}
              {c.tiktokHref ? (
                <a
                  href={c.tiktokHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)]"
                  aria-label="TikTok"
                >
                  <FaTiktok className="h-[1.05rem] w-[1.05rem]" />
                </a>
              ) : null}
              {c.youtubeHref ? (
                <a
                  href={c.youtubeHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)]"
                  aria-label="YouTube"
                >
                  <FiYoutube className="h-[1.15rem] w-[1.15rem]" />
                </a>
              ) : null}
              {c.whatsappHref ? (
                <a
                  href={c.whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 min-w-[2.5rem] items-center justify-center gap-1.5 rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] px-3 text-sm font-semibold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)]"
                >
                  <FaWhatsapp className="h-[1.15rem] w-[1.15rem] text-emerald-700" aria-hidden />
                  WA
                </a>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 border-t border-[color:var(--lx-nav-border)]/80 pt-4 sm:flex-row sm:items-stretch sm:gap-3">
          {c.menuFileHref && c.menuFileLabel ? (
            <RestauranteShellInlineDataAssetButton
              href={c.menuFileHref}
              label={c.menuFileLabel}
              className="flex flex-1 items-center justify-center rounded-xl border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-nav-hover)] px-4 py-3 text-sm font-semibold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-active)]"
            />
          ) : null}
          {c.brochureFileHref && c.brochureFileLabel ? (
            <RestauranteShellInlineDataAssetButton
              href={c.brochureFileHref}
              label={c.brochureFileLabel}
              className="flex flex-1 items-center justify-center rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] px-4 py-3 text-sm font-semibold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)]"
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function RestauranteDetailShell({ data }: { data: RestaurantDetailShellData }) {
  const open = data.hoursPreview.status === "open";
  const showQuick = (data.quickInfo?.length ?? 0) > 0;
  const showPlatillos = (data.menuHighlights?.length ?? 0) > 0;
  const showMenuOnly = Boolean(data.fullMenuCta) && !showPlatillos;
  const showHighlights = (data.highlightTags?.length ?? 0) > 0;
  const vg = data.venueGallery;
  const showVenueGallery = Boolean(
    vg && ((vg.categories?.length ?? 0) > 0 || (vg.supplemental?.length ?? 0) > 0)
  );
  const legacyGallery = (data.gallery?.length ?? 0) > 0;
  const showAbout = Boolean(data.aboutBody?.trim());
  const showContact = hasContactContent(data.contact);
  const showStacks = (data.stackSections?.length ?? 0) > 0;
  const showCtas = (data.primaryCtas?.length ?? 0) > 0;
  const hasHeroImg = Boolean(data.heroImageUrl?.trim());
  const showHoursDetail = Boolean(
    data.hoursDetail &&
      ((data.hoursDetail.rows?.length ?? 0) > 0 ||
        data.hoursDetail.specialNote?.trim() ||
        data.hoursDetail.temporaryNote?.trim())
  );

  return (
    <main className="min-h-screen bg-[color:var(--lx-bg)]">
      {/* PREMIUM HERO SECTION */}
      <section className="relative">
        <div className="relative h-[60vh] min-h-[400px] max-h-[600px] w-full overflow-hidden">
          {data.heroImageUrl ? (
            <Image
              src={data.heroImageUrl}
              alt={data.heroImageAlt ?? "Foto principal del restaurante"}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-amber-100 via-amber-50 to-orange-50" aria-hidden />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" aria-hidden />
        </div>
        
        {/* Hero Content Overlay */}
        <div className="absolute inset-0 flex items-end">
          <div className="w-full bg-gradient-to-t from-black/80 via-black/50 to-transparent px-6 py-12 sm:px-8 lg:px-12">
            <div className="mx-auto max-w-7xl">
              <div className="max-w-3xl">
                <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.2em] text-white/60">
                  Restaurante
                </p>
                <h1 className="mb-4 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
                  {data.businessName}
                </h1>
                
                {/* Trust Rating */}
                {data.trustRating ? (
                  <div className="mb-4 flex flex-wrap items-center gap-3 text-white">
                    <StarRow rating={Math.min(5, data.trustRating.average)} />
                    <span className="text-lg font-semibold">{data.trustRating.average.toFixed(1)}</span>
                    <span className="text-white/80">
                      ({data.trustRating.count.toLocaleString("es-US")} valoraciones)
                    </span>
                  </div>
                ) : null}
                
                {/* Cuisine Line */}
                {data.cuisineTypeLine ? (
                  <p className="mb-4 text-lg font-medium text-white/90 sm:text-xl">
                    {data.cuisineTypeLine}
                  </p>
                ) : null}
                
                {/* Short Summary */}
                {data.summaryShort ? (
                  <p className="mb-6 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">
                    {data.summaryShort}
                  </p>
                ) : null}
                
                {/* Taxonomy Chips */}
                {data.taxonomyChips?.length ? (
                  <HeroTaxonomyLine chips={data.taxonomyChips} maxVisible={4} light />
                ) : null}
                
                {/* Hours Status */}
                <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                  <p className="min-w-0 text-sm">
                    <span className={`font-semibold ${open ? "text-green-400" : "text-red-400"}`}>
                      {data.hoursPreview.statusLine}
                    </span>
                    <span className="text-white/60"> · </span>
                    <span className="text-white/85">{data.hoursPreview.scheduleSummary}</span>
                  </p>
                  {showHoursDetail ? (
                    <a
                      href={data.seeHoursHref}
                      className="w-fit shrink-0 text-sm font-semibold text-white/90 underline underline-offset-4 hover:text-white"
                    >
                      {data.seeHoursLabel}
                    </a>
                  ) : null}
                </div>
              </div>
              
              {/* Primary CTAs in Hero */}
              {showCtas ? (
                <div className="mt-8">
                  <RestauranteShellInteractiveCtas listingId={data.id} ctas={data.primaryCtas} layout="wrap" />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* TOP INFORMATION BAND - QUICK FACTS */}
      {showQuick ? (
        <section className="border-b border-[color:var(--lx-nav-border)] bg-white" aria-labelledby="quick-info-heading">
          <div className="mx-auto max-w-7xl px-6 py-6 sm:px-8 lg:px-12">
            <h2 id="quick-info-heading" className="sr-only">
              Información rápida
            </h2>
            <div className="flex flex-wrap gap-4 sm:gap-6">
              {data.quickInfo!.map((item) => (
                <div
                  key={`${item.key}-${item.label}`}
                  className="flex min-w-0 max-w-full items-center gap-2 rounded-xl bg-[color:var(--lx-section)] px-4 py-2 text-sm"
                >
                  <span className="shrink-0 font-semibold text-[color:var(--lx-muted)]">{item.label}</span>
                  <span className="min-w-0 break-words font-medium text-[color:var(--lx-text)]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* PREMIUM CONTENT LAYOUT - Featured dishes high on page */}
      <div className="mx-auto max-w-7xl px-6 py-8 sm:px-8 lg:px-12">
        {/* Featured Dishes Section - High Priority */}
        {showPlatillos ? (
          <section className="mb-16" aria-labelledby="featured-dishes-heading">
            <div className="mb-8">
              <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[color:var(--lx-muted)]">Destacados</p>
              <h2 id="featured-dishes-heading" className="mt-2 text-3xl font-bold tracking-tight text-[color:var(--lx-text)] sm:text-4xl">
                Platos populares
              </h2>
              <p className="mt-3 text-lg text-[color:var(--lx-text-2)]">
                Descubre nuestras especialidades más solicitadas
              </p>
            </div>
            <RestauranteShellPlatillosBlock dishes={data.menuHighlights!} fullMenuCta={data.fullMenuCta} />
          </section>
        ) : null}

        {/* Menu Only Section */}
        {showMenuOnly ? (
          <section className="mb-16" aria-label="Menú">
            <div className="mb-8">
              <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[color:var(--lx-muted)]">Carta</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-[color:var(--lx-text)] sm:text-4xl">Explora el menú</h2>
            </div>
            <RestauranteShellInlineDataAssetButton
              href={data.fullMenuCta!.href}
              label={`${data.fullMenuCta!.label} →`}
              className="flex w-full min-h-[64px] items-center justify-center rounded-2xl border-2 border-[color:var(--lx-gold-border)] bg-[color:var(--lx-section)] px-6 py-4 text-lg font-semibold text-[color:var(--lx-text)] transition-all hover:bg-[color:var(--lx-nav-hover)] hover:border-[color:var(--lx-gold)]"
            />
          </section>
        ) : null}
      </div>

      {/* Two-column layout for About and Contact */}
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-3 lg:gap-16">
          {/* About Section - 2 columns */}
          <div className="lg:col-span-2">
            {showAbout ? (
              <section aria-labelledby="about-heading" className="scroll-mt-24">
                <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[color:var(--lx-muted)]">Historia</p>
                <h2 id="about-heading" className="mt-2 text-2xl font-bold tracking-tight text-[color:var(--lx-text)] sm:text-3xl">
                  {data.aboutTitle ?? "Sobre el negocio"}
                </h2>
                <p className="mt-6 text-lg leading-[1.8] text-[color:var(--lx-text-2)]">{data.aboutBody}</p>
              </section>
            ) : null}
          </div>

          {/* Contact Section - 1 column */}
          <div className="lg:col-span-1">
            {showContact ? (
              <div className="sticky top-8">
                <ContactSection data={data} />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Hours Section */}
      <div className="mx-auto max-w-7xl px-6 py-8 sm:px-8 lg:px-12">
        {showHoursDetail && data.hoursDetail ? (
          <section
            id="horarios-detalle"
            className="mb-16 scroll-mt-24"
            aria-labelledby="hours-detail-heading"
          >
            <div className="mb-8">
              <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[color:var(--lx-muted)]">Planifica</p>
              <h2 id="hours-detail-heading" className="mt-2 text-2xl font-bold tracking-tight text-[color:var(--lx-text)] sm:text-3xl">
                Horarios
              </h2>
            </div>
            <div className={`${CARD} px-6 py-6 sm:px-8`}>
              <dl className="divide-y divide-[color:var(--lx-nav-border)]/70">
                {data.hoursDetail.rows.map((r) => (
                  <div key={r.dayLabel} className="flex flex-wrap gap-x-4 gap-y-1 py-4 first:pt-0">
                    <dt className="w-40 shrink-0 font-semibold text-[color:var(--lx-muted)]">{r.dayLabel}</dt>
                    <dd className="min-w-0 text-[15px] text-[color:var(--lx-text-2)]">{r.line}</dd>
                  </div>
                ))}
              </dl>
              {data.hoursDetail.specialNote ? (
                <p className="mt-6 text-sm leading-relaxed text-[color:var(--lx-text-2)]">
                  <span className="font-semibold text-[color:var(--lx-text)]">Nota: </span>
                  {data.hoursDetail.specialNote}
                </p>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>

      {/* Wide sections for gallery, highlights, and stacks */}
      <div className="mx-auto mt-16 w-full max-w-[1200px] space-y-20 sm:mt-20">
        {/* Grouped Features Section */}
        {data.groupedFeatures ? (
          <section className="px-6 sm:px-8 lg:px-12" aria-labelledby="features-heading">
            <RestauranteGroupedFeaturesSection features={data.groupedFeatures} />
          </section>
        ) : null}

        {/* Stack Sections */}
        {showStacks
          ? data.stackSections!.map((stack) => (
              <section key={stack.id} className="px-6 sm:px-8 lg:px-12 scroll-mt-24" aria-labelledby={`stack-${stack.id}`}>
                <div className="mb-8">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[color:var(--lx-muted)]">Servicios especiales</p>
                  <h2 id={`stack-${stack.id}`} className="mt-2 text-2xl font-bold tracking-tight text-[color:var(--lx-text)] sm:text-3xl">
                    {stack.title}
                  </h2>
                </div>
                <div className={`${CARD} px-6 py-6 sm:px-8`}>
                  <dl className="space-y-4 text-sm">
                    {stack.rows.map((row) => (
                      <div key={`${row.label}-${row.value}`} className="grid gap-1 sm:grid-cols-[200px_1fr]">
                        <dt className="font-semibold text-[color:var(--lx-muted)]">{row.label}</dt>
                        <dd className="text-[color:var(--lx-text-2)]">{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </section>
            ))
          : null}

        {/* Gallery Section */}
        {(showVenueGallery || legacyGallery) ? (
          <section className="px-6 sm:px-8 lg:px-12" aria-labelledby="gallery-heading">
            <div className="mb-8">
              <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[color:var(--lx-muted)]">Galería</p>
              <h2 id="gallery-heading" className="mt-2 text-2xl font-bold tracking-tight text-[color:var(--lx-text)] sm:text-3xl">
                Fotos y videos
              </h2>
            </div>
            {showVenueGallery ? (
              <RestauranteShellVenueGalleryBlock bundle={data.venueGallery!} galleryCta={data.galleryCta} />
            ) : (
              <RestauranteShellGalleryBlock gallery={data.gallery!} galleryCta={data.galleryCta} />
            )}
          </section>
        ) : null}

        {/* Trust Section */}
        {data.trustLight ? (
          <section className={`${CARD} mx-6 sm:mx-8 lg:mx-12 scroll-mt-24 border-dashed px-6 py-8 sm:px-8`} aria-label="Confianza">
            <p className="text-sm leading-relaxed text-[color:var(--lx-text-2)]">{data.trustLight.summaryLine}</p>
            {data.trustLight.externalTrustHref && data.trustLight.externalTrustLabel ? (
              <a
                href={data.trustLight.externalTrustHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--lx-text)] underline decoration-[color:var(--lx-gold-border)] underline-offset-4 hover:text-[color:var(--lx-gold)]"
              >
                {data.trustLight.externalTrustLabel}
                <FiExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            ) : null}
          </section>
        ) : null}
      </div>
    </main>
  );
}
