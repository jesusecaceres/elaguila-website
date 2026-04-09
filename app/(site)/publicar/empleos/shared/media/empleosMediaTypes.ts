export type EmpleosImageItem = {
  id: string;
  url: string;
  alt: string;
  /** Exactly one image should be main when multiple exist */
  isMain?: boolean;
};

export function newImageId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `img_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
