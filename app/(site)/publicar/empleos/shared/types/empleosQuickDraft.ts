import type { ExperienceSlug, JobModalitySlug } from "@/app/clasificados/empleos/data/empleosJobTypes";

import { EMPLEOS_INTERNAL_FILTER_REGION } from "../constants/empleosStandardRegion";
import type { EmpleosImageItem } from "../media/empleosMediaTypes";

export type EmpleosQuickPrimaryCta = "phone" | "whatsapp" | "email";

export type EmpleosQuickScheduleRow = { day: string; shift: string };

export type EmpleosQuickDraft = {
  title: string;
  businessName: string;
  /** Role family — must match `EmpleosJobRecord.category` filter slugs. */
  categorySlug: string;
  /** When `categorySlug === "otro"`, public-facing custom label. */
  categoryCustom: string;
  experienceLevel: ExperienceSlug;
  /** Internal filter region (default NorCal). Prefer address fields for public display. */
  city: string;
  state: string;
  workModality: JobModalitySlug;
  jobType: string;
  /** Legacy single line; combined with `scheduleRows` at publish. */
  schedule: string;
  /** Structured shifts; rendered as clean lines in preview and public output. */
  scheduleRows: EmpleosQuickScheduleRow[];
  pay: string;
  description: string;
  /** Repeatable benefit lines → shell bullets. */
  benefits: string[];
  /** Up to 5 optional screener prompts for internal apply. */
  screenerQuestions: string[];
  images: EmpleosImageItem[];
  logoUrl: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  primaryCta: EmpleosQuickPrimaryCta;
  addressLine1: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
  /** Local object URL for draft preview only — not uploaded to Mux */
  videoObjectUrl: string | null;
  videoFileName: string;
  /** External video URL for draft preview only (no Mux). */
  videoUrl: string;
};

/** Migrates legacy `benefitsText` and partial sessions. */
export function normalizeEmpleosQuickDraft(p: Partial<EmpleosQuickDraft> & { benefitsText?: string }): EmpleosQuickDraft {
  const e = emptyEmpleosQuickDraft();
  const raw = p as Partial<EmpleosQuickDraft> & { benefitsText?: string };
  const legacyText = typeof raw.benefitsText === "string" ? raw.benefitsText : "";
  const rest: Partial<EmpleosQuickDraft> = { ...raw };
  delete (rest as { benefitsText?: string }).benefitsText;
  let benefits = Array.isArray(rest.benefits) ? [...rest.benefits] : [];
  if (!benefits.length && legacyText.trim()) {
    benefits = legacyText.split("\n").map((s) => s.trim()).filter(Boolean);
  }
  const exp = rest.experienceLevel;
  const experienceLevel: ExperienceSlug =
    exp === "entry" || exp === "mid" || exp === "senior" ? exp : e.experienceLevel;
  const screenerQuestions = Array.isArray(rest.screenerQuestions)
    ? rest.screenerQuestions.map((s) => String(s ?? "").trim()).filter(Boolean).slice(0, 5)
    : e.screenerQuestions;
  const categorySlug = typeof rest.categorySlug === "string" && rest.categorySlug.trim() ? rest.categorySlug.trim() : e.categorySlug;
  const categoryCustom =
    typeof rest.categoryCustom === "string" ? rest.categoryCustom.trim() : e.categoryCustom;
  const cityRaw = typeof rest.city === "string" && rest.city.trim() ? rest.city.trim() : e.city;
  const modalityRaw = rest.workModality;
  const workModality: JobModalitySlug =
    modalityRaw === "presencial" || modalityRaw === "hibrido" || modalityRaw === "remoto" ? modalityRaw : e.workModality;

  let scheduleRows: EmpleosQuickScheduleRow[] = Array.isArray(rest.scheduleRows)
    ? rest.scheduleRows.map((r) => ({
        day: String((r as EmpleosQuickScheduleRow).day ?? "").trim(),
        shift: String((r as EmpleosQuickScheduleRow).shift ?? "").trim(),
      }))
    : [];
  const schedStr = typeof rest.schedule === "string" ? rest.schedule.trim() : "";
  if (!scheduleRows.some((r) => r.day || r.shift) && schedStr) {
    scheduleRows = [{ day: "", shift: schedStr }];
  }
  if (!scheduleRows.length) scheduleRows = [{ day: "", shift: "" }];

  return {
    ...e,
    ...rest,
    benefits,
    categorySlug,
    categoryCustom,
    experienceLevel,
    screenerQuestions,
    videoUrl: typeof rest.videoUrl === "string" ? rest.videoUrl : e.videoUrl,
    city: cityRaw || EMPLEOS_INTERNAL_FILTER_REGION,
    workModality,
    scheduleRows,
  };
}

export function emptyEmpleosQuickDraft(): EmpleosQuickDraft {
  return {
    title: "",
    businessName: "",
    categorySlug: "oficina",
    categoryCustom: "",
    experienceLevel: "mid",
    city: EMPLEOS_INTERNAL_FILTER_REGION,
    state: "",
    workModality: "presencial",
    jobType: "",
    schedule: "",
    scheduleRows: [{ day: "", shift: "" }],
    pay: "",
    description: "",
    benefits: [],
    screenerQuestions: [],
    images: [],
    logoUrl: "",
    phone: "",
    whatsapp: "",
    email: "",
    website: "",
    primaryCta: "phone",
    addressLine1: "",
    addressCity: "",
    addressState: "",
    addressZip: "",
    videoObjectUrl: null,
    videoFileName: "",
    videoUrl: "",
  };
}
