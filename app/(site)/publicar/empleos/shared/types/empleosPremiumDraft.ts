import type { ExperienceSlug, JobModalitySlug } from "@/app/clasificados/empleos/data/empleosJobTypes";

import { EMPLEOS_INTERNAL_FILTER_REGION } from "../constants/empleosStandardRegion";
import type { EmpleosImageItem } from "../media/empleosMediaTypes";

export type EmpleosPremiumPrimaryCta = "apply" | "phone" | "whatsapp" | "email" | "website";

export type EmpleosPremiumDraft = {
  title: string;
  companyName: string;
  categorySlug: string;
  categoryCustom: string;
  experienceLevel: ExperienceSlug;
  workModality: JobModalitySlug;
  scheduleLabel: string;
  city: string;
  state: string;
  salaryPrimary: string;
  salarySecondary: string;
  jobType: string;
  featured: boolean;
  premium: boolean;
  gallery: EmpleosImageItem[];
  logoUrl: string;
  applyLabel: string;
  websiteUrl: string;
  phone: string;
  whatsapp: string;
  email: string;
  primaryCta: EmpleosPremiumPrimaryCta;
  screenerQuestions: string[];
  introduction: string;
  responsibilities: string[];
  requirements: string[];
  offers: string[];
  companyOverview: string;
  employerAddress: string;
  videoObjectUrl: string | null;
  videoFileName: string;
  /** External video URL for draft preview only (no Mux). */
  videoUrl: string;
};

function isJobModalitySlug(v: unknown): v is JobModalitySlug {
  return v === "presencial" || v === "hibrido" || v === "remoto";
}

export function normalizeEmpleosPremiumDraft(p: Partial<EmpleosPremiumDraft>): EmpleosPremiumDraft {
  const e = emptyEmpleosPremiumDraft();
  const raw = p as Partial<EmpleosPremiumDraft>;
  const exp = raw.experienceLevel;
  const experienceLevel: ExperienceSlug =
    exp === "entry" || exp === "mid" || exp === "senior" ? exp : e.experienceLevel;
  const workModality = isJobModalitySlug(raw.workModality) ? raw.workModality : e.workModality;
  const screenerQuestions = Array.isArray(raw.screenerQuestions)
    ? raw.screenerQuestions.map((s) => String(s ?? "").trim()).filter(Boolean).slice(0, 5)
    : e.screenerQuestions;
  const categorySlug =
    typeof raw.categorySlug === "string" && raw.categorySlug.trim() ? raw.categorySlug.trim() : e.categorySlug;
  const categoryCustom =
    typeof raw.categoryCustom === "string" ? raw.categoryCustom.trim() : e.categoryCustom;
  const scheduleLabel = typeof raw.scheduleLabel === "string" ? raw.scheduleLabel : e.scheduleLabel;
  const cityRaw = typeof raw.city === "string" && raw.city.trim() ? raw.city.trim() : e.city;
  return {
    ...e,
    ...raw,
    city: cityRaw || EMPLEOS_INTERNAL_FILTER_REGION,
    experienceLevel,
    workModality,
    screenerQuestions,
    categorySlug,
    categoryCustom,
    scheduleLabel,
  };
}

export function emptyEmpleosPremiumDraft(): EmpleosPremiumDraft {
  return {
    title: "",
    companyName: "",
    categorySlug: "oficina",
    categoryCustom: "",
    experienceLevel: "mid",
    workModality: "presencial",
    scheduleLabel: "",
    city: EMPLEOS_INTERNAL_FILTER_REGION,
    state: "",
    salaryPrimary: "",
    salarySecondary: "",
    jobType: "",
    featured: false,
    premium: true,
    gallery: [],
    logoUrl: "",
    applyLabel: "",
    websiteUrl: "",
    phone: "",
    whatsapp: "",
    email: "",
    primaryCta: "apply",
    screenerQuestions: [],
    introduction: "",
    responsibilities: [""],
    requirements: [""],
    offers: [""],
    companyOverview: "",
    employerAddress: "",
    videoObjectUrl: null,
    videoFileName: "",
    videoUrl: "",
  };
}
