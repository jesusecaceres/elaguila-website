/**
 * Program 6, Gate 6O — Language / Bilingual Engine.
 * Supports es, en, bilingual, es_primary_en_support, en_primary_es_support.
 * Natural Spanish, not literal machine translation.
 */
import type { CreativeLanguage } from "./types";
import type { PrintFormatKey } from "./printSpecs";

export const SUPPORTED_LANGUAGES: readonly CreativeLanguage[] = [
  "es", "en", "bilingual", "es_primary_en_support", "en_primary_es_support",
];

export function isSupportedLanguage(lang: string): lang is CreativeLanguage {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(lang);
}

export function canFormatSupportBilingual(format: PrintFormatKey): boolean {
  // Quarter ads should not cram two complete languages
  return format !== "QUARTER";
}

export function getLanguageBehavior(lang: CreativeLanguage, format: PrintFormatKey): {
  primaryLanguage: "es" | "en";
  secondaryLanguage: "es" | "en" | null;
  allowFullBilingual: boolean;
  description: string;
} {
  switch (lang) {
    case "es":
      return { primaryLanguage: "es", secondaryLanguage: null, allowFullBilingual: false, description: "Spanish only." };
    case "en":
      return { primaryLanguage: "en", secondaryLanguage: null, allowFullBilingual: false, description: "English only." };
    case "bilingual":
      return {
        primaryLanguage: "es",
        secondaryLanguage: "en",
        allowFullBilingual: canFormatSupportBilingual(format),
        description: canFormatSupportBilingual(format)
          ? "Full bilingual content supported."
          : "Quarter ad: primary language + concise secondary CTA only.",
      };
    case "es_primary_en_support":
      return {
        primaryLanguage: "es",
        secondaryLanguage: "en",
        allowFullBilingual: canFormatSupportBilingual(format),
        description: "Spanish primary with English support. " + (canFormatSupportBilingual(format) ? "Full support." : "Concise English CTA only."),
      };
    case "en_primary_es_support":
      return {
        primaryLanguage: "en",
        secondaryLanguage: "es",
        allowFullBilingual: canFormatSupportBilingual(format),
        description: "English primary with Spanish support. " + (canFormatSupportBilingual(format) ? "Full support." : "Concise Spanish CTA only."),
      };
  }
}

export const LANGUAGE_PRESERVATION_RULES: readonly string[] = [
  "Preserve business names across languages.",
  "Preserve addresses across languages.",
  "Preserve URLs across languages.",
  "Preserve proper nouns across languages.",
  "Natural Spanish, not literal machine translation.",
  "Store approved copy separately from generated draft.",
];

export interface BilingualCopyPair {
  es: string;
  en: string;
}

export function isBilingualCopyPair(value: unknown): value is BilingualCopyPair {
  return typeof value === "object" && value !== null && "es" in value && "en" in value;
}
