export type EmpleosImageItem = {
  id: string;
  url: string;
  alt: string;
  /** Exactly one image should be main when multiple exist */
  isMain?: boolean;
  /**
   * When set (e.g. PDF flyer), gallery UI renders a file card instead of an image preview.
   * Empleos Quick leaves this unset (images only).
   */
  attachmentMime?: string;
};

export function newImageId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `img_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
