import Link from "next/link";
import { CategoryGrid } from "@/app/components/recursos/CategoryGrid";
import { HelpNowBar } from "@/app/components/recursos/HelpNowBar";
import { RecursosLangSwitch } from "@/app/components/recursos/RecursosLangSwitch";
import { RecursosSearchForm } from "@/app/components/recursos/RecursosSearchForm";
import { getRecursosPageCopy, type RecursosPageCopy } from "@/app/lib/recursos/copy";
import {
  LANE_COPY,
  LANE_EXPLORE_PATH,
  LANE_ORDER,
  LANE_PUBLISH_PATH,
  type ResourceLaneKey,
} from "@/app/lib/recursos/lanes";
import type { PrimaryCategorySlug, PublicResourceRecord, RecursosLang } from "@/app/lib/recursos/types";
import { URGENCY_LEVELS } from "@/app/lib/recursos/urgency";
import { URGENCY_STYLE } from "@/app/lib/recursos/urgencyStyle";

type Lang = RecursosLang;
type PageCopy = RecursosPageCopy;

function appendLangToPath(path: string, lang: Lang): string {
  const [base, hash] = path.split("#");
  const joiner = base.includes("?") ? "&" : "?";
  const withParam = `${base}${joiner}lang=${lang}`;
  return hash ? `${withParam}#${hash}` : withParam;
}

function buildExploreHref(lane: ResourceLaneKey, lang: Lang): string {
  return appendLangToPath(LANE_EXPLORE_PATH[lane], lang);
}

function buildPublishHref(lane: ResourceLaneKey, lang: Lang): string {
  return appendLangToPath(LANE_PUBLISH_PATH[lane], lang);
}

function buildPostResourceEntryHref(lang: Lang): string {
  const redirect = encodeURIComponent(`/publicar?lang=${lang}`);
  return `/login?mode=post&lang=${lang}&redirect=${redirect}`;
}

function LaneMark({ lane }: { lane: ResourceLaneKey }) {
  const stroke = "#2A4536";
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke,
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-7 w-7",
  };

  switch (lane) {
    case "comunidad":
      return (
        <svg {...common} aria-hidden>
          <rect x="4" y="5" width="16" height="14" rx="1.5" />
          <path d="M8 3v4M16 3v4M4 10h16" />
          <circle cx="9" cy="14" r="1.25" />
          <circle cx="15" cy="14" r="1.25" />
        </svg>
      );
    case "clases":
      return (
        <svg {...common} aria-hidden>
          <path d="M5 6h14v12H5z" />
          <path d="M9 6V4h6v2" />
          <path d="M8 11h8M8 14h5" />
        </svg>
      );
    case "iglesias":
      return (
        <svg {...common} aria-hidden>
          <path d="M12 4v16" />
          <path d="M8 8h8" />
          <path d="M6 20h12" />
          <path d="M10 20V12h4v8" />
        </svg>
      );
    case "busco":
      return (
        <svg {...common} aria-hidden>
          <circle cx="10" cy="10" r="5.5" />
          <path d="M14.5 14.5L19 19" />
        </svg>
      );
    case "mascotas-y-perdidos":
      return (
        <svg {...common} aria-hidden>
          <ellipse cx="8" cy="14" rx="2.5" ry="3" />
          <ellipse cx="12" cy="11" rx="2" ry="2.5" />
          <ellipse cx="16" cy="14" rx="2.5" ry="3" />
          <ellipse cx="10" cy="7" rx="2" ry="2.5" />
          <ellipse cx="14" cy="7" rx="2" ry="2.5" />
        </svg>
      );
    case "ayuda-comunitaria":
      return (
        <svg {...common} aria-hidden>
          <path d="M12 4v6" />
          <path d="M8 8c2-2 8-2 8 0v2c0 3-2 5-4 6-2-1-4-3-4-6V8z" />
          <path d="M9 20h6" />
        </svg>
      );
    default:
      return null;
  }
}

function ResourceLaneCard({
  lane,
  lang,
  exploreHref,
  publishHref,
  exploreLabel,
}: {
  lane: ResourceLaneKey;
  lang: Lang;
  exploreHref: string;
  publishHref: string;
  exploreLabel: string;
}) {
  const copy = LANE_COPY[lane];
  const label = lang === "es" ? copy.labelEs : copy.labelEn;
  const desc = lang === "es" ? copy.descEs : copy.descEn;
  const publishLabel = lang === "es" ? copy.publishEs : copy.publishEn;

  return (
    <article className="flex h-full min-h-[17.5rem] flex-col rounded-xl border border-[#D6C7AD] bg-[#FFFDF7] p-5 shadow-[0_8px_24px_-16px_rgba(31,36,28,0.15)]">
      <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[#C9A84A]/35 bg-[#FAF6EE] text-[#2A4536]">
        <LaneMark lane={lane} />
      </span>
      <h3 className="mt-4 text-base font-bold text-[#1F241C]">{label}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-[#3D3428]">{desc}</p>
      <div className="mt-auto flex flex-col gap-4 border-t border-[#D6C7AD]/50 pt-6">
        <Link
          href={exploreHref}
          className="inline-flex min-h-[2.5rem] w-full items-center justify-center rounded-lg border border-[#C9A84A]/70 bg-[#FAF6EE] px-4 py-2.5 text-center text-sm font-bold text-[#2A4536] transition hover:border-[#C9A84A] hover:bg-[#FFFDF7]"
        >
          {exploreLabel}
        </Link>
        <Link
          href={publishHref}
          className="inline-flex min-h-[2.5rem] w-full items-center justify-center rounded-lg bg-[#7A1E2C] px-4 py-2.5 text-center text-sm font-bold text-[#FFFDF7] transition hover:bg-[#5e1721]"
        >
          {publishLabel}
        </Link>
      </div>
    </article>
  );
}

function UrgencyLegend({ lang }: { lang: Lang }) {
  return (
    <section
      className="mt-10 rounded-xl border border-[#D6C7AD] bg-[#FFFDF7] p-5 shadow-[0_8px_24px_-16px_rgba(31,36,28,0.12)] sm:p-6"
      aria-labelledby="recursos-urgencia-title"
    >
      <h2 id="recursos-urgencia-title" className="font-serif text-xl font-bold text-[#2A4536] sm:text-2xl">
        {lang === "en" ? "How urgency works" : "Cómo funciona la urgencia"}
      </h2>
      <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {URGENCY_LEVELS.map((u) => {
          const treatment = URGENCY_STYLE[u.level];
          return (
            <li
              key={u.level}
              className="rounded-lg border p-4"
              style={{ borderColor: treatment.border, backgroundColor: treatment.bg }}
            >
              <p className="text-sm font-bold" style={{ color: treatment.text }}>
                {lang === "en" ? u.labelEn : u.labelEs}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed" style={{ color: treatment.text }}>
                {lang === "en" ? u.descriptionEn : u.descriptionEs}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function TrustStrip({ t }: { t: PageCopy }) {
  return (
    <section className="mt-10 rounded-xl border border-[#C9A84A]/40 bg-[#FAF6EE] p-5 sm:p-6" aria-labelledby="recursos-trust-title">
      <h2 id="recursos-trust-title" className="font-serif text-lg font-bold text-[#2A4536] sm:text-xl">
        {t.trustStripTitle}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#3D3428]">{t.trustStripBody}</p>
    </section>
  );
}

export default function RecursosComunitariosClient({
  lang,
  resources,
  helpNowResources,
  categoryCounts,
}: {
  lang: Lang;
  resources: PublicResourceRecord[];
  helpNowResources: PublicResourceRecord[];
  categoryCounts: Record<PrimaryCategorySlug, number>;
}) {
  const t = getRecursosPageCopy(lang);
  const postEntryHref = buildPostResourceEntryHref(lang);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#FAF6EE] pb-20 text-[#1F241C]">
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

      <div className="relative mx-auto max-w-6xl px-4 pt-24 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4">
          <HelpNowBar resources={helpNowResources} lang={lang} />

          {/* 1 — LEONIX CERCA DE TI hero */}
          <section className="max-w-3xl" aria-labelledby="recursos-hero-title">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#556B3E]">{t.brandEyebrow}</p>
              <RecursosLangSwitch compact />
            </div>
            <h1
              id="recursos-hero-title"
              className="mt-3 font-serif text-4xl font-bold leading-none tracking-tight text-[#2A4536] sm:text-5xl"
            >
              {t.heroQuestion}
            </h1>
            <p className="mt-4 text-lg font-semibold leading-snug text-[#1F241C] sm:text-xl">{t.heroSupport}</p>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">{t.heroTrustLine}</p>

            <RecursosSearchForm lang={lang} />

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href="#recursos-directorio"
                className="inline-flex min-h-[2.875rem] items-center justify-center rounded-full bg-[#7A1E2C] px-8 py-2.5 text-sm font-bold text-[#FFFDF7] shadow-[0_10px_28px_-10px_rgba(122,30,44,0.45)] transition hover:bg-[#5e1721]"
              >
                {t.ctaExplore}
              </a>
              <a
                href={postEntryHref}
                className="inline-flex min-h-[2.875rem] items-center justify-center rounded-full border-2 border-[#C9A84A]/70 bg-[#FFFDF7] px-8 py-2.5 text-sm font-bold text-[#3D3428] transition hover:border-[#C9A84A] hover:bg-[#FBF7EF]"
              >
                {t.ctaPost}
              </a>
            </div>
          </section>
        </div>

        {/* 2 — Verified need-first category directory */}
        <section id="recursos-directorio" className="mt-14 sm:mt-16" aria-labelledby="recursos-categorias-title">
          <h2
            id="recursos-categorias-title"
            className="font-serif text-2xl font-bold leading-snug text-[#2A4536] sm:text-[1.75rem]"
          >
            {t.directoryHeading}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">{t.categoriesIntro}</p>

          <CategoryGrid lang={lang} counts={categoryCounts} />

          {resources.length === 0 ? (
            <p className="mt-6 text-xs font-medium text-[#556B3E]/90">{t.categoriesComingSoonNote}</p>
          ) : null}
        </section>

        {/* 3 — Urgency model legend */}
        <UrgencyLegend lang={lang} />

        {/* 4 — Verified-trust explainer strip (PRINT → QR → SEARCH → ACTION doctrine) */}
        <TrustStrip t={t} />

        {/* 5 — Existing classifieds-backed community lanes (events, classes, churches, etc.) */}
        <section id="recursos" className="mt-14 sm:mt-16" aria-labelledby="recursos-lanes-title">
          <h2
            id="recursos-lanes-title"
            className="font-serif text-2xl font-bold leading-snug text-[#2A4536] sm:text-[1.75rem]"
          >
            {t.sectionLanes}
          </h2>

          <ul className="mt-8 grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {LANE_ORDER.map((lane) => (
              <li key={lane} className="flex h-full">
                <ResourceLaneCard
                  lane={lane}
                  lang={lang}
                  exploreHref={buildExploreHref(lane, lang)}
                  publishHref={buildPublishHref(lane, lang)}
                  exploreLabel={t.explore}
                />
              </li>
            ))}
          </ul>
        </section>

        {/* 6 — Community CTA */}
        <section
          className="mt-14 rounded-2xl border border-[#C9A84A]/40 bg-[#2A4536] px-6 py-10 text-[#FFFDF7] shadow-[0_16px_40px_-20px_rgba(31,36,28,0.35)] sm:px-10 sm:py-12"
          aria-labelledby="recursos-promo-title"
        >
          <h2 id="recursos-promo-title" className="font-serif text-2xl font-bold leading-snug sm:text-[1.75rem]">
            {t.promoTitle}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#FAF6EE]/90 sm:text-[0.9375rem]">
            {t.promoDescription}
          </p>
          <a
            href={postEntryHref}
            className="mt-8 inline-flex min-h-[2.875rem] items-center justify-center rounded-full bg-[#7A1E2C] px-8 py-2.5 text-sm font-bold text-[#FFFDF7] shadow-[0_10px_28px_-10px_rgba(122,30,44,0.45)] transition hover:bg-[#5e1721]"
          >
            {t.promoButton}
          </a>
        </section>
      </div>
    </main>
  );
}
