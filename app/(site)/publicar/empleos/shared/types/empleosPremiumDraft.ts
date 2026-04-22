import type { ExperienceSlug, JobModalitySlug } from "@/app/clasificados/empleos/data/empleosJobTypes";

import { EMPLEOS_STANDARD_CITY } from "../constants/empleosStandardRegion";
import type { EmpleosImageItem } from "../media/empleosMediaTypes";

export type EmpleosPremiumPrimaryCta = "apply" | "whatsapp" | "email" | "website";

export type EmpleosPremiumDraft = {
  title: string;
  companyName: string;
  categorySlug: string;
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
  whatsapp: string;
  email: string;
  primaryCta: EmpleosPremiumPrimaryCta;
  screenerQuestions: string[];
  introduction: string;
  responsibilities: string[];
  requirements: string[];
  offers: string[];
  companyOverview: string;
  employerRating: string;
  employerAddress: string;
  reviewCount: string;
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
  const scheduleLabel = typeof raw.scheduleLabel === "string" ? raw.scheduleLabel : e.scheduleLabel;
  return { ...e, ...raw, city: EMPLEOS_STANDARD_CITY, experienceLevel, workModality, screenerQuestions, categorySlug, scheduleLabel };
}

export function emptyEmpleosPremiumDraft(): EmpleosPremiumDraft {
  return {
    title: "",
    companyName: "",
    categorySlug: "oficina",
    experienceLevel: "mid",
    workModality: "presencial",
    scheduleLabel: "",
    city: EMPLEOS_STANDARD_CITY,
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
    whatsapp: "",
    email: "",
    primaryCta: "apply",
    screenerQuestions: [],
    introduction: "",
    responsibilities: [""],
    requirements: [""],
    offers: [""],
    companyOverview: "",
    employerRating: "",
    employerAddress: "",
    reviewCount: "",
    videoObjectUrl: null,
    videoFileName: "",
    videoUrl: "",
  };
}
