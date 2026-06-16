"use client";

import Link from "next/link";
import {
  isAdminCategoryClientReady,
  isAdminCategoryScaffoldEntry,
  type AdminCategoriesHubEntry,
} from "@/app/admin/_lib/adminCategoriesHubEntries";
import { getCategorySchema } from "@/app/clasificados/config/categorySchema";
import {
  adminCategoryLiveListingsAvailable,
  adminCategoryLiveListingsCtaLabel,
  getAdminCategoryBlockerText,
  getAdminCategoryStatusProof,
  getAdminCategoryStatusReason,
} from "@/app/admin/_lib/adminCategoryStatusTruth";
import { ADMIN_CATEGORIES_ADVANCED_REGISTRY_HREF } from "@/app/admin/_lib/adminGlobalNav";
import {
  adminCategoryWorkspaceQueueHref,
  adminCategoryOpenQueueCtaCopy,
  adminCategoryOperationalStatusLabel,
  adminCategoryWorkspaceLiveListingsHref,
} from "@/app/admin/_lib/adminCategoryWorkspaceQueueHref";

import { getClassifiedsOpsContract } from "@/app/admin/_lib/classifiedsOpsContract";
import type { AdminLang } from "@/app/admin/_lib/adminI18nCookie";
import { adminMessages } from "@/app/admin/_lib/adminStrings";
import {
  adminCardBase,
  adminDashboardCtaActive,
  adminDashboardCtaNeutral,
  adminDashboardCtaPremium,
  adminDashboardCtaPrimary,
  adminDashboardCtaView,
  adminDashboardMetricChip,
  adminLinkAccent,
} from "@/app/admin/_components/adminTheme";

export function queueHrefForEntry(entry: AdminCategoriesHubEntry): string {
  const ops = getClassifiedsOpsContract(entry.slug);
  return ops?.adQueueAdminPath ?? adminCategoryWorkspaceQueueHref(entry.slug);
}

function planSummary(plans: string[]): string {
  if (!plans.length) return "—";
  return plans.join(" · ");
}

function statusChipClass(status: AdminCategoriesHubEntry["operationalStatus"]): string {
  if (status === "live") return "border-[#2A4536]/40 bg-[#F4FAF2] text-[#2A4536]";
  if (status === "staged" || status === "coming_soon") return "border-[#C9782F]/40 bg-[#FFF3E6] text-[#8A4B12]";
  return "border-[#E8DFD0] bg-[#FAF7F2] text-[#5C5346]";
}

export function ClasificadosCategoryStatusChip({ entry }: { entry: AdminCategoriesHubEntry }) {
  return (
    <span className={`rounded-lg border px-2 py-0.5 text-[10px] font-bold uppercase ${statusChipClass(entry.operationalStatus)}`}>
      {adminCategoryOperationalStatusLabel(entry.operationalStatus)}
    </span>
  );
}

export function ClasificadosCategorySelectedPanel({
  entry,
  lang,
  showRegistryLink = true,
}: {
  entry: AdminCategoriesHubEntry;
  lang: AdminLang;
  showRegistryLink?: boolean;
}) {
  const m = adminMessages(lang);
  const schema = getCategorySchema(entry.slug);
  const ops = getClassifiedsOpsContract(entry.slug);
  const proof = getAdminCategoryStatusProof(entry);
  const statusReason = getAdminCategoryStatusReason(entry, lang);
  const blocker = getAdminCategoryBlockerText(entry, lang);
  const isScaffold = isAdminCategoryScaffoldEntry(entry);
  const isClientReady = isAdminCategoryClientReady(entry);
  const queueHref = queueHrefForEntry(entry);
  const liveHref = adminCategoryWorkspaceLiveListingsHref(entry.slug);
  const liveAvailable = adminCategoryLiveListingsAvailable(entry);
  const queueCta = adminCategoryOpenQueueCtaCopy(lang);
  const compact = "!min-h-[44px] sm:!min-h-[42px]";

  return (
    <article
      className={`${adminCardBase} min-w-0 border-[#C9B46A]/35 p-5 sm:p-6`}
      data-testid="clasificados-category-selected-panel"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#E8DFD0]/70 pb-4">
        <div className="min-w-0">
          <p className="text-3xl leading-none" aria-hidden>
            {entry.emoji}
          </p>
          <h3 className="mt-2 text-xl font-bold text-[#1E1810]">{entry.displayNameEs}</h3>
          <p className="mt-0.5 font-mono text-xs text-[#7A7164]">{entry.slug}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ClasificadosCategoryStatusChip entry={entry} />
          {isScaffold ? (
            <span className="rounded-lg border border-rose-300 bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-900">
              {m("hub.scaffoldBadge")}
            </span>
          ) : isClientReady ? (
            <span className="rounded-lg border border-[#2A4536]/40 bg-[#F4FAF2] px-2 py-0.5 text-[10px] font-bold uppercase text-[#2A4536]">
              {m("hub.clientReadyBadge")}
            </span>
          ) : (
            <span className="rounded-lg border border-[#C9782F]/40 bg-[#FFF3E6] px-2 py-0.5 text-[10px] font-bold uppercase text-[#8A4B12]">
              {m("hub.partialBadge")}
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-[#E8DFD0]/80 bg-[#FAF7F2]/90 p-3" data-testid="clasificados-category-status-reason">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">{m("hub.statusWhyTitle")}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-[#3D3629]">{statusReason}</p>
        {blocker ? (
          <p className="mt-2 text-xs leading-relaxed text-[#8A4B12]">
            <span className="font-bold">Blocker:</span> {blocker}
          </p>
        ) : null}
      </div>

      <p className="mt-3 text-sm leading-relaxed text-[#5C5346]">{entry.notes || "—"}</p>

      <dl className="mt-4 grid gap-2 text-sm text-[#5C5346] sm:grid-cols-2">
        <div>
          <dt className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">{m("hub.readiness")}</dt>
          <dd className="mt-0.5 font-semibold text-[#3D3629]">{entry.readiness}</dd>
        </div>
        {schema ? (
          <>
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">{m("hub.plans")}</dt>
              <dd className="mt-0.5">{planSummary(schema.plans)}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">{m("hub.fields")}</dt>
              <dd className="mt-0.5 break-words">
                {m("hub.fieldGroup")}{" "}
                <code className="rounded bg-[#FFFCF7] px-1 text-xs">{schema.formFieldGroupKey ?? "—"}</code>
              </dd>
            </div>
          </>
        ) : (
          <div className="sm:col-span-2">
            <dt className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">{m("hub.schema")}</dt>
            <dd className="mt-0.5">{m("hub.schemaOpsOnly")}</dd>
          </div>
        )}
        {proof.sourceTable ? (
          <div className="sm:col-span-2">
            <dt className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">Source</dt>
            <dd className="mt-0.5 font-mono text-xs leading-snug text-[#3D3428]">
              {proof.sourceTable}
              {proof.opsKind ? ` · ${proof.opsKind}` : ""}
            </dd>
          </div>
        ) : null}
      </dl>

      <div className="mt-4 rounded-lg border border-[#C9B46A]/30 bg-[#FFFCF7]/90 p-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">{m("hub.routesTitle")}</p>
        <ul className="mt-2 space-y-1.5 font-mono text-[11px] text-[#5C5346]">
          <li>
            <span className="font-bold text-[#7A7164]">{m("hub.routeQueue")}:</span> {proof.queueRoute}
          </li>
          <li>
            <span className="font-bold text-[#7A7164]">{m("hub.routeLive")}:</span> {proof.liveRoute}
          </li>
          <li>
            <span className="font-bold text-[#7A7164]">{m("hub.routePublic")}:</span>{" "}
            <Link href={proof.publicRoute} className={adminLinkAccent} target="_blank" rel="noopener noreferrer">
              {proof.publicRoute}
            </Link>
          </li>
        </ul>
      </div>

      <div className="mt-5 grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2" data-testid="clasificados-category-cta-grid">
        <Link href={queueHref} className={`${adminDashboardCtaPrimary} ${compact}`} title={queueCta.title}>
          {queueCta.label} →
        </Link>
        {liveAvailable ? (
          <Link href={liveHref} className={`${adminDashboardCtaActive} ${compact}`} title={m("hub.liveListingsCtaTitle")}>
            {adminCategoryLiveListingsCtaLabel(entry, lang)} →
          </Link>
        ) : (
          <span
            className={`${adminDashboardCtaNeutral} ${compact} cursor-not-allowed opacity-60`}
            title={m("listingsCategoryOps.liveNotWiredTitle")}
          >
            {m("hub.liveListingsUnavailable")}
          </span>
        )}
        <Link
          href={entry.landingTarget}
          className={`${adminDashboardCtaView} ${compact}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          View public category →
        </Link>
        {showRegistryLink ? (
          <Link href={ADMIN_CATEGORIES_ADVANCED_REGISTRY_HREF} className={`${adminDashboardCtaPremium} ${compact}`}>
            {m("hub.categoriesRegistry")}
          </Link>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-[#E8DFD0]/70 pt-4 text-sm">
        {ops ? (
          <>
            <Link href={ops.fieldsNotesAdminPath} className={adminLinkAccent}>
              {m("hub.editorOther")}
            </Link>
            <Link href={ops.operationalSpaceAdminPath} className={adminLinkAccent}>
              {m("hub.opsSpace")}
            </Link>
          </>
        ) : (
          <>
            <Link
              href={`/admin/workspace/clasificados/category/${encodeURIComponent(entry.slug)}#contenido`}
              className={adminLinkAccent}
            >
              {m("hub.editorOther")}
            </Link>
            <Link
              href={`/admin/workspace/clasificados/category/${encodeURIComponent(entry.slug)}#operacion`}
              className={adminLinkAccent}
            >
              {m("hub.opsSpace")}
            </Link>
          </>
        )}
      </div>
    </article>
  );
}

export function ClasificadosCategorySelectorButton({
  entry,
  selected,
  onSelect,
}: {
  entry: AdminCategoriesHubEntry;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full min-w-0 items-start gap-3 rounded-lg border px-3 py-3 text-left transition ${
        selected
          ? "border-[#C9B46A] bg-[#FFFCF7] ring-1 ring-[#C9B46A]/40"
          : "border-[#E8DFD0] bg-[#FAF7F2] hover:border-[#C9B46A]/50 hover:bg-[#FBF7EF]"
      }`}
      aria-pressed={selected}
      data-testid={`clasificados-category-selector-${entry.slug}`}
    >
      <span className="text-xl leading-none" aria-hidden>
        {entry.emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-[#1E1810]">{entry.displayNameEs}</span>
        <span className="mt-0.5 block font-mono text-[10px] text-[#7A7164]">{entry.slug}</span>
        <span className="mt-2 inline-flex">
          <span className={adminDashboardMetricChip}>{adminCategoryOperationalStatusLabel(entry.operationalStatus)}</span>
        </span>
      </span>
    </button>
  );
}
