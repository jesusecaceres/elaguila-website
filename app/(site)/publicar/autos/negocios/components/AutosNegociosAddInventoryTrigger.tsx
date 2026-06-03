"use client";

import { useState } from "react";
import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import type { AutosAdditionalInventoryVehicleInput } from "@/app/lib/clasificados/autos/autosAdditionalInventoryDraft";
import { AutosNegociosAddInventoryDrawer } from "./AutosNegociosAddInventoryDrawer";

export function AutosNegociosAddInventoryTrigger({
  lang,
  label,
  className = "",
  variant = "primary",
  additionalCount,
  onSave,
  flushDraft,
}: {
  lang: AutosNegociosLang;
  label: string;
  className?: string;
  variant?: "primary" | "secondary";
  additionalCount: number;
  onSave: (input: AutosAdditionalInventoryVehicleInput) => boolean;
  flushDraft?: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const base =
    variant === "primary"
      ? "inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-[#2A2620] px-5 text-sm font-bold text-[#FAF7F2] shadow-md transition hover:bg-[#1E1810]"
      : "inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#C9B46A]/50 bg-white px-4 text-sm font-semibold text-[#6E5418]";

  return (
    <>
      <button type="button" className={`${base} ${className}`.trim()} onClick={() => setOpen(true)}>
        {label}
      </button>
      <AutosNegociosAddInventoryDrawer
        open={open}
        onClose={() => setOpen(false)}
        lang={lang}
        additionalCount={additionalCount}
        onSave={onSave}
        flushDraft={flushDraft}
      />
    </>
  );
}
