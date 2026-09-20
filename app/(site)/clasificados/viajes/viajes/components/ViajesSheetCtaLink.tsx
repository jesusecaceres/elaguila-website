"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { CtaActionSheet, type CtaSheetIntent } from "@/app/components/cta";
import { buildViajesIntentFromHref, isViajesContactHref } from "../lib/viajesCtaSheet";

type Props = {
  href: string;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  lang?: "es" | "en";
  /** When true, http(s) booking/destination links open in a new tab on first tap. */
  allowDirectExternal?: boolean;
};

export function ViajesSheetCtaLink({ href, children, className, style, lang = "es", allowDirectExternal = true }: Props) {
  const [ctaIntent, setCtaIntent] = useState<CtaSheetIntent | null>(null);
  const trimmed = href.trim();

  if (!trimmed) {
    return (
      <span className={className} style={style}>
        {children}
      </span>
    );
  }

  if (isViajesContactHref(trimmed)) {
    return (
      <>
        <button
          type="button"
          className={className}
          style={style}
          onClick={() => {
            const intent = buildViajesIntentFromHref(trimmed, { headline: typeof children === "string" ? children : undefined });
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
      <Link href={trimmed} className={className} style={style}>
        {children}
      </Link>
    );
  }

  if (allowDirectExternal && (trimmed.startsWith("http://") || trimmed.startsWith("https://"))) {
    return (
      <a href={trimmed} target="_blank" rel="noopener noreferrer" className={className} style={style}>
        {children}
      </a>
    );
  }

  return (
    <span className={className} style={style}>
      {children}
    </span>
  );
}
