import type { ClasificadosServiciosPromoRow } from "./clasificadosServiciosApplicationTypes";
import type { ServiciosLang } from "./clasificadosServiciosApplicationTypes";

/** Browser-openable promo PDF href in form/preview (data URL or https). */
export function isPromoPdfPreviewHref(href: string | undefined | null): boolean {
  const t = (href ?? "").trim();
  if (!t) return false;
  const lower = t.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("file:") || lower.startsWith("blob:")) {
    return false;
  }
  if (t.startsWith("data:application/pdf")) return true;
  if (/^https?:\/\//i.test(t)) return true;
  return false;
}

export function formatPromoPdfFileSize(bytes: number, lang: ServiciosLang): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) {
    const kb = (bytes / 1024).toFixed(bytes < 10_240 ? 1 : 0);
    return lang === "en" ? `${kb} KB` : `${kb} KB`;
  }
  const mb = (bytes / (1024 * 1024)).toFixed(1);
  return lang === "en" ? `${mb} MB` : `${mb} MB`;
}

export function promoPdfDisplayFileName(row: Pick<ClasificadosServiciosPromoRow, "pdfFileName" | "pdfUrl">, lang: ServiciosLang): string {
  const explicit = row.pdfFileName?.trim();
  if (explicit) return explicit.slice(0, 120);
  const url = row.pdfUrl.trim();
  if (url.startsWith("data:application/pdf")) {
    return lang === "en" ? "Uploaded PDF" : "PDF cargado";
  }
  try {
    const u = new URL(url);
    const seg = u.pathname.split("/").filter(Boolean).pop();
    if (seg && /\.pdf$/i.test(seg)) return decodeURIComponent(seg).slice(0, 120);
  } catch {
    /* ignore */
  }
  return lang === "en" ? "Uploaded PDF" : "PDF cargado";
}
