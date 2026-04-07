import type { TiendaAccent } from "../types/tienda";

export function accentStyles(accent: TiendaAccent) {
  switch (accent) {
    case "gold":
      return {
        ring: "ring-[color:rgba(201,168,74,0.30)]",
        glow: "shadow-[0_18px_60px_rgba(201,168,74,0.12)]",
        chip: "bg-[rgba(201,168,74,0.16)] text-[color:rgba(255,247,226,0.92)] border-[color:rgba(201,168,74,0.35)]",
        line: "bg-[linear-gradient(90deg,rgba(201,168,74,0.0),rgba(201,168,74,0.55),rgba(201,168,74,0.0))]",
      };
    case "stone":
      return {
        ring: "ring-[color:rgba(226,214,197,0.22)]",
        glow: "shadow-[0_18px_60px_rgba(226,214,197,0.08)]",
        chip: "bg-[rgba(226,214,197,0.12)] text-[color:rgba(255,252,247,0.88)] border-[color:rgba(226,214,197,0.26)]",
        line: "bg-[linear-gradient(90deg,rgba(226,214,197,0.0),rgba(226,214,197,0.5),rgba(226,214,197,0.0))]",
      };
    case "cream":
      return {
        ring: "ring-[color:rgba(255,252,247,0.18)]",
        glow: "shadow-[0_18px_60px_rgba(255,252,247,0.06)]",
        chip: "bg-[rgba(255,252,247,0.10)] text-[color:rgba(255,252,247,0.88)] border-[color:rgba(255,252,247,0.18)]",
        line: "bg-[linear-gradient(90deg,rgba(255,252,247,0.0),rgba(255,252,247,0.40),rgba(255,252,247,0.0))]",
      };
    case "sage":
      return {
        ring: "ring-[color:rgba(140,176,160,0.22)]",
        glow: "shadow-[0_18px_60px_rgba(140,176,160,0.08)]",
        chip: "bg-[rgba(140,176,160,0.12)] text-[color:rgba(240,255,250,0.86)] border-[color:rgba(140,176,160,0.26)]",
        line: "bg-[linear-gradient(90deg,rgba(140,176,160,0.0),rgba(140,176,160,0.48),rgba(140,176,160,0.0))]",
      };
    case "plum":
      return {
        ring: "ring-[color:rgba(198,140,176,0.22)]",
        glow: "shadow-[0_18px_60px_rgba(198,140,176,0.08)]",
        chip: "bg-[rgba(198,140,176,0.12)] text-[color:rgba(255,240,250,0.86)] border-[color:rgba(198,140,176,0.26)]",
        line: "bg-[linear-gradient(90deg,rgba(198,140,176,0.0),rgba(198,140,176,0.48),rgba(198,140,176,0.0))]",
      };
    case "sky":
      return {
        ring: "ring-[color:rgba(124,171,199,0.22)]",
        glow: "shadow-[0_18px_60px_rgba(124,171,199,0.08)]",
        chip: "bg-[rgba(124,171,199,0.12)] text-[color:rgba(235,250,255,0.86)] border-[color:rgba(124,171,199,0.26)]",
        line: "bg-[linear-gradient(90deg,rgba(124,171,199,0.0),rgba(124,171,199,0.48),rgba(124,171,199,0.0))]",
      };
    case "ink":
    default:
      return {
        ring: "ring-[color:rgba(255,255,255,0.12)]",
        glow: "shadow-[0_18px_60px_rgba(0,0,0,0.35)]",
        chip: "bg-[rgba(255,255,255,0.06)] text-[color:rgba(255,255,255,0.82)] border-[color:rgba(255,255,255,0.14)]",
        line: "bg-[linear-gradient(90deg,rgba(255,255,255,0.0),rgba(255,255,255,0.18),rgba(255,255,255,0.0))]",
      };
  }
}

