/**
 * Quick → CLASES and COMUNIDAD. Both feed the shared community session draft
 * (`COMMUNITY_SESSION_KEYS.*`) exactly as the canonical quick applications do, then hand off to the
 * existing preview route. Zero canonical code is touched.
 */

import type { DayHoursRow, DayKey } from "@/app/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes";
import { COMMUNITY_SESSION_KEYS } from "@/app/publicar/community/shared/constants/communitySessionKeys";
import { communityHandoffPreviewUrl } from "@/app/publicar/community/shared/constants/communityPublishRoutes";
import { flushCommunityDraftToSession } from "@/app/publicar/community/shared/hooks/useCommunityDraftSession";
import { COMMUNITY_WEEK_ORDER, emptyCommunityWeeklySchedule } from "@/app/publicar/community/shared/lib/communityWeeklySchedule";
import { gateClasesQuickPreview, gateComunidadQuickPreview } from "@/app/publicar/community/shared/required/communityRequiredForPreview";
import {
  CLASES_CATEGORY_OPTIONS,
  CLASES_SKILL_LEVEL_OPTIONS,
  COMMUNITY_AUDIENCE_OPTIONS,
  COMMUNITY_REGISTRATION_OPTIONS,
  COMUNIDAD_CATEGORY_OPTIONS,
} from "@/app/publicar/community/shared/taxonomy/communityTaxonomy";
import {
  emptyClasesQuickDraft,
  emptyComunidadQuickDraft,
  normalizeClasesQuickDraft,
  normalizeComunidadQuickDraft,
  type ClasesQuickDraft,
  type ComunidadQuickDraft,
  type CommunityPrimaryCta,
} from "@/app/publicar/community/shared/types/communityQuickDraft";
import type { SupportedLang } from "@/app/lib/language";
import type { QuickClassifiedCategoryAdapter, QuickFieldOption, QuickIntakeStep, QuickIntakeValues } from "@/app/lib/quickClassifieds/quickClassifiedTypes";
import { quickList, quickStr } from "@/app/lib/quickClassifieds/quickClassifiedValidation";
import { cityField, contactStep, mediaToEmpleosImageItems, optionsFromEsEn, resolveCity } from "./quickAdapterShared";

const DAY_LABELS: Record<DayKey, { es: string; en: string }> = {
  mon: { es: "Lun", en: "Mon" },
  tue: { es: "Mar", en: "Tue" },
  wed: { es: "Mié", en: "Wed" },
  thu: { es: "Jue", en: "Thu" },
  fri: { es: "Vie", en: "Fri" },
  sat: { es: "Sáb", en: "Sat" },
  sun: { es: "Dom", en: "Sun" },
};

const DAY_OPTIONS: QuickFieldOption[] = COMMUNITY_WEEK_ORDER.map((d) => ({ value: d, label: DAY_LABELS[d] }));

function weeklyFrom(values: QuickIntakeValues): DayHoursRow[] {
  const days = new Set(quickList(values, "weeklyDays"));
  const open = quickStr(values, "weeklyStart");
  const close = quickStr(values, "weeklyEnd");
  return emptyCommunityWeeklySchedule().map((row) =>
    days.has(row.day) ? { ...row, closed: false, open, close } : { ...row, closed: true, open: "", close: "" },
  );
}

function primaryCtaFrom(values: QuickIntakeValues): CommunityPrimaryCta {
  if (quickStr(values, "phone")) return "phone";
  if (quickStr(values, "whatsapp")) return "whatsapp";
  if (quickStr(values, "email")) return "email";
  return "phone";
}

const isCustom = (key: string) => (v: QuickIntakeValues) => quickStr(v, key) === "otro";

// ---------------------------------------------------------------- CLASES

const isOneTime = (v: QuickIntakeValues) => quickStr(v, "scheduleMode") !== "recurring";
const isRecurring = (v: QuickIntakeValues) => quickStr(v, "scheduleMode") === "recurring";

const CLASES_STEPS: readonly QuickIntakeStep[] = [
  {
    id: "class",
    title: { es: "Tu clase", en: "Your class" },
    fields: [
      { key: "title", kind: "text", label: { es: "Título de la clase", en: "Class title" }, placeholder: { es: "Ej. Clases de guitarra para principiantes", en: "e.g. Guitar lessons for beginners" }, required: true, maxLength: 120 },
      { key: "organizer", kind: "text", label: { es: "Instructor / organizador", en: "Instructor / organizer" }, required: true, maxLength: 80 },
      { key: "category", kind: "select", label: { es: "Tipo de clase", en: "Class type" }, required: true, options: optionsFromEsEn(CLASES_CATEGORY_OPTIONS) },
      { key: "categoryCustom", kind: "text", label: { es: "Escribe el tipo de clase", en: "Enter the class type" }, required: isCustom("category"), showWhen: isCustom("category"), maxLength: 60 },
      { key: "mode", kind: "chips", maxSelections: 1, label: { es: "Modalidad", en: "Mode" }, required: true, options: [{ value: "presencial", label: { es: "Presencial", en: "In person" } }, { value: "enLinea", label: { es: "En línea", en: "Online" } }, { value: "hibrida", label: { es: "Híbrida", en: "Hybrid" } }] },
      { key: "audience", kind: "chips", maxSelections: 1, label: { es: "¿Para quién es?", en: "Who is it for?" }, required: true, options: optionsFromEsEn(COMMUNITY_AUDIENCE_OPTIONS) },
      { key: "skillLevel", kind: "chips", maxSelections: 1, label: { es: "Nivel", en: "Level" }, required: true, options: optionsFromEsEn(CLASES_SKILL_LEVEL_OPTIONS) },
      { key: "registrationRequired", kind: "chips", maxSelections: 1, label: { es: "¿Requiere registro?", en: "Registration required?" }, required: true, options: optionsFromEsEn(COMMUNITY_REGISTRATION_OPTIONS) },
      { key: "description", kind: "textarea", label: { es: "Descripción corta", en: "Short description" }, required: true, maxLength: 2000 },
      cityField("canonical", { es: "Ciudad donde se ofrece", en: "City where it is offered" }),
    ],
  },
  {
    id: "when",
    title: { es: "¿Cuándo es?", en: "When is it?" },
    fields: [
      { key: "scheduleMode", kind: "chips", maxSelections: 1, label: { es: "Tipo de horario", en: "Schedule type" }, required: true, options: [{ value: "one_time", label: { es: "Una sola fecha", en: "One date" } }, { value: "recurring", label: { es: "Se repite cada semana", en: "Repeats weekly" } }] },
      { key: "oneTimeDate", kind: "date", label: { es: "Fecha", en: "Date" }, required: isOneTime, showWhen: isOneTime },
      { key: "oneTimeStart", kind: "time", label: { es: "Hora de inicio", en: "Start time" }, required: isOneTime, showWhen: isOneTime },
      { key: "oneTimeEnd", kind: "time", label: { es: "Hora de fin", en: "End time" }, required: isOneTime, showWhen: isOneTime },
      { key: "weeklyDays", kind: "chips", label: { es: "Días", en: "Days" }, required: isRecurring, showWhen: isRecurring, options: DAY_OPTIONS },
      { key: "weeklyStart", kind: "time", label: { es: "Hora de inicio", en: "Start time" }, required: isRecurring, showWhen: isRecurring },
      { key: "weeklyEnd", kind: "time", label: { es: "Hora de fin", en: "End time" }, required: isRecurring, showWhen: isRecurring },
    ],
  },
  contactStep({ nameKey: null }),
];

export const clasesQuickAdapter: QuickClassifiedCategoryAdapter = {
  category: "clases",
  steps: CLASES_STEPS,
  confirmations: { kind: "community", variant: "clases" },
  async buildAndWriteCanonicalDraft({ values, media, confirmations, ctx }) {
    const recurring = isRecurring(values);
    const category = quickStr(values, "category");
    const audience = quickStr(values, "audience");
    const draft: ClasesQuickDraft = normalizeClasesQuickDraft({
      ...emptyClasesQuickDraft(),
      title: quickStr(values, "title"),
      organizer: quickStr(values, "organizer"),
      category,
      categories: category ? [category] : [],
      categoryCustom: quickStr(values, "categoryCustom"),
      // Paid classes cannot publish today (shouldBlockClasesPaidPublish) — Quick pins the free posture; the
      // customer can change it in the existing application.
      classCostType: "gratis",
      mode: (quickStr(values, "mode") || "presencial") as ClasesQuickDraft["mode"],
      audience,
      audiences: audience ? [audience] : [],
      skillLevel: quickStr(values, "skillLevel"),
      registrationRequired: quickStr(values, "registrationRequired"),
      scheduleMode: recurring ? "recurring" : "one_time",
      oneTimeDate: recurring ? "" : quickStr(values, "oneTimeDate"),
      oneTimeStart: recurring ? "" : quickStr(values, "oneTimeStart"),
      oneTimeEnd: recurring ? "" : quickStr(values, "oneTimeEnd"),
      weeklySchedule: recurring ? weeklyFrom(values) : emptyCommunityWeeklySchedule(),
      description: quickStr(values, "description"),
      images: mediaToEmpleosImageItems(media),
      publicCity: resolveCity(values),
      phone: quickStr(values, "phone"),
      whatsapp: quickStr(values, "whatsapp"),
      email: quickStr(values, "email"),
      primaryCta: primaryCtaFrom(values),
      publishConfirmations: { ...confirmations },
    });
    const gate = gateClasesQuickPreview(draft, ctx.lang);
    if (!gate.ok) return { ok: false, issues: gate.issues };
    flushCommunityDraftToSession(COMMUNITY_SESSION_KEYS.clases, draft, normalizeClasesQuickDraft);
    return { ok: true, handoff: { kind: "preview", href: communityHandoffPreviewUrl("clases", ctx.routeLang as SupportedLang) } };
  },
};

// ---------------------------------------------------------------- COMUNIDAD

const costNeedsNote = (v: QuickIntakeValues) => {
  const c = quickStr(v, "eventCost");
  return c === "pagado" || c === "donacion";
};

const COMUNIDAD_STEPS: readonly QuickIntakeStep[] = [
  {
    id: "event",
    title: { es: "Tu evento", en: "Your event" },
    fields: [
      { key: "title", kind: "text", label: { es: "Título del evento", en: "Event title" }, placeholder: { es: "Ej. Kermés de la parroquia San Juan", en: "e.g. St. John parish fair" }, required: true, maxLength: 120 },
      { key: "organizer", kind: "text", label: { es: "Organizador", en: "Organizer" }, required: true, maxLength: 80 },
      { key: "category", kind: "select", label: { es: "Tipo de evento", en: "Event type" }, required: true, options: optionsFromEsEn(COMUNIDAD_CATEGORY_OPTIONS) },
      { key: "categoryCustom", kind: "text", label: { es: "Describe el tipo de evento", en: "Describe the event type" }, required: isCustom("category"), showWhen: isCustom("category"), maxLength: 60 },
      { key: "audience", kind: "chips", maxSelections: 1, label: { es: "¿Para quién es?", en: "Who is it for?" }, required: true, options: optionsFromEsEn(COMMUNITY_AUDIENCE_OPTIONS) },
      { key: "registrationRequired", kind: "chips", maxSelections: 1, label: { es: "¿Requiere registro?", en: "Registration required?" }, required: true, options: optionsFromEsEn(COMMUNITY_REGISTRATION_OPTIONS) },
      { key: "eventCost", kind: "chips", maxSelections: 1, label: { es: "Costo", en: "Cost" }, required: true, options: [{ value: "gratis", label: { es: "Gratis", en: "Free" } }, { value: "pagado", label: { es: "Con costo", en: "Paid" } }, { value: "donacion", label: { es: "Donación", en: "Donation" } }, { value: "noConfirmado", label: { es: "Por confirmar", en: "To be confirmed" } }] },
      { key: "admissionNote", kind: "text", label: { es: "Nota de admisión (precio / donación)", en: "Admission note (price / donation)" }, required: costNeedsNote, showWhen: costNeedsNote, maxLength: 120 },
      { key: "description", kind: "textarea", label: { es: "Descripción corta", en: "Short description" }, required: true, maxLength: 2000 },
      cityField("canonical", { es: "Ciudad del evento", en: "Event city" }),
      { key: "venue", kind: "text", label: { es: "Lugar (nombre del sitio)", en: "Venue (place name)" }, maxLength: 120 },
    ],
  },
  {
    id: "when",
    title: { es: "¿Cuándo es?", en: "When is it?" },
    fields: [
      { key: "date", kind: "date", label: { es: "Fecha", en: "Date" }, required: true },
      { key: "eventEndDate", kind: "date", label: { es: "Fecha de fin (si dura varios días)", en: "End date (if multi-day)" } },
      { key: "eventSessionStart", kind: "time", label: { es: "Hora de inicio", en: "Start time" }, required: true },
      { key: "eventSessionEnd", kind: "time", label: { es: "Hora de fin", en: "End time" }, required: true },
    ],
  },
  contactStep({ nameKey: null }),
];

export const comunidadQuickAdapter: QuickClassifiedCategoryAdapter = {
  category: "comunidad",
  steps: COMUNIDAD_STEPS,
  confirmations: { kind: "community", variant: "comunidad" },
  async buildAndWriteCanonicalDraft({ values, media, confirmations, ctx }) {
    const draft: ComunidadQuickDraft = normalizeComunidadQuickDraft({
      ...emptyComunidadQuickDraft(),
      title: quickStr(values, "title"),
      organizer: quickStr(values, "organizer"),
      category: quickStr(values, "category"),
      categoryCustom: quickStr(values, "categoryCustom"),
      audience: quickStr(values, "audience"),
      registrationRequired: quickStr(values, "registrationRequired"),
      eventCost: (quickStr(values, "eventCost") || "gratis") as ComunidadQuickDraft["eventCost"],
      admissionNote: quickStr(values, "admissionNote"),
      date: quickStr(values, "date"),
      eventEndDate: quickStr(values, "eventEndDate"),
      eventSessionStart: quickStr(values, "eventSessionStart"),
      eventSessionEnd: quickStr(values, "eventSessionEnd"),
      description: quickStr(values, "description"),
      images: mediaToEmpleosImageItems(media),
      publicCity: resolveCity(values),
      venue: quickStr(values, "venue"),
      phone: quickStr(values, "phone"),
      whatsapp: quickStr(values, "whatsapp"),
      email: quickStr(values, "email"),
      primaryCta: primaryCtaFrom(values),
      publishConfirmations: { ...confirmations },
    });
    const gate = gateComunidadQuickPreview(draft, ctx.lang);
    if (!gate.ok) return { ok: false, issues: gate.issues };
    flushCommunityDraftToSession(COMMUNITY_SESSION_KEYS.comunidad, draft, normalizeComunidadQuickDraft);
    return { ok: true, handoff: { kind: "preview", href: communityHandoffPreviewUrl("comunidad", ctx.routeLang as SupportedLang) } };
  },
};
