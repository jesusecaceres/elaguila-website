import type { EmpleosImageItem } from "../media/empleosMediaTypes";

export type EmpleosQuickPrimaryCta = "phone" | "whatsapp" | "email";

export type EmpleosQuickDraft = {
  title: string;
  businessName: string;
  city: string;
  state: string;
  jobType: string;
  schedule: string;
  pay: string;
  description: string;
  /** Repeatable benefit lines → shell bullets. */
  benefits: string[];
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
  const { benefitsText: _drop, ...rest } = raw;
  let benefits = Array.isArray(rest.benefits) ? [...rest.benefits] : [];
  if (!benefits.length && legacyText.trim()) {
    benefits = legacyText.split("\n").map((s) => s.trim()).filter(Boolean);
  }
  return { ...e, ...rest, benefits, videoUrl: typeof rest.videoUrl === "string" ? rest.videoUrl : e.videoUrl };
}

export function emptyEmpleosQuickDraft(): EmpleosQuickDraft {
  return {
    title: "",
    businessName: "",
    city: "",
    state: "",
    jobType: "",
    schedule: "",
    pay: "",
    description: "",
    benefits: [],
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
