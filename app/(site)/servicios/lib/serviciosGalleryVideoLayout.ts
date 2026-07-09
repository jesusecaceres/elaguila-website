/** Combined gallery video grid — Restaurantes rhythm with count-aware centering. */
export function serviciosCombinedVideoGridClass(count: number): string {
  if (count <= 0) return "";
  if (count === 1) return "mx-auto grid w-full max-w-sm grid-cols-1 gap-2";
  if (count === 2) return "mx-auto grid w-full max-w-2xl grid-cols-2 gap-2";
  if (count === 3) return "mx-auto grid w-full max-w-3xl grid-cols-2 gap-2 sm:grid-cols-3";
  return "grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4";
}
