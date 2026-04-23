import type { JobFairModality } from "@/app/clasificados/empleos/data/empleoJobFairSampleData";

import { EMPLEOS_INTERNAL_FILTER_REGION } from "../constants/empleosStandardRegion";

export type EmpleosFeriaDraft = {
  title: string;
  flyerImageUrl: string;
  flyerAlt: string;
  dateLine: string;
  timeLine: string;
  venue: string;
  city: string;
  state: string;
  organizer: string;
  organizerUrl: string;
  modality: JobFairModality;
  freeEntry: boolean;
  bilingual: boolean;
  industryFocus: string;
  detailsBullets: string[];
  secondaryDetails: string[];
  ctaIntro: string;
  contactLink: string;
  contactPhone: string;
  contactEmail: string;
  ctaLabel: string;
};

export function normalizeEmpleosFeriaDraft(p: Partial<EmpleosFeriaDraft>): EmpleosFeriaDraft {
  const e = emptyEmpleosFeriaDraft();
  const raw = p as Partial<EmpleosFeriaDraft>;
  const cityRaw = typeof raw.city === "string" && raw.city.trim() ? raw.city.trim() : e.city;
  return { ...e, ...raw, city: cityRaw || EMPLEOS_INTERNAL_FILTER_REGION };
}

export function emptyEmpleosFeriaDraft(): EmpleosFeriaDraft {
  return {
    title: "",
    flyerImageUrl: "",
    flyerAlt: "",
    dateLine: "",
    timeLine: "",
    venue: "",
    city: EMPLEOS_INTERNAL_FILTER_REGION,
    state: "",
    organizer: "",
    organizerUrl: "",
    modality: "presencial",
    freeEntry: true,
    bilingual: false,
    industryFocus: "",
    detailsBullets: [],
    secondaryDetails: [],
    ctaIntro: "",
    contactLink: "",
    contactPhone: "",
    contactEmail: "",
    ctaLabel: "",
  };
}
