"use client";

import { useCallback, type ReactNode } from "react";
import type { RestauranteListingDraft } from "./restauranteDraftTypes";
import { isRestauranteDisplayableImageRef } from "./restauranteMediaDisplay";
import { readRestauranteImageAsDataUrl } from "./compressRestauranteImage";
import type { RestauranteDraftPatch } from "./useRestauranteDraft";
import { RestauranteBucketSortableGrid } from "./RestauranteBucketSortableGrid";
import { RestauranteUploadRow } from "./RestauranteUploadRow";

const MAX_IMAGES_PER_BUCKET = 12;

interface RestaurantePublishMediaBucketsProps {
  draft: RestauranteListingDraft;
  onChange: (patch: RestauranteDraftPatch) => void;
}

export function RestaurantePublishMediaBuckets({
  draft,
  onChange,
}: RestaurantePublishMediaBucketsProps) {
  const addFoodImages = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
      const processed = await Promise.all(imageFiles.map(async (f) => await readRestauranteImageAsDataUrl(f)));

      const current = draft.foodImages ?? [];
      onChange({
        foodImages: [...current, ...processed].slice(0, MAX_IMAGES_PER_BUCKET),
      });
    },
    [draft.foodImages, onChange],
  );

  const addInteriorImages = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
      const processed = await Promise.all(imageFiles.map(async (f) => await readRestauranteImageAsDataUrl(f)));

      const current = draft.interiorImages ?? [];
      onChange({
        interiorImages: [...current, ...processed].slice(0, MAX_IMAGES_PER_BUCKET),
      });
    },
    [draft.interiorImages, onChange],
  );

  const addExteriorImages = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
      const processed = await Promise.all(imageFiles.map(async (f) => await readRestauranteImageAsDataUrl(f)));

      const current = draft.exteriorImages ?? [];
      onChange({
        exteriorImages: [...current, ...processed].slice(0, MAX_IMAGES_PER_BUCKET),
      });
    },
    [draft.exteriorImages, onChange],
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
            disabled={foodCount >= MAX_IMAGES_PER_BUCKET}
            selectedLabel={foodCount > 0 ? `${foodCount} foto(s) · máx. ${MAX_IMAGES_PER_BUCKET}` : null}
            onFilesSelected={(fl) => void addFoodImages(fl)}
          />
        }
        emptyHint="Aún no hay fotos de comida."
        sortable={<RestauranteBucketSortableGrid field="foodImages" draft={draft} setDraftPatch={onChange} />}
        showEmptyHint={foodOk === 0}
      />

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
        sortable={<RestauranteBucketSortableGrid field="interiorImages" draft={draft} setDraftPatch={onChange} />}
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
        sortable={<RestauranteBucketSortableGrid field="exteriorImages" draft={draft} setDraftPatch={onChange} />}
        showEmptyHint={exteriorOk === 0}
      />
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
