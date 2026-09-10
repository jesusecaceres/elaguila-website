import { FiClock, FiMapPin } from "react-icons/fi";
import type { ServiciosProfileResolved, ServiciosLang } from "../types/serviciosBusinessProfile";
import { getServiciosProfileLabels } from "../copy/serviciosProfileCopy";
import { SV } from "./serviciosDesignTokens";
import { buildServiciosHeroHoursPill } from "./serviciosHeroHoursStatus";

export function ServiciosHours({ profile, lang }: { profile: ServiciosProfileResolved; lang: ServiciosLang }) {
  const L = getServiciosProfileLabels(lang);
  const hours = profile.contact.hours;

  if (!hours) return null;

  /** Gate SERVICIOS-1 — real open/closed computed from today's parsed hour range at render time,
   * replacing the publish-time-frozen `openNowLabel` string (always "Hoy"/"Today", never actually
   * "Open"/"Closed") and its substring colour heuristic. This is the same shared evaluator the
   * results `open_now` filter already uses (serviciosResultsFilter.ts →
   * serviciosHoursSummaryIsOpenNow), so the public profile and search now agree. Falls back to the
   * stored label when the hours text cannot be parsed into a time range. */
  const pill = buildServiciosHeroHoursPill(hours, lang, {
    // Gate SERVICIOS-3 (D-1) — same business-timezone rule as the hero badge and the results
    // filter. `profile.contact` carries the persisted location this resolves from.
    timeZone: profile.contact.businessTimeZone ?? null,
  });
  const pillText = pill?.text || hours.openNowLabel;
  // When the engine returns no pill at all there is nothing to colour as open/closed; the stored
  // `openNowLabel` is a publish-time string, not a live status, so it is shown as neutral text
  // rather than being re-interpreted into a colour the engine declined to assert.
  const pillIsClosed = pill ? pill.variant === "closed" : false;

  return (
    <section
      className="rounded-2xl border p-4 shadow-sm sm:p-6 md:p-8"
      style={{ backgroundColor: SV.card, borderColor: SV.border, boxShadow: SV.shadowSm }}
    >
      <div className="flex items-center gap-2">
        <FiClock className="h-5 w-5 text-[#3B66AD]" aria-hidden />
        <h2 className="text-lg font-bold tracking-tight text-[color:var(--lx-text)] md:text-xl">{L.weeklyHours}</h2>
        {pillText ? (
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
            style={{
              borderColor: pillIsClosed ? SV.border : SV.accentBorder,
              backgroundColor: pillIsClosed ? SV.warmSoft : SV.accentSoft,
              color: pillIsClosed ? SV.warm : SV.accent,
            }}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: 'currentColor' }} aria-hidden />
            {pillText}
          </span>
        ) : null}
      </div>
      
      {hours.todayHoursLine ? (
        <p className="mt-4 text-sm font-medium text-[color:var(--lx-text)]">{hours.todayHoursLine}</p>
      ) : null}
      
      {hours.weeklyRows && hours.weeklyRows.length > 0 ? (
        <div className="mt-5 space-y-2">
          {hours.weeklyRows.map((row, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-lg border border-black/[0.06] bg-white/95 px-3 py-2 shadow-sm"
              style={{ borderColor: SV.warmBorder }}
            >
              <span className="text-sm font-medium text-[color:var(--lx-text)]">{row.dayLabel}</span>
              <span className="text-sm text-[color:var(--lx-text-2)]">{row.line}</span>
            </div>
          ))}
        </div>
      ) : null}

      {hours.specialHoursRows && hours.specialHoursRows.length > 0 ? (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--lx-text-2)]">
            {L.specialHours}
          </p>
          <div className="mt-2 space-y-2">
            {hours.specialHoursRows.map((row, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border border-black/[0.06] bg-white/95 px-3 py-2 shadow-sm"
                style={{ borderColor: SV.warmBorder }}
              >
                <span className="text-sm font-medium text-[color:var(--lx-text)]">{row.label}</span>
                <span className="text-sm text-[color:var(--lx-text-2)]">{row.note}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
