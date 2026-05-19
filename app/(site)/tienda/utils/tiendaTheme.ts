import type { TiendaAccent } from "../types/tienda";

export function accentStyles(accent: TiendaAccent) {
  switch (accent) {
    case "gold":
      return {
        ring: "ring-[color:rgba(201,168,74,0.30)]",
        glow: "shadow-[0_8px_28px_rgba(201,120,47,0.12)]",
        chip: "bg-[color:var(--lx-lion)]/15 text-[color:var(--lx-text)] border-[color:var(--lx-lion)]/40",
        line: "bg-[linear-gradient(90deg,rgba(201,168,74,0.0),rgba(201,168,74,0.55),rgba(201,168,74,0.0))]",
      };
    case "stone":
      return {
        ring: "ring-[color:rgba(226,214,197,0.40)]",
        glow: "shadow-[0_8px_28px_rgba(42,36,22,0.10)]",
        chip: "bg-[color:var(--lx-border)]/40 text-[color:var(--lx-text)] border-[color:var(--lx-border)]",
        line: "bg-[linear-gradient(90deg,rgba(226,214,197,0.0),rgba(226,214,197,0.5),rgba(226,214,197,0.0))]",
      };
    case "cream":
      return {
        ring: "ring-[color:rgba(201,180,106,0.30)]",
        glow: "shadow-[0_8px_28px_rgba(42,36,22,0.08)]",
        chip: "bg-[color:var(--lx-canvas)] text-[color:var(--lx-muted)] border-[color:var(--lx-border)]",
        line: "bg-[linear-gradient(90deg,rgba(201,168,74,0.0),rgba(201,168,74,0.30),rgba(201,168,74,0.0))]",
      };
    case "sage":
      return {
        ring: "ring-[color:rgba(140,176,160,0.35)]",
        glow: "shadow-[0_8px_28px_rgba(42,36,22,0.08)]",
        chip: "bg-[color:var(--lx-olive)]/15 text-[color:var(--lx-text)] border-[color:var(--lx-olive)]/40",
        line: "bg-[linear-gradient(90deg,rgba(140,176,160,0.0),rgba(140,176,160,0.48),rgba(140,176,160,0.0))]",
      };
    case "plum":
      return {
        ring: "ring-[color:rgba(198,140,176,0.35)]",
        glow: "shadow-[0_8px_28px_rgba(42,36,22,0.08)]",
        chip: "bg-[rgba(198,140,176,0.15)] text-[color:var(--lx-text)] border-[rgba(198,140,176,0.40)]",
        line: "bg-[linear-gradient(90deg,rgba(198,140,176,0.0),rgba(198,140,176,0.48),rgba(198,140,176,0.0))]",
      };
    case "sky":
      return {
        ring: "ring-[color:rgba(124,171,199,0.35)]",
        glow: "shadow-[0_8px_28px_rgba(42,36,22,0.08)]",
        chip: "bg-[color:var(--lx-blue)]/15 text-[color:var(--lx-text)] border-[color:var(--lx-blue)]/40",
        line: "bg-[linear-gradient(90deg,rgba(124,171,199,0.0),rgba(124,171,199,0.48),rgba(124,171,199,0.0))]",
      };
    case "ink":
    default:
      return {
        ring: "ring-[color:rgba(42,36,22,0.20)]",
        glow: "shadow-[0_8px_28px_rgba(42,36,22,0.10)]",
        chip: "bg-[color:var(--lx-border)]/30 text-[color:var(--lx-text)] border-[color:var(--lx-border)]/60",
        line: "bg-[linear-gradient(90deg,rgba(42,36,22,0.0),rgba(42,36,22,0.18),rgba(42,36,22,0.0))]",
      };
  }
}

