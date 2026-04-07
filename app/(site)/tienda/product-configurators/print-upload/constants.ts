import type { AcceptedMime } from "./types";

export const DEFAULT_ACCEPTED_MIMES: AcceptedMime[] = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/tiff",
];

/** HTML file input accept string (subset of MVP types) */
export const PRINT_UPLOAD_INPUT_ACCEPT = ".pdf,.png,.jpg,.jpeg,.tif,.tiff,application/pdf,image/png,image/jpeg,image/tiff";

export const DEFAULT_MAX_FILE_MB = 150;

/** PPI proxy for minimum pixel dimensions (MVP, not prepress) */
export const PRINT_UPLOAD_MIN_PPI_PROXY = 115;
