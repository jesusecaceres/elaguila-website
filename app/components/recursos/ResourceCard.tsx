import Link from "next/link";
import { getPrimaryCategoryLabel } from "@/app/lib/recursos/categories";
import { resolveBilingualField } from "@/app/lib/recursos/recursosBilingualFallback";
import { recursosResourceHref } from "@/app/lib/recursos/recursosUrls";
import type { RecursosLang } from "@/app/lib/recursos/types";
import type { PublicResourceWithSpanishTrust } from "@/app/lib/recursos/server/communityResourcesPublicQueries";
import { getUrgencyLabel } from "@/app/lib/recursos/urgency";
import { URGENCY_STYLE } from "@/app/lib/recursos/urgencyStyle";
import { ResourceQuickActions } from "./ResourceQuickActions";

const VERIFIED_LABEL: Record<RecursosLang, (date: string | null) => string> = {
  es: (date) => (date ? `Verificado · ${date}` : "Verificado"),
  en: (date) => (date ? `Verified · ${date}` : "Verified"),
};

function formatVerifiedDate(iso: string | null | undefined, lang: RecursosLang): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(lang === "en" ? "en-US" : "es-US", { year: "numeric", month: "short" });
}

/**
 * Answers, in order: who / what / for whom / where / act now / is it current — per the
 * approved result-card hierarchy. No ratings, no reviews, no fabricated open/closed status.
 */
export function ResourceCard({ resource, lang }: { resource: PublicResourceWithSpanishTrust; lang: RecursosLang }) {
  const treatment = URGENCY_STYLE[resource.urgencyLevel];
  const description = resolveBilingualField({ esValue: resource.shortDescriptionEs, enValue: resource.shortDescriptionEn, lang, spanishStatus: resource.spanishStatus });
  const eligibility = resolveBilingualField({ esValue: resource.eligibilityEs, enValue: resource.eligibilityEn, lang, spanishStatus: resource.spanishStatus });
  const verifiedDate = formatVerifiedDate(resource.verification.lastVerifiedAt, lang);
  const href = recursosResourceHref(resource.slug, lang);

  return (
    <article className="flex h-full flex-col rounded-xl border border-[#D6C7AD] bg-[#FFFDF7] p-5 shadow-[0_8px_24px_-16px_rgba(31,36,28,0.15)]">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide"
          style={{ borderColor: treatment.border, backgroundColor: treatment.bg, color: treatment.text }}
        >
          {getUrgencyLabel(resource.urgencyLevel, lang)}
        </span>
        <span className="inline-flex items-center rounded-full border border-[#C9A84A]/50 bg-[#FAF6EE] px-2.5 py-0.5 text-[11px] font-semibold text-[#2A4536]">
          {getPrimaryCategoryLabel(resource.primaryCategory, lang)}
        </span>
      </div>

      <h3 className="mt-3 text-base font-bold leading-snug text-[#1F241C]">
        <Link href={href} className="hover:underline">
          {resource.organizationName}
        </Link>
      </h3>
      {resource.programName ? <p className="text-sm font-semibold text-[#556B3E]">{resource.programName}</p> : null}

      {description.value ? (
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-[#3D3428]">
          {description.value}
          {description.isFallback ? <span className="ml-1 text-xs font-semibold text-[#8B7E70]">(EN)</span> : null}
        </p>
      ) : (
        <div className="flex-1" />
      )}

      {eligibility.value ? (
        <p className="mt-2 text-xs leading-relaxed text-[#5C564E]">
          {eligibility.value}
          {eligibility.isFallback ? <span className="ml-1 text-[10px] font-semibold text-[#8B7E70]">(EN)</span> : null}
        </p>
      ) : null}
      {resource.serviceArea ? <p className="mt-1 text-xs font-semibold text-[#5C564E]">{resource.serviceArea}</p> : null}

      <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-[#3E5324]">
        <span aria-hidden>✓</span>
        <span>{VERIFIED_LABEL[lang](verifiedDate)}</span>
      </div>

      <div className="mt-4 border-t border-[#D6C7AD]/60 pt-4">
        <ResourceQuickActions resource={resource} lang={lang} layout="compact" publicUrl={href} />
      </div>
    </article>
  );
}
