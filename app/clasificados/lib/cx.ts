/** Join class names, skipping falsy entries (hub + clasificados UI). */
export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
