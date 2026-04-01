import { isBusinessCardTemplateId, type BusinessCardTemplateId } from "./businessCardTemplateCatalog";

export type LeoPreferredStyle = "luxury" | "modern" | "bold" | "minimal" | "elegant";

export type LeoEmphasis = "logo" | "company" | "contact";

export type LeoBackStyle = "clean" | "services" | "address" | "map-style";

const LEO_STYLES = new Set<string>(["luxury", "modern", "bold", "minimal", "elegant"]);
const LEO_EMPHASIS = new Set<string>(["logo", "company", "contact"]);
const LEO_BACK = new Set<string>(["clean", "services", "address", "map-style"]);

/** Persisted on the document + session for fulfillment notes. */
export type BusinessCardLeoSnapshot = {
  profession: string;
  preferredStyle: LeoPreferredStyle;
  preferredColorsNote: string;
  emphasis: LeoEmphasis;
  backStyle: LeoBackStyle;
  selectedTemplateId: BusinessCardTemplateId;
};

/** Full LEO intake before mapping into the builder document. */
export type BusinessCardLeoIntake = {
  profession: string;
  businessName: string;
  personName: string;
  title: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  slogan: string;
  preferredStyle: LeoPreferredStyle;
  preferredColors: string;
  emphasis: LeoEmphasis;
  backStyle: LeoBackStyle;
  logoDataUrl: string | null;
  logoNaturalWidth: number | null;
  logoNaturalHeight: number | null;
};

export function isBusinessCardLeoSnapshot(x: unknown): x is BusinessCardLeoSnapshot {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.profession === "string" &&
    typeof o.preferredColorsNote === "string" &&
    typeof o.preferredStyle === "string" &&
    LEO_STYLES.has(o.preferredStyle) &&
    typeof o.emphasis === "string" &&
    LEO_EMPHASIS.has(o.emphasis) &&
    typeof o.backStyle === "string" &&
    LEO_BACK.has(o.backStyle) &&
    typeof o.selectedTemplateId === "string" &&
    isBusinessCardTemplateId(o.selectedTemplateId)
  );
}
