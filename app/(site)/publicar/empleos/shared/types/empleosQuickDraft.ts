import type { ExperienceSlug } from "@/app/clasificados/empleos/data/empleosJobTypes";

import { EMPLEOS_STANDARD_CITY } from "../constants/empleosStandardRegion";
import type { EmpleosImageItem } from "../media/empleosMediaTypes";

export type EmpleosQuickPrimaryCta = "phone" | "whatsapp" | "email";

export type EmpleosQuickDraft = {
  title: string;
  businessName: string;
  /** Role family — must match `EmpleosJobRecord.category` filter slugs. */
  categorySlug: string;
  experienceLevel: ExperienceSlug;
  city: string;
  state: string;
  jobType: string;
  schedule: string;
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

  return {
    ...e,
    ...rest,
    benefits,
    categorySlug,
    experienceLevel,
    screenerQuestions,
    videoUrl: typeof rest.videoUrl === "string" ? rest.videoUrl : e.videoUrl,
    city: EMPLEOS_STANDARD_CITY,
  };
}

export function emptyEmpleosQuickDraft(): EmpleosQuickDraft {
  return {
    title: "",
    businessName: "",
    categorySlug: "oficina",
    experienceLevel: "mid",
    city: EMPLEOS_STANDARD_CITY,
    state: "",
    jobType: "",
    schedule: "",
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
