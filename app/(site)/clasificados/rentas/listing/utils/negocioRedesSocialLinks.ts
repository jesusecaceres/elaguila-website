/**
 * Parse negocioRedes text into renderable social links (shared naming with legacy BR / rentas).
 */
export function parseNegocioRedesSocialLinks(raw: string | null | undefined): Array<{ label: string; url: string }> | null {
  const s = (raw ?? "").trim();
  if (!s) return null;
  const out: Array<{ label: string; url: string }> = [];
  const urlLike = /https?:\/\/[^\s,]+/gi;
  const parts = s
    .split(/[,;]|\s+-\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
  for (const part of parts) {
    const urlMatch = part.match(urlLike);
    const url = urlMatch ? urlMatch[0] : "";
    const labelPart = url ? part.replace(urlLike, "").replace(/^[:\s]+|[:\s]+$/g, "").trim() : part;
    const label =
      labelPart.toLowerCase().startsWith("facebook")
        ? "Facebook"
        : labelPart.toLowerCase().startsWith("instagram") || labelPart.toLowerCase().startsWith("ig")
          ? "Instagram"
          : labelPart.toLowerCase().startsWith("whatsapp") || labelPart.toLowerCase().startsWith("wa")
            ? "WhatsApp"
            : labelPart.toLowerCase().startsWith("twitter") || labelPart.toLowerCase().startsWith("x ")
              ? "X"
              : labelPart || "Red social";
    if (url && /^https?:\/\//i.test(url)) {
      out.push({ label, url });
    } else if (/^https?:\/\//i.test(part)) {
      out.push({ label: "Red social", url: part });
    }
  }
  if (out.length === 0 && /https?:\/\//i.test(s)) {
    const m = s.match(urlLike);
    if (m) m.forEach((u) => out.push({ label: "Enlace", url: u }));
  }
  return out.length > 0 ? out : null;
}
