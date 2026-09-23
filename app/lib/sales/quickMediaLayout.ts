/**
 * Quick Business media layout: 1–3 genuine images, no empty placeholder boxes, no video.
 * Pure — executable in harnesses without DOM.
 */

export type QuickMediaLayoutSlot =
  | { kind: "hero"; index: 0 }
  | { kind: "support"; index: 1 | 2 }
  | { kind: "info_panel" };

export type QuickMediaLayout = {
  imageCount: 1 | 2 | 3;
  slots: readonly QuickMediaLayoutSlot[];
  allowsVideo: false;
  emptyPlaceholders: 0;
};

export function layoutQuickMedia(imageCount: number): QuickMediaLayout | { ok: false; error: "too_few" | "too_many" } {
  if (imageCount < 1) return { ok: false, error: "too_few" };
  if (imageCount > 3) return { ok: false, error: "too_many" };
  if (imageCount === 1) {
    return {
      imageCount: 1,
      slots: [{ kind: "hero", index: 0 }, { kind: "info_panel" }],
      allowsVideo: false,
      emptyPlaceholders: 0,
    };
  }
  if (imageCount === 2) {
    return {
      imageCount: 2,
      slots: [
        { kind: "hero", index: 0 },
        { kind: "support", index: 1 },
      ],
      allowsVideo: false,
      emptyPlaceholders: 0,
    };
  }
  return {
    imageCount: 3,
    slots: [
      { kind: "hero", index: 0 },
      { kind: "support", index: 1 },
      { kind: "support", index: 2 },
    ],
    allowsVideo: false,
    emptyPlaceholders: 0,
  };
}

export function quickMediaGridClass(imageCount: 1 | 2 | 3): string {
  if (imageCount === 1) return "grid grid-cols-1 gap-3";
  if (imageCount === 2) return "grid grid-cols-2 gap-3";
  return "grid grid-cols-3 gap-2 sm:gap-3";
}
