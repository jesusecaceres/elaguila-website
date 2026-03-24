/** Heuristics for BR negocio floorplan preview (URL pasted vs uploaded). */

export function isFloorplanUrlProbablyPdf(url: string): boolean {
  const u = url.split("?")[0]?.toLowerCase() ?? "";
  return u.endsWith(".pdf") || u.includes(".pdf");
}

export function isFloorplanUrlProbablyImage(url: string): boolean {
  const u = url.split("?")[0] ?? "";
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(u);
}
