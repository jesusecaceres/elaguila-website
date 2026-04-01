/** CSS transform for center-anchored native objects on the trim preview. */
export function nativePreviewTransformCss(rotationDeg: number): string {
  if (rotationDeg === 0) return "translate(-50%, -50%)";
  return `translate(-50%, -50%) rotate(${rotationDeg}deg)`;
}
