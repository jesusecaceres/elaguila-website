"use client";

import Image from "next/image";
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
import { readFileAsDataUrl } from "@/app/publicar/autos/negocios/lib/readFileAsDataUrl";
import { readRestauranteImageAsDataUrl } from "./compressRestauranteImage";
import {
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
      <div className="absolute right-1 top-1 flex items-center gap-1">
        <button
          type="button"
          className="touch-none rounded border border-[color:var(--lx-nav-border)] bg-white/95 p-1.5 text-[color:var(--lx-text)] shadow-sm cursor-grab active:cursor-grabbing"
          aria-label={dragLabel}
          {...attributes}
          {...listeners}
        >
          ⋮⋮
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-full bg-red-700 px-2 py-0.5 text-xs font-bold text-white"
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
  draftRef: React.MutableRefObject<RestauranteListingDraft>;
  setDraftPatch: (p: Partial<RestauranteListingDraft>) => void;
  uploadLabels: Record<string, string>;
  setUploadLabels: React.Dispatch<React.SetStateAction<Record<string, string>>>;
};

export function RestaurantePublishMediaStrip({
  draft,
  draftRef,
  setDraftPatch,
  uploadLabels,
  setUploadLabels,
}: Props) {
  const sequence = useMemo(() => resolveRestauranteGallerySequence(draft), [draft]);
  const ids = useMemo(() => sequence.map(entryToId), [sequence]);

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
      const nextSeq = arrayMove(sequence, oldIndex, newIndex);
      setDraftPatch({ galleryMediaSequence: nextSeq });
    },
    [ids, sequence, setDraftPatch]
  );

  const removeGalleryAt = (galleryIndex: number) => {
    const cur = draftRef.current;
    const imgs = [...(cur.galleryImages ?? [])];
    imgs.splice(galleryIndex, 1);
    const prevSeq = cur.galleryMediaSequence ?? resolveRestauranteGallerySequence(cur);
    const nextSeq = remapSequenceAfterImageRemove(prevSeq, galleryIndex);
    setDraftPatch({
      galleryImages: imgs,
      galleryMediaSequence: nextSeq,
      galleryOrder: imgs.map((_, i) => String(i)),
    });
  };

  const removeVideo = () => {
    const cur = draftRef.current;
    const seq = (cur.galleryMediaSequence ?? resolveRestauranteGallerySequence(cur)).filter((x) => x !== "v");
    setUploadLabels((p) => {
      const n = { ...p };
      delete n.video;
      return n;
    });
    setDraftPatch({
      videoFile: undefined,
      videoUrl: undefined,
      galleryMediaSequence: seq.length ? seq : undefined,
    });
  };

  const addGalleryFiles = async (files: FileList | null) => {
    const list = files ? Array.from(files) : [];
    const cur = draftRef.current;
    const prev = cur.galleryImages ?? [];
    const room = MAX_GALLERY - prev.length;
    const toAdd = list.slice(0, Math.max(0, room));
    const urls: string[] = [];
    for (const f of toAdd) {
      urls.push(await readRestauranteImageAsDataUrl(f));
    }
    if (!urls.length) return;
    const imgs = [...prev, ...urls];
    const prevSeq = resolveRestauranteGallerySequence(cur);
    const hadV = prevSeq.includes("v");
    const withoutV: number[] = prevSeq.filter((e): e is number => e !== "v");
    const start = prev.length;
    for (let i = 0; i < urls.length; i++) withoutV.push(start + i);
    const hasV =
      (typeof cur.videoFile === "string" && cur.videoFile.trim().length > 0) ||
      (typeof cur.videoUrl === "string" && cur.videoUrl.trim().length > 0);
    const nextSeq: RestauranteGallerySeqEntry[] =
      hadV || hasV ? [...withoutV, "v" as const] : withoutV;
    setDraftPatch({
      galleryImages: imgs,
      galleryMediaSequence: nextSeq,
      galleryOrder: imgs.map((_, i) => String(i)),
    });
  };

  const addVideoFile = async (files: FileList | null) => {
    const f = files?.[0];
    if (!f) {
      removeVideo();
      return;
    }
    setUploadLabels((p) => ({ ...p, video: f.name }));
    const dataUrl = await readFileAsDataUrl(f);
    const cur = draftRef.current;
    let seq = cur.galleryMediaSequence ?? resolveRestauranteGallerySequence({ ...cur, videoFile: dataUrl });
    if (!seq.includes("v")) seq = [...seq, "v"];
    setDraftPatch({ videoFile: dataUrl, videoUrl: undefined, galleryMediaSequence: seq });
  };

  const heroEmpty = !draft.heroImage?.trim();
  const firstImageEntry = sequence.find((x): x is number => typeof x === "number");

  return (
    <div className="mt-4 grid gap-4">
      <div>
        <p className="text-sm font-semibold text-[color:var(--lx-text)]">Galería general y video</p>
        <p className="mt-1 text-xs leading-relaxed text-[color:var(--lx-muted)]">
          Arrastra con el asa ⋮⋮ (mismo patrón que otros rubros Leonix). La primera imagen en este orden es la portada
          sugerida si no subes una foto principal aparte.
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
          {sequence.length > 0 ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={ids} strategy={rectSortingStrategy}>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                  {sequence.map((entry) => {
                    if (entry === "v") {
                      return (
                        <SortableGalleryTile
                          key="v"
                          id="v"
                          dragLabel="Arrastrar video"
                          onRemove={removeVideo}
                        >
                          <div className="relative aspect-square w-full">
                            {draft.videoFile?.startsWith("data:video") ? (
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
                            <span className="absolute bottom-2 left-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white">
                              Video
                            </span>
                          </div>
                        </SortableGalleryTile>
                      );
                    }
                    const url = draft.galleryImages?.[entry];
                    if (!url) return null;
                    const isCoverHint = heroEmpty && entry === firstImageEntry;
                    return (
                      <SortableGalleryTile
                        key={`g-${entry}`}
                        id={`g-${entry}`}
                        dragLabel="Arrastrar imagen"
                        onRemove={() => removeGalleryAt(entry)}
                      >
                        <div className="relative aspect-square w-full">
                          <Image src={url} alt="" fill className="object-cover" unoptimized />
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
