"use client";

import { useState } from "react";
import { adminCardBase, adminCtaChipSecondary } from "@/app/admin/_components/adminTheme";

/**
 * Live Preview (Gate 5) — embeds the exact same admin Preview route (which renders the
 * same `DigitalContactPageClient` as production) in an iframe next to the editor. Every
 * Save redirects back to this edit page, which reloads this iframe with the freshly
 * persisted record — no separate manual refresh step, and no duplicate preview model.
 */
export function ExecutiveHubLivePreviewPanel({ slug }: { slug: string }) {
  const [open, setOpen] = useState(true);
  const [nonce, setNonce] = useState(0);
  const previewUrl = `/admin/team/executive-hub/${slug}/preview`;

  return (
    <div className="lg:sticky lg:top-6">
      <div className={`${adminCardBase} overflow-hidden`}>
        <div className="flex items-center justify-between gap-2 border-b border-[color:var(--lx-border)]/70 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">Live preview</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setNonce((n) => n + 1)}
              className={`${adminCtaChipSecondary} !min-h-0 px-2 py-1 text-[11px]`}
              title="Reload preview"
            >
              Refresh
            </button>
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className={`${adminCtaChipSecondary} !min-h-0 px-2 py-1 text-[11px]`}
            >
              Open full ↗
            </a>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className={`${adminCtaChipSecondary} !min-h-0 px-2 py-1 text-[11px] lg:hidden`}
            >
              {open ? "Hide" : "Show"}
            </button>
          </div>
        </div>
        <div className={`${open ? "block" : "hidden"} lg:block`}>
          <iframe
            key={nonce}
            src={previewUrl}
            title="Executive Hub live preview"
            className="h-[70vh] w-full border-0 lg:h-[calc(100vh-9rem)]"
          />
        </div>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-[#7A7164]">
        Updates automatically every time you save — this reloads with the record you just persisted.
      </p>
    </div>
  );
}
