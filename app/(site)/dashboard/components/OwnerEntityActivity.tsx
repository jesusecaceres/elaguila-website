"use client";

/**
 * Owner Command Center — Package 3, Gate 3A. Canonical listing-scoped activity feed.
 *
 * Presentation only — accepts already-fetched, already-real activity records (leads,
 * applications, requests). It never fetches, never invents an actor/date/status the source
 * data doesn't truthfully carry, and never parses free-text content into structured fields
 * unless the caller has already done so from a deterministic, proven source shape. If a
 * field isn't real for a given record, omit it — do not render a placeholder dash where the
 * underlying data has no equivalent.
 */
import { DashboardListingActionBar, type ActionItem } from "./DashboardListingActionBar";

export type OwnerEntityActivityItem = {
  id: string;
  actor?: string | null;
  date: string;
  contactHref?: string | null;
  contactLabel?: string | null;
  message: string;
  status?: string | null;
  /** Real, already-wired owner actions for this activity row (e.g. application status). */
  actions?: ActionItem[];
};

export function OwnerEntityActivity({
  title,
  items,
  emptyLabel,
  lang,
}: {
  title: string;
  items: OwnerEntityActivityItem[];
  emptyLabel?: string;
  lang: "es" | "en";
}) {
  if (items.length === 0 && !emptyLabel) return null;
  return (
    <section aria-label={title}>
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8A6B1F]">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-2 text-xs text-[#9A9084]">{emptyLabel}</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {items.map((item) => (
            <li key={item.id} className="rounded-xl border border-[#D6C7AD]/70 bg-[#FBF7EF]/70 p-3">
              <p className="text-[11px] font-mono text-[#7A7164]">
                {new Date(item.date).toLocaleString(lang === "es" ? "es-US" : "en-US")}
              </p>
              {item.actor || item.contactHref ? (
                <p className="mt-0.5 text-sm font-semibold text-[#1E1810]">
                  {item.actor ?? ""}
                  {item.actor && item.contactHref ? " · " : ""}
                  {item.contactHref ? (
                    <a href={item.contactHref} className="text-[#7A1E2C] underline">
                      {item.contactLabel ?? item.contactHref}
                    </a>
                  ) : null}
                </p>
              ) : null}
              <p className="mt-1 whitespace-pre-wrap text-sm text-[#5C5346]">{item.message}</p>
              {item.status ? (
                <span className="mt-1 inline-block rounded-full border border-[#D6C7AD]/70 bg-[#FFFDF7] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#5C5346]">
                  {item.status}
                </span>
              ) : null}
              {item.actions && item.actions.length > 0 ? (
                <div className="mt-2">
                  <DashboardListingActionBar actions={item.actions} />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
