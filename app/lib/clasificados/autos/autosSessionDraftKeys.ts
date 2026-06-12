/** Stable v2 sessionStorage keys — lane-specific, versioned, unaffected by ?lang= query. */

export const AUTOS_SESSION_DRAFT_VERSION = 2;

export function buildAutosNegociosActiveDraftSessionKey(namespace: string): string {
  return `leonix:autos:negocios:activeDraft:v${AUTOS_SESSION_DRAFT_VERSION}:${namespace}`;
}

export function buildAutosNegociosActiveChildDraftSessionKey(namespace: string): string {
  return `leonix:autos:negocios:activeChildDraft:v${AUTOS_SESSION_DRAFT_VERSION}:${namespace}`;
}

export function buildAutosPrivadoActiveDraftSessionKey(namespace: string): string {
  return `leonix:autos:privado:activeDraft:v${AUTOS_SESSION_DRAFT_VERSION}:${namespace}`;
}

export function storageEventAffectsAutosNegociosSessionDraft(key: string | null): boolean {
  if (key === null) return true;
  return (
    key.startsWith("leonix:autos:negocios:activeDraft:v") ||
    key.startsWith("leonix:autos:negocios:activeChildDraft:v")
  );
}

export function storageEventAffectsAutosPrivadoSessionDraft(key: string | null): boolean {
  if (key === null) return true;
  return key.startsWith("leonix:autos:privado:activeDraft:v");
}
