"use client";

/**
 * Owner Command Center — Package 3, Gate 3A. Canonical Owner Entity Workspace.
 *
 * The one structural component every owner-manageable entity's management experience is
 * built from. It owns layout, section order, spacing, responsive behavior, and semantic
 * action placement — it owns NOTHING about data. A category page becomes a data
 * adapter/composer: it fetches its own real rows (unchanged from before this gate), reads
 * `app/(site)/dashboard/lib/ownerEntityCapabilityRegistry.ts` to decide which sections are
 * truthful for that category, and passes already-resolved props in. Route truth stays with
 * `categoryRouteRegistry.ts`/`dashboardActionResolver.ts` — this component never builds a
 * href itself.
 *
 * Canonical section order (Master Blueprint Part 2): header → identity detail → performance
 * → Community Trust → external reputation → primary operation → quick view → lifecycle →
 * specialized tools → activity. A section is omitted, not rendered empty, when its data is
 * absent — never decoration to preserve visual symmetry.
 */
import { Fragment, type ReactNode } from "react";
import { DashboardListingActionBar, type ActionItem } from "./DashboardListingActionBar";
import { DashboardMobileActionSheet } from "./DashboardMobileActionSheet";
import { OwnerEntityHeader } from "./OwnerEntityHeader";
import { OwnerEntityDetailGrid, type OwnerEntityDetailItem } from "./OwnerEntityDetailGrid";
import { OwnerEntityPerformance, type OwnerEntityMetric } from "./OwnerEntityPerformance";
import { OwnerEntityCommunityTrust, type OwnerCommunityTrustEntry } from "./OwnerEntityCommunityTrust";
import { OwnerEntityExternalReputation, type OwnerExternalReviewLink } from "./OwnerEntityExternalReputation";
import { OwnerEntitySpecializedTools } from "./OwnerEntitySpecializedTools";
import { OwnerEntityActivity, type OwnerEntityActivityItem } from "./OwnerEntityActivity";

type Lang = "es" | "en";

/** One titled specialized-tools group (gold role) — e.g. "Cupones y ofertas", "Inventario",
 * "Herramientas de negocio". `specialized` accepts either one of these (existing single-group
 * callers keep working unchanged) or an array of these (new multi-group callers), so a category
 * page's own tools (coupons, inventory, applications) and a Business Tools doorway can coexist
 * without forking into a second workspace shell or replacing each other. */
export type OwnerEntitySpecializedGroup = { title: string; actions: ActionItem[]; children?: ReactNode };

export function OwnerEntityWorkspace({
  lang,
  header,
  detailItems,
  performance,
  communityTrust,
  externalReputation,
  primaryAction,
  quickActions = [],
  lifecycleActions = [],
  specialized,
  activity,
  mobileSheetLabels,
  note,
  footerHint,
}: {
  lang: Lang;
  header: {
    eyebrow: string;
    title: string;
    subtitle?: string;
    statusLabel: string;
    statusChipClass: string;
    plan?: string | null;
    leonixId?: string | null;
    badges?: string[];
    createAction?: { label: string; href: string } | null;
  };
  detailItems?: OwnerEntityDetailItem[];
  performance?: { title: string; metrics: OwnerEntityMetric[] };
  communityTrust?: { title: string; helperText: string; entries: OwnerCommunityTrustEntry[] | null };
  externalReputation?: { title: string; links: OwnerExternalReviewLink[] };
  primaryAction: ActionItem;
  quickActions?: ActionItem[];
  lifecycleActions?: ActionItem[];
  /** Backward-compatible: pass a single group exactly as before, or an array of groups when a
   * category needs more than one (e.g. its own tools plus a Business Tools doorway). Empty
   * groups (no actions, no children) are omitted automatically — never rendered as decoration. */
  specialized?: OwnerEntitySpecializedGroup | OwnerEntitySpecializedGroup[];
  activity?: { title: string; items: OwnerEntityActivityItem[]; emptyLabel?: string; id?: string };
  mobileSheetLabels: { trigger: string; title: string; close: string };
  /** Real, server-resolved attention/lifecycle note (e.g. "Requires urgent attention") — never
   * a fabricated status. Omit when there is nothing truthful to say. */
  note?: { text: string; tone: "urgent" | "warning" | "neutral" } | null;
  /** Short muted disclaimer line at the bottom of the card (e.g. plan footnote, add-on hint). */
  footerHint?: string | null;
}) {
  const primary: ActionItem = { ...primaryAction, tone: "primary" };
  // Deterministic order: whatever order the caller listed groups in (single-group callers are
  // unaffected — Array.isArray(specialized) is false, so this is just [specialized]). A group
  // with no actions and no children is dropped here, once, so every consumer below (the mobile
  // sheet's overflow list included) already only sees real, renderable groups.
  const specializedGroups: OwnerEntitySpecializedGroup[] = (
    specialized ? (Array.isArray(specialized) ? specialized : [specialized]) : []
  ).filter((group) => group.actions.length > 0 || Boolean(group.children));
  const overflowActions: ActionItem[] = [
    ...quickActions,
    ...lifecycleActions,
    ...specializedGroups.flatMap((group) => group.actions),
  ];

  return (
    <div className="rounded-3xl border border-[#D6C7AD]/85 bg-[#FFFDF7] p-5 shadow-[0_10px_32px_-16px_rgba(31,36,28,0.1)] ring-1 ring-[#C9A84A]/10 sm:p-6">
      <div className="flex flex-col gap-4">
        <OwnerEntityHeader {...header} />

        {note ? (
          <p
            className={`-mt-2 text-xs font-semibold ${
              note.tone === "urgent" ? "text-red-700" : note.tone === "warning" ? "text-amber-800" : "text-[#7A7164]"
            }`}
          >
            {note.text}
          </p>
        ) : null}

        <OwnerEntityDetailGrid items={detailItems ?? []} />

        {performance ? <OwnerEntityPerformance title={performance.title} metrics={performance.metrics} /> : null}

        {communityTrust ? (
          <OwnerEntityCommunityTrust
            title={communityTrust.title}
            helperText={communityTrust.helperText}
            entries={communityTrust.entries}
          />
        ) : null}

        {externalReputation ? (
          <OwnerEntityExternalReputation title={externalReputation.title} links={externalReputation.links} />
        ) : null}

        {/* Primary operation — always visible, every breakpoint. */}
        <div>
          <DashboardListingActionBar actions={[primary]} />
        </div>

        {/* Quick view + lifecycle + specialized — inline on md:+, collapsed into the shared
            mobile sheet below md: (never a second, bespoke drawer implementation). */}
        {quickActions.length > 0 ? (
          <div className="hidden md:block">
            <DashboardListingActionBar actions={quickActions} />
          </div>
        ) : null}
        {lifecycleActions.length > 0 ? (
          <div className="hidden md:block">
            <DashboardListingActionBar actions={lifecycleActions} />
          </div>
        ) : null}
        {specializedGroups.map((group, index) => (
          // Fragment (no wrapping element) — each group's action-bar and children stay direct
          // children of the flex column above, exactly as the single-group shape always was, so
          // existing single-group callers get byte-identical spacing/layout.
          <Fragment key={`${group.title}-${index}`}>
            {group.actions.length > 0 ? (
              <div className="hidden md:block">
                <OwnerEntitySpecializedTools title={group.title} actions={group.actions} />
              </div>
            ) : null}
            {group.children ? (
              <section aria-label={group.title}>
                {group.actions.length === 0 ? (
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8A6B1F]">{group.title}</h3>
                ) : (
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8A6B1F] md:hidden">{group.title}</h3>
                )}
                <div className="mt-2">{group.children}</div>
              </section>
            ) : null}
          </Fragment>
        ))}
        {overflowActions.length > 0 ? (
          <DashboardMobileActionSheet
            triggerLabel={mobileSheetLabels.trigger}
            sheetTitle={mobileSheetLabels.title}
            closeLabel={mobileSheetLabels.close}
            actions={overflowActions}
          />
        ) : null}

        {activity ? (
          <OwnerEntityActivity title={activity.title} items={activity.items} emptyLabel={activity.emptyLabel} lang={lang} id={activity.id} />
        ) : null}

        {footerHint ? <p className="text-[11px] leading-relaxed text-[#9A9084]">{footerHint}</p> : null}
      </div>
    </div>
  );
}
