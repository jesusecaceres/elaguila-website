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
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" aria-hidden />
          </div>
          <div className="border-t border-white/10 bg-gradient-to-b from-[#141210] to-[#0e0c0a] px-4 pb-6 pt-6 sm:px-6">
            <HeroIdentityBlock data={data} open={open} showHoursDetail={showHoursDetail} taxonomyMax={3} light />
            {showCtas ? (
              <div className="mt-8 border-t border-white/10 pt-6">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">Siguiente paso</p>
                <RestauranteShellInteractiveCtas listingId={data.id} ctas={data.primaryCtas} layout="scrollRail" />
              </div>
            ) : null}
          </div>
        </div>

        <div className="hidden lg:block">
          <div className="relative aspect-[2.4/1] min-h-[280px] w-full max-h-[min(52vh,520px)] bg-[#1a1814]">
            {hasHeroImg ? (
              <Image
                src={data.heroImageUrl!}
                alt={data.heroImageAlt ?? ""}
                fill
                priority
                unoptimized={data.heroImageUrl!.startsWith("data:")}
                className="object-cover"
                sizes="(max-width:1280px) 90vw, 1100px"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#1a1814] via-[#2d2820] to-[#4a4034]" aria-hidden />
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0b0a08] via-black/20 to-transparent" aria-hidden />
          </div>
          <div className="border-t border-white/10 bg-gradient-to-b from-[#151311] via-[#100f0c] to-[#0a0908] px-10 py-10 xl:px-14 xl:py-12">
            <div className="mx-auto max-w-[880px]">
              <HeroIdentityBlock data={data} open={open} showHoursDetail={showHoursDetail} taxonomyMax={3} light />
              {showCtas ? (
                <div className="mt-10 border-t border-white/10 pt-8">
                  <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">Acciones principales</p>
                  <RestauranteShellInteractiveCtas listingId={data.id} ctas={data.primaryCtas} layout="wrap" />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* Trust / quick proof — immediately after hero */}
      {showQuick ? (
        <section className={`${editorialClass} mt-10 sm:mt-12`} aria-labelledby="quick-info-heading">
          <h2 id="quick-info-heading" className="sr-only">
            Información rápida
          </h2>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--lx-muted)]">En contexto</p>
          <div className={`${CARD} flex flex-wrap gap-x-3 gap-y-2.5 px-5 py-5 sm:px-6`}>
            {data.quickInfo!.map((item) => (
              <div
                key={`${item.key}-${item.label}`}
                className="flex min-w-0 max-w-full items-baseline gap-2 rounded-2xl border border-[color:var(--lx-gold-border)]/70 bg-[color:var(--lx-section)] px-3.5 py-2 text-[13px]"
              >
                <span className="shrink-0 font-semibold text-[color:var(--lx-muted)]">{item.label}</span>
                <span className="min-w-0 break-words font-medium text-[color:var(--lx-text)]">{item.value}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Editorial story column */}
      <div className={`${editorialClass} ${SECTION_GAP} mt-12 sm:mt-14 lg:mt-16`}>
        {showAbout ? (
          <section aria-labelledby="about-heading" className="scroll-mt-24">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--lx-muted)]">Historia</p>
            <h2 id="about-heading" className="mt-1 text-2xl font-bold tracking-tight text-[color:var(--lx-text)]">
              {data.aboutTitle ?? "Sobre el negocio"}
            </h2>
            <p className="mt-5 text-[15px] leading-[1.8] text-[color:var(--lx-text-2)]">{data.aboutBody}</p>
          </section>
        ) : null}

        {showPlatillos ? (
          <RestauranteShellPlatillosBlock dishes={data.menuHighlights!} fullMenuCta={data.fullMenuCta} />
        ) : null}
        {showMenuOnly ? (
          <section className="scroll-mt-24" aria-label="Menú">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--lx-muted)]">Carta</p>
            <h2 className="mt-1 text-2xl font-bold text-[color:var(--lx-text)]">Explora el menú</h2>
            <RestauranteShellInlineDataAssetButton
              href={data.fullMenuCta!.href}
              label={`${data.fullMenuCta!.label} →`}
              className="mt-5 flex w-full min-h-[52px] items-center justify-center rounded-2xl border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-section)] px-4 py-3.5 text-sm font-semibold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)]"
            />
          </section>
        ) : null}

        {showContact ? <ContactSection data={data} /> : null}

        {showHoursDetail && data.hoursDetail ? (
          <section
            id="horarios-detalle"
            className={`${CARD} scroll-mt-24 px-5 py-6 sm:px-7 sm:py-7 lg:scroll-mt-28`}
            aria-labelledby="hours-detail-heading"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--lx-muted)]">Planifica</p>
            <h2 id="hours-detail-heading" className="mt-1 text-2xl font-bold tracking-tight text-[color:var(--lx-text)]">
              Horarios
            </h2>
            <dl className="mt-5 divide-y divide-[color:var(--lx-nav-border)]/70">
              {data.hoursDetail.rows.map((r) => (
                <div key={r.dayLabel} className="flex flex-wrap gap-x-4 gap-y-1 py-3.5 first:pt-0">
                  <dt className="w-36 shrink-0 font-semibold text-[color:var(--lx-muted)]">{r.dayLabel}</dt>
                  <dd className="min-w-0 text-[15px] text-[color:var(--lx-text-2)]">{r.line}</dd>
                </div>
              ))}
            </dl>
            {data.hoursDetail.specialNote ? (
              <p className="mt-5 text-sm leading-relaxed text-[color:var(--lx-text-2)]">
                <span className="font-semibold text-[color:var(--lx-text)]">Nota: </span>
                {data.hoursDetail.specialNote}
              </p>
            ) : null}
            {data.hoursDetail.temporaryNote ? (
              <p className="mt-4 rounded-xl border border-amber-200/90 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950">
                <span className="font-semibold">Horario temporal: </span>
                {data.hoursDetail.temporaryNote}
              </p>
            ) : null}
          </section>
        ) : null}
      </div>

      {/* Wider modules: traits, stacks, gallery */}
      <div className={`mx-auto mt-12 w-full max-w-[1080px] space-y-14 sm:mt-16 sm:space-y-16 lg:space-y-[4.5rem]`}>
        {showHighlights ? <RestauranteShellDestacadosSection tags={data.highlightTags!} /> : null}

        {showStacks
          ? data.stackSections!.map((stack) => (
              <section key={stack.id} className="scroll-mt-24" aria-labelledby={`stack-${stack.id}`}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--lx-muted)]">Detalle</p>
                <h2 id={`stack-${stack.id}`} className="mt-1 text-2xl font-bold tracking-tight text-[color:var(--lx-text)]">
                  {stack.title}
                </h2>
                <dl className={`${CARD} mt-5 space-y-4 px-5 py-5 text-sm sm:px-6`}>
                  {stack.rows.map((row) => (
                    <div key={`${row.label}-${row.value}`}>
                      <dt className="font-semibold text-[color:var(--lx-muted)]">{row.label}</dt>
                      <dd className="mt-1 text-[color:var(--lx-text-2)]">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))
          : null}

        {showVenueGallery ? (
          <RestauranteShellVenueGalleryBlock bundle={data.venueGallery!} galleryCta={data.galleryCta} />
        ) : legacyGallery ? (
          <RestauranteShellGalleryBlock gallery={data.gallery!} galleryCta={data.galleryCta} />
        ) : null}

        {data.trustLight ? (
          <section className={`${CARD} scroll-mt-24 border-dashed px-5 py-6 sm:px-7`} aria-label="Confianza">
            <p className="text-sm leading-relaxed text-[color:var(--lx-text-2)]">{data.trustLight.summaryLine}</p>
            {data.trustLight.externalTrustHref && data.trustLight.externalTrustLabel ? (
              <a
                href={data.trustLight.externalTrustHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[color:var(--lx-text)] underline decoration-[color:var(--lx-gold-border)] underline-offset-4 hover:text-[color:var(--lx-gold)]"
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
