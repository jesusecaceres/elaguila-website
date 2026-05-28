/** DeepL tag_handling helpers — shared until Google G3 defines its own non-translatable strategy. */

export function wrapMaskPlaceholdersForXmlTags(text: string): string {
  return text.replace(/__LEONIX_MASK_\d+__/g, (m) => `<x>${m}</x>`);
}

export function unwrapMaskPlaceholdersFromXmlTags(text: string): string {
  return text.replace(/<x>(__LEONIX_MASK_\d+__)<\/x>/g, (_, m) => m);
}
