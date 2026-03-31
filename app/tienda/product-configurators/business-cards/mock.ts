import type { BusinessCardBuilderDocument } from "./types";
import { STANDARD_BUSINESS_CARD_CANVAS } from "./constants";

/** Placeholder document shape for upcoming editor */
export const mockStandardBusinessCardDocument: BusinessCardBuilderDocument = {
  id: "mock-bc-standard",
  version: 1,
  activeSide: "front",
  canvas: STANDARD_BUSINESS_CARD_CANVAS,
  textBlocks: [
    { id: "t-name", role: "name", labelKey: "bc.field.name", maxChars: 40, required: true },
    { id: "t-title", role: "title", labelKey: "bc.field.title", maxChars: 60 },
    { id: "t-phone", role: "phone", labelKey: "bc.field.phone", maxChars: 22 },
    { id: "t-email", role: "email", labelKey: "bc.field.email", maxChars: 48 },
  ],
  imageBlocks: [{ id: "i-logo", role: "logo", maxMb: 15, required: false }],
  guidesVisible: true,
  approval: {
    requiresCustomerApproval: true,
    requiresLeonixApproval: false,
    confirmationLabels: [
      "Spelling and phone numbers are correct",
      "Colors and contrast are acceptable for print",
      "Safe margins respected",
    ] as const,
  },
};
