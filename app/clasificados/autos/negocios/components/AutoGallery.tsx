import Image from "next/image";
import { FiPlay } from "react-icons/fi";
import type { AutoDealerListing } from "../types/autoDealerListing";

const CARD =
  "rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4 shadow-[0_8px_32px_-8px_rgba(42,36,22,0.1)]";

export function AutoGallery({ data }: { data: AutoDealerListing }) {
  const main = data.heroImages[0];
  const extra = Math.max(0, data.heroImages.length - 1);
  const t1 = data.heroImages[1] ?? main;
  const t2 = data.heroImages[2] ?? main;
  const t3 = data.heroImages[3] ?? main;
  const altBase = data.vehicleTitle;

  return (
    <div className={CARD}>
      <div className="flex flex-col gap-3">
        {/* Hero */}
        <div className="relative aspect-[16/10] overflow-hidden rounded-[14px]">
          {main ? (
            <Image
              src={main}
              alt={altBase}
              fill
              className="object-cover"
              sizes="(min-width: 1280px) 1200px, 100vw"
              priority
            />
          ) : null}
          <div
            className="pointer-events-none absolute right-3 top-3 rounded-full border border-white/30 bg-[color:var(--lx-text)]/85 px-3 py-1 text-xs font-bold tracking-tight text-[#FFFCF7] shadow-md backdrop-blur-sm"
            aria-label={`${extra} fotos adicionales`}
          >
            +{extra} fotos
          </div>
        </div>

        {/* 3 photo tiles + video — 2×2 on mobile, 4 across on md+ */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Thumb src={t1} alt={`${altBase} — vista 2`} />
          <Thumb src={t2} alt={`${altBase} — vista 3`} />
          <Thumb src={t3} alt={`${altBase} — vista 4`} />
          <button
            type="button"
            className="group relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[14px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] text-left md:aspect-auto md:min-h-[140px]"
            aria-label="Reproducir video del vehículo"
          >
            {main ? (
              <Image
                src={main}
                alt=""
                fill
                className="object-cover opacity-90 transition group-hover:opacity-100"
                sizes="(min-width: 768px) 25vw, 50vw"
              />
            ) : null}
            <span className="absolute inset-0 bg-gradient-to-t from-[color:var(--lx-text)]/55 to-transparent" />
            <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border border-white/40 bg-[#FFFCF7]/95 text-[color:var(--lx-text)] shadow-lg backdrop-blur-sm transition group-hover:scale-[1.03]">
              <FiPlay className="ml-0.5 h-7 w-7" aria-hidden />
            </span>
            <span className="absolute bottom-2 left-2 z-10 rounded-md bg-[#FFFCF7]/95 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[color:var(--lx-text)]">
              Recorrido en video
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

function Thumb({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return (
    <div
      className={`relative aspect-[4/3] overflow-hidden rounded-[14px] border border-[color:var(--lx-nav-border)] md:aspect-auto md:min-h-[140px] ${className ?? ""}`}
    >
      <Image src={src} alt={alt} fill className="object-cover" sizes="(min-width: 768px) 25vw, 50vw" />
    </div>
  );
}
