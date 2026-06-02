"use client";

type Tab = "photos" | "videos";

type Props = {
  lang: "es" | "en";
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
};

/** Fotos / Videos toggle — shown only when caller renders it for listings with both media types. */
export function EnVentaMediaTabToggle({ lang, activeTab, onTabChange }: Props) {
  const photosLabel = lang === "es" ? "Fotos" : "Photos";
  const videosLabel = lang === "es" ? "Videos" : "Videos";

  return (
    <nav
      className="inline-flex max-w-full rounded-xl border border-[#D6C7AD]/80 bg-[#FFFCF7] p-1 shadow-sm"
      aria-label={lang === "es" ? "Tipo de medio" : "Media type"}
      data-testid="ev-media-tab-toggle"
    >
      <button
        type="button"
        onClick={() => onTabChange("photos")}
        className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition sm:px-4 sm:text-sm ${
          activeTab === "photos"
            ? "bg-white text-[#3D2C12] shadow-sm ring-1 ring-[#C9A84A]/45"
            : "text-[#7A7164] hover:text-[#3D2C12]"
        }`}
        aria-pressed={activeTab === "photos"}
      >
        {photosLabel}
      </button>
      <button
        type="button"
        onClick={() => onTabChange("videos")}
        className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition sm:px-4 sm:text-sm ${
          activeTab === "videos"
            ? "bg-white text-[#3D2C12] shadow-sm ring-1 ring-[#C9A84A]/45"
            : "text-[#7A7164] hover:text-[#3D2C12]"
        }`}
        aria-pressed={activeTab === "videos"}
      >
        {videosLabel}
      </button>
    </nav>
  );
}

export type EnVentaMediaTab = Tab;

export function resolveEnVentaDefaultMediaTab(hasPhotos: boolean, hasVideos: boolean): Tab {
  if (hasPhotos) return "photos";
  if (hasVideos) return "videos";
  return "photos";
}
