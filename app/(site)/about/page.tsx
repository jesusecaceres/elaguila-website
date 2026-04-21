import Link from "next/link";
import type { Metadata } from "next";

function withLangParam(href: string, lang: string): string {
  if (href.startsWith("http://") || href.startsWith("https://") || href.includes("lang=")) return href;
  const sep = href.includes("?") ? "&" : "?";
  return `${href}${sep}lang=${lang}`;
}
import { getSiteSectionPayload } from "@/app/lib/siteSectionContent/siteSectionContentData";
import type { NosotrosPayload } from "@/app/lib/siteSectionContent/payloadTypes";
import { mergeNosotrosCopy } from "@/app/lib/siteSectionContent/nosotrosMerge";
import { LEONIX_MEDIA_SITE_NAME } from "@/app/lib/leonixBrand";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: {
  searchParams?: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const sp = (await props.searchParams) ?? {};
  const lang = sp.lang === "en" ? "en" : "es";
  const { payload } = await getSiteSectionPayload("nosotros");
  const c = mergeNosotrosCopy(payload as unknown as NosotrosPayload);
  const title = lang === "en" ? "About" : "Nosotros";
  const description =
    lang === "en"
      ? `Who we are: ${LEONIX_MEDIA_SITE_NAME}, a bilingual business visibility and local discovery platform under Leonix Global LLC.`
      : `Quiénes somos: ${LEONIX_MEDIA_SITE_NAME}, plataforma bilingüe de visibilidad empresarial y descubrimiento local bajo Leonix Global LLC.`;
  return {
    title,
    description,
    openGraph: { title, description, siteName: LEONIX_MEDIA_SITE_NAME },
    twitter: { title, description },
  };
}

export default async function AboutPage(props: { searchParams?: Promise<{ lang?: string }> }) {
  const sp = (await props.searchParams) ?? {};
  const lang = sp.lang === "en" ? "en" : "es";
  const swap = lang === "en" ? "es" : "en";

  const { payload } = await getSiteSectionPayload("nosotros");
  const c = mergeNosotrosCopy(payload as unknown as NosotrosPayload);
  const L = c[lang];

  return (
    <main className="mx-auto max-w-4xl px-6 pb-16 pt-28 text-[color:var(--lx-text)]">
      <div className="mb-6 flex justify-end">
        <Link
          href={`/about?lang=${swap}`}
          className="text-sm font-medium text-[color:var(--lx-text-2)] underline hover:text-[color:var(--lx-text)]"
        >
          {lang === "en" ? "Español" : "English"}
        </Link>
      </div>

      <div className="rounded-3xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-8 shadow-[0_18px_48px_rgba(42,36,22,0.10)]">
        <h1 className="mb-4 text-3xl font-bold">{L.heroTitle}</h1>
        <p className="mb-6 leading-relaxed text-[color:var(--lx-text-2)]/90">{L.lead}</p>

        {c.mediaImageSrc ? (
          <div className="mb-6 overflow-hidden rounded-2xl border border-[color:var(--lx-nav-border)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.mediaImageSrc} alt={L.mediaAlt} className="max-h-72 w-full object-cover" />
          </div>
        ) : null}

        {L.mission ? (
          <section className="mb-4">
            <h2 className="text-lg font-semibold">{lang === "en" ? "Mission" : "Misión"}</h2>
            <p className="mt-1 text-[color:var(--lx-text-2)]/90">{L.mission}</p>
          </section>
        ) : null}
        {L.vision ? (
          <section className="mb-4">
            <h2 className="text-lg font-semibold">{lang === "en" ? "Vision" : "Visión"}</h2>
            <p className="mt-1 text-[color:var(--lx-text-2)]/90">{L.vision}</p>
          </section>
        ) : null}
        {L.values ? (
          <section className="mb-6">
            <h2 className="text-lg font-semibold">{lang === "en" ? "Values" : "Valores"}</h2>
            <p className="mt-1 whitespace-pre-wrap text-[color:var(--lx-text-2)]/90">{L.values}</p>
          </section>
        ) : null}

        <div className="flex flex-wrap gap-3">
          {c.ctaPrimaryHref ? (
            <Link
              href={withLangParam(c.ctaPrimaryHref, lang)}
              className="inline-flex rounded-full bg-[color:var(--lx-cta-dark)] px-5 py-2.5 text-sm font-semibold text-[color:var(--lx-cta-light)]"
            >
              {L.ctaPrimary}
            </Link>
          ) : null}
          {c.ctaSecondaryHref ? (
            <Link
              href={withLangParam(c.ctaSecondaryHref, lang)}
              className="inline-flex rounded-full border border-[color:var(--lx-nav-border)] px-5 py-2.5 text-sm font-semibold"
            >
              {L.ctaSecondary}
            </Link>
          ) : null}
        </div>
      </div>
    </main>
  );
}
