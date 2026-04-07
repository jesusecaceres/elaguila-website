import { getPrintUploadConfig } from "./productConfigs";
import type { PrintUploadApprovalChecks, PrintUploadDocument, PrintUploadProductSlug } from "./types";

const defaultApproval = (): PrintUploadApprovalChecks => ({
  reviewedSpecsAndFile: false,
  printAsSubmitted: false,
  noLeonixLiabilityForArtwork: false,
  willContactForDesignHelp: false,
});

export function createInitialPrintUploadDocument(slug: PrintUploadProductSlug): PrintUploadDocument {
  const cfg = getPrintUploadConfig(slug);
  if (!cfg) {
    throw new Error(`Unknown print upload slug: ${slug}`);
  }
  return {
    id: `pu-${Date.now().toString(36)}`,
    version: 1,
    productSlug: slug,
    categorySlug: cfg.categorySlug,
    specs: { ...cfg.defaults },
    frontFile: null,
    backFile: null,
    approval: defaultApproval(),
  };
}
