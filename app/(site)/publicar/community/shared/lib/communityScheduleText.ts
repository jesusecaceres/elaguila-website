import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import type { DayHoursRow } from "@/app/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes";

/**
 * Genuinely shared, category-agnostic weekly-schedule → plain-text formatter,
 * used by both the Comunidad and Clases publish-payload description builders.
 * Kept in its own module (rather than inside publishCommunityQuickToListings.ts)
 * so those two category-owned builders can import it without creating a
 * circular import back into the shared transport/persist file.
 */
function dayShort(day: DayHoursRow["day"], lang: Lang): string {
  const es: Record<DayHoursRow["day"], string> = {
    mon: "Lun",
    tue: "Mar",
    wed: "Mié",
    thu: "Jue",
    fri: "Vie",
    sat: "Sáb",
    sun: "Dom",
  };
  const en: Record<DayHoursRow["day"], string> = {
    mon: "Mon",
    tue: "Tue",
    wed: "Wed",
    thu: "Thu",
    fri: "Fri",
    sat: "Sat",
    sun: "Sun",
  };
  return lang === "en" ? en[day] : es[day];
}

export function formatWeekly(rows: DayHoursRow[], lang: Lang): string {
  const lines: string[] = [];
  for (const r of rows) {
    if (r.closed) continue;
    const o = String(r.open ?? "").trim();
    const c = String(r.close ?? "").trim();
    if (!o || !c) continue;
    lines.push(`${dayShort(r.day, lang)} ${o}–${c}`);
  }
  if (!lines.length) return "";
  const h = lang === "es" ? "Horario" : "Schedule";
  return `${h}:\n${lines.join("\n")}`;
}
