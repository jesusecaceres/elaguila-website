import type { TextFieldRole } from "../types";

/** Legacy stacked-field render order inside `BusinessCardPreview` (must match editor field order). */
export const BUSINESS_CARD_PREVIEW_LEGACY_LINE_ORDER: TextFieldRole[] = [
  "company",
  "personName",
  "title",
  "tagline",
  "phone",
  "email",
  "website",
  "address",
];
