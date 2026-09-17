import { adminCardBase } from "@/app/admin/_components/adminTheme";
import { getLeoMorningBrief } from "@/app/leo/_lib/leoMorningBriefService";
import type { LeoMorningBriefTopPriority } from "@/app/leo/_lib/leoTypes";

import { scrubOwnerFacingText } from "./leoOwnerPresentation";

function formatBriefDate(nowMs: number, timezone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(nowMs));
}

function PriorityRow({ item }: { item: LeoMorningBriefTopPriority }) {
  return (
    <li className="min-w-0 rounded-xl border border-[color:var(--lx-border)]/70 bg-white/80 p-3.5">
      <div className="flex min-w-0 gap-3">
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#7A1E2C] text-sm font-bold text-white">
          {item.rank}
        </span>
        <div className="min-w-0 flex-1">
          <p className="break-words text-sm font-bold text-[#1E1810]">{scrubOwnerFacingText(item.what)}</p>
          <p className="mt-1 break-words text-xs leading-relaxed text-[#5C5346]">
            {scrubOwnerFacingText(item.why)}
          </p>
          <div className="mt-2 flex min-w-0 flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-wide text-[#A67C52]">
            <span>{item.source}</span>
            {item.dueOrTime ? <span>{item.dueOrTime}</span> : null}
            <span>{item.priority.replace(/_/g, " ")}</span>
          </div>
          {item.safeNextAction ? (
            <p className="mt-2 text-xs text-[#5C5346]">Next: {scrubOwnerFacingText(item.safeNextAction)}</p>
          ) : null}
        </div>
      </div>
    </li>
  );
}

export async function LeoMorningBriefPanel() {
  const brief = await getLeoMorningBrief();
  const nowMs = Date.parse(brief.generatedAt);
  const schedule = brief.sections.find((s) => s.kind === "CALENDAR");
  const care = brief.sections.find((s) => s.kind === "CLIENT_CARE");

  return (
    <section
      className={`${adminCardBase} min-w-0 overflow-hidden border-[#7A1E2C]/15 p-4 shadow-[0_12px_40px_-16px_rgba(122,30,44,0.18)] sm:p-5`}
      aria-labelledby="leo-morning-brief-heading"
      data-leo-morning-brief
    >
      <div className="mb-4 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wide text-[#A67C52]">Morning CEO Brief</p>
        <h2 id="leo-morning-brief-heading" className="mt-1 text-xl font-bold tracking-tight text-[#1E1810] sm:text-2xl">
          Good morning
        </h2>
        <p className="mt-1 text-sm text-[#5C5346]">
          {formatBriefDate(Number.isFinite(nowMs) ? nowMs : Date.now(), brief.timezone)}
        </p>
        <p className="mt-3 break-words text-base font-semibold leading-relaxed text-[#1E1810]">
          {scrubOwnerFacingText(brief.headline)}
        </p>
      </div>

      {brief.topPriorities.length > 0 ? (
        <div className="mb-4 min-w-0">
          <h3 className="text-sm font-bold text-[#1E1810]">Top priorities</h3>
          <ul className="mt-2 space-y-2">
            {brief.topPriorities.map((item) => (
              <PriorityRow key={`${item.rank}-${item.evidenceRef ?? item.what}`} item={item} />
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid min-w-0 gap-4 md:grid-cols-2">
        {schedule ? (
          <div className="min-w-0 rounded-xl border border-[color:var(--lx-border)]/70 bg-[color:var(--lx-section)] p-3.5">
            <h3 className="text-sm font-bold text-[#1E1810]">Today&apos;s schedule</h3>
            <p className="mt-1 text-xs leading-relaxed text-[#5C5346]">{scrubOwnerFacingText(schedule.summary)}</p>
            {schedule.cards.length > 0 ? (
              <ul className="mt-2 space-y-1.5">
                {schedule.cards.slice(0, 4).map((card) => (
                  <li key={card.cardId} className="break-words text-sm font-semibold text-[#1E1810]">
                    {scrubOwnerFacingText(card.title)}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {care ? (
          <div className="min-w-0 rounded-xl border border-[color:var(--lx-border)]/70 bg-[color:var(--lx-section)] p-3.5">
            <h3 className="text-sm font-bold text-[#1E1810]">Who needs attention</h3>
            <p className="mt-1 text-xs leading-relaxed text-[#5C5346]">{scrubOwnerFacingText(care.summary)}</p>
            {care.cards.length > 0 ? (
              <ul className="mt-2 space-y-1.5">
                {care.cards.slice(0, 4).map((card) => (
                  <li key={card.cardId} className="break-words text-sm font-semibold text-[#1E1810]">
                    {scrubOwnerFacingText(card.title)}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>

      {brief.canWait.length > 0 ? (
        <div className="mt-4 min-w-0">
          <h3 className="text-sm font-bold text-[#1E1810]">Can wait</h3>
          <ul className="mt-2 space-y-1.5">
            {brief.canWait.map((item) => (
              <li key={`wait-${item.evidenceRef ?? item.what}`} className="break-words text-xs text-[#5C5346]">
                {scrubOwnerFacingText(item.what)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {brief.limitations.some((l) => /unavailable|Based on available/i.test(l)) ? (
        <p className="mt-4 text-xs text-amber-900" role="status">
          {scrubOwnerFacingText(
            brief.limitations.find((l) => /unavailable|Based on available/i.test(l)) ?? brief.limitations[0] ?? "",
          )}
        </p>
      ) : null}

      <p className="mt-3 text-[10px] text-[#5C5346]/80">
        On-demand briefing only — no scheduled delivery yet. Ask LEO: &quot;Give me my morning brief.&quot;
      </p>
    </section>
  );
}
