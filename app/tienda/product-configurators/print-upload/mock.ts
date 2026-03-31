import type { PrintUploadJobSpec } from "./types";
import { DEFAULT_ACCEPTED_MIMES, DEFAULT_MAX_FILE_MB } from "./constants";

/** Example spec for standard flyer upload flow */
export const mockFlyerUploadSpec: PrintUploadJobSpec = {
  id: "flyers-standard-upload",
  acceptedTypes: DEFAULT_ACCEPTED_MIMES,
  maxFileMb: DEFAULT_MAX_FILE_MB,
  sidedness: "two-sided",
  agreements: [
    {
      id: "print-as-submitted",
      labelKey: "upload.agreement.printAsSubmitted",
      required: true,
    },
  ],
  policy: {
    preserveOriginal: true,
    generatePreviewDerivative: true,
  },
  futureChecks: ["LOW_RESOLUTION", "MISSING_BLEED", "DIMENSION_MISMATCH", "FILE_TOO_LARGE"] as const,
};
