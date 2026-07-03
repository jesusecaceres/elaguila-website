/** Durable AI scan session — ofertaLocalId + lastScanJobId only (no OCR/base64). */
export const OFERTAS_LOCALES_AI_SCAN_SESSION_KEY = "leonix:ofertas-locales:ai-scan-session:v1" as const;

export type OfertaLocalAiScanSession = {
  ofertaLocalId: string | null;
  lastScanJobId: string | null;
};

function getLocalStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function getSessionStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function migrateSessionScanToLocal(): void {
  const local = getLocalStorage();
  const session = getSessionStorage();
  if (!local || !session) return;
  try {
    const sessionRaw = session.getItem(OFERTAS_LOCALES_AI_SCAN_SESSION_KEY);
    if (!sessionRaw) return;
    const localRaw = local.getItem(OFERTAS_LOCALES_AI_SCAN_SESSION_KEY);
    if (!localRaw) {
      local.setItem(OFERTAS_LOCALES_AI_SCAN_SESSION_KEY, sessionRaw);
    }
  } catch {
    // ignore
  }
}

function readSessionRaw(): string | null {
  migrateSessionScanToLocal();
  try {
    const localRaw = getLocalStorage()?.getItem(OFERTAS_LOCALES_AI_SCAN_SESSION_KEY);
    if (localRaw) return localRaw;
    return getSessionStorage()?.getItem(OFERTAS_LOCALES_AI_SCAN_SESSION_KEY) ?? null;
  } catch {
    return null;
  }
}

function parseSession(raw: string): OfertaLocalAiScanSession {
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object") return { ofertaLocalId: null, lastScanJobId: null };
  const o = parsed as Record<string, unknown>;
  return {
    ofertaLocalId: typeof o.ofertaLocalId === "string" && o.ofertaLocalId.trim() ? o.ofertaLocalId.trim() : null,
    lastScanJobId:
      typeof o.lastScanJobId === "string" && o.lastScanJobId.trim() ? o.lastScanJobId.trim() : null,
  };
}

export function loadOfertaLocalAiScanSession(): OfertaLocalAiScanSession {
  const raw = readSessionRaw();
  if (!raw) return { ofertaLocalId: null, lastScanJobId: null };
  try {
    return parseSession(raw);
  } catch {
    return { ofertaLocalId: null, lastScanJobId: null };
  }
}

export function saveOfertaLocalAiScanSession(session: OfertaLocalAiScanSession): void {
  const payload = JSON.stringify({
    ofertaLocalId: session.ofertaLocalId?.trim() || null,
    lastScanJobId: session.lastScanJobId?.trim() || null,
  });
  try {
    getLocalStorage()?.setItem(OFERTAS_LOCALES_AI_SCAN_SESSION_KEY, payload);
  } catch {
    // fall through
  }
  try {
    getSessionStorage()?.setItem(OFERTAS_LOCALES_AI_SCAN_SESSION_KEY, payload);
  } catch {
    // ignore quota / privacy mode
  }
}

export function clearOfertaLocalAiScanSession(): void {
  try {
    getLocalStorage()?.removeItem(OFERTAS_LOCALES_AI_SCAN_SESSION_KEY);
    getSessionStorage()?.removeItem(OFERTAS_LOCALES_AI_SCAN_SESSION_KEY);
  } catch {
    // ignore
  }
}
