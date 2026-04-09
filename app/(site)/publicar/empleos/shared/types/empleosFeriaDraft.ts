import type { JobFairModality } from "@/app/clasificados/empleos/data/empleoJobFairSampleData";

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

export function emptyEmpleosFeriaDraft(): EmpleosFeriaDraft {
  return {
    title: "",
    flyerImageUrl: "",
    flyerAlt: "",
    dateLine: "",
    timeLine: "",
    venue: "",
    city: "",
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
