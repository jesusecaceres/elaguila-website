"use client";

import { useCallback, useMemo, type ReactNode } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { RestauranteListingDraft } from "./restauranteDraftTypes";
import { isRestauranteDisplayableImageRef, isRestauranteLocalVideoDataUrl } from "./restauranteMediaDisplay";
import { readFileAsDataUrl } from "@/app/publicar/autos/negocios/lib/readFileAsDataUrl";
import { readRestauranteImageAsDataUrl } from "./compressRestauranteImage";
import type { RestauranteDraftPatch } from "./useRestauranteDraft";
import {
  computePublishGallerySequence,
  remapSequenceAfterImageRemove,
  resolveRestauranteGallerySequence,
  type RestauranteGallerySeqEntry,
} from "./restauranteGalleryMediaSequence";
import { RestauranteUploadRow } from "./RestauranteUploadRow";

const MAX_GALLERY = 24;

function entryToId(e: RestauranteGallerySeqEntry): string {
  return e === "v" ? "v" : `g-${e}`;
}

function SortableGalleryTile({
  id,
  children,
  onRemove,
  dragLabel,
}: {
  id: string;
  children: ReactNode;
  onRemove: () => void;
  dragLabel: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative overflow-hidden rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)]"
    >
      {children}
      <div className="absolute right-1 top-1 z-10 flex max-w-[calc(100%-8px)] flex-wrap items-center justify-end gap-1">
        <button
          type="button"
          className="touch-none flex min-h-[36px] min-w-[36px] cursor-grab items-center justify-center rounded-lg border-2 border-black/25 bg-white px-2 py-1 text-xs font-extrabold leading-none text-[#111] shadow-md active:cursor-grabbing"
          aria-label={dragLabel}
          title={dragLabel}
          {...attributes}
          {...listeners}
        >
          <span aria-hidden>⋮⋮</span>
          <span className="ml-1 hidden font-bold sm:inline">Orden</span>
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="min-h-[36px] min-w-[36px] rounded-full bg-red-700 text-sm font-bold leading-none text-white shadow-md"
          aria-label="Quitar"
        >
          ×
        </button>
      </div>
    </div>
  );
}

type Props = {
  draft: RestauranteListingDraft;
  setDraftPatch: (p: RestauranteDraftPatch) => void;
  uploadLabels: Record<string, string>;
  setUploadLabels: React.Dispatch<React.SetStateAction<Record<string, string>>>;
};

export function RestaurantePublishMediaStrip({
  draft,
  setDraftPatch,
  uploadLabels,
  setUploadLabels,
}: Props) {
  const displaySequence = useMemo(() => {
    const seq = computePublishGallerySequence(draft);
    const imgs = draft.galleryImages ?? [];
    const nShow = imgs.filter((u) => isRestauranteDisplayableImageRef(u)).length;
    const nums = seq.filter((x): x is number => typeof x === "number");
    const hasVid = !!(draft.videoFile?.trim() || draft.videoUrl?.trim());
    if (nShow > 0 && nums.length !== nShow) {
      const validIdx = imgs
        .map((u, i) => (isRestauranteDisplayableImageRef(u) ? i : null))
        .filter((i): i is number => i !== null);
      const out: RestauranteGallerySeqEntry[] = [...validIdx];
      if (hasVid) out.push("v");
      return out;
    }
    return seq;
  }, [draft]);
  const ids = useMemo(() => displaySequence.map(entryToId), [displaySequence]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = ids.indexOf(String(active.id));
      const newIndex = ids.indexOf(String(over.id));
      if (oldIndex < 0 || newIndex < 0) return;
      const nextSeq = arrayMove(displaySequence, oldIndex, newIndex);
      setDraftPatch({ galleryMediaSequence: nextSeq });
    },
    [ids, displaySequence, setDraftPatch]
  );

  const removeGalleryAt = (galleryIndex: number) => {
    setDraftPatch((prev) => {
      const imgs = [...(prev.galleryImages ?? [])];
      imgs.splice(galleryIndex, 1);
      const prevSeq = prev.galleryMediaSequence ?? resolveRestauranteGallerySequence(prev);
      const nextSeq = remapSequenceAfterImageRemove(prevSeq, galleryIndex);
      return {
        galleryImages: imgs,
        galleryMediaSequence: nextSeq.length ? nextSeq : undefined,
        galleryOrder: imgs.map((_, i) => String(i)),
      };
    });
  };

  const removeVideo = () => {
    setUploadLabels((p) => {
      const n = { ...p };
      delete n.video;
      return n;
    });
    setDraftPatch((prev) => {
      const seq = (prev.galleryMediaSequence ?? resolveRestauranteGallerySequence(prev)).filter((x) => x !== "v");
      return {
        videoFile: undefined,
        videoUrl: undefined,
        galleryMediaSequence: seq.length ? seq : undefined,
      };
    });
  };

  const addGalleryFiles = async (files: FileList | null) => {
    const list = files ? Array.from(files) : [];
    const toRead = list.slice(0, MAX_GALLERY);
    const urls: string[] = [];
    for (const f of toRead) {
      const u = await readRestauranteImageAsDataUrl(f);
      if (isRestauranteDisplayableImageRef(u)) urls.push(u.trim());
    }
    if (!urls.length) return;
    setDraftPatch((prev) => {
      const prevImgs = prev.galleryImages ?? [];
      const room = MAX_GALLERY - prevImgs.length;
      const slice = urls.slice(0, Math.max(0, room));
      if (!slice.length) return {};
      const imgs = [...prevImgs, ...slice];
      const prevSeq = resolveRestauranteGallerySequence(prev);
      const hadV = prevSeq.includes("v");
      const withoutV: number[] = prevSeq.filter((e): e is number => e !== "v");
      const start = prevImgs.length;
      for (let i = 0; i < slice.length; i++) withoutV.push(start + i);
      const hasV = !!(prev.videoFile?.trim() || prev.videoUrl?.trim());
      const nextSeq: RestauranteGallerySeqEntry[] =
        hadV || hasV ? [...withoutV, "v" as const] : withoutV;
      return {
        galleryImages: imgs,
        galleryMediaSequence: nextSeq,
        galleryOrder: imgs.map((_, i) => String(i)),
      };
    });
  };

  const addVideoFile = async (files: FileList | null) => {
    const f = files?.[0];
    if (!f) {
      removeVideo();
      return;
    }
    const dataUrl = await readFileAsDataUrl(f);
    const t = typeof dataUrl === "string" ? dataUrl.trim() : "";
    if (!t || !/^data:video/i.test(t)) {
      setUploadLabels((p) => {
        const n = { ...p };
        delete n.video;
        return n;
      });
      return;
    }
    setUploadLabels((p) => ({ ...p, video: f.name }));
    setDraftPatch((prev) => {
      let seq = prev.galleryMediaSequence ?? resolveRestauranteGallerySequence({ ...prev, videoFile: t });
      if (!seq.includes("v")) seq = [...seq, "v"];
      return { videoFile: t, videoUrl: undefined, galleryMediaSequence: seq };
    });
  };

  const heroEmpty = !draft.heroImage?.trim();
  const firstImageEntry = displaySequence.find((x): x is number => typeof x === "number");
  const hasGalleryTiles = displaySequence.some((e) => e !== "v");
  const hasVideoTile = displaySequence.includes("v");

  return (
    <div className="mt-4 grid gap-4">
      <div>
        <p className="text-sm font-semibold text-[color:var(--lx-text)]">Galería general y video</p>
        <p className="mt-1 text-xs leading-relaxed text-[color:var(--lx-muted)]">
          Cada archivo aceptado aparece como tarjeta con vista previa. Usa el control <strong>⋮⋮ Orden</strong> (o arrastra
          desde ahí) para reordenar — mismo patrón que otros rubros Leonix. La primera imagen en este orden es la portada
          sugerida si no subes una foto principal aparte.
        </p>
        <p className="mt-2 text-xs font-medium text-[color:var(--lx-text-2)]">
          Video: <strong>archivo local</strong> y <strong>enlace (URL)</strong> son opciones distintas. En vista previa se
          usa <strong>primero el archivo local</strong> si existe; si no, el enlace.
        </p>
        <div
          className="mt-3 rounded-xl border border-dashed border-[color:var(--lx-nav-border)]/80 bg-[color:var(--lx-section)]/30 p-4"
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
          }}
          onDrop={(e) => {
            e.preventDefault();
            const fl = e.dataTransfer.files;
            if (fl?.length) void addGalleryFiles(fl);
          }}
        >
          <div className="flex flex-wrap gap-2">
            <RestauranteUploadRow
              buttonLabel="Agregar fotos"
              helperText="Varias a la vez, o arrastra imágenes aquí."
              accept="image/*"
              multiple
              disabled={((draft.galleryImages ?? []).length ?? 0) >= MAX_GALLERY}
              selectedLabel={
                (draft.galleryImages?.length ?? 0) > 0
                  ? `${draft.galleryImages!.length} foto(s) · máx. ${MAX_GALLERY}`
                  : null
              }
              onFilesSelected={(fl) => void addGalleryFiles(fl)}
            />
            <RestauranteUploadRow
              buttonLabel="Subir video"
              helperText="Archivo local (vista previa en el borrador)."
              accept="video/*"
              selectedLabel={uploadLabels.video ?? (draft.videoFile ? "Video en el borrador" : null)}
              onFilesSelected={(fl) => void addVideoFile(fl)}
            />
          </div>
          {hasGalleryTiles || hasVideoTile ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={ids} strategy={rectSortingStrategy}>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {displaySequence.map((entry) => {
                    if (entry === "v") {
                      return (
                        <SortableGalleryTile
                          key="v"
                          id="v"
                          dragLabel="Arrastrar video"
                          onRemove={removeVideo}
                        >
                          <div className="relative aspect-square w-full">
                            {isRestauranteLocalVideoDataUrl(draft.videoFile) ? (
                              <video
                                className="absolute inset-0 h-full w-full object-cover"
                                muted
                                playsInline
                                preload="metadata"
                                src={draft.videoFile}
                              />
                            ) : draft.videoUrl?.trim() ? (
                              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-[#2a2620] to-[#1a1814] p-2 text-center">
                                <span className="text-2xl" aria-hidden>
                                  ▶
                                </span>
                                <span className="line-clamp-3 px-1 text-[10px] font-semibold text-white/85">
                                  {draft.videoUrl.trim()}
                                </span>
                              </div>
                            ) : (
                              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-[#2a2620] to-[#1a1814] p-2 text-center">
                                <span className="text-2xl" aria-hidden>
                                  ▶
                                </span>
                                <span className="text-[10px] font-semibold text-white/80">Video</span>
                              </div>
                            )}
                            <span className="absolute bottom-2 left-2 max-w-[calc(100%-12px)] rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold leading-tight text-white">
                              {isRestauranteLocalVideoDataUrl(draft.videoFile)
                                ? "Video · archivo (se usa en preview)"
                                : draft.videoUrl?.trim()
                                  ? "Video · enlace (preview si no hay archivo)"
                                  : "Video"}
                            </span>
                          </div>
                        </SortableGalleryTile>
                      );
                    }
                    const url = draft.galleryImages?.[entry];
                    if (!isRestauranteDisplayableImageRef(url)) return null;
                    const isCoverHint = heroEmpty && entry === firstImageEntry;
                    return (
                      <SortableGalleryTile
                        key={`g-${entry}`}
                        id={`g-${entry}`}
                        dragLabel="Arrastrar imagen"
                        onRemove={() => removeGalleryAt(entry)}
                      >
                        <div className="relative aspect-square w-full min-h-[140px] bg-[color:var(--lx-section)]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover"
                            draggable={false}
                          />
                          {isCoverHint ? (
                            <span className="absolute bottom-2 left-2 rounded bg-[color:var(--lx-gold)]/95 px-1.5 py-0.5 text-[10px] font-bold text-[#1a1814]">
                              Portada sugerida
                            </span>
                          ) : null}
                        </div>
                      </SortableGalleryTile>
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <p className="mt-3 text-xs text-[color:var(--lx-muted)]">Aún no hay fotos en la galería general.</p>
          )}
        </div>
      </div>
    </div>
  );
}
