import type { JobFairModality } from "@/app/clasificados/empleos/data/empleoJobFairSampleData";

export type EmpleosFeriaDraft = {
  title: string;
  flyerImageUrl: string;
  flyerAlt: string;
  dateLine: string;
  timeLine: string;
  venue: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  stateRegion: string;
  postalCode: string;
  country: string;
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
  const stateRegion =
    typeof raw.stateRegion === "string" && raw.stateRegion.trim()
      ? raw.stateRegion.trim()
      : typeof raw.state === "string"
        ? raw.state.trim()
        : e.stateRegion;
  return {
    ...e,
    ...raw,
    city: cityRaw,
    state: typeof raw.state === "string" && raw.state.trim() ? raw.state.trim() : stateRegion,
    stateRegion,
    postalCode: typeof raw.postalCode === "string" ? raw.postalCode.trim() : e.postalCode,
    country: typeof raw.country === "string" ? raw.country.trim() : e.country,
  };
}

export function emptyEmpleosFeriaDraft(): EmpleosFeriaDraft {
  return {
    title: "",
    flyerImageUrl: "",
    flyerAlt: "",
    dateLine: "",
    timeLine: "",
    venue: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    stateRegion: "",
    postalCode: "",
    country: "",
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
