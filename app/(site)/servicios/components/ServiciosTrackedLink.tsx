"use client";

import type { CSSProperties, ReactNode } from "react";

type Props = {
  listingSlug?: string;
  eventType?: string;
  href: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  target?: string;
  rel?: string;
  "aria-label"?: string;
};

export function ServiciosTrackedLink({
  listingSlug,
  eventType,
  href,
  className,
  style,
  children,
  target,
  rel,
  "aria-label": ariaLabel,
}: Props) {
  const onClick = () => {
    if (!listingSlug || !eventType) return;
    void fetch("/api/clasificados/servicios/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingSlug, eventType, meta: { href } }),
    }).catch(() => {});
  };

  return (
    <a href={href} className={className} style={style} target={target} rel={rel} aria-label={ariaLabel} onClick={onClick}>
      {children}
    </a>
  );
}
