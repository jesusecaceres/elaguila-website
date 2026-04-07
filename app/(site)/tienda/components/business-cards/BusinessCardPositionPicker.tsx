"use client";

import type { LayoutPreset } from "../../product-configurators/business-cards/types";

const PRESETS: LayoutPreset[] = [
  "top-left",
  "top-center",
  "top-right",
  "center-left",
  "center",
  "center-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
];

const SHORT: Record<LayoutPreset, string> = {
  "top-left": "TL",
  "top-center": "TC",
  "top-right": "TR",
  "center-left": "CL",
  center: "C",
  "center-right": "CR",
  "bottom-left": "BL",
  "bottom-center": "BC",
  "bottom-right": "BR",
};

export function BusinessCardPositionPicker(props: {
  label: string;
  value: LayoutPreset;
  onChange: (p: LayoutPreset) => void;
  disabled?: boolean;
}) {
  const { label, value, onChange, disabled } = props;
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-[rgba(255,247,226,0.72)] mb-2">{label}</div>
      <div className="grid grid-cols-3 gap-1.5 max-w-[220px]">
        {PRESETS.map((p) => {
          const active = p === value;
          return (
            <button
              key={p}
              type="button"
              disabled={disabled}
              onClick={() => onChange(p)}
              className={[
                "h-9 rounded-lg text-[10px] font-medium transition",
                active
                  ? "bg-[rgba(201,168,74,0.28)] text-[rgba(255,247,226,0.95)] border border-[rgba(201,168,74,0.45)]"
                  : "bg-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.7)] border border-[rgba(255,255,255,0.10)] hover:bg-[rgba(255,255,255,0.10)]",
                disabled ? "opacity-40 cursor-not-allowed" : "",
              ].join(" ")}
              aria-pressed={active}
            >
              {SHORT[p]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
