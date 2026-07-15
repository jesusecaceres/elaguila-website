"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { trackAutosContactFromHref } from "../../lib/autosCtaTracking";
import { autosAnalyticsTrackMeta } from "../../lib/autosAnalyticsIdentity";

type Props = {
  href: string;
  children: ReactNode;
  className?: string;
  /** When true, http(s) links open in a new tab. */
  allowDirectExternal?: boolean;
  onOpen?: () => void;
  /** autos_classifieds_listings.id */
  listingSourceId?: string;
  leonixAdId?: string | null;
  lane?: string;
};

/**
 * Autos Negocios direct contact link — opens tel:/sms:/mailto:/wa.me/Maps without intermediate modals.
 */
export function AutosDirectContactLink({
  href,
  children,
  className,
  allowDirectExternal = true,
  onOpen,
  listingSourceId,
  leonixAdId,
  lane,
}: Props) {
  const trimmed = href.trim();
  const analyticsMeta = listingSourceId?.trim()
    ? autosAnalyticsTrackMeta({
        sourceId: listingSourceId.trim(),
        leonixAdId,
        lane,
        source: "detail_contact",
      })
    : undefined;

  const trackOpen = () => {
    if (analyticsMeta) trackAutosContactFromHref(trimmed, analyticsMeta);
    onOpen?.();
  };

  if (!trimmed) {
    return <span className={className}>{children}</span>;
  }

  if (trimmed.startsWith("/")) {
    return (
      <Link href={trimmed} className={className} onClick={() => trackOpen()}>
        {children}
      </Link>
    );
  }

  if (
    /^tel:/i.test(trimmed) ||
    /^sms:/i.test(trimmed) ||
    /^mailto:/i.test(trimmed)
  ) {
    return (
      <a href={trimmed} className={className} onClick={() => trackOpen()}>
        {children}
      </a>
    );
  }

  if (/wa\.me|api\.whatsapp\.com/i.test(trimmed)) {
    return (
      <a
        href={trimmed}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onClick={() => trackOpen()}
      >
        {children}
      </a>
    );
  }

  if (allowDirectExternal && (trimmed.startsWith("http://") || trimmed.startsWith("https://"))) {
    return (
      <a
        href={trimmed}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onClick={() => trackOpen()}
      >
        {children}
      </a>
    );
  }

  return <span className={className}>{children}</span>;
}
