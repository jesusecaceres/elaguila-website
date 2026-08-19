import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { normalizeLang } from "@/app/lib/language";
import { LEONIX_MEDIA_SITE_NAME, LEONIX_SITE_ORIGIN, leonixPageTitle } from "@/app/lib/leonixBrand";
import { getPublicChurchBySlug } from "@/app/lib/iglesias/churchQueries";
import { getIglesiasCopy, formatIglesiasServiceSummary, googleDirectionsHref, telHref, iglesiasLanguageLabel } from "@/app/lib/iglesias/copy";
import { iglesiasNeedLabel } from "@/app/lib/iglesias/taxonomy";
import { IglesiasPageShell } from "../components/IglesiasPageShell";
import { IglesiasSafeImage } from "../components/IglesiasSafeImage";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ lang?: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params;
  const sp = (await props.searchParams) ?? {};
  const lang = normalizeLang(sp.lang) === "en" ? "en" : "es";
  const church = await getPublicChurchBySlug(slug, lang);
  if (!church) {
    return { title: lang === "en" ? "Church not found" : "Iglesia no encontrada", robots: { index: false, follow: false } };
  }
  const title = church.name;
  const description =
    church.shortDescription?.trim() ||
    (lang === "en"
      ? `${church.name} in ${church.city || "San Jose"}. Service times, ministries, and contact on Leonix Media.`
      : `${church.name} en ${church.city || "San José"}. Horarios, ministerios y contacto en Leonix Media.`);
  const path = `/iglesias/${encodeURIComponent(church.slug)}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    robots: { index: true, follow: true },
    openGraph: {
      title: leonixPageTitle(title),
      description,
      url: path,
      siteName: LEONIX_MEDIA_SITE_NAME,
      type: "website",
      locale: lang === "en" ? "en_US" : "es_ES",
    },
  };
}

export default async function IglesiasChurchPage(props: Props) {
  const { slug } = await props.params;
  const sp = (await props.searchParams) ?? {};
  const lang = normalizeLang(sp.lang) === "en" ? "en" : "es";
  const church = await getPublicChurchBySlug(slug, lang);
  if (!church) notFound();

  const copy = getIglesiasCopy(lang);
  const heroSrc = church.heroUrl || church.logoUrl;
  const actions: Array<{ href: string; label: string; external?: boolean }> = [];
  if (church.publicLocation && church.addressLine1) {
    actions.push({ href: googleDirectionsHref(church.addressLine1), label: copy.cardDirections, external: true });
  }
  if (church.phone) actions.push({ href: telHref(church.phone), label: copy.cardCall });
  if (church.website) actions.push({ href: church.website, label: copy.profileWebsite, external: true });
  if (church.livestreamUrl) actions.push({ href: church.livestreamUrl, label: copy.profileLivestream, external: true });

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Church",
    name: church.name,
    url: `${LEONIX_SITE_ORIGIN}/iglesias/${encodeURIComponent(church.slug)}`,
  };
  if (church.publicLocation && church.addressLine1) {
    jsonLd.address = {
      "@type": "PostalAddress",
      streetAddress: church.addressLine1,
      addressLocality: church.city || undefined,
      addressRegion: church.state || undefined,
      postalCode: church.zip || undefined,
    };
  }
  if (church.phone) jsonLd.telephone = church.phone;
  if (church.website) jsonLd.url = church.website;

  const socials = Object.entries(church.socials).filter(([, v]) => Boolean(v));

  return (
    <IglesiasPageShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article>
        <div className="relative">
          <IglesiasSafeImage src={heroSrc} alt={heroSrc ? church.imageAlt || church.name : ""} className="aspect-[16/9] w-full max-h-[28rem] sm:aspect-[2.2/1]" priority />
        </div>
        <div className="mx-auto max-w-[88rem] overflow-x-hidden px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#7A1E2C]">
            {lang === "en" ? "Church" : "Iglesia"}
          </p>
          <h1 className="mt-2 font-serif text-[clamp(1.8rem,4vw+0.4rem,3rem)] font-bold leading-tight text-[#1F241C]">{church.name}</h1>
          <p className="mt-2 text-sm text-[#5C5346]">
            {[church.denomination || church.churchType, church.city, church.languages.map((l) => iglesiasLanguageLabel(l, lang)).join(" · ")]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {church.needKeys.length ? (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {church.needKeys.map((key) => (
                <li key={key} className="rounded-full border border-[#D6C7AD] bg-[#FAF6EE] px-2.5 py-0.5 text-[11px] font-semibold text-[#5C5346]">
                  {iglesiasNeedLabel(key, lang)}
                </li>
              ))}
            </ul>
          ) : null}

          {actions.length ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {actions.map((a) => (
                <a
                  key={a.href}
                  href={a.href}
                  className="inline-flex min-h-11 items-center rounded-xl border border-[#D6C7AD] bg-[#FFFDF7] px-4 text-sm font-semibold text-[#1F241C] hover:bg-[#FAF6EE]"
                  {...(a.external ? { target: "_blank", rel: "noreferrer" } : {})}
                >
                  {a.label}
                </a>
              ))}
            </div>
          ) : null}

          <section className="mt-10 overflow-hidden rounded-[1.5rem] border border-[#C9A84A]/35 bg-[#FFFDF7] px-5 py-6 sm:px-7" aria-labelledby="iglesias-services-title">
            <h2 id="iglesias-services-title" className="font-serif text-2xl font-bold text-[#1F241C]">
              {copy.profileServices}
            </h2>
            {church.services.length ? (
              <ul className="mt-3 space-y-2">
                {church.services.map((s) => (
                  <li key={s.id} className="rounded-lg border border-[#D6C7AD]/70 bg-[#FFFDF7] px-4 py-3 text-sm text-[#3D3428]">
                    {formatIglesiasServiceSummary(s.day_of_week, s.starts_at, s.language, lang)}
                    {s.label ? ` · ${s.label}` : ""}
                    {s.mode === "online" ? ` · ${copy.modeOnline}` : s.mode === "hybrid" ? ` · ${copy.modeHybrid}` : ` · ${copy.modeInPerson}`}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-[#5C5346]">{copy.profileNoServices}</p>
            )}
          </section>

          {church.mission || church.shortDescription ? (
            <section className="mt-6 overflow-hidden rounded-[1.5rem] border border-[#C9A84A]/35 bg-[#FFFDF7] px-5 py-6 sm:px-7" aria-labelledby="iglesias-about-title">
              <h2 id="iglesias-about-title" className="font-serif text-2xl font-bold text-[#1F241C]">
                {copy.profileAbout}
              </h2>
              <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-relaxed text-[#3D3428] sm:text-base">
                {church.mission || church.shortDescription}
              </p>
            </section>
          ) : null}

          {church.ministries.length ? (
            <section className="mt-6 overflow-hidden rounded-[1.5rem] border border-[#C9A84A]/35 bg-[#FFFDF7] px-5 py-6 sm:px-7" aria-labelledby="iglesias-help-title">
              <h2 id="iglesias-help-title" className="font-serif text-2xl font-bold text-[#1F241C]">
                {copy.profileHelp}
              </h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {church.ministries.map((m) => (
                  <li key={m.id} className="rounded-xl border border-[#D6C7AD]/70 bg-[#FFFDF7] px-4 py-3">
                    <p className="font-semibold text-[#1F241C]">{iglesiasNeedLabel(m.need_key, lang)}</p>
                    {m.display_note ? <p className="mt-1 text-sm text-[#5C5346]">{m.display_note}</p> : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="mt-6 overflow-hidden rounded-[1.5rem] border border-[#C9A84A]/35 bg-[#FFFDF7] px-5 py-6 sm:px-7" aria-labelledby="iglesias-contact-title">
            <h2 id="iglesias-contact-title" className="font-serif text-2xl font-bold text-[#1F241C]">
              {copy.profileContact}
            </h2>
            <ul className="mt-3 space-y-1 text-sm text-[#3D3428]">
              {church.phone ? (
                <li>
                  <a className="underline-offset-2 hover:underline" href={telHref(church.phone)}>
                    {church.phone}
                  </a>
                </li>
              ) : null}
              {church.email ? (
                <li>
                  <a className="underline-offset-2 hover:underline" href={`mailto:${church.email}`}>
                    {church.email}
                  </a>
                </li>
              ) : null}
              {church.publicLocation && church.addressLine1 ? (
                <li>
                  {copy.profileLocation}: {church.addressLine1}
                  {church.addressLine2 ? `, ${church.addressLine2}` : ""}
                  {church.zip ? ` ${church.zip}` : ""}
                </li>
              ) : null}
            </ul>
            {socials.length ? (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-[#5C5346]">{copy.profileSocials}</h3>
                <ul className="mt-2 flex flex-wrap gap-3 text-sm">
                  {socials.map(([k, v]) => (
                    <li key={k}>
                      <a href={v} className="underline-offset-2 hover:underline" target="_blank" rel="noreferrer">
                        {k}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>

          <p className="mt-12">
            <Link href={`/iglesias?lang=${lang}`} className="text-sm font-semibold text-[#7A1E2C] underline-offset-2 hover:underline">
              {copy.profileBack}
            </Link>
          </p>
        </div>
      </article>
    </IglesiasPageShell>
  );
}
