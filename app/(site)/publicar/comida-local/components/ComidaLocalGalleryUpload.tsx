"use client";

import { COMIDA_LOCAL_GALLERY_MAX } from "@/app/lib/clasificados/comida-local/comidaLocalConstants";
import {
  COMIDA_LOCAL_FIELD_COPY,
  resolveComidaLocalFieldCopy,
} from "@/app/lib/clasificados/comida-local/comidaLocalFieldCopy";
import type { ComidaLocalImageDraft } from "@/app/lib/clasificados/comida-local/comidaLocalTypes";
import { ComidaLocalImageUploadField } from "./ComidaLocalImageUploadField";

type Props = {
  draftListingId: string;
  images: ComidaLocalImageDraft[];
  onChange: (images: ComidaLocalImageDraft[]) => void;
  es: boolean;
};

export function ComidaLocalGalleryUpload({ draftListingId, images, onChange, es }: Props) {
  const copy = resolveComidaLocalFieldCopy(COMIDA_LOCAL_FIELD_COPY.galleryImages, es);
  const atCap = images.length >= COMIDA_LOCAL_GALLERY_MAX;

  const addSlot = !atCap ? (
    <ComidaLocalImageUploadField
      key={`add-${images.length}`}
      role="gallery"
      label={`${copy.label} (${images.length}/${COMIDA_LOCAL_GALLERY_MAX})`}
      helper={copy.helper}
      optional
      draftListingId={draftListingId}
      image={null}
      minHeightClass="min-h-[100px]"
      es={es}
      onImageChange={(img) => {
        if (!img) return;
        onChange([...images, { ...img, role: "gallery" }]);
      }}
    />
  ) : null;

  return (
    <div className="space-y-4">
      {images.map((img, i) => (
        <ComidaLocalImageUploadField
          key={img.id || `gallery-${i}`}
          role="gallery"
          label={es ? `Galería — foto ${i + 1}` : `Gallery — photo ${i + 1}`}
          helper={es ? "Foto extra para tu ficha." : "Extra photo for your listing."}
          optional
          draftListingId={draftListingId}
          image={img}
          minHeightClass="min-h-[100px]"
          es={es}
          onImageChange={(next) => {
            if (!next) {
              onChange(images.filter((_, j) => j !== i));
              return;
            }
            const nextList = [...images];
            nextList[i] = { ...next, role: "gallery" };
            onChange(nextList);
          }}
        />
      ))}
      {addSlot}
    </div>
  );
}
