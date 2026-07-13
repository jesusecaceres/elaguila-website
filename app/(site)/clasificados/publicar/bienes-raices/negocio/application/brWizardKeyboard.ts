/**
 * Bienes wizard keyboard helpers — page shortcuts must never steal Space/arrows from editable fields.
 */

const EDITABLE_SELECTOR =
  'input, textarea, select, [contenteditable=""], [contenteditable="true"], [role="textbox"]';

export function brIsEditableKeyboardTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof Element)) return false;
  const el = target as HTMLElement;
  if (el.isContentEditable) return true;
  if (el.closest?.(EDITABLE_SELECTOR)) return true;
  const tag = el.tagName?.toLowerCase?.() ?? "";
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  return false;
}

/** Use on window/document keydown handlers that advance wizard steps or close drawers. */
export function brShouldIgnoreWizardShortcut(e: KeyboardEvent): boolean {
  if (brIsEditableKeyboardTarget(e.target)) return true;
  // Native button Space activation must remain intact — only skip custom step shortcuts there.
  const t = e.target;
  if (t instanceof HTMLElement) {
    const tag = t.tagName.toLowerCase();
    if (tag === "button" || t.getAttribute("role") === "button") {
      if (e.key === " " || e.code === "Space") return true;
    }
  }
  return false;
}
