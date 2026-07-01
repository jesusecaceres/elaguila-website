"use client";

import Image from "next/image";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { formatTimeForDisplay, getActiveWeeklyScheduleGridItems } from "@/app/(site)/publicar/community/shared/lib/communityWeeklySchedule";
import {
  labelComunidadAccessibilityKey,
  labelCommunityAudience,
  labelCommunityRegistration,
  resolveComunidadEventTypePublicLabel,
} from "@/app/(site)/publicar/community/shared/taxonomy/communityTaxonomy";
import { comunidadCostLabel } from "@/app/(site)/publicar/community/shared/copy/communityPublishCopy";
import { formatAdmissionWithDollar } from "@/app/(site)/clasificados/community/CommunityQuickAnuncioDetail";
import type { ComunidadQuickDraft } from "@/app/(site)/publicar/community/shared/types/communityQuickDraft";
import { CommunityContactCanvas } from "@/app/(site)/publicar/community/shared/preview/CommunityContactCanvas";
import type { CommunityGlobalAnalyticsCtx } from "@/app/lib/clasificados/comunidad/comunidadClasesBuscoGlobalAnalytics";
import {
  cityStateZipLine,
  pickMainHeroImage,
  formatDateIso,
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
    organizer: "Organizado por",
    publicCity: "Ciudad / ubicación",
    eventCost: "Costo del evento",
    registration: "Registro",
    eventDate: "Fecha del evento",
    eventWeekly: "Días y horarios del evento",
    time: "Horario",
    description: "Descripción",
    bring: "Qué llevar o saber",
  },
  en: {
    organizer: "Organized by",
    publicCity: "City / location",
    eventCost: "Event cost",
    registration: "Registration",
    eventDate: "Event date",
    eventWeekly: "Event days & times",
    time: "Time",
    description: "Description",
    bring: "What to bring or know",
  },
} as const;

function formatComunidadEventDateRange(draft: ComunidadQuickDraft, lang: Lang): string {
  const a = draft.date.trim();
  const b = draft.eventEndDate.trim();
  if (!a) return "";
  if (!b || b === a) return formatDateIso(a, lang);
  return `${formatDateIso(a, lang)} – ${formatDateIso(b, lang)}`;
}

export type ComunidadQuickAdShell = "standalone" | "embedded";

export function ComunidadQuickAdCanvas({
  draft,
  lang,
  shell = "standalone",
  contactSectionId,
  heroTestId,
  analyticsCtx,
  leonixAdId,
}: {
  draft: ComunidadQuickDraft;
  lang: Lang;
  shell?: ComunidadQuickAdShell;
  contactSectionId?: string;
  heroTestId?: string;
  analyticsCtx?: CommunityGlobalAnalyticsCtx;
  leonixAdId?: string | null;
}) {
  const t = COPY[lang];
  const main = pickMainHeroImage(draft.images);
  const isPdf = main.kind === "pdf";
  const cityZipLine = cityStateZipLine({ ...draft, country: draft.country });
  const sessStart = draft.eventSessionStart.trim();
  const sessEnd = draft.eventSessionEnd.trim();
  const schedLang = lang === "en" ? "en" : "es";
  const scheduleRows = getActiveWeeklyScheduleGridItems(draft.weeklySchedule, schedLang);
  const dateRange = formatComunidadEventDateRange(draft, lang);
  const costLabel = comunidadCostLabel(draft.eventCost, lang);
  const registrationLabel = draft.registrationRequired
    ? labelCommunityRegistration(draft.registrationRequired, lang)
    : "";

  const chips: string[] = [];
  if (draft.category) {
    chips.push(resolveComunidadEventTypePublicLabel(draft.category, draft.categoryCustom, lang));
  }
  if (draft.audience) chips.push(labelCommunityAudience(draft.audience, lang));
  if (dateRange) chips.push(dateRange);
  if (cityZipLine) chips.push(cityZipLine);
  chips.push(costLabel);
  if (registrationLabel) chips.push(registrationLabel);
  if (draft.accessibilityKeys.length) {
    chips.push(draft.accessibilityKeys.map((k) => labelComunidadAccessibilityKey(k, lang)).join(" · "));
  }

  const infoItems = [
    { key: "city", label: t.publicCity, value: cityZipLine },
    { key: "cost", label: t.eventCost, value: costLabel, subValue: draft.admissionNote.trim() ? formatAdmissionWithDollar(draft.admissionNote.trim()) : undefined },
    { key: "reg", label: t.registration, value: registrationLabel },
    { key: "date", label: t.eventDate, value: dateRange },
  ];

  const singleScheduleRow =
    !scheduleRows.length && sessStart && sessEnd
      ? {
          dayLabel: t.time,
          timeRange: `${formatTimeForDisplay(sessStart, schedLang)} – ${formatTimeForDisplay(sessEnd, schedLang)}`,
        }
      : null;

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
              draft.eventCost === "gratis"
                ? "border-emerald-800/30 bg-[#E8F3EA] text-[#1B4332]"
                : "border-amber-800/35 bg-[#FFF3E0] text-[#5D4037]"
            }`}
          >
            {costLabel}
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

        <CommunityPremiumScheduleCard
          title={t.eventWeekly}
          rows={scheduleRows}
          singleRow={singleScheduleRow}
          lang={lang}
        />

        <CommunityPremiumTextCard
          title={t.bring}
          body={draft.bringNote}
          testId="community-premium-bring"
        />

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
        />

        <CommunityPremiumTrustFooter lang={lang} leonixAdId={leonixAdId ?? analyticsCtx?.leonixAdId} />
      </div>
    </article>
  );
}
