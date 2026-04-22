"use client";

import { useCallback, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { RestauranteSortableMediaTile } from "@/app/clasificados/restaurantes/application/RestauranteSortableMediaTile";
import { remapPrimaryIndexAfterArrayMove } from "./leonixRemapPrimaryAfterPhotoReorder";

function photoId(i: number) {
  return `leonix-re-photo-${i}`;
}

export type LeonixRealEstateSortablePhotoStripProps = {
  urls: string[];
  primaryImageIndex: number;
  onReorder: (nextUrls: string[], nextPrimary: number) => void;
  onRemove: (index: number) => void;
  onSetPrimary: (index: number) => void;
  /** `grid`: card tiles (negocio-style). `list`: compact row preview (privado legacy density). */
  variant?: "grid" | "list";
  dragLabel?: string;
};

/**
 * Drag-and-drop photo ordering for Leonix real-estate publish flows (same interaction model as restaurantes).
 */
export function LeonixRealEstateSortablePhotoStrip({
  urls,
  primaryImageIndex,
  onReorder,
  onRemove,
  onSetPrimary,
  variant = "grid",
  dragLabel = "Arrastrar para reordenar foto",
}: LeonixRealEstateSortablePhotoStripProps) {
  const ids = useMemo(() => urls.map((_, i) => photoId(i)), [urls]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = ids.indexOf(String(active.id));
      const newIndex = ids.indexOf(String(over.id));
      if (oldIndex < 0 || newIndex < 0) return;
      const nextUrls = arrayMove(urls, oldIndex, newIndex);
      let nextPrimary = remapPrimaryIndexAfterArrayMove(primaryImageIndex, oldIndex, newIndex);
      nextPrimary = Math.min(Math.max(0, nextPrimary), Math.max(0, nextUrls.length - 1));
      onReorder(nextUrls, nextPrimary);
    },
    [ids, urls, primaryImageIndex, onReorder],
  );

  const gridClass =
    variant === "grid"
      ? "mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
      : "mt-3 grid gap-2.5 sm:grid-cols-2";

  if (urls.length === 0) return null;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <ul className={`${gridClass} m-0 list-none p-0`}>
          {urls.map((url, i) => {
            const id = photoId(i);
            const isPrimary = i === primaryImageIndex;
            return (
              <li key={id} className="min-w-0">
                <RestauranteSortableMediaTile
                  id={id}
                  dragLabel={dragLabel}
                  onRemove={() => onRemove(i)}
                  variant="gallery"
                >
                  <div className="p-1.5">
                    <div className="mb-1.5 flex items-center justify-between gap-2 pr-1">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-[#8A7B62]">
                        Foto {i + 1}
                        {isPrimary ? " · Portada" : ""}
                      </span>
                    </div>
                    { }
                    <img
                      src={url}
                      alt=""
                      className={
                        variant === "grid"
                          ? "aspect-[4/3] w-full rounded-lg object-cover"
                          : "h-28 w-full rounded-md object-cover sm:h-32"
                      }
                    />
                    <div className="mt-2 flex flex-wrap gap-1">
                      <button
                        type="button"
                        className={`rounded-lg px-2 py-1 text-[11px] font-bold ${
                          isPrimary
                            ? "bg-[#C9B46A]/25 text-[#6E5418]"
                            : "border border-[#C9B46A]/40 text-[#6E5418]"
                        }`}
                        onClick={() => onSetPrimary(i)}
                      >
                        {isPrimary ? "Portada activa" : "Usar como portada"}
                      </button>
                    </div>
                  </div>
                </RestauranteSortableMediaTile>
              </li>
            );
          })}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
