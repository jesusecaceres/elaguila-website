"use client";

import { useState } from "react";
import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import {
  AutosNegociosInventoryBoostPanel,
  type AutosInventoryBoostEditorContext,
} from "./AutosNegociosInventoryBoostPanel";

type Props = {
  lang: AutosNegociosLang;
  label: string;
  editorContext: AutosInventoryBoostEditorContext;
  flushDraft?: () => Promise<void>;
  className?: string;
  variant?: "primary" | "secondary";
};

export function AutosNegociosInventoryBoostTrigger({
  lang,
  label,
  editorContext,
  flushDraft,
  className = "",
  variant = "secondary",
}: Props) {
  const [open, setOpen] = useState(false);
  const base =
    variant === "primary"
      ? "inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-[#2A2620] px-5 text-sm font-bold text-[#FAF7F2] shadow-md transition hover:bg-[#1E1810]"
      : "inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-nav-hover)] px-5 text-sm font-bold text-[color:var(--lx-text)]";

  return (
    <>
      <button type="button" className={`${base} ${className}`.trim()} onClick={() => setOpen(true)}>
        {label}
      </button>
      <AutosNegociosInventoryBoostPanel
        open={open}
        onClose={() => setOpen(false)}
        lang={lang}
        flushDraft={flushDraft}
        editorContext={editorContext}
      />
    </>
  );
}
