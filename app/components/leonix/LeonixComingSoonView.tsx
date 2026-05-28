"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useState, type FormEvent, type ReactNode } from "react";
import { submitLeadForm } from "@/app/(site)/lib/submitLeadForm";
import {
  LEONIX_COMING_SOON_COPY,
  LEONIX_COMING_SOON_NEWSLETTER_SOURCE,
  leonixAdvertiseHref,
  leonixLaunchHref,
  leonixMediaKitHref,
  type HeroAccent,
  type HeroLine,
  type LeonixComingSoonLang,
} from "@/app/lib/leonix/leonixComingSoonCopy";

export type LeonixComingSoonViewMode = "page" | "gate";

type LeonixComingSoonViewProps = {
  mode?: LeonixComingSoonViewMode;
};

const heroLineBase =
  "text-[1.05rem] font-semibold leading-snug tracking-tight text-[#3D3428] sm:text-xl sm:leading-snug";

const heroAccentClass: Record<HeroAccent, string> = {
  burgundy: "font-bold text-[#7A1E2C]",
  gold: "font-bold text-[#8A6B1F] underline decoration-[#C9A84A] decoration-2 underline-offset-[0.22em]",
};

const categoryIconTone: Record<
  "burgundy" | "green" | "gold",
  { ring: string; bg: string; text: string }
> = {
  burgundy: { ring: "border-[#7A1E2C]/35", bg: "bg-[#7A1E2C]/10", text: "text-[#7A1E2C]" },
  green: { ring: "border-[#556B3E]/35", bg: "bg-[#556B3E]/10", text: "text-[#556B3E]" },
  gold: { ring: "border-[#C9A84A]/45", bg: "bg-[#C9A84A]/12", text: "text-[#8A6B1F]" },
};

function HeroLineText({ line }: { line: HeroLine }) {
  return (
    <>
      {line.parts.map((part, index) =>
        part.accent ? (
          <span key={`${part.text}-${index}`} className={heroAccentClass[part.accent]}>
            {part.text}
          </span>
        ) : (
          <span key={`${part.text}-${index}`}>{part.text}</span>
        )
      )}
    </>
  );
}

function ArrowIcon({ className = "ml-2 h-4 w-4 shrink-0" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrustIcon() {
  return (
    <span
      className="mr-2.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#C9A84A]/55 bg-[#C9A84A]/12 text-[#8A6B1F]"
      aria-hidden
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 3l2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L4.8 8.2l5-.7L12 3z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function CategoryIcon({ tone }: { tone: "burgundy" | "green" | "gold" }) {
  const c = categoryIconTone[tone];
  return (
    <span
      className={`inline-flex h-[3.25rem] w-[3.25rem] shrink-0 items-center justify-center rounded-full border-2 ${c.ring} ${c.bg} ${c.text}`}
      aria-hidden
    >
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </span>
  );
}

function FeatureIcon({ variant }: { variant: "default" | "qr" }) {
  return (
    <span
      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[#C9A84A]/50 bg-[#FFFDF7] text-[#8A6B1F] shadow-[0_2px_8px_rgba(201,168,74,0.2)]"
      aria-hidden
    >
      {variant === "qr" ? (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 3h3v3h-3v-3z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 7v10M7 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}
    </span>
  );
}

function QrScanIcon() {
  return (
    <span
      className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[#C9A84A]/40 bg-[#FFFDF7] text-[#7A1E2C] shadow-sm sm:flex"
      aria-hidden
    >
      <svg className="h-9 w-9" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 3h3v3h-3v-3z"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function SocialPlaceholder({ label }: { label: string }) {
  return (
    <button
      type="button"
      disabled
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-[#4A4F47] bg-transparent text-[10px] font-bold uppercase tracking-wider text-[#C9A84A]/70"
    >
      ···
    </button>
  );
}

function CtaLink({
  href,
  variant,
  children,
}: {
  href: string;
  variant: "primary" | "secondary" | "tertiary";
  children: ReactNode;
}) {
  const base =
    "inline-flex min-h-[3rem] w-full items-center justify-center rounded-full px-6 py-3 text-center text-sm font-bold transition sm:min-h-[3.125rem] sm:text-[0.95rem]";
  const styles = {
    primary: `${base} bg-[#7A1E2C] text-white shadow-[0_8px_20px_-6px_rgba(122,30,44,0.55)] hover:bg-[#5e1721]`,
    secondary: `${base} border-2 border-[#C9A84A] bg-[#FFFDF7] text-[#1F241C] shadow-sm hover:border-[#b89742] hover:bg-[#FBF7EF]`,
    tertiary: `${base} border border-[#7A1E2C]/25 bg-[#FBF7EF] text-[#7A1E2C] shadow-sm hover:border-[#7A1E2C]/45 hover:bg-[#FFFDF7]`,
  };
  return (
    <Link href={href} className={styles[variant]}>
      <span>{children}</span>
      <ArrowIcon />
    </Link>
  );
}

function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mb-5 text-xs font-bold uppercase tracking-[0.16em] text-[#556B3E]">{children}</p>
  );
}

export function LeonixComingSoonView({ mode = "page" }: LeonixComingSoonViewProps) {
  const [lang, setLang] = useState<LeonixComingSoonLang>("es");
  const emailId = useId();
  const t = LEONIX_COMING_SOON_COPY[lang];
  const [email, setEmail] = useState("");
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterError, setNewsletterError] = useState<string | null>(null);
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);

  useEffect(() => {
    if (mode !== "gate") return;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, [mode]);

  async function onNewsletterSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (newsletterLoading || newsletterSuccess) return;
    setNewsletterError(null);
    setNewsletterLoading(true);

    const result = await submitLeadForm(
      "/api/newsletter/subscribe",
      {
        email,
        source: LEONIX_COMING_SOON_NEWSLETTER_SOURCE,
        lang,
        preferredLanguage: lang,
      },
      lang
    );

    setNewsletterLoading(false);
    if (result.ok) {
      setNewsletterSuccess(true);
      return;
    }
    setNewsletterError(result.message || t.notifyError);
  }

  const shellClass =
    mode === "gate"
      ? "fixed inset-0 z-[9999] overflow-x-hidden overflow-y-auto overscroll-none bg-[#F8F4EA] text-[#1F241C]"
      : "min-h-screen overflow-x-hidden bg-[#F8F4EA] text-[#1F241C]";

  return (
    <div
      lang={lang}
      className={shellClass}
      role={mode === "gate" ? "dialog" : undefined}
      aria-modal={mode === "gate" ? true : undefined}
      aria-label={t.pageAria}
    >
      <header className="sticky top-0 z-20 border-b border-[#D6C7AD]/70 bg-[#FBF7EF]/97 shadow-[0_1px_0_rgba(214,199,173,0.5)] backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <Link href="#inicio" className="shrink-0 py-0.5">
              <Image
                src="/logo-clean.png"
                alt="Leonix Media"
                width={168}
                height={58}
                className="h-10 w-auto object-contain sm:h-[2.85rem]"
                priority
              />
            </Link>

            <div className="flex items-center gap-3">
              <div
                className="flex shrink-0 rounded-full border border-[#D6C7AD] bg-[#FFFDF7] p-0.5 text-xs font-semibold shadow-sm sm:text-sm"
                role="group"
                aria-label={lang === "es" ? "Idioma" : "Language"}
              >
                {(["es", "en"] as const).map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setLang(code)}
                    aria-pressed={lang === code}
                    className={`min-w-[4.25rem] rounded-full px-3 py-2 transition-colors ${
                      lang === code
                        ? "bg-[#7A1E2C] text-white shadow-sm"
                        : "text-[#3D3428] hover:bg-[#E8DCC5]/55"
                    }`}
                  >
                    {LEONIX_COMING_SOON_COPY[code].langToggle[code]}
                  </button>
                ))}
              </div>

              <Link
                href={leonixLaunchHref(lang)}
                className="hidden shrink-0 rounded-full bg-[#7A1E2C] px-4 py-2 text-sm font-bold text-white shadow-[0_6px_16px_-6px_rgba(122,30,44,0.65)] transition hover:bg-[#5e1721] sm:inline-flex"
              >
                {t.navLaunch}
              </Link>
            </div>
          </div>

          <nav
            className="mt-3 hidden items-center justify-end gap-x-5 gap-y-1 text-[0.9rem] font-medium text-[#3D3428] lg:flex"
            aria-label={lang === "es" ? "Principal" : "Main"}
          >
            {t.nav.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={
                  item.active
                    ? "text-[#7A1E2C] underline decoration-[#7A1E2C] decoration-2 underline-offset-[0.35em]"
                    : "hover:text-[#7A1E2C]"
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <nav
            className="mt-3 flex items-center gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden"
            aria-label={t.mobileNavAria}
          >
            {t.nav.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${
                  item.active
                    ? "bg-[#7A1E2C]/12 text-[#7A1E2C] ring-1 ring-[#7A1E2C]/25"
                    : "bg-[#FFFDF7] text-[#3D3428] ring-1 ring-[#D6C7AD]/80"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={leonixLaunchHref(lang)}
              className="shrink-0 whitespace-nowrap rounded-full bg-[#7A1E2C] px-3 py-1.5 text-xs font-bold text-white"
            >
              {t.navLaunch}
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-12 pt-8 sm:px-6 sm:pt-10">
        <section id="inicio" className="scroll-mt-28">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(240px,0.88fr)] lg:items-start lg:gap-10 xl:gap-14">
            <div className="min-w-0">
              <p className="inline-flex rounded-full border border-[#C9A84A]/65 bg-[#FFFDF7] px-3.5 py-1 text-[0.68rem] font-bold tracking-[0.14em] text-[#7A1E2C] sm:text-xs">
                {t.badge}
              </p>
              <h1 className="mt-4 font-serif text-[2.35rem] font-bold leading-[1.05] tracking-tight text-[#2A4536] sm:text-5xl lg:text-[3.2rem]">
                {t.heroTitle}
              </h1>

              <div
                className="mt-6 max-w-xl rounded-2xl border border-[#D6C7AD]/85 bg-[#FFFDF7] p-4 shadow-[0_10px_30px_-18px_rgba(31,36,28,0.35)] sm:p-5"
                aria-label={t.heroValueAria}
              >
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#556B3E] sm:text-xs">
                  {t.heroValueLabel}
                </p>
                <ul className="mt-3 space-y-2.5 sm:space-y-3">
                  {t.heroLines.map((line, index) => (
                    <li
                      key={index}
                      className={
                        index === 2
                          ? `${heroLineBase} rounded-xl border border-[#C9A84A]/45 bg-[#FBF7EF] px-3 py-2.5`
                          : heroLineBase
                      }
                    >
                      <HeroLineText line={line} />
                    </li>
                  ))}
                </ul>
              </div>

              <p className="mt-6 max-w-[36rem] text-base leading-relaxed text-[#3D3428] sm:text-[1.05rem]">
                {t.heroParagraph}
              </p>

              <div
                id="anunciate"
                className="mt-8 grid scroll-mt-28 gap-3 sm:max-w-xl sm:grid-cols-1 lg:max-w-none lg:grid-cols-1 xl:grid-cols-1"
              >
                <CtaLink href={leonixAdvertiseHref(lang)} variant="primary">
                  {t.ctaAdvertise}
                </CtaLink>
                <div className="grid gap-3 sm:grid-cols-2">
                  <CtaLink href={leonixMediaKitHref(lang)} variant="secondary">
                    {t.ctaMediaKit}
                  </CtaLink>
                  <CtaLink href={leonixLaunchHref(lang)} variant="tertiary">
                    {t.ctaLaunch}
                  </CtaLink>
                </div>
              </div>

              <ul
                className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-3"
                aria-label={t.trustAria}
              >
                {t.trustChips.map((chip) => (
                  <li
                    key={chip}
                    className="flex items-center rounded-xl border border-[#D6C7AD]/70 bg-[#FFFDF7]/90 px-3 py-2.5 text-sm font-semibold text-[#3D3428]"
                  >
                    <TrustIcon />
                    <span className="leading-snug">{chip}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div
              id="ediciones"
              className="scroll-mt-28 mx-auto w-full max-w-[17.5rem] sm:max-w-xs lg:mx-0 lg:max-w-none lg:justify-self-end"
            >
              <div className="overflow-hidden rounded-2xl border border-[#C9A84A]/40 bg-[#FFFDF7] shadow-[0_20px_44px_-20px_rgba(31,36,28,0.38)]">
                <div className="border-b border-[#D6C7AD]/80 bg-[#7A1E2C] px-4 py-2.5 text-center text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#F8F4EA] sm:text-xs">
                  {t.magazineRibbon}
                </div>
                <div className="flex items-center justify-center bg-gradient-to-b from-[#EDE4D2]/55 via-[#F8F4EA] to-[#F8F4EA] px-4 py-5 sm:py-6">
                  <div className="relative aspect-[3/4] w-full max-w-[13.5rem] overflow-hidden rounded-lg border border-[#D6C7AD]/75 bg-[#FFFDF7] shadow-[0_12px_28px_-14px_rgba(31,36,28,0.45)] sm:max-w-[14.5rem]">
                    <Image
                      src="/magazine/leonix-media-launch-es.png"
                      alt={t.magazineAlt}
                      fill
                      className="object-contain object-center p-1.5"
                      sizes="(max-width: 640px) 216px, 232px"
                      priority
                    />
                  </div>
                </div>
                <p className="border-t border-[#D6C7AD]/60 px-4 py-3 text-center text-[0.7rem] leading-relaxed text-[#5F6258]">
                  {t.magazineCaption}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="beneficios" className="mt-20 scroll-mt-28">
          <SectionEyebrow>{t.categorySectionLabel}</SectionEyebrow>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {t.cards.map((card) => (
              <article
                key={card.title}
                className="flex h-full flex-col rounded-2xl border border-[#D6C7AD]/85 bg-[#FFFDF7] p-6 shadow-[0_10px_28px_-16px_rgba(31,36,28,0.22)]"
              >
                <CategoryIcon tone={card.iconTone} />
                <h2 className="mt-4 font-serif text-xl font-bold text-[#7A1E2C]">{card.title}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-[#3D3428]">{card.subtitle}</p>
                {card.tagline ? (
                  <p className="mt-4 text-sm font-bold text-[#9A7B28]">{card.tagline}</p>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <section className="mt-20">
          <SectionEyebrow>{t.featureSectionLabel}</SectionEyebrow>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {t.features.map((feature, index) => (
              <article
                key={feature.title}
                className="flex h-full flex-col rounded-2xl border border-[#D6C7AD]/75 bg-[#FBF7EF] p-5 shadow-[0_6px_20px_-12px_rgba(31,36,28,0.18)]"
              >
                <FeatureIcon variant={index === 2 ? "qr" : "default"} />
                <h3 className="mt-3 font-serif text-base font-bold leading-snug text-[#2A4536] sm:text-lg">
                  {feature.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-[#3D3428]">{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="multilingual"
          className="mt-20 scroll-mt-28 rounded-2xl border border-[#D6C7AD]/85 bg-gradient-to-br from-[#FBF7EF] to-[#FFFDF7] p-6 shadow-[0_12px_32px_-18px_rgba(31,36,28,0.2)] sm:p-8"
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#556B3E]">
                {t.multilingualLabel}
              </p>
              <h2 className="mt-2 font-serif text-2xl font-bold tracking-tight text-[#7A1E2C] sm:text-[1.75rem]">
                {t.multilingualTitle}
              </h2>
              <ul className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {t.multilingualSummary.map((item) => (
                  <li
                    key={item}
                    className="rounded-full border border-[#C9A84A]/45 bg-[#FFFDF7] px-3.5 py-1.5 text-xs font-semibold text-[#3D3428] sm:text-sm"
                  >
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-5 max-w-3xl text-sm leading-relaxed text-[#3D3428] sm:text-[0.95rem]">
                {t.multilingualBody}
              </p>
            </div>
            <QrScanIcon />
          </div>
        </section>
      </main>

      <section
        id="sobre"
        className="scroll-mt-28 bg-gradient-to-r from-[#7A1E2C] via-[#6b1925] to-[#5e1721] text-[#F8F4EA] shadow-[inset_0_1px_0_rgba(255,253,247,0.08)]"
        aria-labelledby="launch-strip-title"
      >
        <div className="mx-auto max-w-6xl px-4 py-9 sm:px-6 sm:py-11">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex max-w-lg gap-4">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#C9A84A]/45 bg-[#C9A84A]/18 text-[#F8F4EA]"
                aria-hidden
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 6h16v12H4V6zm0 0l8 6 8-6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <div>
                <h2 id="launch-strip-title" className="font-serif text-2xl font-bold sm:text-[1.65rem]">
                  {t.launchTitle}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[#F8F4EA]/92 sm:text-base">{t.launchBody}</p>
              </div>
            </div>

            {newsletterSuccess ? (
              <p
                className="w-full rounded-xl border border-[#C9A84A]/35 bg-[#FFFDF7]/10 px-4 py-3.5 text-sm font-semibold lg:max-w-md"
                role="status"
              >
                {t.notifySuccess}
              </p>
            ) : (
              <form
                className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-xl lg:shrink-0"
                onSubmit={onNewsletterSubmit}
                noValidate
              >
                <label htmlFor={emailId} className="sr-only">
                  {t.emailPlaceholder}
                </label>
                <input
                  id={emailId}
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={newsletterLoading}
                  placeholder={t.emailPlaceholder}
                  className="min-h-[3rem] min-w-0 flex-1 rounded-xl border border-[#D6C7AD] bg-[#FFFDF7] px-4 py-3 text-[#1F241C] shadow-inner placeholder:text-[#5F6258] focus:outline-none focus:ring-2 focus:ring-[#C9A84A]/50 disabled:opacity-70"
                />
                <button
                  type="submit"
                  disabled={newsletterLoading}
                  className="inline-flex min-h-[3rem] shrink-0 items-center justify-center rounded-xl bg-[#C9A84A] px-6 py-3 text-sm font-bold text-[#1F241C] shadow-[0_8px_18px_-8px_rgba(0,0,0,0.35)] transition hover:bg-[#d4bc6a] disabled:cursor-not-allowed disabled:opacity-70 sm:text-base"
                >
                  {newsletterLoading ? t.notifySubmitting : t.notifyButton}
                  {!newsletterLoading ? <ArrowIcon className="ml-2 h-4 w-4 shrink-0" /> : null}
                </button>
              </form>
            )}
          </div>
          {newsletterError ? (
            <p className="mt-4 text-sm font-medium text-[#FFE8E8]" role="alert">
              {newsletterError}
            </p>
          ) : null}
        </div>
      </section>

      <footer className="border-t border-[#2A2E28] bg-[#1F241C] text-[#E8DCC5]">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-4 py-8 text-center sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:text-left sm:px-6">
          <p className="text-sm font-medium tracking-wide text-[#E8DCC5]">{t.footerGeo}</p>
          <div className="flex gap-2.5" aria-label={t.socialAria}>
            <SocialPlaceholder label="Facebook" />
            <SocialPlaceholder label="Instagram" />
            <SocialPlaceholder label="WhatsApp" />
            <SocialPlaceholder label="YouTube" />
          </div>
          <p className="text-xs text-[#9CA39A] sm:max-w-[14rem] sm:text-right">{t.footerCopyright}</p>
        </div>
      </footer>
    </div>
  );
}
