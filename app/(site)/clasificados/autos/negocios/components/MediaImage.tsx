import Image from "next/image";
import type { CSSProperties } from "react";

/** Supports remote URLs and local `data:` previews from uploads. */
export function MediaImage({
  src,
  alt,
  fill,
  className,
  sizes,
  priority,
  style,
}: {
  src: string;
  alt: string;
  fill?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
  style?: CSSProperties;
}) {
  if (src.startsWith("data:")) {
    return (
      // next/image does not accept arbitrary data: URLs the same way; use native img for local upload previews.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={fill ? `absolute inset-0 h-full w-full object-cover ${className ?? ""}` : className}
        style={style}
      />
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      className={className}
      sizes={sizes}
      priority={priority}
      style={style}
    />
  );
}
