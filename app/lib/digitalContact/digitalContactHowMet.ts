import type { DigitalContactHowMetOption } from "./digitalContactTypes";

/** Optional "How did we meet?" attribution for Lead Exchange — CRM-ready source tagging. */
export const DIGITAL_CONTACT_HOW_MET_OPTIONS: DigitalContactHowMetOption[] = [
  { id: "door-to-door", labelEs: "Puerta a puerta", labelEn: "Door-to-door" },
  { id: "magazine", labelEs: "Revista", labelEn: "Magazine" },
  { id: "referral", labelEs: "Referido", labelEn: "Referral" },
  { id: "facebook", labelEs: "Facebook", labelEn: "Facebook" },
  { id: "instagram", labelEs: "Instagram", labelEn: "Instagram" },
  { id: "website", labelEs: "Sitio web", labelEn: "Website" },
  { id: "other", labelEs: "Otro", labelEn: "Other" },
];

export function isValidDigitalContactHowMetId(id: string | null | undefined): boolean {
  if (!id) return true; // optional field
  return DIGITAL_CONTACT_HOW_MET_OPTIONS.some((o) => o.id === id);
}
