import type { MouseEvent, PointerEvent } from "react";

/** True when the event target is a native `<select>` or its option list interaction. */
export function isAutosDrawerNativeSelectInteraction(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest("select, option, optgroup, datalist"));
}

/** Prevent drawer backdrop/outside handlers from treating native select opens as outside clicks. */
export function shouldIgnoreAutosDrawerOutsideInteraction(event: Event): boolean {
  if (isAutosDrawerNativeSelectInteraction(event.target)) return true;
  const type = event.type;
  if (type === "focusout" || type === "blur") {
    const related = (event as FocusEvent).relatedTarget;
    if (isAutosDrawerNativeSelectInteraction(related)) return true;
  }
  return false;
}

type ModalSelectPropBag = {
  className?: string;
  onMouseDown?: (e: MouseEvent) => void;
  onPointerDown?: (e: PointerEvent) => void;
  onClick?: (e: MouseEvent) => void;
};

/** Native `<select>` props that keep menus open inside Autos inventory drawer/modals. */
export function autosDrawerNativeSelectProps(
  baseClassName: string,
  insideModal: boolean,
): ModalSelectPropBag {
  if (!insideModal) return { className: baseClassName };
  return {
    className: `${baseClassName} relative z-[2] touch-manipulation`,
    onMouseDown: (e) => e.stopPropagation(),
    onPointerDown: (e) => e.stopPropagation(),
    onClick: (e) => e.stopPropagation(),
  };
}
