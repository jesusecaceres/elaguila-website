"use client";

import { useState } from "react";
import { RestauranteShellDataUrlModal } from "./RestauranteShellDataUrlModal";

/** Menu/brochure file: data URLs open in modal; http(s) keep normal link (optional new tab for external). */
export function RestauranteShellInlineDataAssetButton({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className: string;
}) {
  const [open, setOpen] = useState(false);
  if (href.startsWith("data:")) {
    return (
      <>
        <button type="button" onClick={() => setOpen(true)} className={className}>
          {label}
        </button>
        <RestauranteShellDataUrlModal open={open} onClose={() => setOpen(false)} href={href} title={label} />
      </>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {label}
    </a>
  );
}
