import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicPillarJsonLd } from "@/app/components/PublicPillarJsonLd";
import { RecursosLangSwitch } from "@/app/components/recursos/RecursosLangSwitch";
import { ResourceCard } from "@/app/components/recursos/ResourceCard";
import { ResourceQuickActions } from "@/app/components/recursos/ResourceQuickActions";
import { navCopyLang, normalizeLang } from "@/app/lib/language";
import { LEONIX_SITE_ORIGIN, leonixPageTitle } from "@/app/lib/leonixBrand";
import { getPrimaryCategoryLabel } from "@/app/lib/recursos/categories";
import { resolveResourceDescription } from "@/app/lib/recursos/recursosBilingualFallback";
import { recursosCategoryHref, recursosResourcePath, RECURSOS_BASE_PATH } from "@/app/lib/recursos/recursosUrls";
import { recursosResourceJsonLd } from "@/app/lib/recursos/recursosResourceJsonLd";
import { listPublicCommunityResources, getPublicCommunityResourceBySlug } from "@/app/lib/recursos/server/communityResourcesPublicQueries";
import type { PublicResourceRecord, RecursosLang } from "@/app/lib/recursos/types";
import { getUrgencyLabel } from "@/app/lib/recursos/urgency";
import { URGENCY_STYLE } from "@/app/lib/recursos/urgencyStyle";

const COST_LABEL: Record<RecursosLang, Record<PublicResourceRecord["costModel"], string>> = {
  es: { free: "Gratis", low_cost: "Costo bajo", eligibility_based: "Según elegibilidad", unknown: "No especificado" },
  en: { free: "Free", low_cost: "Low cost", eligibility_based: "Eligibility-based", unknown: "Not specified" },
};

const SECTION_LABEL: Record<RecursosLang, Record<string, string>> = {
  es: {
    verified: "Información verificada",
    whatHelp: "¿Qué ayuda ofrecen?",
    eligibility: "Elegibilidad",
    cost: "Costo",
    languages: "Idiomas",
    serviceArea: "Área de servicio",
    hours: "Horario",
    address: "Ubicación",
    source: "Fuente oficial",
    scanNote: "Escanea de nuevo para ver la información más reciente.",
    related: "Recursos relacionados",
    is24Hours: "Disponible 24/7",
    withheld: "Ubicación confidencial por seguridad. Contacta directamente para más información.",
  },
  en: {
    verified: "Verified information",
    whatHelp: "What help do they offer?",
    eligibility: "Eligibility",
    cost: "Cost",
    languages: "Languages",
    serviceArea: "Service area",
    hours: "Hours",
    address: "Location",
    source: "Official source",
    scanNote: "Scan again anytime to see the latest information.",
    related: "Related resources",
    is24Hours: "Available 24/7",
    withheld: "Confidential location for safety. Contact directly for more information.",
  },
};

function formatVerifiedDate(iso: string | null | undefined, lang: RecursosLang): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(lang === "en" ? "en-US" : "es-US", { year: "numeric", month: "long", day: "numeric" });
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const sp = (await props.searchParams) ?? {};
  const lang = normalizeLang(sp.lang);

  // Same safety-gated function the page body uses — a slug that isn't currently eligible must
  // never leak metadata (title/description) either.
  const resource = await getPublicCommunityResourceBySlug(slug);
  if (!resource) return {};

  const name = resource.programName ? `${resource.organizationName} — ${resource.programName}` : resource.organizationName;
  const description = resolveResourceDescription(resource, navCopyLang(lang)).text || undefined;
  const path = recursosResourcePath(resource.slug);
  const title = lang === "en" ? `${name} — Community Resources` : `${name} — Recursos Comunitarios`;

  return {
    title,
    description,
    alternates: { canonical: path },
    robots: { index: true, follow: true },
    openGraph: { title: leonixPageTitle(title), description, url: path, type: "website" },
    twitter: { card: "summary", title: leonixPageTitle(title), description },
  };
}

export default async function RecursoDetailPage(props: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ lang?: string }>;
}) {
  const { slug } = await props.params;
  const sp = (await props.searchParams) ?? {};
  const lang = normalizeLang(sp.lang);
  const recursosLang = navCopyLang(lang);
  const t = SECTION_LABEL[recursosLang];

  // Gate 4: fetch ONLY through the safety-gated slug query. Never fall back to raw table data.
  const resource = await getPublicCommunityResourceBySlug(slug);
  if (!resource) notFound();

  const canonicalPath = recursosResourcePath(resource.slug);
  const canonicalUrl = `${LEONIX_SITE_ORIGIN}${canonicalPath}`;
  const { text: description, isEnglishFallback } = resolveResourceDescription(resource, recursosLang);
  const eligibility = recursosLang === "en" ? resource.eligibilityEn || resource.eligibilityEs : resource.eligibilityEs || resource.eligibilityEn;
  const verifiedDate = formatVerifiedDate(resource.verification.lastVerifiedAt, recursosLang);
  const treatment = URGENCY_STYLE[resource.urgencyLevel];

  const addressWithheld = Boolean(resource.contact.address?.addressWithheldForSafety);
  const addressText =
    !addressWithheld && resource.contact.address
      ? [resource.contact.address.line1, resource.contact.address.line2, resource.contact.address.city, resource.contact.address.state, resource.contact.address.zip]
          .filter(Boolean)
          .join(", ")
      : null;

  // Related resources — same safety-gated function, same category, current resource excluded.
  const { resources: sameCategory } = await listPublicCommunityResources({ category: resource.primaryCategory, limit: 8 });
  const related = sameCategory.filter((r) => r.slug !== resource.slug).slice(0, 3);

  const jsonLd = recursosResourceJsonLd(resource, canonicalUrl);

  return (
    <main className="min-h-screen bg-[#FAF6EE] px-4 pb-24 pt-24 text-[#1F241C] sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PublicPillarJsonLd id="recursos-comunitarios" lang={lang} />

      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between gap-3">
          <Link href={recursosCategoryHref(resource.primaryCategory, lang)} className="text-xs font-bold text-[#556B3E] hover:underline">
            ← {getPrimaryCategoryLabel(resource.primaryCategory, recursosLang)}
          </Link>
          <RecursosLangSwitch compact />
        </div>

        {/* 1–4: identity, program, category, urgency */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide"
            style={{ borderColor: treatment.border, backgroundColor: treatment.bg, color: treatment.text }}
          >
            {getUrgencyLabel(resource.urgencyLevel, recursosLang)}
          </span>
          <span className="inline-flex items-center rounded-full border border-[#C9A84A]/50 bg-[#FFFDF7] px-2.5 py-0.5 text-[11px] font-semibold text-[#2A4536]">
            {getPrimaryCategoryLabel(resource.primaryCategory, recursosLang)}
          </span>
          {resource.urgencyLevel === "help-now" && resource.contact.is24Hours ? (
            <span className="inline-flex items-center rounded-full border border-[#7A1E2C]/30 bg-[#FBEAEA] px-2.5 py-0.5 text-[11px] font-bold text-[#7A1E2C]">
              {t.is24Hours}
            </span>
          ) : null}
        </div>

        <h1 className="mt-3 font-serif text-3xl font-bold leading-snug text-[#2A4536] sm:text-4xl">{resource.organizationName}</h1>
        {resource.programName ? <p className="mt-1 text-lg font-semibold text-[#556B3E]">{resource.programName}</p> : null}

        {/* 5: verification trust strip */}
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-[#8FA467]/40 bg-[#F4F7EC] px-4 py-2.5 text-sm font-semibold text-[#3E5324]">
          <span aria-hidden>✓</span>
          <span>
            {t.verified}
            {verifiedDate ? ` · ${verifiedDate}` : ""}
          </span>
        </div>

        {/* 6: what they help with */}
        {description ? (
          <section className="mt-6" aria-labelledby="recurso-que-ayuda">
            <h2 id="recurso-que-ayuda" className="text-sm font-bold uppercase tracking-wide text-[#556B3E]">
              {t.whatHelp}
            </h2>
            <p className="mt-2 text-base leading-relaxed text-[#1F241C]">
              {description}
              {isEnglishFallback ? <span className="ml-1 text-sm font-semibold text-[#8B7E70]">(EN)</span> : null}
            </p>
          </section>
        ) : null}

        {/* 7: direct CTA section */}
        <section className="mt-6 rounded-xl border border-[#D6C7AD] bg-[#FFFDF7] p-4 sm:p-5">
          <ResourceQuickActions resource={resource} lang={recursosLang} layout="full" publicUrl={canonicalUrl} />
        </section>

        {/* 8–14: eligibility, cost, languages, service area, hours, address, source */}
        <dl className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {eligibility ? (
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-[#556B3E]">{t.eligibility}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-[#3D3428]">{eligibility}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-[#556B3E]">{t.cost}</dt>
            <dd className="mt-1 text-sm leading-relaxed text-[#3D3428]">{COST_LABEL[recursosLang][resource.costModel]}</dd>
          </div>
          {resource.languages && resource.languages.length > 0 ? (
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-[#556B3E]">{t.languages}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-[#3D3428]">{resource.languages.join(", ")}</dd>
            </div>
          ) : null}
          {resource.serviceArea ? (
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-[#556B3E]">{t.serviceArea}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-[#3D3428]">{resource.serviceArea}</dd>
            </div>
          ) : null}
          {(recursosLang === "en" ? resource.contact.hoursNoteEn : resource.contact.hoursNoteEs) ? (
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-[#556B3E]">{t.hours}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-[#3D3428]">
                {recursosLang === "en" ? resource.contact.hoursNoteEn : resource.contact.hoursNoteEs}
              </dd>
            </div>
          ) : null}
        </dl>

        {/* Safe address — never rendered when withheld, regardless of any stray field data */}
        {addressWithheld ? (
          <div className="mt-6 rounded-lg border border-[#C97A4A]/40 bg-[#FBF1E8] p-4 text-sm leading-relaxed text-[#7A3E1E]">
            {t.withheld}
          </div>
        ) : addressText ? (
          <div className="mt-6">
            <p className="text-xs font-bold uppercase tracking-wide text-[#556B3E]">{t.address}</p>
            <p className="mt-1 text-sm leading-relaxed text-[#3D3428]">{addressText}</p>
          </div>
        ) : null}

        {resource.verification.officialSourceUrl ? (
          <p className="mt-6 text-xs text-[#8B7E70]">
            {t.source}:{" "}
            <a href={resource.verification.officialSourceUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#556B3E] hover:underline">
              {resource.verification.officialSourceUrl}
            </a>
          </p>
        ) : null}

        {/* QR-ready destination representation — print/QR bridge, per PRINT → QR → SEARCH → ACTION */}
        <div className="mt-8 rounded-xl border border-dashed border-[#C9A84A]/50 bg-[#FAF6EE] p-4 text-xs text-[#5C564E]">
          <p className="font-semibold text-[#2A4536]">{t.scanNote}</p>
          <p className="mt-1 break-all font-mono">{canonicalUrl}</p>
        </div>

        {/* Related resources — same safety-gated data only */}
        {related.length > 0 ? (
          <section className="mt-12" aria-labelledby="recurso-relacionados">
            <h2 id="recurso-relacionados" className="font-serif text-xl font-bold text-[#2A4536]">
              {t.related}
            </h2>
            <ul className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <li key={r.slug} className="flex h-full">
                  <ResourceCard resource={r} lang={recursosLang} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="mt-10">
          <Link href={`${RECURSOS_BASE_PATH}?lang=${recursosLang}`} className="text-sm font-bold text-[#556B3E] hover:underline">
            {recursosLang === "en" ? "← Back to all resources" : "← Volver a todos los recursos"}
          </Link>
        </div>
      </div>
    </main>
  );
}
