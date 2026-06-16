/** Per-tab AI scan session — stores record id + last scan job id only (no OCR/base64). */
export const OFERTAS_LOCALES_AI_SCAN_SESSION_KEY = "leonix:ofertas-locales:ai-scan-session:v1" as const;

export type OfertaLocalAiScanSession = {
  ofertaLocalId: string | null;
  lastScanJobId: string | null;
};

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function loadOfertaLocalAiScanSession(): OfertaLocalAiScanSession {
  const storage = getStorage();
  if (!storage) return { ofertaLocalId: null, lastScanJobId: null };
  try {
    const raw = storage.getItem(OFERTAS_LOCALES_AI_SCAN_SESSION_KEY);
    if (!raw) return { ofertaLocalId: null, lastScanJobId: null };
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return { ofertaLocalId: null, lastScanJobId: null };
    const o = parsed as Record<string, unknown>;
    return {
      ofertaLocalId: typeof o.ofertaLocalId === "string" && o.ofertaLocalId.trim() ? o.ofertaLocalId.trim() : null,
      lastScanJobId:
        typeof o.lastScanJobId === "string" && o.lastScanJobId.trim() ? o.lastScanJobId.trim() : null,
    };
  } catch {
    return { ofertaLocalId: null, lastScanJobId: null };
  }
}

export function saveOfertaLocalAiScanSession(session: OfertaLocalAiScanSession): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(
      OFERTAS_LOCALES_AI_SCAN_SESSION_KEY,
      JSON.stringify({
        ofertaLocalId: session.ofertaLocalId?.trim() || null,
        lastScanJobId: session.lastScanJobId?.trim() || null,
      })
    );
  } catch {
    // ignore quota / privacy mode
  }
}

export function clearOfertaLocalAiScanSession(): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(OFERTAS_LOCALES_AI_SCAN_SESSION_KEY);
  } catch {
    // ignore
  }
}
