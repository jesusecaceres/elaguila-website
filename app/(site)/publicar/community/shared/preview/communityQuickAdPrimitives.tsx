"use client";

import { FiUser } from "react-icons/fi";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { getCanonicalCityName } from "@/app/data/locations/californiaLocationHelpers";

/** Warm chip style — shared by Clases/Comunidad quick ad canvases (WYSIWYG). */
export const COMMUNITY_QUICK_WARM_CHIP =
  "inline-flex max-w-full items-center rounded-full border border-[#A98C2A]/45 bg-[#F4EBD8] px-3 py-1 text-xs font-semibold text-[#3D3428] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]";

export function OrganizerByline({ label, name }: { label: string; name: string }) {
  return (
    <div className="mt-3 flex items-start gap-3 rounded-xl border border-[#C9B46A]/50 bg-[#F4EBD8]/65 px-3.5 py-3 sm:px-4">
      <FiUser className="mt-0.5 h-5 w-5 shrink-0 text-[#8B7355]" aria-hidden />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6B5E4E]">{label}</p>
        <p className="mt-0.5 text-lg font-bold leading-snug tracking-tight text-[#2A2826]">{name}</p>
      </div>
    </div>
  );
}

export function cityStateZipLine(d: { publicCity: string; state: string; zip: string }): string {
  const city = getCanonicalCityName(d.publicCity.trim()) || d.publicCity.trim();
  if (!city) return "";
  const st = d.state.trim() || "CA";
  const z = d.zip.trim();
  return z ? `${city}, ${st} ${z}` : `${city}, ${st}`;
}

export const COMMUNITY_QUICK_FALLBACK_IMG =
  "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=70";

function isNonImageAttachment(url: string, mime?: string): boolean {
  if (mime === "application/pdf") return true;
  if (url.startsWith("data:application/pdf")) return true;
  const base = url.split(/[?#]/)[0]?.toLowerCase() ?? "";
  return base.endsWith(".pdf");
}

export function pickMainHeroImage(
  images: { url: string; alt: string; isMain?: boolean; attachmentMime?: string }[],
): { url: string; alt: string; heroIsFlyerDoc?: boolean } {
  const withUrl = images.filter((x) => String(x.url ?? "").trim());
  if (!withUrl.length) return { url: COMMUNITY_QUICK_FALLBACK_IMG, alt: "preview" };
  const main = withUrl.find((x) => x.isMain) ?? withUrl[0];
  const url = main.url;
  if (isNonImageAttachment(url, main.attachmentMime)) {
    return { url: COMMUNITY_QUICK_FALLBACK_IMG, alt: main.alt || "preview", heroIsFlyerDoc: true };
  }
  return { url, alt: main.alt || "preview" };
}

export function formatDateIso(iso: string, lang: Lang): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso + "T00:00:00");
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(lang === "en" ? "en-US" : "es-MX", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
