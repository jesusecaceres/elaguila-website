import Image from "next/image";
import Link from "next/link";
import { adminBtnPrimary, adminBtnSecondary } from "../../_components/adminTheme";
import { BusinessConciergeInstallBanner } from "./BusinessConciergeInstallBanner";
import { LeonixServiceWorkerRegister } from "@/app/components/digitalContact/LeonixServiceWorkerRegister";
import type { StaffConciergeAttentionEntry, StaffConciergeHome } from "../../_lib/staffConciergeHome";
import type { StaffOperatingSystem, StaffOsLink } from "../../_lib/staffOperatingSystem";
import { advisorSignalDashboardAnchor } from "@/app/lib/business/advisor/logic";
import type { AdvisorSignalType } from "@/app/lib/business/advisor/types";
import type { ProposalAwaitingDecisionRow } from "@/app/lib/business/proposals/repository";
import type { UpcomingMeetingAttentionRow } from "@/app/lib/business/meetingStudio/repository";
import type { CommitmentAttentionRow } from "@/app/lib/business/promiseKeeper/repository";
import type { CreativeAttentionRow } from "@/app/lib/business/creativeStudio/repository";

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

function TodayChip({ label, count }: { label: string; count: number }) {
  return (
    <div className="min-w-[7.5rem] flex-1 rounded-xl border border-[#E8DFD0] bg-[#FFFDF7] px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8A6B1F]">{label}</p>
      <p className="mt-0.5 font-serif text-2xl font-bold tabular-nums text-[#1E1810]">{count}</p>
    </div>
  );
}

function AttentionList({ items }: { items: readonly StaffConciergeAttentionEntry[] }) {
  if (items.length === 0) {
    return <p className="mt-2 text-xs text-[#7A7164]">Ningún negocio necesita atención inmediata en este momento. / No businesses need immediate attention right now.</p>;
  }
  return (
    <ul className="mt-2 space-y-2">
      {items.map((item) => (
        <li key={`${item.businessId}-${item.reasonLabel}`}>
          <Link
            href={item.href}
            className="flex min-h-[44px] flex-col justify-center gap-0.5 rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-[#1E1810]">{item.displayName}</span>
              <span className="block truncate text-[11px] text-[#7A7164]">
                {item.reasonLabel}
                {item.detailText ? ` · ${item.detailText}` : ""}
              </span>
            </span>
            <span className="shrink-0 text-xs font-semibold text-[#7A1E2C]">Open</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function OsLinkButton({ link }: { link: StaffOsLink }) {
  const cls = link.primary
    ? `${adminBtnPrimary} min-h-[56px] flex-col gap-0.5 py-2`
    : `${adminBtnSecondary} min-h-[44px] flex-col gap-0.5 border-[#C9A84A]/70 py-2`;
  const hintCls = link.primary ? "text-[10px] font-normal text-white/80" : "text-[10px] font-normal text-[#7A7164]";
  const body = (
    <>
      <span>{link.label}</span>
      {link.hint ? <span className={hintCls}>{link.hint}</span> : null}
    </>
  );
  // In-page anchors (Find business) stay plain <a> so the hash scroll works without a router hop.
  return link.href.startsWith("#") ? (
    <a href={link.href} className={cls}>{body}</a>
  ) : (
    <Link href={link.href} className={cls}>{body}</Link>
  );
}

function OsGroup({
  title,
  links,
  columns = "grid-cols-1 sm:grid-cols-2",
  children,
}: {
  title: string;
  links: readonly StaffOsLink[];
  columns?: string;
  /** Page-local controls (in-page anchors) that are not role-routed, rendered first. */
  children?: React.ReactNode;
}) {
  if (links.length === 0 && !children) return null;
  return (
    <div className="mt-3 rounded-2xl border border-[#E8DFD0] bg-white p-4">
      <h2 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A6B1F]">{title}</h2>
      <div className={`mt-2 grid gap-2 ${columns}`}>
        {children}
        {links.map((link) => (
          <OsLinkButton key={link.key} link={link} />
        ))}
      </div>
    </div>
  );
}

export function StaffCommandCenter({
  os,
  home,
  summaryUnavailable = false,
  needsAttention = [],
  ownerHandoff = [],
  ownerHandoffUnavailable = false,
  advisorSignals = [],
  advisorUnavailable = false,
  advisorEnabled = false,
  proposalsAwaitingDecision = [],
  upcomingMeetings = [],
  commitmentsAttention = [],
  creativeAwaitingReview = [],
}: {
  /** Role-aware wire map (app/admin/_lib/staffOperatingSystem.ts) — composed server-side from the strict actor. */
  os: StaffOperatingSystem;
  home: StaffConciergeHome;
  summaryUnavailable?: boolean;
  needsAttention?: readonly StaffConciergeAttentionEntry[];
  ownerHandoff?: readonly OwnerHandoffRow[];
  ownerHandoffUnavailable?: boolean;
  advisorSignals?: readonly AdvisorAttentionRow[];
  advisorUnavailable?: boolean;
  advisorEnabled?: boolean;
  proposalsAwaitingDecision?: readonly ProposalAwaitingDecisionRow[];
  upcomingMeetings?: readonly UpcomingMeetingAttentionRow[];
  commitmentsAttention?: readonly CommitmentAttentionRow[];
  creativeAwaitingReview?: readonly CreativeAttentionRow[];
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
            <p className="font-serif text-xl font-bold leading-tight tracking-tight text-[#1E1810] sm:text-3xl">
              Leonix Business Concierge
            </p>
            <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#9A8B6A]">Centro de Comando del Personal / Staff Command Center</p>
            <p className="mt-0.5 text-[11px] font-semibold text-[#5C5346]">{os.personaLabel}</p>
          </div>
        </div>
        <BusinessConciergeInstallBanner />
        {/* Gate 14 — the PWA start_url is this page, but the one canonical service worker
            (public/sw.js, scope "/") was only ever registered from Doorbell / the owner console. Registering it
            here too means a device that installs from the staff home actually gets the /offline
            fallback; same worker, same file, no second registration path. */}
        <LeonixServiceWorkerRegister />
      </div>

      {summaryUnavailable ? (
        <p className="mt-4 rounded-xl border border-[#E8DFD0] bg-white px-3 py-3 text-xs text-[#7A7164]">
          El resumen del Centro de Comando no está disponible en este momento. El inventario de negocios abajo sigue disponible. / Command Center summary is unavailable right now. Business inventory below is still available.
        </p>
      ) : (
        <>
          <div className="mt-3 rounded-2xl border border-[#E8DFD0] bg-white p-4">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A6B1F]">Hoy / Today</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              <TodayChip label="Seguimientos vencidos hoy / Follow-ups due today" count={home.dueFollowUps.length} />
              <TodayChip label="Seguimientos atrasados / Overdue follow-ups" count={home.overdueFollowUps.length} />
              <TodayChip label="Reuniones / Meetings" count={upcomingMeetings.length} />
              <TodayChip label="Compromisos vencidos/bloqueados / Commitments due/blocked" count={commitmentsAttention.length} />
              <TodayChip label="Propuestas en espera de decisión / Proposals awaiting decision" count={proposalsAwaitingDecision.length} />
              <TodayChip label="Creativo en revisión / Creative awaiting review" count={creativeAwaitingReview.length} />
            </div>
            {home.dueFollowUps.length === 0 &&
            home.overdueFollowUps.length === 0 &&
            upcomingMeetings.length === 0 &&
            commitmentsAttention.length === 0 &&
            proposalsAwaitingDecision.length === 0 &&
            creativeAwaitingReview.length === 0 ? (
              <p className="mt-2 text-xs text-[#7A7164]">Nada pendiente en este momento. / Nothing due right now.</p>
            ) : null}
          </div>

          <div className="mt-3 rounded-2xl border border-[#E8DFD0] bg-white p-4">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A6B1F]">Necesita atención / Needs attention</h2>
            <AttentionList items={needsAttention} />
          </div>
        </>
      )}

      {advisorEnabled ? (
        <div className="mt-3 rounded-2xl border border-[#E8DFD0] bg-white p-4">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A6B1F]">Asesor / Advisor</h2>
          {advisorUnavailable ? (
            <p className="mt-2 text-xs text-[#7A7164]">Las señales del asesor no están disponibles en este momento. Los seguimientos y el inventario abajo siguen disponibles. / Advisor signals are unavailable right now. Follow-ups and inventory below are still available.</p>
          ) : advisorSignals.length === 0 ? (
            <p className="mt-2 text-xs text-[#7A7164]">No hay señales activas del asesor. / No active advisor signals.</p>
          ) : (
            <>
              <p className="mt-1 text-xs text-[#3D3428]">
                {advisorSignals.length} active advisor signal{advisorSignals.length === 1 ? "" : "s"} from canonical Program 7 truth. Esto no es un segundo almacén de notificaciones. / This is not a second notification store.
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

      <div className="mt-3 rounded-2xl border border-[#E8DFD0] bg-white p-4">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A6B1F]">Entrega al Dueño / Owner Handoff</h2>
        {ownerHandoffUnavailable ? (
          <p className="mt-2 text-xs text-[#7A7164]">La Entrega al Dueño no está disponible en este momento. Los seguimientos y el inventario abajo siguen disponibles. / Owner Handoff is unavailable right now. Follow-ups and inventory below are still available.</p>
        ) : ownerHandoff.length === 0 ? (
          <p className="mt-2 text-xs text-[#7A7164]">No hay propuestas aceptadas esperando entrega al dueño. / No accepted proposals are waiting for owner handoff.</p>
        ) : (
          <>
            <p className="mt-1 text-xs text-[#3D3428]">
              {ownerHandoff.length} accepted proposal{ownerHandoff.length === 1 ? "" : "s"} need attention. Aceptado no es firmado, pagado ni publicado. / Accepted is not signed, paid, or published.
            </p>
            <ul className="mt-2 space-y-2">
              {ownerHandoff.map((row) => (
                <li key={row.proposalId}>
                  <Link
                    href={`/admin/businesses/${row.businessId}#owner-handoff`}
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

      {/* Staff Operating System — the day-in-the-life groups. Links come from ONE role-aware
          composer (app/admin/_lib/staffOperatingSystem.ts) so a sales_rep is never handed a
          /admin/workspace or /admin/ops link the dashboard layout would bounce. Every search-first
          action still carries its intent through ?action= (conciergeIntent.ts). Same admin button
          styles, no new visual system, no new permission. TODAY is the block above. */}
      <OsGroup title="Trabajo con clientes / Client work" links={os.clientWork}>
        {/* Page-local anchor — the inventory below IS the "find" step, so this one link stays a
            plain in-page anchor (the only bare #businesses-inventory hand-off on the home). */}
        <a href="#businesses-inventory" className={`${adminBtnSecondary} min-h-[44px] flex-col gap-0.5 border-[#C9A84A]/70 py-2`}>
          <span>Buscar negocio / Find business</span>
          <span className="text-[10px] font-normal text-[#7A7164]">Inventario de identidades confirmadas, abajo. / Confirmed-identity inventory, below.</span>
        </a>
        {/* Every Sales Workspace role holds conduct_canvassing + view_field_discovery, so these two
            stay literal (existing Gate 01 pins them). */}
        <Link href="/admin/businesses/canvass" className={`${adminBtnSecondary} min-h-[44px] border-[#C9A84A]/70`}>
          Agregar prospecto / Add prospect
        </Link>
        <Link href="/admin/field" className={`${adminBtnSecondary} min-h-[44px] border-[#C9A84A]/70`}>
          Agente de Campo / Field Agent
        </Link>
      </OsGroup>
      <OsGroup title="Comercial / Commercial" links={os.commercial} />
      <OsGroup title="Comunicación con clientes / Customer communication" links={os.customerCommunication} />
      <OsGroup title="Mi Leonix / My Leonix" links={os.myLeonix} columns="grid-cols-2 sm:grid-cols-3" />
      {os.restricted.length > 0 ? (
        <details className="mt-3 rounded-2xl border border-[#E8DFD0] bg-[#FBF7EF] p-4">
          <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A6B1F]">
            No disponible para su rol / Not available for your role ({os.restricted.length})
          </summary>
          <ul className="mt-2 space-y-1">
            {os.restricted.map((r) => (
              <li key={r.key} className="text-xs text-[#5C5346]">
                <span className="font-semibold text-[#1E1810]">{r.label}</span> — {r.reason}
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      {!summaryUnavailable && (home.recentBusinesses.length > 0 || upcomingMeetings.length > 0) ? (
        <div className="mt-3 grid grid-cols-1 gap-4 rounded-2xl border border-[#E8DFD0] bg-white p-4 lg:grid-cols-2">
          {home.recentBusinesses.length > 0 ? (
            <div>
              <h2 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A6B1F]">Negocios recientes / Recent businesses</h2>
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

          {upcomingMeetings.length > 0 ? (
            <div>
              <h2 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A6B1F]">Próximo / Upcoming</h2>
              <ul className="mt-2 space-y-1.5">
                {upcomingMeetings.slice(0, 5).map((row) => (
                  <li key={row.meetingId}>
                    <Link
                      href={`/admin/businesses/${row.businessId}#meetings`}
                      className="flex min-h-[40px] items-center justify-between gap-2 rounded-lg border border-[#E8DFD0] bg-white px-3 py-1.5 text-xs"
                    >
                      <span className="truncate font-semibold text-[#1E1810]">{row.displayName}</span>
                      <span className="shrink-0 text-[#7A7164]">
                        {new Date(row.scheduledAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
