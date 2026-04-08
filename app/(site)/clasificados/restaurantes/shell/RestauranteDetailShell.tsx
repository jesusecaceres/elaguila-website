import Image from "next/image";
import Link from "next/link";
import { FiMail, FiMapPin, FiPhone, FiInstagram, FiFacebook, FiYoutube } from "react-icons/fi";
import { FaTiktok, FaWhatsapp } from "react-icons/fa";
import type { RestaurantDetailShellData } from "./restaurantDetailShellTypes";
import { RestauranteShellInteractiveCtas } from "./RestauranteShellInteractiveCtas";
import { RestauranteShellGalleryBlock } from "./RestauranteShellGalleryBlock";
import { RestauranteShellPlatillosBlock } from "./RestauranteShellPlatillosBlock";
import { RestauranteShellVenueGalleryBlock } from "./RestauranteShellVenueGalleryBlock";

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
      c.menuFileHref
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

  return (
    <main className="mx-auto mt-6 max-w-[1280px] px-4 sm:mt-8 md:px-5 lg:px-6">
      {/* 1. HERO */}
      <section className="relative overflow-hidden rounded-[24px] border border-black/8 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.45)]">
        <div className="relative min-h-[min(72vh,640px)] w-full">
          {hasHeroImg ? (
            <Image
              src={data.heroImageUrl!}
              alt={data.heroImageAlt ?? ""}
              fill
              priority
              unoptimized={data.heroImageUrl!.startsWith("data:")}
              className="object-cover"
              sizes="(max-width:1280px) 100vw, 1280px"
            />
          ) : (
            <div
              className="absolute inset-0 bg-gradient-to-br from-[#1a1814] via-[#2d2820] to-[#4a4034]"
              aria-hidden
            />
          )}
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/35 to-black/10"
            aria-hidden
          />
          <div
            className={`absolute inset-x-0 bottom-0 flex flex-col gap-6 p-6 sm:p-8 md:p-10 ${showCtas ? "pb-36 sm:pb-40 md:pb-44" : "pb-10 sm:pb-12 md:pb-14"}`}
          >
            <div className="max-w-3xl">
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-[2.35rem] md:leading-[1.1]">
                {data.businessName}
              </h1>
              {data.trustRating ? (
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/95">
                  <StarRow rating={Math.min(5, data.trustRating.average)} />
                  <span className="font-semibold tabular-nums">
                    {data.trustRating.average.toFixed(1)}
                  </span>
                  <span className="text-white/75">
                    ({data.trustRating.count.toLocaleString("es-US")} valoraciones)
                  </span>
                </div>
              ) : null}
              {data.cuisineTypeLine ? (
                <p className="mt-2 text-[15px] font-medium text-white/88 sm:text-base">{data.cuisineTypeLine}</p>
              ) : null}
              {data.taxonomyChips?.length ? (
                <div className="mt-2 flex flex-wrap gap-2" aria-label="Detalles de categoría">
                  {data.taxonomyChips.map((c) => (
                    <span
                      key={c.key}
                      title={c.label}
                      className="max-w-full min-w-0 rounded-full border border-white/25 bg-white/10 px-2.5 py-0.5 text-left text-[11px] font-semibold leading-snug text-white/95 sm:text-xs"
                    >
                      <span className="line-clamp-2 break-words">{c.label}</span>
                    </span>
                  ))}
                </div>
              ) : null}
              {data.summaryShort ? (
                <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/92 sm:text-base">
                  {data.summaryShort}
                </p>
              ) : null}
              <div id="horarios" className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                <p className="text-sm">
                  <span className={open ? "font-semibold text-emerald-300" : "font-semibold text-amber-200"}>
                    {data.hoursPreview.statusLine}
                  </span>
                  <span className="text-white/55"> · </span>
                  <span className="text-white/85">{data.hoursPreview.scheduleSummary}</span>
                </p>
                <Link
                  href={data.seeHoursHref}
                  className="w-fit text-sm font-semibold text-[color:var(--lx-gold-soft)] underline decoration-white/35 underline-offset-4 hover:text-white"
                >
                  {data.seeHoursLabel}
                </Link>
              </div>
            </div>
          </div>
          {showCtas ? (
            <div className="absolute bottom-6 left-0 right-0 z-10 flex justify-center px-3">
              <RestauranteShellInteractiveCtas listingId={data.id} ctas={data.primaryCtas} />
            </div>
          ) : null}
        </div>
      </section>

      {/* 3. QUICK INFO STRIP */}
      {showQuick ? (
        <section className="mt-8" aria-label="Información rápida">
          <div className={`${CARD} flex flex-wrap gap-x-3 gap-y-2 px-4 py-4 sm:px-5`}>
            {data.quickInfo!.map((item) => (
              <div
                key={`${item.key}-${item.label}`}
                className="flex min-w-0 max-w-full items-baseline gap-2 rounded-full border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-section)] px-3 py-1.5 text-[13px]"
              >
                <span className="shrink-0 font-semibold text-[color:var(--lx-muted)]">{item.label}</span>
                <span className="min-w-0 font-medium text-[color:var(--lx-text)]">{item.value}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div
        className={`mt-10 grid grid-cols-1 gap-8 ${showContact ? "lg:grid-cols-12 lg:gap-10" : ""}`}
      >
        <div className={`min-w-0 space-y-10 ${showContact ? "lg:col-span-8" : "lg:col-span-12"}`}>
          {/* 4. PLATILLOS (featured dishes — not comida bucket) */}
          {showPlatillos ? (
            <RestauranteShellPlatillosBlock dishes={data.menuHighlights!} fullMenuCta={data.fullMenuCta} />
          ) : null}
          {showMenuOnly ? (
            <section className="mt-2" aria-label="Menú">
              <a
                href={data.fullMenuCta!.href}
                className="flex w-full min-h-[48px] items-center justify-center rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] px-4 py-3.5 text-sm font-semibold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)]"
              >
                {data.fullMenuCta!.label}
                <span className="ml-1 text-[color:var(--lx-gold)]" aria-hidden>
                  →
                </span>
              </a>
            </section>
          ) : null}

          {/* 5. HIGHLIGHTS */}
          {showHighlights ? (
            <section aria-labelledby="highlights-heading">
              <h2 id="highlights-heading" className="text-xl font-bold tracking-tight text-[color:var(--lx-text)]">
                Destacados
              </h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {data.highlightTags!.map((tag) => (
                  <li key={tag.key}>
                    <span className="inline-flex items-center rounded-full border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-card)] px-3 py-1.5 text-[13px] font-medium text-[color:var(--lx-text-2)]">
                      {tag.label}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* Optional stacks I–K */}
          {showStacks
            ? data.stackSections!.map((stack) => (
                <section key={stack.id} aria-labelledby={`stack-${stack.id}`}>
                  <h2 id={`stack-${stack.id}`} className="text-xl font-bold tracking-tight text-[color:var(--lx-text)]">
                    {stack.title}
                  </h2>
                  <dl className={`${CARD} mt-4 space-y-3 px-5 py-4 text-sm`}>
                    {stack.rows.map((row) => (
                      <div key={`${row.label}-${row.value}`}>
                        <dt className="font-semibold text-[color:var(--lx-muted)]">{row.label}</dt>
                        <dd className="mt-0.5 text-[color:var(--lx-text-2)]">{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))
            : null}

          {/* 6. VENUE GALLERY (grouped) or legacy flat gallery */}
          {showVenueGallery ? (
            <RestauranteShellVenueGalleryBlock bundle={data.venueGallery!} galleryCta={data.galleryCta} />
          ) : legacyGallery ? (
            <RestauranteShellGalleryBlock gallery={data.gallery!} galleryCta={data.galleryCta} />
          ) : null}

          {/* 8. ABOUT */}
          {showAbout ? (
            <section aria-labelledby="about-heading">
              <h2 id="about-heading" className="text-xl font-bold tracking-tight text-[color:var(--lx-text)]">
                {data.aboutTitle ?? "Sobre el negocio"}
              </h2>
              <p className="mt-4 text-[15px] leading-[1.75] text-[color:var(--lx-text-2)]">{data.aboutBody}</p>
            </section>
          ) : null}

          {/* 9. LIGHT TRUST */}
          {data.trustLight ? (
            <section
              className={`${CARD} border-dashed px-5 py-5 sm:px-6`}
              aria-label="Confianza"
            >
              <p className="text-sm leading-relaxed text-[color:var(--lx-text-2)]">{data.trustLight.summaryLine}</p>
              {data.trustLight.externalTrustHref && data.trustLight.externalTrustLabel ? (
                <a
                  href={data.trustLight.externalTrustHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex text-sm font-semibold text-[color:var(--lx-text)] underline decoration-[color:var(--lx-gold-border)] underline-offset-4 hover:text-[color:var(--lx-gold)]"
                >
                  {data.trustLight.externalTrustLabel}
                </a>
              ) : null}
            </section>
          ) : null}
        </div>

        {/* 7. CONTACT + ACCESS */}
        {showContact ? (
          <aside className="min-w-0 lg:col-span-4 lg:row-span-1">
            <div className={`${CARD} sticky top-24 space-y-5 p-5 sm:p-6`}>
              <h2 className="text-lg font-bold text-[color:var(--lx-text)]">Contacto y acceso</h2>
              <div className="space-y-3 text-sm">
                {data.contact!.addressLine1 || data.contact!.mapsSearchQuery ? (
                  <div className="flex gap-2 text-[color:var(--lx-text-2)]">
                    <FiMapPin className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--lx-gold)]" aria-hidden />
                    <div>
                      {data.contact!.addressLine1 ? <p>{data.contact!.addressLine1}</p> : null}
                      {data.contact!.addressLine2 ? <p>{data.contact!.addressLine2}</p> : null}
                      {data.contact!.mapsSearchQuery ? (
                        <a
                          href={mapsHref(data.contact!.mapsSearchQuery!)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1.5 font-semibold text-[color:var(--lx-text)] underline decoration-[color:var(--lx-gold-border)] underline-offset-4 hover:text-[color:var(--lx-gold)]"
                        >
                          Ver ubicación
                        </a>
                      ) : null}
                    </div>
                  </div>
                ) : null}
                {data.contact!.phoneDisplay && data.contact!.phoneTelHref ? (
                  <a
                    href={data.contact!.phoneTelHref}
                    className="flex items-center gap-2 font-medium text-[color:var(--lx-text)] hover:text-[color:var(--lx-gold)]"
                  >
                    <FiPhone className="h-4 w-4 text-[color:var(--lx-gold)]" aria-hidden />
                    {data.contact!.phoneDisplay}
                  </a>
                ) : null}
                {data.contact!.email ? (
                  <a
                    href={`mailto:${data.contact!.email}`}
                    className="flex items-center gap-2 font-medium text-[color:var(--lx-text)] hover:text-[color:var(--lx-gold)]"
                  >
                    <FiMail className="h-4 w-4 text-[color:var(--lx-gold)]" aria-hidden />
                    {data.contact!.email}
                  </a>
                ) : null}
                {data.contact!.websiteHref && data.contact!.websiteDisplay ? (
                  <a
                    href={data.contact!.websiteHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 break-all font-medium text-[color:var(--lx-text)] hover:text-[color:var(--lx-gold)]"
                  >
                    <span className="text-[color:var(--lx-gold)]" aria-hidden>
                      ◆
                    </span>
                    {data.contact!.websiteDisplay}
                  </a>
                ) : null}
              </div>

              {data.contact!.instagramHref ||
              data.contact!.facebookHref ||
              data.contact!.tiktokHref ||
              data.contact!.youtubeHref ||
              data.contact!.whatsappHref ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--lx-muted)]">
                    Redes y mensajería
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {data.contact!.instagramHref ? (
                      <a
                        href={data.contact!.instagramHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)]"
                        aria-label="Instagram"
                      >
                        <FiInstagram className="h-[1.15rem] w-[1.15rem]" />
                      </a>
                    ) : null}
                    {data.contact!.facebookHref ? (
                      <a
                        href={data.contact!.facebookHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)]"
                        aria-label="Facebook"
                      >
                        <FiFacebook className="h-[1.15rem] w-[1.15rem]" />
                      </a>
                    ) : null}
                    {data.contact!.tiktokHref ? (
                      <a
                        href={data.contact!.tiktokHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)]"
                        aria-label="TikTok"
                      >
                        <FaTiktok className="h-[1.05rem] w-[1.05rem]" />
                      </a>
                    ) : null}
                    {data.contact!.youtubeHref ? (
                      <a
                        href={data.contact!.youtubeHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)]"
                        aria-label="YouTube"
                      >
                        <FiYoutube className="h-[1.15rem] w-[1.15rem]" />
                      </a>
                    ) : null}
                    {data.contact!.whatsappHref ? (
                      <a
                        href={data.contact!.whatsappHref}
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

              {data.contact!.menuFileHref && data.contact!.menuFileLabel ? (
                <a
                  href={data.contact!.menuFileHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center rounded-xl border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-nav-hover)] px-4 py-3 text-sm font-semibold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-active)]"
                >
                  {data.contact!.menuFileLabel}
                </a>
              ) : null}
            </div>
          </aside>
        ) : null}
      </div>
    </main>
  );
}
