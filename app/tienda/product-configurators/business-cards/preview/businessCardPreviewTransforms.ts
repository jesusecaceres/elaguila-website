/** Compose base CSS transform with fine nudge (-1..1) as % of card width. */
export function mergeTransform(base: string | undefined, nudgeX: number, nudgeY: number): string {
  const nx = nudgeX * 3;
  const ny = nudgeY * 3;
  const b = base ?? "translate(-50%, -50%)";
  return `${b} translate(${nx}%, ${ny}%)`;
}
