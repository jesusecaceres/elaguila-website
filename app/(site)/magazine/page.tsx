"use client";

import Image from "next/image";
import Link from "next/link";
import { AdvertiseDropdown } from "@/app/components/AdvertiseDropdown";
import type { AdvertiseLang } from "@/app/lib/advertiseDropdownConfig";
import type { PublicMagazineManifest } from "@/app/lib/magazine/magazineManifestTypes";
import {
  JUNE_2026,
  MAGAZINE_UI,
  resolveMagazineLang,
  type MagazineLang,
} from "@/app/(site)/magazine/2026/june/issueContent";
import { MagazineLanguageSelector } from "@/app/(site)/magazine/components/MagazineLanguageSelector";
import { MagazineTranslatedReader } from "@/app/(site)/magazine/components/MagazineTranslatedReader";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type MagazineEdition = {
  titleEs: string;
  titleEn: string;
  monthEs: string;
  monthEn: string;
  year: string;
  monthKey: string;
  coverImage: string;
  pdfUrl: string;
  flipbookUrl: string | null;
};

const DEFAULT_FLIPBOOK = "https://flip.leonixmedia.com/books/leonix-media-june-2026/";

const CURRENT_EDITION: MagazineEdition = {
  titleEs: "Leonix Media — Junio 2026",
  titleEn: "Leonix Media — June 2026",
  monthEs: "Junio",
  monthEn: "June",
  year: "2026",
  monthKey: "june",
  coverImage: "/magazine/2026/june/cover.png",
  pdfUrl: "/magazine/2026/june/leonix-media-june-2026.pdf",
  flipbookUrl: "https://flip.leonixmedia.com/books/leonix-media-june-2026/",
};

const PAST_EDITIONS: MagazineEdition[] = [];

const COPY = {
  es: {
    heroEyebrow: "LEONIX MEDIA",
    heroTitle: "La Revista",
    heroSubtitle: "Comunidad, cultura y negocios en una edición digital e impresa.",
    heroDescription:
      "Explora la edición actual, consulta publicaciones anteriores y mantente conectado con historias, negocios y oportunidades de nuestra comunidad.",
    currentEyebrow: "EDICIÓN ACTUAL",
    currentTitle: "Leonix Media — Junio 2026",
    currentBody:
      "La nueva edición de Leonix Media conecta negocios locales, comunidad, cultura, deportes, recetas, inspiración y oportunidades para crecer con nuestra comunidad.",
    readMagazine: "Leer la revista",
    downloadPdf: "Descargar PDF",
    archiveEyebrow: "ARCHIVO",
    archiveTitle: "Ediciones anteriores",
    archiveIntro: "Consulta publicaciones pasadas de Leonix Media en un solo lugar.",
    newsletterTitle: "Recibe la revista y noticias de Leonix",
    newsletterBody:
      "Sé de los primeros en recibir nuevas ediciones, anuncios importantes, oportunidades locales y actualizaciones de nuestra comunidad.",
    newsletterPlaceholder: "Tu correo electrónico",
    newsletterButton: "Suscribirme",
    newsletterMicro: "Recibe actualizaciones de Leonix Media. Sin spam.",
    newsletterAria: "Suscripción al boletín de la revista",
    emailLabel: "Correo electrónico",
    advertiseTitle: "¿Quieres aparecer en una próxima edición?",
    advertiseBody:
      "Conecta tu negocio con lectores locales a través de la revista impresa, edición digital y presencia bilingüe.",
    advertiseCta: "Anúnciate con nosotros",
    flipModalTitle: "Leonix Media — Revista digital",
    loading: "Cargando ediciones…",
  },
  en: {
    heroEyebrow: "LEONIX MEDIA",
    heroTitle: "The Magazine",
    heroSubtitle: "Community, culture, and business in a digital and print edition.",
    heroDescription:
      "Explore the current edition, browse past publications, and stay connected with stories, businesses, and opportunities from our community.",
    currentEyebrow: "CURRENT EDITION",
    currentTitle: "Leonix Media — June 2026",
    currentBody:
      "The new Leonix Media edition connects local businesses, community, culture, sports, recipes, inspiration, and opportunities to grow with our community.",
    readMagazine: "Read the magazine",
    downloadPdf: "Download PDF",
    archiveEyebrow: "ARCHIVE",
    archiveTitle: "Past editions",
    archiveIntro: "Browse previous Leonix Media publications in one place.",
    newsletterTitle: "Get the magazine and Leonix updates",
    newsletterBody:
      "Be among the first to receive new editions, important announcements, local opportunities, and community updates.",
    newsletterPlaceholder: "Your email address",
    newsletterButton: "Subscribe",
    newsletterMicro: "Receive Leonix Media updates. No spam.",
    newsletterAria: "Magazine newsletter signup",
    emailLabel: "Email address",
    advertiseTitle: "Want to appear in a future edition?",
    advertiseBody:
      "Connect your business with local readers through print magazine placement, digital edition visibility, and bilingual presence.",
    advertiseCta: "Advertise with us",
    flipModalTitle: "Leonix Media — Digital magazine",
    loading: "Loading editions…",
  },
  vi: {
    heroEyebrow: "LEONIX MEDIA",
    heroTitle: "Tạp chí",
    heroSubtitle: "Cộng đồng, văn hóa và kinh doanh trong phiên bản kỹ thuật số và in.",
    heroDescription:
      "Khám phá số hiện tại, xem các ấn phẩm trước và giữ kết nối với câu chuyện, doanh nghiệp và cơ hội từ cộng đồng của chúng ta.",
    currentEyebrow: "SỐ HIỆN TẠI",
    currentTitle: "Leonix Media — Tháng 6 năm 2026",
    currentBody:
      "Số Leonix Media mới kết nối doanh nghiệp địa phương, cộng đồng, văn hóa, thể thao, công thức, cảm hứng và cơ hội phát triển cùng cộng đồng.",
    readMagazine: "Đọc tạp chí (flipbook tiếng Tây Ban Nha)",
    downloadPdf: "Tải PDF",
    archiveEyebrow: "LƯU TRỮ",
    archiveTitle: "Các số trước",
    archiveIntro: "Xem các ấn phẩm Leonix Media trước đây ở một nơi.",
    newsletterTitle: "Nhận tạp chí và tin từ Leonix",
    newsletterBody:
      "Hãy là người đầu tiên nhận số mới, thông báo quan trọng, cơ hội địa phương và cập nhật cộng đồng.",
    newsletterPlaceholder: "Email của bạn",
    newsletterButton: "Đăng ký",
    newsletterMicro: "Nhận cập nhật Leonix Media. Không spam.",
    newsletterAria: "Đăng ký bản tin tạp chí",
    emailLabel: "Email",
    advertiseTitle: "Bạn muốn xuất hiện trong số tới?",
    advertiseBody:
      "Kết nối doanh nghiệp với độc giả địa phương qua tạp chí in, phiên bản kỹ thuật số và hiện diện song ngữ.",
    advertiseCta: "Quảng cáo cùng chúng tôi",
    flipModalTitle: "Leonix Media — Tạp chí kỹ thuật số",
    loading: "Đang tải các số…",
  },
} as const;

function mergeEditionFromManifest(
  base: MagazineEdition,
  manifest: PublicMagazineManifest | null,
  role: "featured" | { year: string; month: string }
): MagazineEdition {
  if (!manifest) return base;
  if (role === "featured") {
    const f = manifest.featured;
    if (f.year !== base.year || f.month !== base.monthKey) return base;
    return {
      ...base,
      titleEs: f.title?.es?.trim() || base.titleEs,
      titleEn: f.title?.en?.trim() || base.titleEn,
      coverImage: (f.coverUrl && f.coverUrl.trim()) || base.coverImage,
      pdfUrl: (f.pdfUrl && f.pdfUrl.trim()) || base.pdfUrl,
      flipbookUrl: (f.flipbookUrl && f.flipbookUrl.trim()) || base.flipbookUrl,
    };
  }
  const months = manifest.years?.[role.year]?.months ?? [];
  const m = months.find((x) => x.month === role.month);
  if (!m) return base;
  return {
    ...base,
    titleEs: m.title?.es?.trim() || base.titleEs,
    titleEn: m.title?.en?.trim() || base.titleEn,
    coverImage: (m.coverUrl && m.coverUrl.trim()) || base.coverImage,
    pdfUrl: (m.pdfUrl && m.pdfUrl.trim()) || base.pdfUrl,
    flipbookUrl: (m.flipbookUrl && m.flipbookUrl.trim()) || base.flipbookUrl,
  };
}

function FullscreenFlipbookModal({
  open,
  onClose,
  src,
  title,
  closeLabel,
}: {
  open: boolean;
  onClose: () => void;
  src: string;
  title: string;
  closeLabel: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90">
      <div className="absolute top-0 left-0 right-0 flex h-16 items-center justify-between border-b border-white/10 bg-black/40 px-4 backdrop-blur sm:px-6">
        <div className="truncate text-sm font-semibold text-gray-200 md:text-base">{title}</div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-full border border-[#C9A84A]/60 px-4 py-2 text-sm font-semibold text-[#C9A84A] transition hover:bg-[#C9A84A]/10"
        >
          {closeLabel}
        </button>
      </div>
      <div className="absolute bottom-0 left-0 right-0 top-16">
        <iframe
          src={src}
          title={title}
          className="h-full w-full border-0"
          scrolling="no"
          allow="fullscreen"
          allowFullScreen
        />
      </div>
    </div>
  );
}

function EditionActions({
  edition,
  lang,
  readLabel,
  downloadLabel,
  onRead,
  compact,
}: {
  edition: MagazineEdition;
  lang: MagazineLang;
  readLabel: string;
  downloadLabel: string;
  onRead: (flipbookUrl: string | null) => void;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "mt-4 flex flex-col gap-2 sm:flex-row" : "mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap"}>
      <button
        type="button"
        onClick={() => onRead(edition.flipbookUrl)}
        className={
          compact
            ? "inline-flex min-h-[2.5rem] flex-1 items-center justify-center rounded-full bg-[#7A1E2C] px-4 py-2 text-xs font-bold text-[#FFFDF7] transition hover:bg-[#5e1721] sm:text-sm"
            : "inline-flex min-h-[2.875rem] items-center justify-center rounded-full bg-[#7A1E2C] px-7 py-2.5 text-sm font-bold text-[#FFFDF7] shadow-[0_10px_28px_-10px_rgba(122,30,44,0.45)] transition hover:bg-[#5e1721]"
        }
      >
        {readLabel}
      </button>
      {edition.pdfUrl ? (
        <a
          href={edition.pdfUrl}
          download
          className={
            compact
              ? "inline-flex min-h-[2.5rem] flex-1 items-center justify-center rounded-full border-2 border-[#7A1E2C]/80 bg-[#FFFDF7] px-4 py-2 text-xs font-bold text-[#7A1E2C] transition hover:bg-[#FBF7EF] sm:text-sm"
              : "inline-flex min-h-[2.875rem] items-center justify-center rounded-full border-2 border-[#7A1E2C]/80 bg-[#FFFDF7] px-7 py-2.5 text-sm font-bold text-[#7A1E2C] transition hover:bg-[#FBF7EF]"
          }
        >
          {downloadLabel}
        </a>
      ) : null}
    </div>
  );
}

function editionDisplayTitle(edition: MagazineEdition, lang: MagazineLang): string {
  if (lang === "vi") return JUNE_2026.title.vi;
  if (lang === "en") return edition.titleEn;
  return edition.titleEs;
}

function editionMonthLabel(edition: MagazineEdition, lang: MagazineLang): string {
  if (lang === "vi") return JUNE_2026.monthLabel.vi;
  if (lang === "en") return edition.monthEn;
  return edition.monthEs;
}

export default function MagazineHubPage() {
  const params = useSearchParams()!;
  const lang = resolveMagazineLang(params.get("lang"));
  const t = COPY[lang];
  const ui = MAGAZINE_UI[lang];
  const advertiseLang: AdvertiseLang = lang === "en" ? "en" : "es";
  const readMoreHref = `/magazine/2026/june/read?lang=${lang}`;

  const [manifest, setManifest] = useState<PublicMagazineManifest | null>(null);
  const [status, setStatus] = useState<"loading" | "ready">("loading");
  const [flipOpen, setFlipOpen] = useState(false);
  const [flipSrc, setFlipSrc] = useState(DEFAULT_FLIPBOOK);

  const currentEdition = useMemo(
    () => mergeEditionFromManifest(CURRENT_EDITION, manifest, "featured"),
    [manifest]
  );

  const pastEditions = useMemo(
    () =>
      PAST_EDITIONS.map((ed) =>
        mergeEditionFromManifest(ed, manifest, { year: ed.year, month: ed.monthKey })
      ),
    [manifest]
  );

  const openFlipbook = useCallback((url?: string | null) => {
    setFlipSrc((url && url.trim()) || DEFAULT_FLIPBOOK);
    setFlipOpen(true);
  }, []);

  const closeFlipbook = useCallback(() => setFlipOpen(false), []);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch("/api/magazine/manifest", { cache: "no-store" });
        if (!res.ok) throw new Error();
        const json = (await res.json()) as PublicMagazineManifest;
        if (alive) setManifest(json);
      } catch {
        if (alive) setManifest(null);
      } finally {
        if (alive) setStatus("ready");
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <main lang={lang} className="min-h-screen overflow-x-hidden bg-[#FAF6EE] pb-20 text-[#1F241C]">
      <div
        className="pointer-events-none fixed inset-0"
        aria-hidden
        style={{
          backgroundImage: `
            radial-gradient(ellipse 110% 65% at 50% -5%, rgba(201, 168, 74, 0.1), transparent 52%),
            radial-gradient(ellipse 45% 35% at 100% 20%, rgba(255, 255, 255, 0.35), transparent 48%)
          `,
        }}
      />

      <FullscreenFlipbookModal
        open={flipOpen}
        onClose={closeFlipbook}
        src={flipSrc}
        title={t.flipModalTitle}
        closeLabel={ui.closeFlipbook}
      />

      <div className="relative mx-auto max-w-6xl px-4 pt-24 sm:px-6 lg:px-8">
        {status !== "ready" ? (
          <p className="text-sm text-[#3D3428]/70">{t.loading}</p>
        ) : (
          <div className="space-y-14 sm:space-y-16 lg:space-y-20">
            {/* 1 — Editorial hero */}
            <section className="max-w-3xl" aria-labelledby="magazine-hero-title">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#556B3E]">{t.heroEyebrow}</p>
              <h1
                id="magazine-hero-title"
                className="mt-3 font-serif text-4xl font-bold leading-none tracking-tight text-[#2A4536] sm:text-5xl"
              >
                {t.heroTitle}
              </h1>
              <p className="mt-4 text-lg font-semibold leading-snug text-[#1F241C] sm:text-xl">{t.heroSubtitle}</p>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">
                {t.heroDescription}
              </p>
            </section>

            {/* 2 — Current edition */}
            <section
              className="overflow-hidden rounded-2xl border border-[#D6C7AD] bg-[#FFFDF7] shadow-[0_20px_48px_-22px_rgba(31,36,28,0.22)] ring-1 ring-[#C9A84A]/15"
              aria-labelledby="magazine-current-title"
            >
              <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,16rem)_1fr] lg:items-center lg:gap-10 lg:p-10">
                <div className="mx-auto w-full max-w-[16rem] lg:mx-0 lg:max-w-none">
                  <div className="overflow-hidden rounded-xl border border-[#D6C7AD] bg-[#FAF6EE] p-1 shadow-[0_16px_40px_-18px_rgba(31,36,28,0.25)]">
                    <Image
                      src={currentEdition.coverImage}
                      alt={editionDisplayTitle(currentEdition, lang)}
                      width={480}
                      height={620}
                      className="h-auto w-full object-contain"
                      priority
                      sizes="(max-width: 1024px) 256px, 320px"
                    />
                  </div>
                </div>

                <div>
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#556B3E]">
                    {t.currentEyebrow}
                  </p>
                  <h2
                    id="magazine-current-title"
                    className="mt-2 font-serif text-2xl font-bold leading-snug text-[#2A4536] sm:text-[1.75rem]"
                  >
                    {t.currentTitle}
                  </h2>
                  <p className="mt-1 text-sm font-medium text-[#3D3428]/75">
                    {editionMonthLabel(currentEdition, lang)} {currentEdition.year}
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">{t.currentBody}</p>
                  <p className="mt-3 rounded-lg border border-[#D6C7AD]/80 bg-[#FAF6EE] px-3 py-2.5 text-xs leading-relaxed text-[#3D3428] sm:text-sm">
                    {ui.originalEditionNote}
                  </p>
                  <EditionActions
                    edition={currentEdition}
                    lang={lang}
                    readLabel={t.readMagazine}
                    downloadLabel={t.downloadPdf}
                    onRead={openFlipbook}
                  />
                </div>
              </div>
            </section>

            {/* 3 — Language entry + translated reader preview */}
            <section
              className="rounded-2xl border border-[#D6C7AD] bg-[#FFFDF7] p-6 sm:p-8"
              aria-labelledby="magazine-language-title"
            >
              <MagazineLanguageSelector basePath="/magazine" />
              <div className="mt-8 border-t border-[#D6C7AD]/70 pt-8">
                <MagazineTranslatedReader
                  lang={lang}
                  variant="preview"
                  readMoreHref={readMoreHref}
                />
              </div>
            </section>

            {pastEditions.length > 0 ? (
              <section aria-labelledby="magazine-archive-title">
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#556B3E]">{t.archiveEyebrow}</p>
                <h2
                  id="magazine-archive-title"
                  className="mt-2 font-serif text-2xl font-bold leading-snug text-[#2A4536] sm:text-[1.75rem]"
                >
                  {t.archiveTitle}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">{t.archiveIntro}</p>

                <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:max-w-2xl">
                  {pastEditions.map((edition) => (
                    <li
                      key={edition.monthKey}
                      className="flex flex-col overflow-hidden rounded-xl border border-[#D6C7AD] bg-[#FFFDF7] shadow-[0_12px_32px_-18px_rgba(31,36,28,0.18)]"
                    >
                      <div className="border-b border-[#D6C7AD]/70 bg-[#FAF6EE] p-4">
                        <div className="mx-auto max-w-[10rem] overflow-hidden rounded-lg border border-[#D6C7AD] bg-white p-0.5">
                          <Image
                            src={edition.coverImage}
                            alt={editionDisplayTitle(edition, lang)}
                            width={280}
                            height={360}
                            className="h-auto w-full object-contain"
                            sizes="200px"
                          />
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col p-5">
                        <h3 className="text-base font-bold text-[#1F241C]">
                          {editionMonthLabel(edition, lang)} {edition.year}
                        </h3>
                        <p className="mt-1 text-sm text-[#3D3428]/80">
                          {editionDisplayTitle(edition, lang)}
                        </p>
                        <EditionActions
                          edition={edition}
                          lang={lang}
                          readLabel={t.readMagazine}
                          downloadLabel={t.downloadPdf}
                          onRead={openFlipbook}
                          compact
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {/* 4 — Newsletter */}
            <section
              className="rounded-2xl border border-[#C9A84A]/35 bg-[#FFFDF7] p-6 shadow-[0_12px_32px_-18px_rgba(31,36,28,0.15)] sm:p-8"
              aria-labelledby="magazine-newsletter-title"
            >
              <h2 id="magazine-newsletter-title" className="font-serif text-xl font-bold text-[#2A4536] sm:text-2xl">
                {t.newsletterTitle}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">{t.newsletterBody}</p>
              <form
                action="/newsletter"
                method="get"
                className="mt-6 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-stretch"
                aria-label={t.newsletterAria}
              >
                <input type="hidden" name="source" value="magazine" />
                <input type="hidden" name="lang" value={lang} />
                <label htmlFor="magazine-newsletter-email" className="sr-only">
                  {t.emailLabel}
                </label>
                <input
                  id="magazine-newsletter-email"
                  type="email"
                  name="email"
                  placeholder={t.newsletterPlaceholder}
                  autoComplete="email"
                  className="min-h-[3rem] min-w-0 flex-1 rounded-full border border-[#D6C7AD] bg-[#FAF6EE] px-4 text-sm text-[#1F241C] placeholder:text-[#3D3428]/55 focus:border-[#C9A84A] focus:outline-none focus:ring-2 focus:ring-[#C9A84A]/35"
                />
                <button
                  type="submit"
                  className="inline-flex min-h-[3rem] shrink-0 items-center justify-center rounded-full bg-[#7A1E2C] px-7 py-2.5 text-sm font-bold text-[#FFFDF7] transition hover:bg-[#5e1721]"
                >
                  {t.newsletterButton}
                </button>
              </form>
              <p className="mt-3 text-xs font-medium text-[#3D3428]/65">{t.newsletterMicro}</p>
            </section>

            {/* 5 — Advertise */}
            <section
              className="rounded-2xl border border-[#2A4536]/20 bg-gradient-to-br from-[#2A4536] via-[#2A4536] to-[#1a2d24] p-6 shadow-[0_20px_48px_-24px_rgba(31,36,28,0.45)] sm:p-8"
              aria-labelledby="magazine-advertise-title"
            >
              <h2 id="magazine-advertise-title" className="font-serif text-xl font-bold text-[#F8F4EA] sm:text-2xl">
                {t.advertiseTitle}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#EDE6D6] sm:text-base">{t.advertiseBody}</p>
              <AdvertiseDropdown lang={advertiseLang} variant="primary" buttonLabel={t.advertiseCta} className="mt-6" />
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
