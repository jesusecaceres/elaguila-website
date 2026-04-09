import type { EmpleoJobFairSample } from "@/app/clasificados/empleos/data/empleoJobFairSampleData";

import { FALLBACK_IMG } from "../required/empleosRequiredForPreview";
import type { EmpleosFeriaDraft } from "../types/empleosFeriaDraft";

function modalityLabel(m: EmpleosFeriaDraft["modality"]): string {
  switch (m) {
    case "virtual":
      return "Virtual";
    case "híbrida":
      return "Híbrida";
    default:
      return "Presencial";
  }
}

export function mapFeriaDraftToShell(d: EmpleosFeriaDraft): EmpleoJobFairSample {
  const flyer = d.flyerImageUrl.trim() || FALLBACK_IMG;
  const baseDetails = [...d.detailsBullets.map((x) => x.trim()).filter(Boolean)];
  const modality = modalityLabel(d.modality);
  const entry = d.freeEntry ? "Entrada gratuita" : "Entrada con costo";
  const merged = [...new Set([...baseDetails, `Modalidad: ${modality}`, entry])];

  const sec = d.secondaryDetails.map((x) => x.trim()).filter(Boolean);
  const link = d.contactLink.trim();
  if (link) sec.push(link);

  return {
    title: d.title.trim() || "Feria de Empleo",
    flyerImageSrc: flyer,
    flyerImageAlt: d.flyerAlt.trim() || "Flyer del evento",
    dateLine: d.dateLine.trim() || "—",
    timeLine: d.timeLine.trim() || undefined,
    venue: d.venue.trim() || "—",
    city: d.city.trim() || "—",
    state: d.state.trim() || "—",
    organizer: d.organizer.trim() || undefined,
    organizerUrl: d.organizerUrl.trim() || undefined,
    detailsBullets: merged.length ? merged : ["Feria de Empleo"],
    secondaryDetails: sec.length ? sec : undefined,
    ctaIntro: d.ctaIntro.trim() || "—",
    contactPhone: d.contactPhone.trim() || undefined,
    contactEmail: d.contactEmail.trim() || undefined,
    eventType: "feria de empleo",
    modality: d.modality,
    freeEntry: d.freeEntry,
    bilingual: d.bilingual,
    industryFocus: d.industryFocus.trim() || undefined,
  };
}
