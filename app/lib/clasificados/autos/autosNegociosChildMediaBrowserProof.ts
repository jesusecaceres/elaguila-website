import type { AutosAdditionalInventoryVehicleDraft } from "./autosAdditionalInventoryDraft";
import { summarizeChildInventoryMediaDraft } from "./autosAdditionalInventoryDraft";

export type AutosChildMediaProofSnapshot = {
  label: string;
  source: string;
  childId: string | null;
  year?: number;
  make?: string;
  model?: string;
  mediaField: "mediaImages";
  mediaImagesCount: number;
  imageUrlCount: number;
  coverId: string | null;
  sortOrders: number[];
  videoUrlsCount: number;
  isReducedObject: boolean;
  inProgressMediaImagesCount: number | null;
  drawerEditingId: string | null;
  editorMediaCount: number | null;
  editorVideoCount: number | null;
  previewMediaCount: number | null;
};

const DRAFT_SESSION_PREFIX = "leonix:autos:negocios:activeDraft:v";
const NAMESPACE_HINT_KEY = "lx-autos-draft-ns-hint-negocios";

function summarizeDraftChild(
  child: AutosAdditionalInventoryVehicleDraft | null | undefined,
): Omit<
  AutosChildMediaProofSnapshot,
  "label" | "source" | "inProgressMediaImagesCount" | "drawerEditingId" | "editorMediaCount" | "editorVideoCount" | "previewMediaCount"
> {
  if (!child) {
    return {
      childId: null,
      mediaField: "mediaImages",
      mediaImagesCount: 0,
      imageUrlCount: 0,
      coverId: null,
      sortOrders: [],
      videoUrlsCount: 0,
      isReducedObject: true,
    };
  }
  const media = summarizeChildInventoryMediaDraft(child);
  const imgs = child.mediaImages ?? [];
  const urlCount = imgs.filter((m) => typeof m.url === "string" && /^https?:\/\//i.test(m.url)).length;
  const hasVehicleScalars = Boolean(child.year || child.make?.trim() || child.model?.trim());
  const isReducedObject = hasVehicleScalars && media.mediaImagesCount === 0 && media.videoUrlsCount === 0;
  return {
    childId: child.id,
    year: child.year,
    make: child.make,
    model: child.model,
    mediaField: "mediaImages",
    mediaImagesCount: media.mediaImagesCount,
    imageUrlCount: urlCount,
    coverId: media.coverId,
    sortOrders: imgs.map((m) => m.sortOrder ?? 0),
    videoUrlsCount: media.videoUrlsCount,
    isReducedObject,
  };
}

/** Read active Autos Negocios session draft JSON from sessionStorage (browser only). */
export function readAutosNegociosSessionDraftJson(): Record<string, unknown> | null {
  if (typeof window === "undefined") return null;
  try {
    const hint = sessionStorage.getItem(NAMESPACE_HINT_KEY)?.trim();
    if (hint) {
      for (let v = 9; v >= 1; v--) {
        const keyed = sessionStorage.getItem(`${DRAFT_SESSION_PREFIX}${v}:${hint}`);
        if (keyed) return JSON.parse(keyed) as Record<string, unknown>;
      }
    }
    for (let i = 0; i < window.sessionStorage.length; i++) {
      const key = window.sessionStorage.key(i);
      if (!key?.startsWith(DRAFT_SESSION_PREFIX)) continue;
      const raw = window.sessionStorage.getItem(key);
      if (!raw) continue;
      return JSON.parse(raw) as Record<string, unknown>;
    }
  } catch {
    return null;
  }
  return null;
}

export function captureAutosChildMediaProofSnapshot(args: {
  label: string;
  source: string;
  childIndex?: number;
}): AutosChildMediaProofSnapshot {
  const draft = readAutosNegociosSessionDraftJson();
  const children = (draft?.additionalInventoryVehicles ?? []) as AutosAdditionalInventoryVehicleDraft[];
  const idx = args.childIndex ?? 0;
  const child = children[idx] ?? null;
  const inProgress = (draft?.inProgressInventoryVehicleDraft ?? null) as AutosAdditionalInventoryVehicleDraft | null;
  const base = summarizeDraftChild(child);
  const editorEl = document.querySelector("[data-autos-editor-media-count]");
  const editorMediaCount = editorEl ? Number(editorEl.getAttribute("data-autos-editor-media-count") ?? "0") : null;
  const editorVideoCount = editorEl
    ? Number(document.querySelector("[data-autos-editor-video-count]")?.getAttribute("data-autos-editor-video-count") ?? "0")
    : null;
  const previewMediaCount = document.querySelector("[data-autos-child-inventory-preview]")
    ? Number(
        document
          .querySelector("[data-autos-preview-media-count]")
          ?.getAttribute("data-autos-preview-media-count") ?? "0",
      )
    : null;
  return {
    label: args.label,
    source: args.source,
    ...base,
    inProgressMediaImagesCount: inProgress ? summarizeChildInventoryMediaDraft(inProgress).mediaImagesCount : null,
    drawerEditingId: typeof draft?.inventoryDrawerEditingId === "string" ? draft.inventoryDrawerEditingId : null,
    editorMediaCount: Number.isFinite(editorMediaCount) ? editorMediaCount : null,
    editorVideoCount: Number.isFinite(editorVideoCount) ? editorVideoCount : null,
    previewMediaCount: Number.isFinite(previewMediaCount) ? previewMediaCount : null,
  };
}
