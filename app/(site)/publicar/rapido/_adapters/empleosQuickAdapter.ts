/**
 * Quick → EMPLEOS standard paid job post (lane `quick`). Feeds `EmpleosQuickDraft` under the canonical session
 * key and hands off to the EXISTING preview (`/clasificados/empleos/quick-preview?from=publicar`), which owns the
 * existing paid checkout. Unblocked by the Gate 5 media wiring repair (empleosDraftMediaUpload.ts).
 */

import { sampleCategorySelectOptions, sampleJobTypeSelectOptions } from "@/app/clasificados/empleos/data/empleosLandingSampleData";
import type { JobModalitySlug } from "@/app/clasificados/empleos/data/empleosJobTypes";
import { EMPLEOS_SESSION_KEYS } from "@/app/publicar/empleos/shared/constants/empleosSessionKeys";
import { empleosHandoffPreviewUrl } from "@/app/publicar/empleos/shared/constants/empleosPublishRoutes";
import { flushEmpleosDraftToSession } from "@/app/publicar/empleos/shared/lib/flushEmpleosDraftToSession";
import { EMPLEOS_PAY_UNIT_OPTIONS_EN, EMPLEOS_PAY_UNIT_OPTIONS_ES } from "@/app/publicar/empleos/shared/lib/empleosPayDisplay";
import { gateEmpleosQuickPreview } from "@/app/publicar/empleos/shared/required/empleosRequiredForPreview";
import { emptyEmpleosQuickDraft, normalizeEmpleosQuickDraft, type EmpleosQuickDraft } from "@/app/publicar/empleos/shared/types/empleosQuickDraft";
import type { SupportedLang } from "@/app/lib/language";
import type { QuickClassifiedCategoryAdapter, QuickFieldOption, QuickIntakeStep, QuickIntakeValues } from "@/app/lib/quickClassifieds/quickClassifiedTypes";
import { quickStr, quickWholeDollars } from "@/app/lib/quickClassifieds/quickClassifiedValidation";
import { cityField, contactStep, mediaToEmpleosImageItems, resolveCity } from "./quickAdapterShared";

/** The existing application uses these ES-labelled lists for both languages — mirrored, not re-labelled. */
const JOB_TYPE_OPTIONS: QuickFieldOption[] = sampleJobTypeSelectOptions.filter((o) => o.value).map((o) => ({ value: o.value, label: { es: o.label, en: o.label } }));
const CATEGORY_OPTIONS: QuickFieldOption[] = sampleCategorySelectOptions.filter((o) => o.value).map((o) => ({ value: o.value, label: { es: o.label, en: o.label } }));
const PAY_UNIT_OPTIONS: QuickFieldOption[] = EMPLEOS_PAY_UNIT_OPTIONS_ES.filter((o) => o.value).map((o) => ({
  value: o.value,
  label: { es: o.label, en: EMPLEOS_PAY_UNIT_OPTIONS_EN.find((e) => e.value === o.value)?.label ?? o.label },
}));

const payNeedsAmount = (v: QuickIntakeValues) => {
  const u = quickStr(v, "payUnit");
  return Boolean(u) && u !== "a-convenir";
};

const STEPS: readonly QuickIntakeStep[] = [
  {
    id: "job",
    title: { es: "La vacante", en: "The job" },
    fields: [
      { key: "title", kind: "text", label: { es: "Puesto", en: "Job title" }, placeholder: { es: "Ej. Cocinero de línea", en: "e.g. Line cook" }, required: true, maxLength: 120 },
      { key: "businessName", kind: "text", label: { es: "Empresa o negocio", en: "Company or business" }, required: true, maxLength: 80, autoComplete: "organization" },
      { key: "jobType", kind: "chips", maxSelections: 1, label: { es: "Tipo de empleo", en: "Job type" }, required: true, options: JOB_TYPE_OPTIONS },
      { key: "jobTypeCustom", kind: "text", label: { es: "Describe el tipo de empleo", en: "Describe the job type" }, required: (v) => quickStr(v, "jobType") === "otro", showWhen: (v) => quickStr(v, "jobType") === "otro", maxLength: 60 },
      { key: "categorySlug", kind: "select", label: { es: "Industria", en: "Industry" }, options: CATEGORY_OPTIONS, defaultValue: "oficina" },
      { key: "categoryCustom", kind: "text", label: { es: "Describe la industria", en: "Describe the industry" }, required: (v) => quickStr(v, "categorySlug") === "otro", showWhen: (v) => quickStr(v, "categorySlug") === "otro", maxLength: 60 },
      { key: "payUnit", kind: "chips", maxSelections: 1, label: { es: "Pago", en: "Pay" }, required: true, options: PAY_UNIT_OPTIONS },
      { key: "payAmount", kind: "currency", label: { es: "Monto (USD)", en: "Amount (USD)" }, required: payNeedsAmount, showWhen: payNeedsAmount, inputMode: "decimal" },
      { key: "schedule", kind: "text", label: { es: "Horario", en: "Schedule" }, placeholder: { es: "Ej. Lunes a viernes, 8 am – 4 pm", en: "e.g. Monday to Friday, 8 am – 4 pm" }, required: true, maxLength: 120 },
      { key: "description", kind: "textarea", label: { es: "Descripción del puesto", en: "Job description" }, required: true, maxLength: 3000 },
      cityField("free", { es: "Ciudad del empleo", en: "Job city" }),
      { key: "state", kind: "text", label: { es: "Estado", en: "State" }, required: true, defaultValue: "CA", maxLength: 40 },
      { key: "country", kind: "text", label: { es: "País", en: "Country" }, required: true, defaultValue: "United States", maxLength: 60 },
    ],
  },
  contactStep({ nameKey: "contactPerson", nameLabel: { es: "Persona de contacto", en: "Contact person" }, nameRequired: false }),
];

function primaryCtaFrom(values: QuickIntakeValues): EmpleosQuickDraft["primaryCta"] {
  if (quickStr(values, "phone")) return "phone";
  if (quickStr(values, "whatsapp")) return "whatsapp";
  return "email";
}

export const empleosQuickAdapter: QuickClassifiedCategoryAdapter = {
  category: "empleos",
  steps: STEPS,
  // The existing Empleos preview carries the checkout confirmations; the draft has no rule booleans.
  confirmations: { kind: "none" },
  async buildAndWriteCanonicalDraft({ values, media, ctx }) {
    const state = quickStr(values, "state");
    const cta = primaryCtaFrom(values);
    const draft: EmpleosQuickDraft = normalizeEmpleosQuickDraft({
      ...emptyEmpleosQuickDraft(),
      title: quickStr(values, "title"),
      businessName: quickStr(values, "businessName"),
      jobType: quickStr(values, "jobType"),
      jobTypeCustom: quickStr(values, "jobTypeCustom"),
      categorySlug: quickStr(values, "categorySlug") || "oficina",
      categoryCustom: quickStr(values, "categoryCustom"),
      workModality: "presencial" as JobModalitySlug,
      payUnit: quickStr(values, "payUnit"),
      payAmount: payNeedsAmount(values) ? quickWholeDollars(values.payAmount) : "",
      schedule: quickStr(values, "schedule"),
      description: quickStr(values, "description"),
      city: resolveCity(values),
      state,
      stateRegion: state,
      country: quickStr(values, "country"),
      images: mediaToEmpleosImageItems(media),
      contactPerson: quickStr(values, "contactPerson"),
      phone: quickStr(values, "phone"),
      whatsapp: quickStr(values, "whatsapp"),
      email: quickStr(values, "email"),
      primaryCta: cta,
      preferredApplyMethod: cta,
    });
    const gate = gateEmpleosQuickPreview(draft, ctx.lang);
    if (!gate.ok) return { ok: false, issues: gate.issues };
    flushEmpleosDraftToSession(EMPLEOS_SESSION_KEYS.quick, draft);
    return { ok: true, handoff: { kind: "preview", href: empleosHandoffPreviewUrl("quick", ctx.routeLang as SupportedLang) } };
  },
};
