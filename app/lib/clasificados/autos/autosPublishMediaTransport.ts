/** Shared Autos publish media transport helpers (client + server safe — no IndexedDB). */

export const AUTOS_IDB_MEDIA_REF_PREFIX = "__AUTOS_IDB_MEDIA__:";
export const AUTOS_IDB_LOGO_REF = "__AUTOS_IDB_LOGO__";
export const AUTOS_IDB_FINANCE_IMAGE_REF = "__AUTOS_IDB_FINANCE_IMAGE__";

export function isAutosPublishableRemoteImageUrl(url: string): boolean {
  const t = url.trim();
  if (!/^https:\/\//i.test(t)) return false;
  if (isAutosIdbPlaceholderRef(t)) return false;
  return true;
}

export function isAutosIdbPlaceholderRef(value: string): boolean {
  const t = value.trim();
  return (
    t.startsWith(AUTOS_IDB_MEDIA_REF_PREFIX) ||
    t === AUTOS_IDB_LOGO_REF ||
    t === AUTOS_IDB_FINANCE_IMAGE_REF
  );
}

export function autosDraftImageRequiresUpload(url: string): boolean {
  const t = url.trim();
  if (!t) return false;
  if (isAutosPublishableRemoteImageUrl(t)) return false;
  if (/^data:image\//i.test(t)) return true;
  if (t.startsWith("blob:")) return true;
  if (isAutosIdbPlaceholderRef(t)) return true;
  return false;
}

export function isAutosNonDurableVideoRef(value: string | null | undefined): boolean {
  const t = value?.trim() ?? "";
  if (!t) return false;
  return t.startsWith("blob:") || t.startsWith("data:video/") || /^data:application\/.*video/i.test(t);
}
