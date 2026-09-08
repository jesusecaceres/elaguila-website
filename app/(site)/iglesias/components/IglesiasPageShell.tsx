import type { ReactNode } from "react";

export function IglesiasPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="iglesias-surface min-h-screen overflow-x-hidden bg-[#F8F4EA] text-[#1F241C] [font-family:ui-sans-serif,system-ui,'Segoe_UI',sans-serif] [&_.font-serif]:[font-family:Georgia,Palatino,'Palatino_Linotype','Times_New_Roman',serif]">
      {children}
    </div>
  );
}

export function IglesiasComingSoonBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[#C9A84A]/70 bg-[#FFF8E8] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#6B5B2E]">
      {label}
    </span>
  );
}
