/** Mask placeholder protection for external translation providers (server-only). */

export function wrapMaskPlaceholdersForXmlTags(text: string): string {
  return text.replace(/__LEONIX_MASK_\d+__/g, (m) => `<x>${m}</x>`);
}

export function unwrapMaskPlaceholdersFromXmlTags(text: string): string {
  return text.replace(/<x>(__LEONIX_MASK_\d+__)<\/x>/g, (_, m) => m);
}

/** Google Cloud Translation (HTML mime): keep __LEONIX_MASK_N__ out of translation. */
export function wrapMaskPlaceholdersForGoogleHtml(text: string): string {
  return text.replace(/__LEONIX_MASK_\d+__/g, (m) => `<span translate="no">${m}</span>`);
}

export function unwrapMaskPlaceholdersFromGoogleHtml(text: string): string {
  return text.replace(
    /<span[^>]*translate=["']no["'][^>]*>(__LEONIX_MASK_\d+__)<\/span>/gi,
    "$1",
  );
}
