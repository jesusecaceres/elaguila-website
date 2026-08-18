import type { RecursosLang, UrgencyLevel } from "./types";

export type UrgencyLevelDef = {
  level: UrgencyLevel;
  labelEs: string;
  labelEn: string;
  descriptionEs: string;
  descriptionEn: string;
};

/** Ordered from most to least urgent — order matters for future sort logic. */
export const URGENCY_LEVELS: readonly UrgencyLevelDef[] = [
  {
    level: "help-now",
    labelEs: "Ayuda ahora",
    labelEn: "Help now",
    descriptionEs: "Crisis, seguridad inmediata y respuesta de emergencia.",
    descriptionEn: "Crisis, immediate safety, and emergency response.",
  },
  {
    level: "i-need-help",
    labelEs: "Necesito ayuda",
    labelEn: "I need help",
    descriptionEs: "Comida, renta, servicios legales y apoyo familiar.",
    descriptionEn: "Food, rent, legal help, and family support.",
  },
  {
    level: "want-to-connect",
    labelEs: "Quiero conectar",
    labelEn: "I want to connect",
    descriptionEs: "Programas juveniles, educación, empleo y oportunidades.",
    descriptionEn: "Youth programs, education, jobs, and opportunities.",
  },
] as const;

const URGENCY_BY_LEVEL: ReadonlyMap<UrgencyLevel, UrgencyLevelDef> = new Map(
  URGENCY_LEVELS.map((u) => [u.level, u]),
);

export function getUrgencyLevel(level: UrgencyLevel): UrgencyLevelDef | undefined {
  return URGENCY_BY_LEVEL.get(level);
}

export function getUrgencyLabel(level: UrgencyLevel, lang: RecursosLang): string {
  const u = URGENCY_BY_LEVEL.get(level);
  if (!u) return level;
  return lang === "en" ? u.labelEn : u.labelEs;
}

export function getUrgencyDescription(level: UrgencyLevel, lang: RecursosLang): string {
  const u = URGENCY_BY_LEVEL.get(level);
  if (!u) return "";
  return lang === "en" ? u.descriptionEn : u.descriptionEs;
}
