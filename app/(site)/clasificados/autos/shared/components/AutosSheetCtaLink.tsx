"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { CtaActionSheet, type CtaSheetIntent } from "@/app/components/cta";
import { buildAutosIntentFromHref, isAutosContactHref } from "../lib/autosCtaSheet";
import { trackAutosContactFromHref } from "../../lib/autosCtaTracking";
import { autosAnalyticsTrackMeta } from "../../lib/autosAnalyticsIdentity";

type Props = {
  href: string;
  children: ReactNode;
  className?: string;
  lang?: "es" | "en";
  /** When true, http(s) booking/website links open in a new tab on first tap. */
  allowDirectExternal?: boolean;
  onOpen?: () => void;
  /** autos_classifieds_listings.id — global analytics (AUTO1). */
  listingSourceId?: string;
  leonixAdId?: string | null;
  lane?: string;
};

export function AutosSheetCtaLink({
  href,
  children,
  className,
  lang = "es",
  allowDirectExternal = true,
  onOpen,
  listingSourceId,
  leonixAdId,
  lane,
}: Props) {
  const [ctaIntent, setCtaIntent] = useState<CtaSheetIntent | null>(null);
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

  if (isAutosContactHref(trimmed)) {
    return (
      <>
        <button
          type="button"
          className={className}
          onClick={() => {
            trackOpen();
            const intent = buildAutosIntentFromHref(trimmed, {
              headline: typeof children === "string" ? children : undefined,
            });
            if (intent) setCtaIntent(intent);
          }}
        >
          {children}
        </button>
        <CtaActionSheet open={ctaIntent != null} onClose={() => setCtaIntent(null)} intent={ctaIntent} lang={lang} />
      </>
    );
  }

  if (trimmed.startsWith("/")) {
    return (
      <Link href={trimmed} className={className} onClick={() => trackOpen()}>
        {children}
      </Link>
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
