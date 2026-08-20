import type { UrgencyLevel } from "./types";

/** Shared urgency color tokens — matches the palette already used on the Recursos landing page. */
export const URGENCY_STYLE: Record<UrgencyLevel, { border: string; bg: string; text: string }> = {
  "help-now": { border: "#C97A4A", bg: "#FBF1E8", text: "#7A3E1E" },
  "i-need-help": { border: "#8FA467", bg: "#F4F7EC", text: "#3E5324" },
  "want-to-connect": { border: "#7C93B0", bg: "#EEF3F8", text: "#2E4A66" },
};
