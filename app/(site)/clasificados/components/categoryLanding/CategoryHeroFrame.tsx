import Image from "next/image";
import type { ReactNode } from "react";

export type CategoryHeroOverlayId =
  | "leonix-warm"
  | "leonix-cream"
  | "leonix-slate"
  | "restaurantes-ember"
  | "editorial-deep"
  | "none";

function HeroOverlays({ variant }: { variant: CategoryHeroOverlayId }) {
  if (variant === "none") return null;
  if (variant === "leonix-warm") {
    return (
      <>
        {/* Slightly lighter wash so photography retains destination presence while copy stays readable */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#F8F1E4]/86 via-[#F5EFE3]/72 to-[#F3EBDD]/90" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-r from-[#3D5A73]/[0.06] via-transparent to-[#3D5A73]/[0.04]" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#F3EBDD] via-[#F3EBDD]/88 to-transparent sm:h-32" aria-hidden />
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#FFFCF7]/42 to-transparent sm:h-20" aria-hidden />
      </>
    );
  }
  if (variant === "leonix-cream") {
    return (
      <>
        <div className="absolute inset-0 bg-gradient-to-b from-[#FBF7F0]/[0.92] via-[#F8F3EA]/[0.82] to-[#F1E9DE]/[0.94]" aria-hidden />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_85%_65%_at_50%_8%,rgba(255,255,255,0.55),transparent_56%)]" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#efe6db] to-transparent sm:h-28" aria-hidden />
      </>
    );
  }
  if (variant === "leonix-slate") {
    return (
      <>
        <div className="absolute inset-0 bg-gradient-to-b from-[#FAF7F2]/92 via-[#F5EFE6]/80 to-[#F0E8DC]/92" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-r from-[#5B7C99]/[0.07] via-transparent to-[#C45C26]/[0.045]" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#F4EDE3] via-[#F4EDE3]/85 to-transparent sm:h-30" aria-hidden />
      </>
    );
  }
  if (variant === "restaurantes-ember") {
    return (
      <>
        <div className="absolute inset-0 bg-gradient-to-b from-[#2D241E]/55 via-[#2D241E]/25 to-[#FDFBF7]/92" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-t from-[#FFFCF7]/95 via-[#FFFCF7]/40 to-transparent" aria-hidden />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_0%,rgba(255,252,247,0.35),transparent_55%)]" aria-hidden />
      </>
    );
  }
  /* editorial-deep */
  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-br from-[#0c2a38]/65 via-[#1a4a5c]/20 to-transparent" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-t from-[#f3ebdd] via-[#f3ebdd]/55 to-[#0a1f2a]/35" aria-hidden />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_0%,rgba(255,252,247,0.2),transparent_58%)]" aria-hidden />
    </>
  );
}

export type CategoryHeroFrameProps = {
  imageSrc: string;
  imageAlt?: string;
  priority?: boolean;
  /** Full Tailwind classes for `object-*` focal control */
  objectClassName?: string;
  overlay?: CategoryHeroOverlayId;
  /** Applied to the outer shell (responsive hero height) */
  minHeightClass?: string;
  roundedClass?: string;
  className?: string;
  /** Vertical alignment of hero copy inside the frame */
  contentJustify?: "center" | "end";
  /** Extra classes on the content wrapper (padding, text align) */
  contentClassName?: string;
  children?: ReactNode;
};

/**
 * Shared image-backed hero band for clasificados category landings.
 * Keeps Leonix cream/gold readability via overlay presets; content sits in `relative z-10` flow.
 */
export function CategoryHeroFrame({
  imageSrc,
  imageAlt = "",
  priority = true,
  objectClassName = "object-cover object-[center_34%] min-[480px]:object-[center_36%] md:object-[center_38%] lg:object-[center_40%]",
  overlay = "leonix-warm",
  minHeightClass = "min-h-[min(38vh,320px)] sm:min-h-[min(42vh,380px)] md:min-h-[min(46vh,440px)] lg:min-h-[min(48vh,480px)]",
  roundedClass = "rounded-2xl border border-[#E8DFD0]/45 sm:rounded-3xl",
  className = "",
  contentJustify = "end",
  contentClassName = "",
  children,
}: CategoryHeroFrameProps) {
  const useNext = imageSrc.startsWith("/") || imageSrc.includes("images.unsplash.com");
  const justify = contentJustify === "center" ? "justify-center" : "justify-end";

  return (
    <div
      className={`relative isolate flex w-full min-w-0 flex-col overflow-hidden shadow-[0_28px_80px_-40px_rgba(42,36,22,0.35)] ${roundedClass} ${minHeightClass} ${className}`.trim()}
    >
      <div className="pointer-events-none absolute inset-0">
        {useNext ? (
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            priority={priority}
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 100vw, min(1440px, 100vw)"
            className={objectClassName}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary HTTPS heroes from CMS/config
          <img src={imageSrc} alt={imageAlt} className={`absolute inset-0 h-full w-full ${objectClassName}`} />
        )}
        <HeroOverlays variant={overlay} />
      </div>
      {children ? (
        <div
          className={`relative z-10 flex w-full flex-1 flex-col ${justify} px-4 py-7 sm:px-6 sm:py-9 md:px-8 md:py-10 lg:px-9 lg:py-11 ${contentClassName}`.trim()}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
