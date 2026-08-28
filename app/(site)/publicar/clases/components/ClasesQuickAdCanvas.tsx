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
import { buildClasesContactCanvasModel } from "@/app/(site)/publicar/clases/lib/buildClasesContactCanvasModel";
import type { CommunityGlobalAnalyticsCtx } from "@/app/lib/clasificados/comunidad/comunidadClasesBuscoGlobalAnalytics";
import { formatTimeForDisplay, getActiveWeeklyScheduleGridItems } from "@/app/(site)/publicar/community/shared/lib/communityWeeklySchedule";
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
import { ClasesPaymentMethodBadge } from "@/app/(site)/publicar/clases/components/ClasesPaymentMethodBadge";

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
    paidNotice:
      "Esta clase tiene costo para el estudiante. La tarifa de anuncio Leonix es de $24.99 por 30 días; esa activación de pago aún no está disponible aquí.",
    online: "En línea",
    dateRange: "Fechas del curso",
    paymentMethods: "Pagos aceptados",
    leonixFee: "Tarifa de anuncio Leonix",
    oneTimeLabel: "Clase única",
    ongoingLabel: "Continua",
    bringOnly: "Qué llevar",
    materials: "Materiales / equipo",
    requirements: "Requisitos / antes de asistir",
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
    paidNotice:
      "This class has a cost for the student. The Leonix listing fee is $24.99 per 30 days; that paid activation isn't available here yet.",
    online: "Online",
    dateRange: "Course dates",
    paymentMethods: "Accepted payments",
    leonixFee: "Leonix listing fee",
    oneTimeLabel: "One-time class",
    ongoingLabel: "Ongoing",
    bringOnly: "What to bring",
    materials: "Materials / equipment",
    requirements: "Requirements / before you attend",
  },
} as const;

export type ClasesQuickAdShell = "standalone" | "embedded";

/** Long readable date, e.g. "1 de septiembre de 2026" / "September 1, 2026". */
function formatLongClassDate(iso: string, lang: Lang): string {
  if (!iso) return "";
  try {
    const d = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(lang === "en" ? "en-US" : "es-MX", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

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

  const audienceSlugs = draft.audiences.length > 0 ? draft.audiences : [draft.audience].filter(Boolean);
  const audienceLabels = audienceSlugs.map((a) => labelCommunityAudience(a, lang));
  const audienceSummary = audienceLabels.join(" + ");

  const levelParts: string[] = [];
  if (draft.skillLevel) levelParts.push(labelClasesSkillLevel(draft.skillLevel, lang));
  if (audienceSummary) levelParts.push(audienceSummary);
  const levelSummary = levelParts.join(" · ");

  const categorySlugs = draft.categories.length > 0 ? draft.categories : [draft.category].filter(Boolean);
  const categoryLabels = categorySlugs.map((slug) =>
    resolveClasesCategoryPublicLabel(slug, draft.categoryCustom, lang),
  );

  const chips: string[] = [...categoryLabels];
  chips.push(modeLabel);
  /** Cap audience chips shown to avoid chip soup — full list still shows in the info grid. */
  if (audienceLabels.length > 0) chips.push(audienceLabels.slice(0, 2).join(" + "));
  if (draft.skillLevel) chips.push(labelClasesSkillLevel(draft.skillLevel, lang));
  if (locationDisplay) chips.push(locationDisplay);
  chips.push(clasesCostLabel(draft.classCostType, lang));
  if (registrationLabel) chips.push(registrationLabel);

  const isOneTime = draft.scheduleMode === "one_time";
  const dateRangeLine = [draft.startDate.trim(), draft.endDate.trim()]
    .filter(Boolean)
    .map((iso) => formatLongClassDate(iso, lang))
    .join(" → ");
  const oneTimeDateLine = formatLongClassDate(draft.oneTimeDate.trim(), lang);
  const oneTimeTimeLine = [draft.oneTimeStart.trim(), draft.oneTimeEnd.trim()]
    .filter(Boolean)
    .map((t2) => formatTimeForDisplay(t2, schedLang))
    .join(" – ");

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
        <div className="pointer-events-none absolute right-3 top-3 flex flex-wrap justify-end gap-2">
          <span
            className={`rounded-full border-2 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide shadow-[0_2px_10px_rgba(0,0,0,0.28)] backdrop-blur-sm ${
              isPaid
                ? "border-[#5D3A12]/40 bg-[#FFF3E0]/95 text-[#5D3A12]"
                : "border-emerald-900/40 bg-[#E8F3EA]/95 text-[#1B4332]"
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
          organizerLogoUrl={draft.organizerLogoUrl}
          chips={chips}
        />

        <CommunityPremiumInfoGrid items={infoItems} />

        <CommunityPremiumTextCard
          title={t.description}
          body={draft.description}
          testId="community-premium-description"
        />

        {isOneTime ? (
          <div className="rounded-xl border border-[#C9B46A]/35 bg-white/70 p-3 sm:p-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#7B2D42]">
              {t.oneTimeLabel}
            </p>
            {oneTimeDateLine ? (
              <p className="mt-1 text-base font-bold text-[#2A2826]">{oneTimeDateLine}</p>
            ) : null}
            {oneTimeTimeLine ? (
              <p className="mt-0.5 text-sm text-[#5C564E]">{oneTimeTimeLine}</p>
            ) : null}
          </div>
        ) : (
          <>
            <p className="text-sm font-medium text-[#5C564E]">
              <span className="font-bold text-[#2A2826]">{t.dateRange}:</span>{" "}
              {dateRangeLine || t.ongoingLabel}
            </p>
            <CommunityPremiumScheduleCard title={t.schedule} rows={scheduleRows} lang={lang} />
          </>
        )}

        <CommunityPremiumTextCard title={t.bringOnly} body={draft.bringNote} testId="community-premium-bring" />
        <CommunityPremiumTextCard title={t.materials} body={draft.materialsNote} testId="community-premium-materials" />
        <CommunityPremiumTextCard title={t.requirements} body={draft.requirementsNote} testId="community-premium-requirements" />

        {draft.paymentMethods.length > 0 || isPaid ? (
          <div className="rounded-xl border border-[#C9B46A]/40 bg-white/70 px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-[#2A2826]">{t.cost}</span>
              <span className="text-sm font-semibold text-[#2A2826]">{priceSummary}</span>
            </div>
            <div className="mt-1 flex items-center justify-between gap-2 text-xs text-[#5C564E]">
              <span>{t.leonixFee}</span>
              <span className="font-semibold">
                {isPaid ? (lang === "es" ? "$24.99 por 30 días" : "$24.99 per 30 days") : t.free}
              </span>
            </div>
            {draft.paymentMethods.length > 0 ? (
              <div className="mt-3">
                <p className="text-xs font-bold uppercase tracking-wide text-[#5C564E]">{t.paymentMethods}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {draft.paymentMethods.map((id) => (
                    <ClasesPaymentMethodBadge key={id} lang={lang} id={id} otherLabel={draft.paymentMethodOther} />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <CommunityContactCanvas
          draft={draft}
          lang={lang}
          sectionHtmlId={contactSectionId}
          analyticsCtx={analyticsCtx}
          locationOnlineLabel={isOnline ? t.online : undefined}
          model={buildClasesContactCanvasModel(draft, lang)}
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
