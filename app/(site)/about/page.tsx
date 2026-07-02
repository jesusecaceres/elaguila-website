import Link from "next/link";
import type { Metadata } from "next";
import { getAboutPageCopy, type AboutPageLang } from "@/app/lib/leonix/aboutPageCopy";
import { LEONIX_MEDIA_SITE_NAME } from "@/app/lib/leonixBrand";

function withLang(href: string, lang: AboutPageLang): string {
  const [path, query = ""] = href.split("?");
  const params = new URLSearchParams(query);
  params.set("lang", lang);
  return `${path}?${params.toString()}`;
}

export async function generateMetadata(props: {
  searchParams?: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const sp = (await props.searchParams) ?? {};
  const lang: AboutPageLang = sp.lang === "en" ? "en" : "es";
  const c = getAboutPageCopy(lang);
  return {
    title: c.metaTitle,
    description: c.metaDescription,
    openGraph: { title: c.metaTitle, description: c.metaDescription, siteName: LEONIX_MEDIA_SITE_NAME },
    twitter: { title: c.metaTitle, description: c.metaDescription },
  };
}

function CtaLink({
  href,
  lang,
  variant,
  children,
}: {
  href: string;
  lang: AboutPageLang;
  variant: "primary" | "secondary";
  children: React.ReactNode;
}) {
  const base =
    variant === "primary"
      ? "bg-[#7A1E2C] text-[#FFFDF7] shadow-[0_10px_28px_-10px_rgba(122,30,44,0.45)] hover:bg-[#5e1721]"
      : "border-2 border-[#C9A84A]/70 bg-[#FFFDF7] text-[#3D3428] hover:border-[#C9A84A] hover:bg-[#FBF7EF]";
  return (
    <Link
      href={withLang(href, lang)}
      className={`inline-flex min-h-[2.875rem] items-center justify-center rounded-full px-6 py-2.5 text-sm font-bold transition ${base}`}
    >
      {children}
    </Link>
  );
}

export default async function AboutPage(props: { searchParams?: Promise<{ lang?: string }> }) {
  const sp = (await props.searchParams) ?? {};
  const lang: AboutPageLang = sp.lang === "en" ? "en" : "es";
  const swap: AboutPageLang = lang === "en" ? "es" : "en";
  const c = getAboutPageCopy(lang);

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

      <div className="relative mx-auto max-w-5xl px-4 pt-24 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-end">
          <Link
            href={`/about?lang=${swap}`}
            className="text-sm font-semibold text-[#556B3E] underline decoration-[#C9A84A]/60 underline-offset-4 hover:text-[#7A1E2C]"
          >
            {c.langSwitch}
          </Link>
        </div>

        {/* Hero */}
        <section className="max-w-3xl" aria-labelledby="about-hero-title">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#556B3E]">LEONIX MEDIA</p>
          <h1
            id="about-hero-title"
            className="mt-3 font-serif text-4xl font-bold leading-tight tracking-tight text-[#2A4536] sm:text-5xl"
          >
            {c.heroTitle}
          </h1>
          <p className="mt-4 text-lg font-semibold leading-snug text-[#1F241C] sm:text-xl">{c.heroSubtitle}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <CtaLink href="/contacto" lang={lang} variant="primary">
              {c.ctaAdvertise}
            </CtaLink>
            <CtaLink href="/clasificados" lang={lang} variant="secondary">
              {c.ctaClassifieds}
            </CtaLink>
            <CtaLink href="/magazine/2026/june/read" lang={lang} variant="secondary">
              {c.ctaMagazine}
            </CtaLink>
            <CtaLink href="/coming-soon-v2" lang={lang} variant="secondary">
              {c.ctaLaunch}
            </CtaLink>
          </div>
        </section>

        {/* What we are */}
        <section className="mt-14 rounded-2xl border border-[#D6C7AD] bg-[#FFFDF7] p-6 sm:p-8">
          <h2 className="font-serif text-2xl font-bold text-[#2A4536]">{c.whatWeAreTitle}</h2>
          <p className="mt-4 text-sm leading-relaxed text-[#3D3428] sm:text-base">{c.whatWeAreBody}</p>
        </section>

        {/* What Leonix connects */}
        <section className="mt-10" aria-labelledby="about-connects-title">
          <h2 id="about-connects-title" className="font-serif text-2xl font-bold text-[#2A4536]">
            {c.connectsTitle}
          </h2>
          <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {c.connectsCards.map((card) => (
              <li
                key={card}
                className="rounded-xl border border-[#C9A84A]/35 bg-[#FFFDF7] px-4 py-4 text-sm font-semibold text-[#1F241C] shadow-[0_8px_24px_-16px_rgba(31,36,28,0.12)]"
              >
                {card}
              </li>
            ))}
          </ul>
        </section>

        {/* Why Leonix exists */}
        <section className="mt-10 rounded-2xl border border-[#556B3E]/25 bg-[#556B3E]/5 p-6 sm:p-8">
          <h2 className="font-serif text-2xl font-bold text-[#2A4536]">{c.whyTitle}</h2>
          <p className="mt-4 text-sm leading-relaxed text-[#3D3428] sm:text-base">{c.whyBody}</p>
        </section>

        {/* Ecosystem */}
        <section className="mt-10" aria-labelledby="about-ecosystem-title">
          <h2 id="about-ecosystem-title" className="font-serif text-2xl font-bold text-[#2A4536]">
            {c.ecosystemTitle}
          </h2>
          <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {c.ecosystemCards.map((card) => (
              <li key={card.title}>
                <Link
                  href={withLang(card.href, lang)}
                  className="flex h-full min-h-[4.5rem] items-center justify-center rounded-xl border border-[#D6C7AD] bg-[#FFFDF7] px-4 py-4 text-center text-sm font-bold text-[#7A1E2C] transition hover:border-[#C9A84A] hover:bg-[#FBF7EF]"
                >
                  {card.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Local roots */}
        <section className="mt-10 rounded-2xl border border-[#D6C7AD] bg-[#FFFDF7] p-6 sm:p-8">
          <h2 className="font-serif text-2xl font-bold text-[#2A4536]">{c.rootsTitle}</h2>
          <p className="mt-4 text-sm leading-relaxed text-[#3D3428] sm:text-base">{c.rootsBody}</p>
        </section>

        {/* Final CTA */}
        <section
          className="mt-14 rounded-2xl border border-[#C9A84A]/40 bg-[#2A4536] px-6 py-10 text-[#FFFDF7] sm:px-10 sm:py-12"
          aria-labelledby="about-final-cta"
        >
          <h2 id="about-final-cta" className="font-serif text-2xl font-bold sm:text-3xl">
            {c.finalTitle}
          </h2>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <CtaLink href="/contacto" lang={lang} variant="primary">
              {c.ctaAdvertise}
            </CtaLink>
            <Link
              href={withLang("/contacto", lang)}
              className="inline-flex min-h-[2.875rem] items-center justify-center rounded-full border-2 border-[#C9A84A]/70 bg-transparent px-6 py-2.5 text-sm font-bold text-[#FFFDF7] transition hover:border-[#C9A84A] hover:bg-[#FFFDF7]/10"
            >
              {c.ctaContact}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
