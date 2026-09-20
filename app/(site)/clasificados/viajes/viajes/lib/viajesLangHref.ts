import type { Lang } from "@/app/clasificados/config/clasificadosHub";

/**
 * Set or replace `lang` on a relative path + query (preserves other params; keeps `#hash`).
 * Use instead of blindly appending `&lang=` when the URL may already include `lang`.
 */
export function setLangOnHref(href: string, lang: Lang): string {
  if (href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("https://wa.me")) {
    return href;
  }
  const [pathAndQs, hash] = href.split("#");
  const [path, qs] = pathAndQs.split("?");
  const p = new URLSearchParams(qs ?? "");
  p.set("lang", lang);
  const out = `${path}?${p.toString()}`;
  return hash ? `${out}#${hash}` : out;
}
