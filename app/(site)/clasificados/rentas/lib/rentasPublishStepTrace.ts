/**
 * Rentas Gate 08E — dev-only publish funnel trace (preview → media → `public.listings`).
 * Enable with `NODE_ENV === "development"` or `localStorage.LEONIX_PUBLISH_DIAG === "1"`.
 */

export type RentasPublishStepTrace = {
  publishClicked: boolean;
  existingErrorBeforePublish: boolean | null;
  errorClearedAtStart: boolean;
  draftId: string | null;
  draftSource: string | null;
  imagesCountBeforeUpload: number;
  imagesUploadStarted: boolean;
  imagesUploadFinished: boolean;
  imagesDurableCount: number;
  videoSelected: boolean;
  muxDirectUploadStarted: boolean;
  muxDirectUploadSucceeded: boolean;
  muxUploadStatusSucceeded: boolean;
  muxAssetId: string | null;
  muxPlaybackId: string | null;
  finalPayloadBuildStarted: boolean;
  finalPayloadBuildFinished: boolean;
  descriptionIsNull: boolean | null;
  descriptionLength: number | null;
  titleLength: number | null;
  publicListingInsertStarted: boolean;
  publicListingInsertSucceeded: boolean;
  publicListingReturnedId: string | null;
  publicListingReturnedLeonixAdId: string | null;
  redirectStarted: boolean;
  finalErrorSet: boolean;
};

function rentasPublishStepDiagEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    (typeof window !== "undefined" &&
      typeof localStorage !== "undefined" &&
      localStorage.getItem("LEONIX_PUBLISH_DIAG") === "1")
  );
}

function emptyTrace(): RentasPublishStepTrace {
  return {
    publishClicked: false,
    existingErrorBeforePublish: null,
    errorClearedAtStart: false,
    draftId: null,
    draftSource: null,
    imagesCountBeforeUpload: 0,
    imagesUploadStarted: false,
    imagesUploadFinished: false,
    imagesDurableCount: 0,
    videoSelected: false,
    muxDirectUploadStarted: false,
    muxDirectUploadSucceeded: false,
    muxUploadStatusSucceeded: false,
    muxAssetId: null,
    muxPlaybackId: null,
    finalPayloadBuildStarted: false,
    finalPayloadBuildFinished: false,
    descriptionIsNull: null,
    descriptionLength: null,
    titleLength: null,
    publicListingInsertStarted: false,
    publicListingInsertSucceeded: false,
    publicListingReturnedId: null,
    publicListingReturnedLeonixAdId: null,
    redirectStarted: false,
    finalErrorSet: false,
  };
}

let currentTrace: RentasPublishStepTrace = emptyTrace();

/** Call at the start of each preview publish click. */
export function rentasPublishStepTraceReset(): RentasPublishStepTrace {
  currentTrace = emptyTrace();
  return currentTrace;
}

export function rentasPublishStepTraceSnapshot(): RentasPublishStepTrace {
  return { ...currentTrace };
}

/** Merge + console (dev / LEONIX_PUBLISH_DIAG only). */
export function rentasPublishStepTracePatch(patch: Partial<RentasPublishStepTrace>): void {
  if (!rentasPublishStepDiagEnabled()) return;
  currentTrace = { ...currentTrace, ...patch };
  console.info("[rentas publish][RentasPublishStepTrace]", rentasPublishStepTraceSnapshot());
}

export function rentasPublishStepDiagOn(): boolean {
  return rentasPublishStepDiagEnabled();
}
