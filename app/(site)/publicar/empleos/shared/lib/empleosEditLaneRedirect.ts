import type { Lang } from "@/app/clasificados/config/clasificadosHub";

export type EmpleosResumeLane = "quick" | "premium" | "feria";

/**
 * If the listing row lane does not match the publish form, send the user to the correct resume URL.
 * @returns true when a redirect was triggered (caller should skip hydrating this form).
 */
export function replaceRouteForEmpleosResumeEdit(
  router: { replace: (href: string) => void },
  opts: { editId: string; lang: Lang; expected: EmpleosResumeLane; actual: string | undefined },
): boolean {
  const actual = String(opts.actual ?? "").trim();
  if (!actual || actual === opts.expected) return false;
  const target =
    actual === "premium" ? "/publicar/empleos/premium" : actual === "feria" ? "/publicar/empleos/feria" : "/publicar/empleos/quick";
  const u = new URLSearchParams();
  if (opts.lang === "en") u.set("lang", "en");
  u.set("edit", opts.editId);
  router.replace(`${target}?${u.toString()}`);
  return true;
}
