import Image from "next/image";
import type { ServiciosGalleryVideo, ServiciosProfileResolved, ServiciosLang } from "../types/serviciosBusinessProfile";
import { getServiciosProfileLabels } from "../copy/serviciosProfileCopy";
import { serviciosImageUnoptimized } from "../lib/serviciosMediaUrl";
import { parseYouTubeVideoId, youTubeEmbedSrc } from "../lib/serviciosVideoEmbed";
import { SV } from "./serviciosDesignTokens";

function VideoTile({ v, lang }: { v: ServiciosGalleryVideo; lang: ServiciosLang }) {
  const yt = parseYouTubeVideoId(v.url);
  if (yt) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-black/[0.06] bg-black shadow-sm">
        <iframe
          title={lang === "en" ? "Video" : "Video"}
          src={youTubeEmbedSrc(yt)}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-black/[0.06] bg-black/[0.04] shadow-sm">
      <video src={v.url} className="h-full w-full object-cover" controls playsInline preload="metadata" />
    </div>
  );
}

function mainGridClass(count: number): string {
  if (count <= 0) return "";
  if (count === 1) return "grid grid-cols-1 gap-4 md:gap-5 max-w-4xl mx-auto";
  if (count === 2) return "grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 max-w-5xl mx-auto";
  if (count === 3) return "grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 md:gap-4";
  return "grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-4";
}

/** Featured image tile aspect — larger when fewer photos */
function mainTileAspectClass(count: number): string {
  if (count === 1) return "aspect-[16/10] sm:aspect-[2/1] max-h-[min(420px,70vh)] sm:max-h-[min(480px,65vh)]";
  if (count === 2) return "aspect-[5/4] sm:aspect-[3/2]";
  return "aspect-[5/4]";
}

export function ServiciosGallery({ profile, lang }: { profile: ServiciosProfileResolved; lang: ServiciosLang }) {
  const L = getServiciosProfileLabels(lang);
  const mains = profile.gallery;
  const more = profile.galleryMore;
  const videos = profile.galleryVideos;

  if (mains.length === 0 && more.length === 0 && videos.length === 0) return null;

  const videoGrid =
    videos.length === 1
      ? "grid grid-cols-1 gap-3 md:gap-4 max-w-3xl mx-auto"
      : videos.length >= 2
        ? "grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4"
        : "";

  return (
    <section
      className="rounded-2xl border p-6 shadow-sm md:p-8"
      style={{ backgroundColor: SV.card, borderColor: SV.border, boxShadow: SV.shadowSm }}
    >
      <h2 className="text-lg font-bold tracking-tight text-[color:var(--lx-text)] md:text-xl">{L.gallery}</h2>

      {videos.length > 0 ? (
        <div className={`mt-6 ${videoGrid}`}>
          {videos.map((v) => (
            <div key={v.id}>
              {videos.length > 1 && v.isPrimary ? (
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[#3B66AD]/90">{L.videoTour}</p>
              ) : null}
              <VideoTile v={v} lang={lang} />
            </div>
          ))}
        </div>
      ) : null}

      {mains.length > 0 ? (
        <div className={`${videos.length > 0 ? "mt-8" : "mt-6"} ${mainGridClass(mains.length)}`}>
          {mains.map((g) => (
            <div
              key={g.id}
              className={`relative overflow-hidden rounded-xl border border-black/[0.06] bg-black/[0.03] ${mainTileAspectClass(mains.length)}`}
            >
              <Image
                src={g.url}
                alt={g.alt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 25vw"
                unoptimized={serviciosImageUnoptimized(g.url)}
              />
            </div>
          ))}
        </div>
      ) : null}

      {more.length > 0 ? (
        <div className="mt-8 border-t border-black/[0.06] pt-6">
          <p className="text-xs font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">{L.galleryMore}</p>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {more.map((g) => (
              <div
                key={g.id}
                className="relative aspect-square overflow-hidden rounded-lg border border-black/[0.06] bg-black/[0.03]"
              >
                <Image
                  src={g.url}
                  alt={g.alt}
                  fill
                  className="object-cover"
                  sizes="120px"
                  unoptimized={serviciosImageUnoptimized(g.url)}
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
