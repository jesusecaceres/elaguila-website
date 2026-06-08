"use client";

import { LeonixRealEstateSortablePhotoStrip } from "@/app/clasificados/lib/LeonixRealEstateSortablePhotoStrip";
import { readFileAsDataUrl } from "../../utils/readFileAsDataUrl";
import type { BrNegocioPrePublishInventoryLang } from "../../brNegocioPrePublishInventoryShellCopy";
import { brNegocioPrePublishInventoryShellCopy } from "../../brNegocioPrePublishInventoryShellCopy";
import type { BrNegocioAdditionalInventoryPropertyDraft } from "../../brNegocioAdditionalInventoryDraft";
import { normalizeChildInventoryDraft } from "../../brNegocioAdditionalInventoryDraft";
import { brInputClass, BrField } from "./brFormPrimitives";

type Props = {
  lang: BrNegocioPrePublishInventoryLang;
  draft: BrNegocioAdditionalInventoryPropertyDraft;
  onChange: (next: BrNegocioAdditionalInventoryPropertyDraft) => void;
};

const MAX_PHOTOS = 40;

export function BrNegocioPrePublishInventoryDrawerMedia({ lang, draft, onChange }: Props) {
  const copy = brNegocioPrePublishInventoryShellCopy(lang);
  const f = copy.fields;
  const normalized = normalizeChildInventoryDraft(draft);
  const photos = normalized.photoUrls;

  const patch = (partial: Partial<BrNegocioAdditionalInventoryPropertyDraft>) => {
    onChange(normalizeChildInventoryDraft({ ...draft, ...partial }));
  };

  return (
    <div className="space-y-4 rounded-xl border border-[#E8DFD0] bg-[#FFFCF7] p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-[#6E5418]">{f.mediaSection}</p>
      <p className="text-xs leading-relaxed text-[#5C5346]/90">{f.mediaSectionHint}</p>

      <div>
        <p className="text-sm font-semibold text-[#1E1810]">{f.photos}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <label className="inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-xl border border-[#C9B46A]/50 bg-[#FBF7EF] px-4 py-2.5 text-xs font-semibold touch-manipulation">
            {f.addPhotos}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                e.target.value = "";
                void Promise.all(files.map((file) => readFileAsDataUrl(file))).then((urls) => {
                  const next = [...photos, ...urls].slice(0, MAX_PHOTOS);
                  patch({ photoUrls: next, primaryPhotoIndex: normalized.primaryPhotoIndex });
                });
              }}
            />
          </label>
        </div>
        <BrField label={f.photoUrlPaste} hint={f.photoUrlPasteHint}>
          <div className="flex gap-2">
            <input
              id="br-inv-photo-url-paste"
              className={brInputClass}
              type="url"
              placeholder="https://"
              defaultValue=""
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                const input = e.currentTarget;
                const url = input.value.trim();
                if (!url || photos.length >= MAX_PHOTOS) return;
                patch({ photoUrls: [...photos, url].slice(0, MAX_PHOTOS) });
                input.value = "";
              }}
            />
            <button
              type="button"
              className="shrink-0 rounded-xl border border-[#E8DFD0] px-3 py-2 text-xs font-semibold text-[#6E5418]"
              onClick={() => {
                const input = document.getElementById("br-inv-photo-url-paste") as HTMLInputElement | null;
                const url = input?.value.trim() ?? "";
                if (!url || photos.length >= MAX_PHOTOS) return;
                patch({ photoUrls: [...photos, url].slice(0, MAX_PHOTOS) });
                if (input) input.value = "";
              }}
            >
              {f.addPhotoUrl}
            </button>
          </div>
        </BrField>
        {photos.length > 0 ? (
          <div className="mt-3">
            <LeonixRealEstateSortablePhotoStrip
              urls={photos}
              primaryImageIndex={normalized.primaryPhotoIndex}
              onReorder={(nextUrls, nextPrimary) =>
                patch({ photoUrls: nextUrls, primaryPhotoIndex: nextPrimary })
              }
              onRemove={(i) => {
                const next = photos.filter((_, j) => j !== i);
                let idx = normalized.primaryPhotoIndex;
                if (idx >= next.length) idx = Math.max(0, next.length - 1);
                patch({ photoUrls: next, primaryPhotoIndex: idx });
              }}
              onSetPrimary={(i) => patch({ primaryPhotoIndex: i })}
            />
          </div>
        ) : null}
        <p className="mt-2 text-xs text-[#7A7164]">{f.coverPhotoNote}</p>
      </div>

      <BrField label={f.listadoUrl} hint={f.listadoUrlHint}>
        <input className={brInputClass} type="url" value={draft.listadoUrl} onChange={(e) => patch({ listadoUrl: e.target.value })} placeholder="https://" />
      </BrField>
      <BrField label={f.videoUrl} hint={f.videoUrlHint}>
        <input className={brInputClass} type="url" value={draft.videoUrl} onChange={(e) => patch({ videoUrl: e.target.value })} placeholder="https://" />
      </BrField>
      <BrField label={f.tourUrl} hint={f.tourUrlHint}>
        <input className={brInputClass} type="url" value={draft.tourUrl} onChange={(e) => patch({ tourUrl: e.target.value })} placeholder="https://" />
      </BrField>
      <BrField label={f.brochureUrl} hint={f.brochureUrlHint}>
        <input className={brInputClass} type="url" value={draft.brochureUrl} onChange={(e) => patch({ brochureUrl: e.target.value })} placeholder="https://" />
      </BrField>
      <BrField label={f.mlsUrl} hint={f.mlsUrlHint}>
        <input className={brInputClass} type="url" value={draft.mlsUrl} onChange={(e) => patch({ mlsUrl: e.target.value })} placeholder="https://" />
      </BrField>
    </div>
  );
}
