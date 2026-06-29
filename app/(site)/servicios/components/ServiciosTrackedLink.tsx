"use client";

import type { AriaRole, CSSProperties, MouseEventHandler, ReactNode } from "react";
import { trackServiciosListingCta } from "../lib/serviciosCtaIntents";
import type { ServiciosAnalyticsTrackMeta } from "../lib/serviciosAnalyticsIdentity";

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
  "data-servicios-results-cta"?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  role?: AriaRole;
  sourceId?: string | null;
  engagementListingId?: string | null;
  ownerUserId?: string | null;
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
  sourceId,
  engagementListingId,
  ownerUserId,
  "data-servicios-results-cta": dataServiciosResultsCta,
}: Props) {
  const onClick: MouseEventHandler<HTMLAnchorElement> = (e) => {
    onClickProp?.(e);
    if (!listingSlug || !eventType) return;
    const meta: ServiciosAnalyticsTrackMeta = {
      listingSlug,
      slug: listingSlug,
      sourceId: sourceId ?? undefined,
      engagementId: (engagementListingId ?? listingSlug).trim(),
      ownerUserId: ownerUserId ?? undefined,
      source: "tracked_link",
      href,
    };
    trackServiciosListingCta(listingSlug, eventType, meta);
  };

  return (
    <a
      href={href}
      className={className}
      style={style}
      target={target}
      rel={rel}
      aria-label={ariaLabel}
      data-servicios-results-cta={dataServiciosResultsCta}
      role={role}
      onClick={onClick}
    >
      {children}
    </a>
  );
}
