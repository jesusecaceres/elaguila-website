export type LeonixCategoryVisualKey =
  | "en-venta"
  | "rentas"
  | "bienes-raices"
  | "autos"
  | "restaurantes"
  | "servicios"
  | "empleos"
  | "clases"
  | "comunidad"
  | "travel";

export const LEONIX_CATEGORY_VISUALS: Record<
  LeonixCategoryVisualKey,
  {
    emoji: string;
    tint: string;
    border: string;
    chipBg: string;
    glow: string;
  }
> = {
  "en-venta": {
    emoji: "🛍️",
    tint: "from-[#FFF2D9] to-[#FFF9EB]",
    border: "border-[#E0C27A]/60",
    chipBg: "bg-[#F6E2B4]",
    glow: "shadow-[0_12px_26px_rgba(176,138,47,0.14)]",
  },
  rentas: {
    emoji: "🏠",
    tint: "from-[#EAF7F1] to-[#F7FCF9]",
    border: "border-[#A8D6BF]/60",
    chipBg: "bg-[#CAE7D7]",
    glow: "shadow-[0_12px_26px_rgba(84,143,114,0.12)]",
  },
  "bienes-raices": {
    emoji: "🏘️",
    tint: "from-[#FFF2D9] to-[#FFF9EB]",
    border: "border-[#D8C79A]/65",
    chipBg: "bg-[#F0DFB8]",
    glow: "shadow-[0_12px_26px_rgba(176,138,47,0.14)]",
  },
  autos: {
    emoji: "🚗",
    tint: "from-[#FFEDEC] to-[#FFF8F7]",
    border: "border-[#E7B5AF]/60",
    chipBg: "bg-[#F4CFCB]",
    glow: "shadow-[0_12px_26px_rgba(173,95,86,0.12)]",
  },
  restaurantes: {
    emoji: "🍽️",
    tint: "from-[#FFF1E8] to-[#FFFAF6]",
    border: "border-[#E7C3A8]/60",
    chipBg: "bg-[#F3D9C4]",
    glow: "shadow-[0_12px_26px_rgba(175,120,72,0.12)]",
  },
  servicios: {
    emoji: "🛠️",
    tint: "from-[#F1EEFF] to-[#FAF8FF]",
    border: "border-[#C9BEEA]/60",
    chipBg: "bg-[#DDD3F5]",
    glow: "shadow-[0_12px_26px_rgba(114,97,167,0.12)]",
  },
  empleos: {
    emoji: "💼",
    tint: "from-[#EAF4FF] to-[#F8FCFF]",
    border: "border-[#B7D0EE]/60",
    chipBg: "bg-[#D4E3F5]",
    glow: "shadow-[0_12px_26px_rgba(90,127,170,0.12)]",
  },
  clases: {
    emoji: "📚",
    tint: "from-[#FFF4E6] to-[#FFFBF5]",
    border: "border-[#E6CCAB]/60",
    chipBg: "bg-[#F2DEC4]",
    glow: "shadow-[0_12px_26px_rgba(176,130,75,0.12)]",
  },
  comunidad: {
    emoji: "🌎",
    tint: "from-[#E9F8F3] to-[#F7FDFB]",
    border: "border-[#B7E0D2]/60",
    chipBg: "bg-[#D2EFE6]",
    glow: "shadow-[0_12px_26px_rgba(86,150,128,0.12)]",
  },
  travel: {
    emoji: "✈️",
    tint: "from-[#ECF5FF] to-[#F8FBFF]",
    border: "border-[#B8D2EC]/60",
    chipBg: "bg-[#D7E7F7]",
    glow: "shadow-[0_12px_26px_rgba(96,133,170,0.12)]",
  },
};
