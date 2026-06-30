"use client";

import Image from "next/image";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import {
  labelClasesSkillLevel,
  labelCommunityAudience,
  labelCommunityRegistration,
  resolveClasesCategoryPublicLabel,
} from "@/app/(site)/publicar/community/shared/taxonomy/communityTaxonomy";
import { clasesCostLabel, clasesFrequencyLabel, clasesModeLabel } from "@/app/(site)/publicar/community/shared/copy/communityPublishCopy";
import type { ClasesQuickDraft } from "@/app/(site)/publicar/community/shared/types/communityQuickDraft";
import { CommunityContactCanvas } from "@/app/(site)/publicar/community/shared/preview/CommunityContactCanvas";
import { CommunityWeeklyScheduleAligned } from "@/app/(site)/publicar/community/shared/preview/CommunityWeeklyScheduleAligned";
import {
  cityStateZipLine,
  OrganizerByline,
  pickMainHeroImage,
  COMMUNITY_QUICK_WARM_CHIP,
  COMMUNITY_QUICK_HERO_OUTER,
  COMMUNITY_QUICK_HERO_INNER,
} from "@/app/(site)/publicar/community/shared/preview/communityQuickAdPrimitives";

const COPY = {
  es: {
    organizer: "Organizado por",
    publicCity: "Ciudad",
    schedule: "Horario",
    cost: "Costo",
    free: "Gratis",
    priceNote: "Nota de precio",
    contact: "Contacto",
    description: "Descripción",
    paidNotice:
      "Esta clase es de pago. La activación de publicación pagada está en preparación.",
    registration: "Registro",
    bring: "Qué llevar o saber",
  },
  en: {
    organizer: "Organized by",
    publicCity: "City",
    schedule: "Schedule",
    cost: "Cost",
    free: "Free",
    priceNote: "Price note",
    contact: "Contact",
    description: "Description",
    paidNotice: "This is a paid class. Paid publishing activation is in preparation.",
    registration: "Registration",
    bring: "What to bring or know",
  },
} as const;

export type ClasesQuickAdShell = "standalone" | "embedded";

export function ClasesQuickAdCanvas({
  draft,
  lang,
  shell = "standalone",
  contactSectionId,
  heroTestId,
}: {
  draft: ClasesQuickDraft;
  lang: Lang;
  shell?: ClasesQuickAdShell;
  contactSectionId?: string;
  heroTestId?: string;
}) {
  const t = COPY[lang];
  const main = pickMainHeroImage(draft.images);
  const isPdf = main.kind === "pdf";
  const isPaid = draft.classCostType === "pagada";
  const priceSummary = isPaid
    ? [draft.priceAmount.trim(), draft.priceFrequency ? `· ${clasesFrequencyLabel(draft.priceFrequency, lang)}` : ""]
        .filter(Boolean)
        .join(" ")
    : t.free;

  const cityZipLine = cityStateZipLine({ ...draft, country: draft.country });

  const articleClass =
    shell === "standalone"
      ? "mx-auto my-6 w-full max-w-4xl overflow-hidden rounded-2xl border border-[#C9B46A]/45 bg-[#FCF9F2] text-[#2A2826] shadow-md"
      : "mx-auto w-full max-w-4xl overflow-hidden rounded-xl text-[#2A2826]";

  return (
    <article className={articleClass}>
      <div
        data-testid={heroTestId}
        data-community-flyer-kind={main.kind}
        data-community-flyer-src={main.kind === "image" || main.kind === "fallback" ? main.url : ""}
        className={COMMUNITY_QUICK_HERO_OUTER}
      >
        <div className={COMMUNITY_QUICK_HERO_INNER}>
          {isPdf ? (
            <div className="flex h-full min-h-[min(50vh,520px)] flex-col items-center justify-center gap-3 bg-[#E8E4DC] px-6 text-center">
              <p className="text-base font-bold text-[#2A2826]">
                {lang === "es" ? "Volante en PDF" : "PDF flyer"}
              </p>
              <p className="max-w-md text-sm text-[#5C564E]">
                {lang === "es"
                  ? "Sube también una imagen JPG, PNG o WebP del volante para mostrarla aquí con la misma vista que en publicación."
                  : "Upload a JPG, PNG, or WebP image of your flyer to show it here (same as on the live listing)."}
              </p>
            </div>
          ) : (
            <Image
              src={main.url}
              alt={main.alt}
              fill
              className="object-contain object-top"
              sizes="(max-width: 768px) 100vw, 960px"
              unoptimized
            />
          )}
        </div>
        <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-2">
          <span
            className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${
              isPaid
                ? "border-amber-800/35 bg-[#FFF3E0] text-[#5D4037]"
                : "border-emerald-800/30 bg-[#E8F3EA] text-[#1B4332]"
            }`}
          >
            {clasesCostLabel(draft.classCostType, lang)}
          </span>
          <span className="rounded-full border border-[#5C4A2A]/45 bg-[#3D3428]/92 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#FFFCF7]">
            {clasesModeLabel(draft.mode, lang)}
          </span>
        </div>
        {isPdf ? (
          <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg bg-black/75 px-2.5 py-1 text-[10px] font-bold text-white">
            {lang === "es" ? "Solo PDF en este campo — añade imagen para el volante" : "PDF only here — add an image for the flyer"}
          </div>
        ) : null}
      </div>
      <div className="space-y-4 p-5 sm:p-7">
        <header>
          <h1 className="text-2xl font-extrabold leading-tight sm:text-3xl lg:text-4xl">
            {draft.title.trim() || "—"}
          </h1>
          <OrganizerByline label={t.organizer} name={draft.organizer.trim() || "—"} />
          <div className="mt-3 flex flex-wrap gap-2">
            {draft.category ? (
              <span className={COMMUNITY_QUICK_WARM_CHIP}>
                {resolveClasesCategoryPublicLabel(draft.category, draft.categoryCustom, lang)}
              </span>
            ) : null}
            <span className={COMMUNITY_QUICK_WARM_CHIP}>{clasesModeLabel(draft.mode, lang)}</span>
            {draft.audience ? <span className={COMMUNITY_QUICK_WARM_CHIP}>{labelCommunityAudience(draft.audience, lang)}</span> : null}
            {draft.skillLevel ? <span className={COMMUNITY_QUICK_WARM_CHIP}>{labelClasesSkillLevel(draft.skillLevel, lang)}</span> : null}
            {cityZipLine ? <span className={COMMUNITY_QUICK_WARM_CHIP}>{cityZipLine}</span> : null}
          </div>
        </header>

        <dl className="grid gap-4 text-[15px] sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-[#9A948C]">{t.publicCity}</dt>
            <dd className="mt-0.5 font-semibold">{cityZipLine || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-[#9A948C]">{t.cost}</dt>
            <dd className="mt-0.5 font-semibold">{priceSummary}</dd>
            {isPaid && draft.priceNote.trim() ? (
              <p className="text-[11px] text-[#5C564E]">
                {t.priceNote}: {draft.priceNote.trim()}
              </p>
            ) : null}
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-[#9A948C]">{t.registration}</dt>
            <dd className="mt-0.5 font-semibold">
              {draft.registrationRequired ? labelCommunityRegistration(draft.registrationRequired, lang) : "—"}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-[#9A948C]">{t.schedule}</dt>
            <dd className="mt-0.5 min-w-0">
              <CommunityWeeklyScheduleAligned rows={draft.weeklySchedule} lang={lang} />
            </dd>
          </div>
          {draft.bringNote.trim() ? (
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-[#9A948C]">{t.bring}</dt>
              <dd className="mt-0.5 whitespace-pre-line">{draft.bringNote.trim()}</dd>
            </div>
          ) : null}
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-[#9A948C]">{t.description}</dt>
            <dd className="mt-0.5 whitespace-pre-line">{draft.description.trim() || "—"}</dd>
          </div>
        </dl>

        <CommunityContactCanvas draft={draft} lang={lang} sectionHtmlId={contactSectionId} />

        {isPaid ? (
          <p className="rounded-xl border border-amber-300/70 bg-amber-50/85 px-3 py-2 text-xs font-medium text-amber-950">
            {t.paidNotice}
          </p>
        ) : null}
      </div>
    </article>
  );
}
