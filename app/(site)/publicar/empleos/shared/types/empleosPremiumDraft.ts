import type { EmpleosImageItem } from "../media/empleosMediaTypes";

export type EmpleosPremiumPrimaryCta = "apply" | "whatsapp" | "email" | "website";

export type EmpleosPremiumDraft = {
  title: string;
  companyName: string;
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

export function emptyEmpleosPremiumDraft(): EmpleosPremiumDraft {
  return {
    title: "",
    companyName: "",
    city: "",
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
