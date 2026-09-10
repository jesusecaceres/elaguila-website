import Image from "next/image";
import Link from "next/link";
import { adminBtnPrimary, adminBtnSecondary } from "../../_components/adminTheme";
import { BusinessConciergeInstallBanner } from "./BusinessConciergeInstallBanner";
import type { StaffConciergeAttentionItem, StaffConciergeHome } from "../../_lib/staffConciergeHome";
import { advisorSignalDashboardAnchor } from "@/app/lib/business/advisor/logic";
import type { AdvisorSignalType } from "@/app/lib/business/advisor/types";

export type OwnerHandoffRow = {
  businessId: string;
  displayName: string;
  proposalId: string;
  version: number;
  acceptedAt: string | null;
};

export type AdvisorAttentionRow = {
  businessId: string;
  displayName: string;
  signalId: string;
  signalType: string;
  severity: string;
  titleEn: string;
  detectedAt: string;
};

const ATTENTION_COPY: Record<StaffConciergeAttentionItem["reason"], string> = {
  overdue: "Overdue follow-up",
  due_today: "Follow-up due today",
  waiting_on_owner: "Waiting on owner",
  follow_up_due: "Follow-up due",
};

function TodayChip({ label, count }: { label: string; count: number }) {
  return (
    <div className="min-w-[8.5rem] flex-1 rounded-xl border border-[#E8DFD0] bg-[#FFFDF7] px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8A6B1F]">{label}</p>
      <p className="mt-0.5 font-serif text-2xl font-bold tabular-nums text-[#1E1810]">{count}</p>
    </div>
  );
}

export function StaffCommandCenter({
  home,
  summaryUnavailable = false,
  ownerHandoff = [],
  ownerHandoffUnavailable = false,
  advisorSignals = [],
  advisorUnavailable = false,
  advisorEnabled = false,
}: {
  home: StaffConciergeHome;
  summaryUnavailable?: boolean;
  ownerHandoff?: readonly OwnerHandoffRow[];
  ownerHandoffUnavailable?: boolean;
  advisorSignals?: readonly AdvisorAttentionRow[];
  advisorUnavailable?: boolean;
  advisorEnabled?: boolean;
}) {
  return (
    <section className="rounded-2xl border border-[#D6C7AD]/85 bg-[#FFFDF7] p-4 shadow-[0_10px_28px_-16px_rgba(31,36,28,0.2)] sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Image
            src="/logo-clean.png"
            alt="Leonix"
            width={48}
            height={48}
            className="h-8 w-8 shrink-0 object-contain sm:h-12 sm:w-12"
            priority
          />
          <div className="min-w-0">
            <p className="font-serif text-lg font-bold leading-tight tracking-tight text-[#1E1810] sm:text-2xl">
              Leonix Business Concierge
            </p>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8A6B1F]">Staff Command Center</p>
          </div>
        </div>
        <BusinessConciergeInstallBanner />
      </div>

      {summaryUnavailable ? (
        <p className="mt-4 rounded-xl border border-[#E8DFD0] bg-white px-3 py-3 text-xs text-[#7A7164]">
          Command Center summary is unavailable right now. Business inventory below is still available.
        </p>
      ) : (
        <>
          <div className="mt-4">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A6B1F]">Today</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              <TodayChip label="Follow-ups due today" count={home.dueFollowUps.length} />
              <TodayChip label="Overdue follow-ups" count={home.overdueFollowUps.length} />
            </div>
            {home.dueFollowUps.length === 0 && home.overdueFollowUps.length === 0 ? (
              <p className="mt-2 text-xs text-[#7A7164]">Nothing due right now.</p>
            ) : null}
          </div>

          <div className="mt-4">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A6B1F]">Needs attention</h2>
            {home.attentionBusinesses.length === 0 ? (
              <p className="mt-2 text-xs text-[#7A7164]">No businesses need immediate follow-up.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {home.attentionBusinesses.map((item) => (
                  <li key={item.businessId}>
                    <Link
                      href={`/admin/businesses/${item.businessId}#outreach`}
                      className="flex min-h-[44px] items-center justify-between gap-3 rounded-xl border border-[#E8DFD0] bg-white px-3 py-2"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-[#1E1810]">{item.displayName}</span>
                        <span className="block text-[11px] text-[#7A7164]">
                          {ATTENTION_COPY[item.reason]}
                          {item.followUpDate ? ` · ${item.followUpDate}` : ""}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs font-semibold text-[#7A1E2C]">Open</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {advisorEnabled ? (
        <div className="mt-4">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A6B1F]">Advisor</h2>
          {advisorUnavailable ? (
            <p className="mt-2 text-xs text-[#7A7164]">Advisor signals are unavailable right now. Follow-ups and inventory below are still available.</p>
          ) : advisorSignals.length === 0 ? (
            <p className="mt-2 text-xs text-[#7A7164]">No active advisor signals.</p>
          ) : (
            <>
              <p className="mt-1 text-xs text-[#3D3428]">
                {advisorSignals.length} active advisor signal{advisorSignals.length === 1 ? "" : "s"} from canonical Program 7 truth. This is not a second notification store.
              </p>
              <ul className="mt-2 space-y-2">
                {advisorSignals.map((row) => {
                  const anchor = advisorSignalDashboardAnchor(row.signalType as AdvisorSignalType);
                  return (
                    <li key={row.signalId}>
                      <Link
                        href={`/admin/businesses/${row.businessId}${anchor}`}
                        className="flex min-h-[44px] flex-col justify-center gap-0.5 rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <span className="min-w-0">
                          <span className="block break-words text-sm font-semibold text-[#1E1810]">{row.displayName}</span>
                          <span className="block break-words text-[11px] text-[#7A7164]">
                            Advisor · {row.signalType} · {row.severity}
                            {row.titleEn ? ` · ${row.titleEn}` : ""}
                          </span>
                        </span>
                        <span className="shrink-0 text-xs font-semibold text-[#7A1E2C]">Open</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      ) : null}

      <div className="mt-4">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A6B1F]">Owner Handoff</h2>
        {ownerHandoffUnavailable ? (
          <p className="mt-2 text-xs text-[#7A7164]">Owner Handoff is unavailable right now. Follow-ups and inventory below are still available.</p>
        ) : ownerHandoff.length === 0 ? (
          <p className="mt-2 text-xs text-[#7A7164]">No accepted proposals are waiting for owner handoff.</p>
        ) : (
          <>
            <p className="mt-1 text-xs text-[#3D3428]">
              {ownerHandoff.length} accepted proposal{ownerHandoff.length === 1 ? "" : "s"} need attention. Accepted is not signed, paid, or published.
            </p>
            <ul className="mt-2 space-y-2">
              {ownerHandoff.map((row) => (
                <li key={row.proposalId}>
                  <Link
                    href={`/admin/businesses/${row.businessId}#proposals`}
                    className="flex min-h-[44px] flex-col justify-center gap-0.5 rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="min-w-0">
                      <span className="block break-words text-sm font-semibold text-[#1E1810]">{row.displayName}</span>
                      <span className="block break-words text-[11px] text-[#7A7164]">
                        Proposal v{row.version} · accepted
                        {row.acceptedAt ? ` · ${new Date(row.acceptedAt).toLocaleDateString()}` : ""}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-[#7A1E2C]">Open</span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="mt-4">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A6B1F]">Quick actions</h2>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <a href="#businesses-inventory" className={`${adminBtnPrimary} min-h-[44px]`}>
            Find business
          </a>
          <Link href="/admin/businesses/canvass" className={`${adminBtnSecondary} min-h-[44px] border-[#C9A84A]/70`}>
            Add prospect
          </Link>
          <Link
            href="/admin/field"
            className={`${adminBtnSecondary} min-h-[44px] flex-col gap-0.5 border-[#C9A84A]/70 py-2 text-[#7A1E2C]`}
          >
            <span>Field Agent</span>
            <span className="text-[10px] font-normal text-[#7A7164]">Quick capture in the field.</span>
          </Link>
        </div>
      </div>

      {!summaryUnavailable && home.recentBusinesses.length > 0 ? (
        <div className="mt-4">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A6B1F]">Recent businesses</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {home.recentBusinesses.map((item) => (
              <li key={item.businessId}>
                <Link
                  href={`/admin/businesses/${item.businessId}`}
                  className="inline-flex min-h-[40px] items-center rounded-full border border-[#E8DFD0] bg-white px-3 py-1.5 text-xs font-semibold text-[#1E1810]"
                >
                  {item.displayName}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
