"use client";

type Props = {
  active: boolean;
  onChange: (next: boolean) => void;
  compact?: boolean;
};

export function BienesRaicesMapToggle({ active, onChange, compact }: Props) {
  return (
    <button
      type="button"
      onClick={() => onChange(!active)}
      aria-pressed={active}
      className={
        (compact ? "px-3 py-1.5 text-xs " : "px-3.5 py-2 text-sm ") +
        "inline-flex items-center gap-2 rounded-full border font-semibold transition " +
        (active
          ? "border-[#C9B46A]/70 bg-[#FFF6E7] text-[#6E5418] shadow-[0_2px_10px_rgba(184,149,74,0.18)]"
          : "border-[#E8DFD0] bg-white/90 text-[#5C5346] hover:border-[#D4C4A8]")
      }
    >
      <span className="inline-block h-2 w-2 rounded-full bg-[#B8954A]/80" aria-hidden />
      Mapa
    </button>
  );
}
