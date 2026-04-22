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
import type { RestauranteListingDraft } from "./restauranteDraftTypes";
import type { RestauranteDraftPatch } from "./useRestauranteDraft";
import { isRestauranteDisplayableImageRef } from "./restauranteMediaDisplay";
import { RestauranteSortableMediaTile } from "./RestauranteSortableMediaTile";

export type RestauranteBucketField = "interiorImages" | "foodImages" | "exteriorImages";

type Props = {
  field: RestauranteBucketField;
  draft: RestauranteListingDraft;
  setDraftPatch: (patch: RestauranteDraftPatch) => void;
};

/**
 * Drag/reorder + remove for interior / comida / exterior buckets — same interaction model as the general gallery strip.
 */
export function RestauranteBucketSortableGrid({ field, draft, setDraftPatch }: Props) {
  const urls = (draft[field] as string[] | undefined) ?? [];

  const itemIds = useMemo(() => urls.map((_, i) => `${field}-${i}`), [field, urls]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = itemIds.indexOf(String(active.id));
      const newIndex = itemIds.indexOf(String(over.id));
      if (oldIndex < 0 || newIndex < 0) return;

      setDraftPatch((prev) => {
        const cur = [...(((prev[field] as string[] | undefined) ?? []) as string[])];
        return { [field]: arrayMove(cur, oldIndex, newIndex) } as Partial<RestauranteListingDraft>;
      });
    },
    [field, itemIds, setDraftPatch]
  );

  const visible = urls.some((u) => isRestauranteDisplayableImageRef(u));
  if (!visible) return null;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={itemIds} strategy={rectSortingStrategy}>
        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {urls.map((url, i) => {
            if (!isRestauranteDisplayableImageRef(url)) return null;
            const sortId = `${field}-${i}`;
            return (
              <li key={sortId}>
                <RestauranteSortableMediaTile
                  id={sortId}
                  dragLabel="Arrastrar para reordenar"
                  variant="bucket"
                  onRemove={() =>
                    setDraftPatch((prev) => {
                      const cur = [...(((prev[field] as string[] | undefined) ?? []) as string[])];
                      cur.splice(i, 1);
                      return { [field]: cur } as Partial<RestauranteListingDraft>;
                    })
                  }
                >
                  <div className="relative aspect-square w-full min-h-[88px] bg-[color:var(--lx-section)]">
                    { }
                    <img
                      src={url}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                      draggable={false}
                      loading="lazy"
                      decoding="async"
                    />
                    <span className="pointer-events-none absolute bottom-1 left-1 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      Aceptada
                    </span>
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
