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
  /** One line per benefit in the form; split for the shell. */
  benefitsText: string;
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
};

/** Migrates legacy `benefits[]` sessions to `benefitsText`. */
export function normalizeEmpleosQuickDraft(p: Partial<EmpleosQuickDraft> & { benefits?: string[] }): EmpleosQuickDraft {
  const e = emptyEmpleosQuickDraft();
  const { benefits: legacyBenefits, ...rest } = p;
  let benefitsText = typeof rest.benefitsText === "string" ? rest.benefitsText : "";
  if (!benefitsText && Array.isArray(legacyBenefits)) benefitsText = legacyBenefits.filter(Boolean).join("\n");
  return { ...e, ...rest, benefitsText };
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
    benefitsText: "",
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
  };
}
