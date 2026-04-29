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

const CARD =
  "rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] shadow-[0_8px_32px_-8px_rgba(42,36,22,0.1)]";

const SECTION_GAP = "space-y-14 sm:space-y-16 lg:space-y-[4.5rem]";

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

/** Identity + trust lines — taxonomy capped to reduce chip walls. */
function HeroIdentityBlock({
  data,
  open,
  showHoursDetail,
  taxonomyMax,
  light,
}: {
  data: RestaurantDetailShellData;
  open: boolean;
  showHoursDetail: boolean;
  taxonomyMax: number;
  light: boolean;
}) {
  const titleClass = light
    ? "text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-[2.25rem] md:leading-[1.12]"
    : "text-3xl font-bold tracking-tight text-[color:var(--lx-text)] sm:text-4xl";

  return (
    <div className="max-w-3xl">
      <p
        className={
          light
            ? "mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45"
            : "mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--lx-muted)]"
        }
      >
        Restaurante
      </p>
      <h1 className={titleClass}>{data.businessName}</h1>
      {data.trustRating ? (
        <div
          className={`mt-3 flex flex-wrap items-center gap-3 text-sm ${light ? "text-white/95" : "text-[color:var(--lx-text)]"}`}
        >
          <StarRow rating={Math.min(5, data.trustRating.average)} />
          <span className="font-semibold tabular-nums">{data.trustRating.average.toFixed(1)}</span>
          <span className={light ? "text-white/70" : "text-[color:var(--lx-text-2)]"}>
            ({data.trustRating.count.toLocaleString("es-US")} valoraciones)
          </span>
        </div>
      ) : null}
      {data.cuisineTypeLine ? (
        <p
          className={`mt-3 text-[15px] font-medium leading-snug sm:text-base ${light ? "text-white/88" : "text-[color:var(--lx-text)]"}`}
        >
          {data.cuisineTypeLine}
        </p>
      ) : null}
      {data.taxonomyChips?.length ? (
        <HeroTaxonomyLine chips={data.taxonomyChips} maxVisible={taxonomyMax} light={light} />
      ) : null}
      {data.summaryShort ? (
        <p
          className={`mt-5 max-w-2xl text-[15px] leading-relaxed sm:text-base ${light ? "text-white/90" : "text-[color:var(--lx-text-2)]"}`}
        >
          {data.summaryShort}
        </p>
      ) : null}
      <div
        className={`mt-6 flex flex-col gap-2 border-t pt-5 sm:flex-row sm:items-center sm:gap-4 ${light ? "border-white/10" : "border-[color:var(--lx-nav-border)]"}`}
      >
        <p className="min-w-0 text-sm break-words">
          <span className={open ? "font-semibold text-emerald-400" : "font-semibold text-amber-300"}>
            {data.hoursPreview.statusLine}
          </span>
          <span className={light ? "text-white/50" : "text-[color:var(--lx-muted)]"}> · </span>
          <span className={light ? "text-white/82" : "text-[color:var(--lx-text-2)]"}>{data.hoursPreview.scheduleSummary}</span>
        </p>
        {showHoursDetail ? (
          <a
            href={data.seeHoursHref}
            className={`w-fit shrink-0 text-sm font-semibold underline underline-offset-4 ${light ? "text-[color:var(--lx-gold-soft)] decoration-white/35 hover:text-white" : "text-[color:var(--lx-text)] decoration-[color:var(--lx-gold-border)] hover:text-[color:var(--lx-gold)]"}`}
          >
            {data.seeHoursLabel}
          </a>
        ) : null}
      </div>
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

export function RestauranteDetailShell({ data, open }: { data: RestaurantDetailShellData; open?: boolean }) {
  const showQuick = (data.quickInfo?.length ?? 0) > 0;
  const showPlatillos = (data.menuHighlights?.length ?? 0) > 0;
  const showMenuOnly = Boolean(data.fullMenuCta) && !showPlatillos;
  const showHighlights = (data.highlightTags?.length ?? 0) > 0;
  const vg = data.venueGallery;
  const showVenueGallery = Boolean(
    vg && ((vg.categories?.length ?? 0) > 0 || (vg.supplemental?.length ?? 0) > 0)
  );
  const legacyGallery = (data.gallery?.length ?? 0) > 0;
  const showGallery = legacyGallery;
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

  const editorialClass = "mx-auto w-full max-w-[min(100%,760px)]";

  return (
    <main className="mx-auto mt-6 min-w-0 max-w-[1180px] px-4 sm:mt-8 md:px-6 lg:px-8">
      {/* HERO — mobile: image → band; desktop: image band + dedicated identity band (no floating overlay) */}
      <section
        className="overflow-hidden rounded-[24px] border border-black/8 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.45)]"
        aria-label="Cabecera del negocio"
      >
        <div className="lg:hidden">
          <div className="relative aspect-[4/3] w-full max-h-[min(44vh,440px)] min-h-[200px] bg-[#1a1814]">
            {hasHeroImg ? (
              <Image
                src={data.heroImageUrl!}
                alt={data.heroImageAlt ?? ""}
                fill
                priority
                unoptimized={data.heroImageUrl!.startsWith("data:")}
                className="object-cover"
                sizes="100vw"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#1a1814] via-[#2d2820] to-[#4a4034]" aria-hidden />
            )}
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" aria-hidden />
        <div className="relative px-6 py-12 sm:px-8 lg:px-12 lg:py-16">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
              {/* Hero content - 2 columns */}
              <div className="lg:col-span-2">
                <HeroIdentityBlock data={data} open={open ?? false} showHoursDetail={showHoursDetail} taxonomyMax={4} light />
                {showCtas ? (
                  <div className="mt-8">
                    <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">Acciones principales</p>
                    <RestauranteShellInteractiveCtas listingId={data.id} ctas={data.primaryCtas} layout="wrap" />
                  </div>
                ) : null}
              </div>

              {/* Trust indicators - 1 column */}
              <div className="lg:col-span-1">
                {data.trustRating ? (
                  <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm p-6">
                    <div className="flex items-center gap-3 text-white">
                      <StarRow rating={Math.min(5, data.trustRating.average)} />
                      <span className="text-2xl font-bold">{data.trustRating.average.toFixed(1)}</span>
                    </div>
                    <p className="mt-2 text-sm text-white/80">{data.trustRating.count.toLocaleString("es-US")} valoraciones</p>
                    {data.quickInfo && data.quickInfo.length > 0 ? (
                      <div className="mt-4 space-y-3">
                        {data.quickInfo.slice(0, 3).map((item) => (
                          <div key={item.key} className="flex items-center gap-3 text-white/90">
                            <span className="text-xs font-medium text-white/60">{item.label}</span>
                            <span className="text-sm">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TOP INFORMATION BAND / QUICK FACTS */}
      {showQuick ? (
        <section className="bg-[color:var(--lx-section)] border-y border-[color:var(--lx-nav-border)]" aria-labelledby="quick-info-heading">
          <div className="mx-auto max-w-7xl px-6 py-8 sm:px-8 lg:px-12">
            <h2 id="quick-info-heading" className="sr-only">Información rápida</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {data.quickInfo!.map((item) => (
                <div key={item.key} className="text-center">
                  <div className="rounded-xl border border-[color:var(--lx-gold-border)]/50 bg-[color:var(--lx-card)] p-4">
                    <div className="text-xs font-semibold text-[color:var(--lx-muted)] uppercase tracking-wide">{item.label}</div>
                    <div className="mt-1 text-sm font-medium text-[color:var(--lx-text)]">{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* 3. FEATURED DISHES / POPULAR DISHES */}
      {showPlatillos ? (
        <section className="scroll-mt-24" aria-labelledby="featured-dishes-heading">
          <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8 lg:px-12 lg:py-16">
            <div className="mb-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--lx-muted)]">Destacados</p>
              <h2 id="featured-dishes-heading" className="mt-2 text-3xl font-bold tracking-tight text-[color:var(--lx-text)] sm:text-4xl">
                Platos populares
              </h2>
            </div>
            <RestauranteShellPlatillosBlock dishes={data.menuHighlights!} fullMenuCta={data.fullMenuCta} />
          </div>
        </section>
      ) : null}

      {/* 4. MAP / CONTACT / ACCESS */}
      {showContact ? (
        <section className="scroll-mt-24 bg-[color:var(--lx-section)]" aria-labelledby="contact-access-heading">
          <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8 lg:px-12 lg:py-16">
            <div className="mb-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--lx-muted)]">Acceso</p>
              <h2 id="contact-access-heading" className="mt-2 text-3xl font-bold tracking-tight text-[color:var(--lx-text)] sm:text-4xl">
                Contacto y ubicación
              </h2>
              <p className="mt-4 text-lg text-[color:var(--lx-text-2)]">
                Reserva mesa, ruta y canales directos — en un solo lugar.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className={`${CARD} p-6`}>
                <ContactSection data={data} />
              </div>
              <div className={`${CARD} p-6`}>
                {data.contact?.mapsSearchQuery ? (
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <iframe
                      src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(data.contact.mapsSearchQuery)}`}
                      className="w-full h-full border-0"
                      allowFullScreen
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="aspect-video rounded-lg bg-gradient-to-br from-[#1a1814] via-[#2d2820] to-[#4a4034] flex items-center justify-center">
                    <FiMapPin className="h-12 w-12 text-white/40" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* 5. HOURS */}
      {showHoursDetail && data.hoursDetail ? (
        <section className="scroll-mt-24" aria-labelledby="hours-detail-heading">
          <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8 lg:px-12 lg:py-16">
            <div className="mb-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--lx-muted)]">Horarios</p>
              <h2 id="hours-detail-heading" className="mt-2 text-3xl font-bold tracking-tight text-[color:var(--lx-text)] sm:text-4xl">
                Horarios de atención
              </h2>
            </div>
            <div className={`${CARD} p-6 lg:p-8`}>
              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.hoursDetail.rows.map((r) => (
                  <div key={r.dayLabel} className="flex flex-col gap-2">
                    <dt className="font-semibold text-[color:var(--lx-muted)]">{r.dayLabel}</dt>
                    <dd className="text-[15px] text-[color:var(--lx-text-2)]">{r.line}</dd>
                  </div>
                ))}
              </dl>
              {data.hoursDetail.specialNote ? (
                <div className="mt-6 pt-6 border-t border-[color:var(--lx-nav-border)]">
                  <p className="text-sm leading-relaxed text-[color:var(--lx-text-2)]">
                    <span className="font-semibold text-[color:var(--lx-text)]">Nota: </span>
                    {data.hoursDetail.specialNote}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      <div className="wider-modules-wrapper">
      {/* 6. HIGHLIGHTS */}
      {showHighlights ? (
        <section className="scroll-mt-24 bg-[color:var(--lx-section)]" aria-labelledby="highlights-heading">
          <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8 lg:px-12 lg:py-16">
            <div className="mb-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--lx-muted)]">Características</p>
              <h2 id="highlights-heading" className="mt-2 text-3xl font-bold tracking-tight text-[color:var(--lx-text)] sm:text-4xl">
                Destacados del lugar
              </h2>
            </div>
            <RestauranteShellDestacadosSection tags={data.highlightTags!} />
          </div>
        </section>
      ) : null}

      {/* 7. GALLERY / MEDIA */}
      {legacyGallery || showVenueGallery ? (
        <section className="scroll-mt-24" aria-labelledby="gallery-heading">
          <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8 lg:px-12 lg:py-16">
            <div className="mb-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--lx-muted)]">Galería</p>
              <h2 id="gallery-heading" className="mt-2 text-3xl font-bold tracking-tight text-[color:var(--lx-text)] sm:text-4xl">
                Espacio y ambiente
              </h2>
            </div>
            {legacyGallery ? (
              <div className="mb-12">
                <h3 className="text-xl font-semibold text-[color:var(--lx-text)] mb-6">Galería principal</h3>
                <RestauranteShellGalleryBlock
                  gallery={data.gallery!}
                  galleryCta={data.fullMenuCta}
                />
              </div>
            ) : null}
            {showVenueGallery ? (
              <div>
                <h3 className="text-xl font-semibold text-[color:var(--lx-text)] mb-6">Interior y exterior</h3>
                <RestauranteShellVenueGalleryBlock bundle={data.venueGallery!} />
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* 8. ABOUT */}
      {showAbout ? (
        <section className="scroll-mt-24 bg-[color:var(--lx-section)]" aria-labelledby="about-heading">
          <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8 lg:px-12 lg:py-16">
            <div className="mb-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--lx-muted)]">Historia</p>
              <h2 id="about-heading" className="mt-2 text-3xl font-bold tracking-tight text-[color:var(--lx-text)] sm:text-4xl">
                {data.aboutTitle ?? "Sobre el negocio"}
              </h2>
            </div>
            <div className={`${CARD} p-6 lg:p-8`}>
              <p className="text-[15px] leading-[1.8] text-[color:var(--lx-text-2)] max-w-4xl">{data.aboutBody}</p>
            </div>
          </div>
        </section>
      ) : null}

      {/* 9. CONDITIONAL STACKS */}
      {showStacks ? (
        <section className="scroll-mt-24" aria-labelledby="stacks-heading">
          <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8 lg:px-12 lg:py-16">
            <div className="mb-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--lx-muted)]">Servicios adicionales</p>
              <h2 id="stacks-heading" className="mt-2 text-3xl font-bold tracking-tight text-[color:var(--lx-text)] sm:text-4xl">
                Más opciones
              </h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {data.stackSections!.map((stack) => (
                <div key={stack.id} className={`${CARD} p-6`}>
                  <h3 className="text-xl font-semibold text-[color:var(--lx-text)] mb-4">{stack.title}</h3>
                  <dl className="space-y-3">
                    {stack.rows.map((row, i) => (
                      <div key={i} className="flex flex-col gap-1">
                        <dt className="font-medium text-[color:var(--lx-muted)]">{row.label}</dt>
                        <dd className="text-[15px] text-[color:var(--lx-text-2)]">{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Menu only fallback */}
      {showMenuOnly ? (
        <section className="scroll-mt-24" aria-label="Menú">
          <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8 lg:px-12 lg:py-16">
            <div className="mb-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--lx-muted)]">Carta</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-[color:var(--lx-text)] sm:text-4xl">Explora el menú</h2>
            </div>
            <div className={`${CARD} p-6 lg:p-8 text-center`}>
              <RestauranteShellInlineDataAssetButton
                href={data.fullMenuCta!.href}
                label={`${data.fullMenuCta!.label} →`}
                className="inline-flex min-h-[52px] items-center justify-center rounded-2xl border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-section)] px-8 py-3.5 text-sm font-semibold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)]"
              />
            </div>
          </div>
        </section>
      ) : null}
      </div>
    </main>
  );
}
