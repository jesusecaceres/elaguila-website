"use client";

import type { AriaRole, CSSProperties, MouseEventHandler, ReactNode } from "react";

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
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  role?: AriaRole;
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
  onClick: onClickProp,
  role,
}: Props) {
  const onClick: MouseEventHandler<HTMLAnchorElement> = (e) => {
    onClickProp?.(e);
    if (!listingSlug || !eventType) return;
    void fetch("/api/clasificados/servicios/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingSlug, eventType, meta: { href } }),
    }).catch(() => {});
  };

  return (
    <a
      href={href}
      className={className}
      style={style}
      target={target}
      rel={rel}
      aria-label={ariaLabel}
      role={role}
      onClick={onClick}
    >
      {children}
    </a>
  );
}
