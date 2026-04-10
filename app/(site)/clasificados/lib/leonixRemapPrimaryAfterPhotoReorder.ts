/**
 * When reordering `photoUrls` / `photoDataUrls` with arrayMove, keep `primaryImageIndex`
 * pointing at the same image (by position before/after move).
 */
export function remapPrimaryIndexAfterArrayMove(
  primaryIndex: number,
  fromIndex: number,
  toIndex: number,
): number {
  if (fromIndex === toIndex) return primaryIndex;
  let pi = primaryIndex;
  if (pi === fromIndex) return toIndex;
  if (fromIndex < toIndex) {
    if (pi > fromIndex && pi <= toIndex) pi -= 1;
  } else {
    if (pi >= toIndex && pi < fromIndex) pi += 1;
  }
  return pi;
}
