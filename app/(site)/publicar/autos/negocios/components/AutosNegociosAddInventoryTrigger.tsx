"use client";

import { useState } from "react";
import type { AutosNegociosCopy } from "@/app/clasificados/autos/negocios/lib/autosNegociosCopy";
import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import type { AutosAdditionalInventoryVehicleDraft } from "@/app/lib/clasificados/autos/autosAdditionalInventoryDraft";
import { applicationCanAddInventoryVehicle } from "@/app/lib/clasificados/autos/autosAdditionalInventoryDraft";
import { AutosNegociosAddInventoryDrawer } from "./AutosNegociosAddInventoryDrawer";

export function AutosNegociosAddInventoryTrigger({
  lang,
  copy,
  label,
  className = "",
  variant = "primary",
  additionalCount,
  additionalVehicles,
  onSave,
  flushDraft,
  onAtLimit,
}: {
  lang: AutosNegociosLang;
  copy: AutosNegociosCopy;
  label: string;
  className?: string;
  variant?: "primary" | "secondary";
  additionalCount: number;
  additionalVehicles: AutosAdditionalInventoryVehicleDraft[];
  onSave: (vehicle: AutosAdditionalInventoryVehicleDraft) => boolean;
  flushDraft?: () => Promise<void>;
  onAtLimit?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const editingVehicle = editingId ? (additionalVehicles.find((v) => v.id === editingId) ?? null) : null;

  const base =
    variant === "primary"
      ? "inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-[#2A2620] px-5 text-sm font-bold text-[#FAF7F2] shadow-md transition hover:bg-[#1E1810]"
      : "inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#C9B46A]/50 bg-white px-4 text-sm font-semibold text-[#6E5418]";

  const openNew = () => {
    if (!applicationCanAddInventoryVehicle(additionalCount)) {
      onAtLimit?.();
      return;
    }
    setEditingId(null);
    setOpen(true);
  };

  return (
    <>
      <button type="button" className={`${base} ${className}`.trim()} onClick={openNew}>
        {label}
      </button>
      <AutosNegociosAddInventoryDrawer
        open={open}
        onClose={() => {
          setOpen(false);
          setEditingId(null);
        }}
        lang={lang}
        copy={copy}
        additionalCount={additionalCount}
        editingVehicle={editingVehicle}
        onSave={(vehicle) => {
          const ok = onSave(vehicle);
          if (ok) setEditingId(null);
          return ok;
        }}
        flushDraft={flushDraft}
      />
    </>
  );
}
