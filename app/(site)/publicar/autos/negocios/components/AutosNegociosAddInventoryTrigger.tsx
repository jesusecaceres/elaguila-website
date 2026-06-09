"use client";

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
  drawerOpen = false,
  drawerEditingId = null,
  onDrawerOpenChange,
  inProgressDraft = null,
  onInProgressChange,
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
  drawerOpen?: boolean;
  drawerEditingId?: string | null;
  onDrawerOpenChange?: (open: boolean, editingId?: string | null) => void;
  inProgressDraft?: AutosAdditionalInventoryVehicleDraft | null;
  onInProgressChange?: (draft: AutosAdditionalInventoryVehicleDraft | null) => void;
}) {
  const open = drawerOpen && drawerEditingId === null;

  const base =
    variant === "primary"
      ? "inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-[#2A2620] px-5 text-sm font-bold text-[#FAF7F2] shadow-md transition hover:bg-[#1E1810]"
      : "inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#C9B46A]/50 bg-white px-4 text-sm font-semibold text-[#6E5418]";

  const openNew = () => {
    if (!applicationCanAddInventoryVehicle(additionalCount)) {
      onAtLimit?.();
      return;
    }
    onDrawerOpenChange?.(true, null);
  };

  return (
    <>
      <button type="button" className={`${base} ${className}`.trim()} onClick={openNew}>
        {label}
      </button>
      <AutosNegociosAddInventoryDrawer
        open={open}
        onClose={() => onDrawerOpenChange?.(false)}
        lang={lang}
        copy={copy}
        additionalCount={additionalCount}
        editingVehicle={null}
        inProgressDraft={inProgressDraft}
        drawerEditingId={drawerEditingId}
        onInProgressChange={onInProgressChange}
        onSave={(vehicle) => {
          const ok = onSave(vehicle);
          return ok;
        }}
        flushDraft={flushDraft}
      />
    </>
  );
}
