"use client";

import type { RestauranteListingDraft } from "./restauranteDraftTypes";
import type { RestauranteDraftPatch } from "./useRestauranteDraft";
import { readRestauranteImageAsDataUrl } from "./compressRestauranteImage";
import { isRestauranteDisplayableImageRef } from "./restauranteMediaDisplay";
import { RestauranteUploadRow } from "./RestauranteUploadRow";

type BucketField = "interiorImages" | "foodImages" | "exteriorImages";

type Props = {
  field: BucketField;
  emptyHintLabel: string;
  draft: RestauranteListingDraft;
  setDraftPatch: (patch: RestauranteDraftPatch) => void;
};

export function RestauranteSubGalleryBucket({ field, emptyHintLabel, draft, setDraftPatch }: Props) {
  const urls = (draft[field] as string[] | undefined) ?? [];

  return (
    <div>
      <RestauranteUploadRow
        buttonLabel="Agregar fotos"
        helperText="Varias a la vez. Cada foto aceptada aparece abajo."
        accept="image/*"
        multiple
        selectedLabel={
          urls.filter((u) => isRestauranteDisplayableImageRef(u)).length > 0
            ? `${urls.filter((u) => isRestauranteDisplayableImageRef(u)).length} foto(s)`
            : null
        }
        onFilesSelected={async (files) => {
          const list = files ? Array.from(files) : [];
          const nextUrls: string[] = [];
          for (const f of list) {
            const u = await readRestauranteImageAsDataUrl(f);
            if (isRestauranteDisplayableImageRef(u)) nextUrls.push(u.trim());
          }
          if (!nextUrls.length) return;
          setDraftPatch((prev) => {
            const cur = ((prev[field] as string[] | undefined) ?? []) as string[];
            return { [field]: [...cur, ...nextUrls] } as Partial<RestauranteListingDraft>;
          });
        }}
      />
      {urls.some((u) => isRestauranteDisplayableImageRef(u)) ? (
        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {urls.map((url, i) =>
            isRestauranteDisplayableImageRef(url) ? (
              <li
                key={`${field}-${i}-${url.slice(0, 48)}`}
                className="relative aspect-square overflow-hidden rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] shadow-sm"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" draggable={false} />
                <button
                  type="button"
                  className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-red-700 text-sm font-bold text-white shadow-md"
                  aria-label="Quitar foto"
                  onClick={() =>
                    setDraftPatch((prev) => {
                      const cur = [...(((prev[field] as string[] | undefined) ?? []) as string[])];
                      cur.splice(i, 1);
                      return { [field]: cur } as Partial<RestauranteListingDraft>;
                    })
                  }
                >
                  ×
                </button>
                <span className="pointer-events-none absolute bottom-1 left-1 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  Aceptada
                </span>
              </li>
            ) : null
          )}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-[color:var(--lx-muted)]">Aún no hay fotos en {emptyHintLabel}.</p>
      )}
    </div>
  );
}
