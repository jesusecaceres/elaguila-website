import { FiPlay } from "react-icons/fi";
import type { AutoDealerListing } from "../types/autoDealerListing";
import { MediaImage } from "./MediaImage";

const CARD =
  "rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4 shadow-[0_8px_32px_-8px_rgba(42,36,22,0.1)]";

export function AutoGallery({ data }: { data: AutoDealerListing }) {
  const images = data.heroImages ?? [];
  const videoUrl = data.videoUrl?.trim();
  const hasVideo = Boolean(videoUrl);
  const main = images[0];
  const extra = Math.max(0, images.length - 1);
  const subImages = images.slice(1, 4);
  const altBase = data.vehicleTitle?.trim() || "Vehículo";

  if (!main && !hasVideo) return null;

  const bottomCells: Array<{ kind: "img"; src: string } | { kind: "video" }> = [];
  for (const src of subImages) {
    bottomCells.push({ kind: "img", src });
  }
  if (hasVideo) bottomCells.push({ kind: "video" });

  const gridCols =
    bottomCells.length >= 4 ? "md:grid-cols-4" : bottomCells.length === 3 ? "md:grid-cols-3" : bottomCells.length === 2 ? "md:grid-cols-2" : "md:grid-cols-1";

  return (
    <div className={CARD}>
      <div className="flex flex-col gap-3">
        {main ? (
          <div className="relative aspect-[16/10] overflow-hidden rounded-[14px]">
            <MediaImage
              src={main}
              alt={altBase}
              fill
              className="object-cover"
              sizes="(min-width: 1280px) 1200px, 100vw"
              priority
            />
            {extra > 0 ? (
              <div
                className="pointer-events-none absolute right-3 top-3 rounded-full border border-white/30 bg-[color:var(--lx-text)]/85 px-3 py-1 text-xs font-bold tracking-tight text-[#FFFCF7] shadow-md backdrop-blur-sm"
                aria-label={`${extra} fotos adicionales`}
              >
                +{extra} fotos
              </div>
            ) : null}
          </div>
        ) : null}

        {bottomCells.length > 0 ? (
          <div className={`grid grid-cols-2 gap-3 ${gridCols}`}>
            {bottomCells.map((cell, i) =>
              cell.kind === "img" ? (
                <Thumb key={`${cell.src}-${i}`} src={cell.src} alt={`${altBase} — vista ${i + 2}`} />
              ) : (
                <button
                  key="video"
                  type="button"
                  className="group relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[14px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] text-left md:aspect-auto md:min-h-[140px]"
                  aria-label="Reproducir video del vehículo"
                >
                  {main ? (
                    <MediaImage
                      src={main}
                      alt=""
                      fill
                      className="object-cover opacity-90 transition group-hover:opacity-100"
                      sizes="(min-width: 768px) 25vw, 50vw"
                    />
                  ) : (
                    <span className="absolute inset-0 bg-gradient-to-br from-[color:var(--lx-section)] to-[color:var(--lx-nav-hover)]" />
                  )}
                  <span className="absolute inset-0 bg-gradient-to-t from-[color:var(--lx-text)]/55 to-transparent" />
                  <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border border-white/40 bg-[#FFFCF7]/95 text-[color:var(--lx-text)] shadow-lg backdrop-blur-sm transition group-hover:scale-[1.03]">
                    <FiPlay className="ml-0.5 h-7 w-7" aria-hidden />
                  </span>
                  <span className="absolute bottom-2 left-2 z-10 rounded-md bg-[#FFFCF7]/95 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[color:var(--lx-text)]">
                    Recorrido en video
                  </span>
                </button>
              ),
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Thumb({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-[14px] border border-[color:var(--lx-nav-border)] md:aspect-auto md:min-h-[140px]">
      <MediaImage src={src} alt={alt} fill className="object-cover" sizes="(min-width: 768px) 25vw, 50vw" />
    </div>
  );
}
