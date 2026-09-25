"use client";

import { useCallback, type ReactNode } from "react";
import type { RestauranteListingDraft } from "./restauranteDraftTypes";
import { isRestauranteDisplayableImageRef } from "./restauranteMediaDisplay";
import {
  readRestauranteImageAsDataUrl,
  RESTAURANTE_GRID_IMAGE_COMPRESSION_OPTS,
} from "./compressRestauranteImage";
import type { RestauranteDraftPatch } from "./useRestauranteDraft";
import { RestauranteBucketSortableGrid } from "./RestauranteBucketSortableGrid";
import { RestauranteUploadRow } from "./RestauranteUploadRow";

const MAX_IMAGES_PER_BUCKET = 12;

interface RestaurantePublishMediaBucketsProps {
  draft: RestauranteListingDraft;
  onChange: (patch: RestauranteDraftPatch) => void;
  /**
   * Quick (Simple) entitlement only: TOTAL photo cap (hero + all buckets) from the per-category Quick table.
   * Photos beyond the hero go to the Comida bucket, the one bucket the public "Galería y Videos" section
   * renders. Interior/Exterior are hidden (stored values are kept, never deleted) and still count toward the
   * cap. null/undefined = Full: three buckets, 12 each, unchanged.
   */
  quickPhotoCap?: number | null;
}

export function RestaurantePublishMediaBuckets({
  draft,
  onChange,
  quickPhotoCap = null,
}: RestaurantePublishMediaBucketsProps) {
  const isQuickCap = typeof quickPhotoCap === "number" && quickPhotoCap > 0;
  /** Comida slots left for Quick: cap minus the hero slot minus stored interior/exterior photos. */
  const quickFoodMax = isQuickCap
    ? Math.max(0, (quickPhotoCap ?? 0) - 1 - (draft.interiorImages?.length ?? 0) - (draft.exteriorImages?.length ?? 0))
    : MAX_IMAGES_PER_BUCKET;
  const foodMax = isQuickCap ? Math.min(MAX_IMAGES_PER_BUCKET, quickFoodMax) : MAX_IMAGES_PER_BUCKET;
  const appendBucketImages = useCallback(
    async (
      field: "foodImages" | "interiorImages" | "exteriorImages",
      files: FileList | null,
    ) => {
      if (!files || files.length === 0) return;
      const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
      for (const f of imageFiles) {
        const dataUrl = await readRestauranteImageAsDataUrl(f, RESTAURANTE_GRID_IMAGE_COMPRESSION_OPTS);
        if (!isRestauranteDisplayableImageRef(dataUrl)) continue;
        onChange((prev) => {
          const current = (prev[field] as string[] | undefined) ?? [];
          const bucketMax = isQuickCap
            ? Math.max(
                0,
                (quickPhotoCap ?? 0) - 1 - (prev.interiorImages?.length ?? 0) - (prev.exteriorImages?.length ?? 0),
              )
            : MAX_IMAGES_PER_BUCKET;
          if (field !== "foodImages" && isQuickCap) return {};
          if (current.length >= Math.min(MAX_IMAGES_PER_BUCKET, bucketMax)) return {};
          return { [field]: [...current, dataUrl.trim()] } as Partial<RestauranteListingDraft>;
        });
      }
    },
    [onChange, isQuickCap, quickPhotoCap],
  );

  const addFoodImages = useCallback(
    (files: FileList | null) => void appendBucketImages("foodImages", files),
    [appendBucketImages],
  );
  const addInteriorImages = useCallback(
    (files: FileList | null) => void appendBucketImages("interiorImages", files),
    [appendBucketImages],
  );
  const addExteriorImages = useCallback(
    (files: FileList | null) => void appendBucketImages("exteriorImages", files),
    [appendBucketImages],
  );

  const foodCount = draft.foodImages?.length ?? 0;
  const interiorCount = draft.interiorImages?.length ?? 0;
  const exteriorCount = draft.exteriorImages?.length ?? 0;
  const foodOk = (draft.foodImages ?? []).filter((u) => isRestauranteDisplayableImageRef(u)).length;
  const interiorOk = (draft.interiorImages ?? []).filter((u) => isRestauranteDisplayableImageRef(u)).length;
  const exteriorOk = (draft.exteriorImages ?? []).filter((u) => isRestauranteDisplayableImageRef(u)).length;

  return (
    <div className="space-y-8">
      <BucketBlock
        title="🍽️ Comida"
        description="Fotos de los platos, bebidas y presentación culinaria. Aparecen en la ficha bajo la categoría comida."
        dropAdd={(fl) => void addFoodImages(fl)}
        uploadSlot={
          <RestauranteUploadRow
            buttonLabel="Agregar fotos de comida"
            helperText="Varias a la vez, o arrastra imágenes aquí."
            accept="image/*"
            multiple
            disabled={foodCount >= foodMax}
            selectedLabel={foodCount > 0 ? `${foodCount} foto(s) · máx. ${foodMax}` : null}
            onFilesSelected={(fl) => void addFoodImages(fl)}
          />
        }
        emptyHint="Aún no hay fotos de comida."
        sortable={
          <RestauranteBucketSortableGrid field="foodImages" draft={draft} setDraftPatch={onChange} />
        }
        showEmptyHint={foodOk === 0}
      />

      {isQuickCap ? null : (
      <>
      <BucketBlock
        title="🏠 Interior"
        description="Fotos del ambiente interior, decoración, mesas, barra y espacios del restaurante."
        dropAdd={(fl) => void addInteriorImages(fl)}
        uploadSlot={
          <RestauranteUploadRow
            buttonLabel="Agregar fotos del interior"
            helperText="Varias a la vez, o arrastra imágenes aquí."
            accept="image/*"
            multiple
            disabled={interiorCount >= MAX_IMAGES_PER_BUCKET}
            selectedLabel={interiorCount > 0 ? `${interiorCount} foto(s) · máx. ${MAX_IMAGES_PER_BUCKET}` : null}
            onFilesSelected={(fl) => void addInteriorImages(fl)}
          />
        }
        emptyHint="Aún no hay fotos del interior."
        sortable={
          <RestauranteBucketSortableGrid field="interiorImages" draft={draft} setDraftPatch={onChange} />
        }
        showEmptyHint={interiorOk === 0}
      />

      <BucketBlock
        title="🌿 Exterior"
        description="Fotos de la fachada, terraza, estacionamiento, entrada y vistas exteriores del restaurante."
        dropAdd={(fl) => void addExteriorImages(fl)}
        uploadSlot={
          <RestauranteUploadRow
            buttonLabel="Agregar fotos del exterior"
            helperText="Varias a la vez, o arrastra imágenes aquí."
            accept="image/*"
            multiple
            disabled={exteriorCount >= MAX_IMAGES_PER_BUCKET}
            selectedLabel={exteriorCount > 0 ? `${exteriorCount} foto(s) · máx. ${MAX_IMAGES_PER_BUCKET}` : null}
            onFilesSelected={(fl) => void addExteriorImages(fl)}
          />
        }
        emptyHint="Aún no hay fotos del exterior."
        sortable={
          <RestauranteBucketSortableGrid field="exteriorImages" draft={draft} setDraftPatch={onChange} />
        }
        showEmptyHint={exteriorOk === 0}
      />
      </>
      )}
    </div>
  );
}

function BucketBlock({
  title,
  description,
  uploadSlot,
  dropAdd,
  sortable,
  emptyHint,
  showEmptyHint,
}: {
  title: string;
  description: string;
  uploadSlot: ReactNode;
  dropAdd: (files: FileList) => void;
  sortable: ReactNode;
  emptyHint: string;
  showEmptyHint: boolean;
}) {
  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-[color:var(--lx-text)]">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-[color:var(--lx-muted)]">{description}</p>
      </div>

      <div
        className="rounded-xl border border-dashed border-[color:var(--lx-nav-border)]/80 bg-[color:var(--lx-section)]/30 p-4"
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }}
        onDrop={(e) => {
          e.preventDefault();
          const fl = e.dataTransfer.files;
          if (fl && fl.length) dropAdd(fl);
        }}
      >
        {uploadSlot}
        {sortable}
        {showEmptyHint ? <p className="mt-2 text-xs text-[color:var(--lx-muted)]">{emptyHint}</p> : null}
      </div>
    </div>
  );
}
