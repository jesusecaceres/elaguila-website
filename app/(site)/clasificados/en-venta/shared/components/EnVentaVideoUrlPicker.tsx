"use client";

import { isEmbeddableExternalVideoUrl } from "@/app/clasificados/en-venta/shared/utils/enVentaVideoEmbed";

type Props = {
  lang: "es" | "en";
  videoUrls: string[];
  activeIndex: number;
  onSelect: (index: number) => void;
};

/** Simple Video 1 / Video 2 switcher for preview + public gallery. */
export function EnVentaVideoUrlPicker({ lang, videoUrls, activeIndex, onSelect }: Props) {
  if (videoUrls.length <= 1) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {videoUrls.map((url, idx) => (
        <button
          key={`${idx}-${url.slice(0, 24)}`}
          type="button"
          onClick={() => onSelect(idx)}
          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
            idx === activeIndex
              ? "border-[#C9A84A] bg-[#FFF7E7] text-[#3D2C12]"
              : "border-[#E8DFD0] bg-white text-[#5C5346] hover:border-[#C9B46A]/45"
          }`}
        >
          {lang === "es" ? `Video ${idx + 1}` : `Video ${idx + 1}`}
        </button>
      ))}
    </div>
  );
}

export function normalizeEnVentaGalleryVideoUrls(
  videoUrls: string[] | null | undefined,
  videoUrl: string | null | undefined
): string[] {
  const fromList = (videoUrls ?? []).map((u) => u.trim()).filter((u) => isEmbeddableExternalVideoUrl(u));
  if (fromList.length) return fromList;
  const single = (videoUrl ?? "").trim();
  return single && isEmbeddableExternalVideoUrl(single) ? [single] : [];
}
