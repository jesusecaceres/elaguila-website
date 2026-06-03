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

/** True when the user likely pressed space mid-word (trailing whitespace in draft). */
export function autosHasDraftTrailingSpace(raw: string | undefined): boolean {
  return typeof raw === "string" && raw.length > 0 && raw !== raw.trimEnd();
}

/** Skip coercion/normalization while the user is mid-word; apply `coerced` otherwise. */
export function autosPreserveDraftTypingValue(
  raw: string | undefined,
  coerced: string | undefined,
): string | undefined {
  if (raw === undefined || raw === "") return coerced;
  if (autosHasDraftTrailingSpace(raw)) return raw;
  return coerced;
}

/** Keyboard shortcuts must not steal Space/Enter while typing in form controls. */
export function isTextEntryTarget(target: EventTarget | null): boolean {
  if (!target || typeof target !== "object") return false;
  const el = target as HTMLElement;
  const tag = el.tagName?.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if (el.isContentEditable) return true;
  const role = el.getAttribute?.("role");
  return role === "textbox" || role === "combobox" || role === "searchbox";
}
