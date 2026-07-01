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
import type { CommunityGlobalAnalyticsCtx } from "@/app/lib/clasificados/comunidad/comunidadClasesBuscoGlobalAnalytics";
import { getActiveWeeklyScheduleGridItems } from "@/app/(site)/publicar/community/shared/lib/communityWeeklySchedule";
import {
  cityStateZipLine,
  pickMainHeroImage,
  COMMUNITY_QUICK_HERO_OUTER,
  COMMUNITY_QUICK_HERO_INNER,
} from "@/app/(site)/publicar/community/shared/preview/communityQuickAdPrimitives";
import {
  CommunityPremiumIdentitySection,
  CommunityPremiumInfoGrid,
  CommunityPremiumScheduleCard,
  CommunityPremiumTextCard,
  CommunityPremiumTrustFooter,
} from "@/app/(site)/publicar/community/shared/preview/communityQuickPremiumShell";

const COPY = {
  es: {
    organizer: "Instructor / organizador",
    publicCity: "Ciudad / ubicación",
    cost: "Costo de la clase",
    free: "Gratis",
    modality: "Modalidad",
    level: "Nivel / audiencia",
    registration: "Registro",
    schedule: "Horario de la clase",
    description: "Descripción",
    bring: "Qué deben saber los alumnos / materiales",
    paidNotice:
      "Esta clase es de pago. La activación de publicación pagada está en preparación.",
    online: "En línea",
  },
  en: {
    organizer: "Instructor / organizer",
    publicCity: "City / location",
    cost: "Class cost",
    free: "Free",
    modality: "Mode",
    level: "Level / audience",
    registration: "Registration",
    schedule: "Class schedule",
    description: "Description",
    bring: "What students should know / materials",
    paidNotice: "This is a paid class. Paid publishing activation is in preparation.",
    online: "Online",
  },
} as const;

export type ClasesQuickAdShell = "standalone" | "embedded";

export function ClasesQuickAdCanvas({
  draft,
  lang,
  shell = "standalone",
  contactSectionId,
  heroTestId,
  analyticsCtx,
  leonixAdId,
}: {
  draft: ClasesQuickDraft;
  lang: Lang;
  shell?: ClasesQuickAdShell;
  contactSectionId?: string;
  heroTestId?: string;
  analyticsCtx?: CommunityGlobalAnalyticsCtx;
  leonixAdId?: string | null;
}) {
  const t = COPY[lang];
  const main = pickMainHeroImage(draft.images);
  const isPdf = main.kind === "pdf";
  const isPaid = draft.classCostType === "pagada";
  const rawPrice = draft.priceAmount.trim();
  const formattedPrice = rawPrice && /^\d/.test(rawPrice) && !rawPrice.startsWith("$") ? `$${rawPrice}` : rawPrice;
  const priceSummary = isPaid
    ? [formattedPrice, draft.priceFrequency ? clasesFrequencyLabel(draft.priceFrequency, lang) : ""]
        .filter(Boolean)
        .join(" · ")
    : t.free;

  const cityZipLine = cityStateZipLine({ ...draft, country: draft.country });
  const modeLabel = clasesModeLabel(draft.mode, lang);
  const isOnline = draft.mode === "enLinea";
  const locationDisplay = isOnline && !cityZipLine ? t.online : cityZipLine;
  const registrationLabel = draft.registrationRequired
    ? labelCommunityRegistration(draft.registrationRequired, lang)
    : "";

  const schedLang = lang === "en" ? "en" : "es";
  const scheduleRows = getActiveWeeklyScheduleGridItems(draft.weeklySchedule, schedLang);

  const levelParts: string[] = [];
  if (draft.skillLevel) levelParts.push(labelClasesSkillLevel(draft.skillLevel, lang));
  if (draft.audience) levelParts.push(labelCommunityAudience(draft.audience, lang));
  const levelSummary = levelParts.join(" · ");

  const chips: string[] = [];
  if (draft.category) {
    chips.push(resolveClasesCategoryPublicLabel(draft.category, draft.categoryCustom, lang));
  }
  chips.push(modeLabel);
  if (draft.audience) chips.push(labelCommunityAudience(draft.audience, lang));
  if (draft.skillLevel) chips.push(labelClasesSkillLevel(draft.skillLevel, lang));
  if (locationDisplay) chips.push(locationDisplay);
  chips.push(clasesCostLabel(draft.classCostType, lang));
  if (registrationLabel) chips.push(registrationLabel);

  const infoItems = [
    { key: "city", label: t.publicCity, value: locationDisplay },
    {
      key: "cost",
      label: t.cost,
      value: priceSummary,
      subValue: isPaid && draft.priceNote.trim() ? draft.priceNote.trim() : undefined,
    },
    { key: "level", label: t.level, value: levelSummary },
    { key: "mode", label: t.modality, value: modeLabel },
    { key: "reg", label: t.registration, value: registrationLabel },
  ];

  const articleClass =
    shell === "standalone"
      ? "mx-auto my-6 w-full max-w-4xl overflow-hidden rounded-2xl border border-[#C9B46A]/45 bg-[#FCF9F2] text-[#2A2826] shadow-md"
      : "mx-auto w-full max-w-4xl min-w-0 overflow-hidden rounded-xl text-[#2A2826]";

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
              className="object-contain object-center"
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
            {modeLabel}
          </span>
        </div>
        {isPdf ? (
          <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg bg-black/75 px-2.5 py-1 text-[10px] font-bold text-white">
            {lang === "es" ? "Solo PDF en este campo — añade imagen para el volante" : "PDF only here — add an image for the flyer"}
          </div>
        ) : null}
      </div>

      <div className="space-y-4 p-5 sm:p-7">
        <CommunityPremiumIdentitySection
          title={draft.title}
          organizerLabel={t.organizer}
          organizerName={draft.organizer}
          chips={chips}
        />

        <CommunityPremiumInfoGrid items={infoItems} />

        <CommunityPremiumScheduleCard title={t.schedule} rows={scheduleRows} lang={lang} />

        <CommunityPremiumTextCard title={t.bring} body={draft.bringNote} testId="community-premium-bring" />

        <CommunityPremiumTextCard
          title={t.description}
          body={draft.description}
          testId="community-premium-description"
        />

        <CommunityContactCanvas
          draft={draft}
          lang={lang}
          sectionHtmlId={contactSectionId}
          analyticsCtx={analyticsCtx}
          locationOnlineLabel={isOnline ? t.online : undefined}
        />

        {isPaid ? (
          <p className="rounded-xl border border-amber-300/70 bg-amber-50/85 px-3 py-2 text-xs font-medium text-amber-950">
            {t.paidNotice}
          </p>
        ) : null}

        <CommunityPremiumTrustFooter lang={lang} leonixAdId={leonixAdId ?? analyticsCtx?.leonixAdId} />
      </div>
    </article>
  );
}
