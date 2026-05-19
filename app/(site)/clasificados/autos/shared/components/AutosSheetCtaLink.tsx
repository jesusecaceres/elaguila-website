"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { CtaActionSheet, type CtaSheetIntent } from "@/app/components/cta";
import { buildAutosIntentFromHref, isAutosContactHref } from "../lib/autosCtaSheet";

type Props = {
  href: string;
  children: ReactNode;
  className?: string;
  lang?: "es" | "en";
  /** When true, http(s) booking/website links open in a new tab on first tap. */
  allowDirectExternal?: boolean;
  onOpen?: () => void;
};

export function AutosSheetCtaLink({
  href,
  children,
  className,
  lang = "es",
  allowDirectExternal = true,
  onOpen,
}: Props) {
  const [ctaIntent, setCtaIntent] = useState<CtaSheetIntent | null>(null);
  const trimmed = href.trim();

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
            onOpen?.();
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
      <Link href={trimmed} className={className} onClick={() => onOpen?.()}>
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
        onClick={() => onOpen?.()}
      >
        {children}
      </a>
    );
  }

  return <span className={className}>{children}</span>;
}
