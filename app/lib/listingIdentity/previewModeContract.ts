/**
 * Globalization P3 (Gate 1) — canonical shared preview-mode contract.
 *
 * Every category that reuses one component to render BOTH a brand-new, not-yet-published
 * application preview AND a dashboard-opened view of an already-published listing must resolve
 * to exactly one of these three modes, and must never show base-plan checkout/confirmation UI
 * outside "new-publish".
 *
 * "edit-draft" and "published-readonly" are both listing-bound (a real, identified listing is
 * being viewed), differing only in whether there is a local, unsaved edit workspace layered on
 * top of the published row. A category that has not yet built that finer split (only one
 * listing-bound UI state today) should resolve `hasUnsavedEditDraft` from the same signal that
 * currently drives its single bound state — see each call site's own comment for its exact
 * mapping. This does not change any category's user-visible behavior; it only names, in one
 * place, the mode every category's own listing-bound boolean/mode already encodes.
 */

export type PreviewMode = "new-publish" | "edit-draft" | "published-readonly";

export type PreviewModeInput = {
  /** True when this preview is bound to a real, identified, already-published listing (opened
   * from the dashboard), as opposed to an in-progress, not-yet-published application draft. */
  listingBound: boolean;
  /** Only meaningful when `listingBound` is true. True when a local, unsaved edit workspace
   * exists on top of the published row (edit-draft); false/omitted means the published row's
   * own state is being shown as-is (published-readonly). Categories with only one listing-bound
   * UI state (no separate read-only view) should pass `true` here, matching their current
   * behavior of always offering "save changes" once bound. */
  hasUnsavedEditDraft?: boolean;
};

export function resolvePreviewMode(input: PreviewModeInput): PreviewMode {
  if (!input.listingBound) return "new-publish";
  return input.hasUnsavedEditDraft === false ? "published-readonly" : "edit-draft";
}

/** True for every listing-bound mode — the one rule every paid category's checkout widget must
 * obey: an already-published listing must never show new-customer checkout, confirmations, or
 * package-purchase UI, regardless of whether it's being viewed read-only or mid-edit. */
export function previewModeSuppressesBasePlanCheckout(mode: PreviewMode): boolean {
  return mode !== "new-publish";
}

export function previewModeIsListingBound(mode: PreviewMode): boolean {
  return mode !== "new-publish";
}
