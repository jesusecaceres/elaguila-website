import "server-only";

/**
 * Recursos Intake OS — Gate 3 safe server-side fetch. Node runtime only. Every redirect hop is
 * re-validated through `validateIntakeUrl` before being followed — `redirect: "manual"` plus
 * our own loop, never the fetch client's built-in auto-follow, specifically so a same-origin
 * URL that redirects to an internal address cannot bypass the SSRF check.
 */
import { validateIntakeUrl } from "./urlSafety";

const FETCH_TIMEOUT_MS = 8000;
const MAX_REDIRECTS = 3;
const MAX_RESPONSE_BYTES = 2_000_000; // 2 MB — plenty for an org's about/contact page, not a media dump
const ALLOWED_CONTENT_TYPE_RE = /^text\/html|^application\/xhtml\+xml/i;

export type UrlFetchResult =
  | { ok: true; finalUrl: string; status: number; html: string }
  | { ok: false; reason: string };

async function fetchOneHop(url: URL): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url.toString(), {
      method: "GET",
      redirect: "manual",
      signal: controller.signal,
      headers: {
        "User-Agent": "LeonixRecursosIntakeBot/1.0 (+https://leonixmedia.com)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetches a URL safely: validates every redirect hop, enforces a redirect cap, a per-request
 * timeout, a response-size cap, and a content-type allow-list. Never ingests binaries/PDFs/
 * images here — that is out of scope for URL intake (PDF has its own Gate 4 pipeline).
 */
export async function fetchUrlSafely(initialUrl: URL): Promise<UrlFetchResult> {
  let current = initialUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    let res: Response;
    try {
      res = await fetchOneHop(current);
    } catch (e) {
      const isAbort = e instanceof Error && e.name === "AbortError";
      return { ok: false, reason: isAbort ? "Tiempo de espera agotado al conectar con el sitio." : "No se pudo conectar con el sitio." };
    }

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) return { ok: false, reason: "Redirección sin destino válido." };
      let nextUrl: URL;
      try {
        nextUrl = new URL(location, current);
      } catch {
        return { ok: false, reason: "Redirección con URL inválida." };
      }
      const check = validateIntakeUrl(nextUrl.toString());
      if (!check.ok) return { ok: false, reason: `Redirección bloqueada por seguridad: ${check.reason}` };
      if (hop === MAX_REDIRECTS) return { ok: false, reason: "Demasiadas redirecciones." };
      current = check.url;
      continue;
    }

    if (res.status < 200 || res.status >= 300) {
      return { ok: false, reason: `El sitio respondió con estado HTTP ${res.status}.` };
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (!ALLOWED_CONTENT_TYPE_RE.test(contentType)) {
      return { ok: false, reason: `Tipo de contenido no compatible (${contentType || "desconocido"}). Solo se acepta HTML.` };
    }

    const contentLength = res.headers.get("content-length");
    if (contentLength && Number(contentLength) > MAX_RESPONSE_BYTES) {
      return { ok: false, reason: "La respuesta del sitio excede el tamaño máximo permitido." };
    }

    const reader = res.body?.getReader();
    if (!reader) {
      const text = await res.text();
      if (text.length > MAX_RESPONSE_BYTES) return { ok: false, reason: "La respuesta del sitio excede el tamaño máximo permitido." };
      return { ok: true, finalUrl: current.toString(), status: res.status, html: text };
    }

    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_RESPONSE_BYTES) {
        await reader.cancel().catch(() => {});
        return { ok: false, reason: "La respuesta del sitio excede el tamaño máximo permitido." };
      }
      chunks.push(value);
    }
    const html = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf-8");
    return { ok: true, finalUrl: current.toString(), status: res.status, html };
  }
  return { ok: false, reason: "Demasiadas redirecciones." };
}
