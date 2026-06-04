import type { ComidaLocalPreviewSocialPlatform } from "@/app/lib/clasificados/comida-local/comidaLocalPreviewTypes";

export function comidaLocalContactButtonClass(
  variant: "primary" | "whatsapp" | "social" | "secondary",
  platform?: ComidaLocalPreviewSocialPlatform
): string {
  const base =
    "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

  if (variant === "primary") {
    return `${base} border-[#7A1E2C] bg-[#7A1E2C] text-[#FFFCF7] hover:bg-[#6a1a26] focus-visible:outline-[#7A1E2C]/50`;
  }
  if (variant === "whatsapp") {
    return `${base} border-[#128C7E]/40 bg-[#25D366]/12 text-[#0b3d32] hover:bg-[#25D366]/22 focus-visible:outline-[#25D366]/40`;
  }
  if (variant === "social" && platform === "instagram") {
    return `${base} border-[#E4405F]/30 bg-[#E4405F]/8 text-[#9b1d42] hover:bg-[#E4405F]/14`;
  }
  if (variant === "social" && platform === "facebook") {
    return `${base} border-[#1877F2]/30 bg-[#1877F2]/8 text-[#0d47a1] hover:bg-[#1877F2]/14`;
  }
  if (variant === "social" && platform === "tiktok") {
    return `${base} border-[#010101]/20 bg-[#010101]/5 text-[#010101] hover:bg-[#010101]/10`;
  }
  return `${base} border-[#D4C4A8] bg-[#FFFCF7] text-[#1E1814] hover:border-[#7A1E2C]/35 focus-visible:outline-[#D4C4A8]`;
}
