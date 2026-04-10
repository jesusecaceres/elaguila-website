"use client";

import type { RestauranteListingDraft } from "./restauranteDraftTypes";
import type { RestauranteDraftPatch } from "./useRestauranteDraft";
import { readRestauranteImageAsDataUrl } from "./compressRestauranteImage";
import { isRestauranteDisplayableImageRef } from "./restauranteMediaDisplay";
import { RestauranteBucketSortableGrid } from "./RestauranteBucketSortableGrid";
import { RestauranteUploadRow } from "./RestauranteUploadRow";

const MAX_BUCKET_IMAGES = 24;

type BucketField = "interiorImages" | "foodImages" | "exteriorImages";

type Props = {
  field: BucketField;
  emptyHintLabel: string;
  draft: RestauranteListingDraft;
  setDraftPatch: (patch: RestauranteDraftPatch) => void;
};

export function RestauranteSubGalleryBucket({ field, emptyHintLabel, draft, setDraftPatch }: Props) {
  const urls = (draft[field] as string[] | undefined) ?? [];
  const nOk = urls.filter((u) => isRestauranteDisplayableImageRef(u)).length;

  return (
    <div>
      <RestauranteUploadRow
        buttonLabel="Agregar fotos"
        helperText={`Varias a la vez. Cada foto aparece al procesarse (compresión). Máx. ${MAX_BUCKET_IMAGES} por categoría.`}
        accept="image/*"
        multiple
        disabled={nOk >= MAX_BUCKET_IMAGES}
        selectedLabel={nOk > 0 ? `${nOk} foto(s) · máx. ${MAX_BUCKET_IMAGES}` : null}
        onFilesSelected={async (files) => {
          const list = files ? Array.from(files) : [];
          for (const f of list) {
            const u = await readRestauranteImageAsDataUrl(f);
            if (!isRestauranteDisplayableImageRef(u)) continue;
            setDraftPatch((prev) => {
              const cur = [...(((prev[field] as string[] | undefined) ?? []) as string[])];
              if (cur.length >= MAX_BUCKET_IMAGES) return {};
              return { [field]: [...cur, u.trim()] } as Partial<RestauranteListingDraft>;
            });
          }
        }}
      />
      <RestauranteBucketSortableGrid field={field} draft={draft} setDraftPatch={setDraftPatch} />
      {!nOk ? <p className="mt-2 text-xs text-[color:var(--lx-muted)]">Aún no hay fotos en {emptyHintLabel}.</p> : null}
    </div>
  );
}
