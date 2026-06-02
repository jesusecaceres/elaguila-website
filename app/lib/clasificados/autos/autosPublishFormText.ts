/**
 * Autos publish form text helpers — do not `.trim()` in `onChange`;
 * trimming while typing blocks the spacebar (e.g. "3.5 V6", "1601 Coleman Ave").
 */

/** Keep raw value while typing; empty string → undefined. */
export function autosDraftTextValue(raw: string): string | undefined {
  return raw.length === 0 ? undefined : raw;
}

/** Optional URL field while typing — preserve until blur/save normalization. */
export function autosDraftUrlValue(raw: string): string | undefined {
  return raw.length === 0 ? undefined : raw;
}
