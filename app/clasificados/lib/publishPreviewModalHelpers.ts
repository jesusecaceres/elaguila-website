/**
 * Helpers for in-page full preview modal: return path, variant, close, and confirm → publish.
 */

/** Current publish URL (path + query) so `/agente/[id]` can link back to this draft/preview flow. */
export function buildPreviewPublishReturnPath(
  pathname: string | null | undefined,
  searchParams: { toString(): string } | null | undefined
): string {
  const q = searchParams?.toString() ?? "";
  return `${pathname ?? ""}${q ? `?${q}` : ""}`;
}

/** Pro-styled preview for Rentas privado; free for other categories. */
export function getFullPreviewVariantOnOpen(branch: { isRentasPrivado: boolean }): "pro" | "free" {
  return branch.isRentasPrivado ? "pro" : "free";
}

export function executeClosePublishFullPreviewModal(params: {
  setModalOpenTracked: (open: boolean) => void;
  setShowFullPreviewModal: (open: boolean) => void;
  clearProHighlight: () => void;
}): void {
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log("[publish preview] closeFullPreviewModal called");
  }
  params.setModalOpenTracked(false);
  params.setShowFullPreviewModal(false);
  params.clearProHighlight();
}

export function executeFullPreviewConfirmPublish(params: {
  fullPreviewRulesConfirmed: boolean;
  fullPreviewInfoConfirmed: boolean;
  setRulesConfirmedPersisted: (v: boolean) => void;
  setPreviewViewed: (v: boolean) => void;
  setShowFullPreviewModal: (v: boolean) => void;
  publish: () => void | Promise<void>;
}): void {
  const {
    fullPreviewRulesConfirmed,
    fullPreviewInfoConfirmed,
    setRulesConfirmedPersisted,
    setPreviewViewed,
    setShowFullPreviewModal,
    publish,
  } = params;
  if (!fullPreviewRulesConfirmed || !fullPreviewInfoConfirmed) return;
  setRulesConfirmedPersisted(true);
  setPreviewViewed(true);
  setShowFullPreviewModal(false);
  setTimeout(() => {
    void publish();
  }, 600);
}
