import Link from "next/link";
import { AdminPageHeader } from "../../../_components/AdminPageHeader";
import { AdminSectionOwnershipCallout } from "../../../_components/AdminSectionOwnershipCallout";
import { adminCardBase, adminBtnSecondary, adminInputClass, adminTableWrap } from "../../../_components/adminTheme";
import { MagazineIssueCreateCard } from "../../../_components/magazine/MagazineIssueCreateCard";
import { getMagazineManifestForAdmin } from "../../../_lib/magazineAdminData";
import { getSiteSectionPayload } from "@/app/lib/siteSectionContent/siteSectionContentData";
import type { RevistaSpotlightPayload } from "@/app/lib/siteSectionContent/payloadTypes";
import { saveRevistaSpotlightAction } from "@/app/admin/revistaSpotlightActions";
import { fetchAllMagazineIssuesForAdmin } from "@/app/lib/magazine/magazineManifestServer";
import type { MagazineIssueRow } from "@/app/lib/magazine/magazineManifestTypes";
import {
  upsertMagazineIssueAction,
  setMagazineCurrentIssueAction,
  archiveMagazineIssueAction,
  publishMagazineIssueAction,
  deleteMagazineDraftAction,
} from "@/app/admin/magazineIssuesActions";
import { MagazineIssueEditAssets } from "@/app/admin/_components/magazine/MagazineIssueEditAssets";

export const dynamic = "force-dynamic";

const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
] as const;

function IssueEditCard({ row }: { row: MagazineIssueRow }) {
  return (
    <div className={`${adminCardBase} space-y-3 p-4`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold text-[#1E1810]">
            {row.year} / {row.month_slug}
            {row.is_featured ? (
              <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-900">
                Actual on cover
              </span>
            ) : null}
          </p>
          <p className="text-xs text-[#7A7164]">
            Status: <span className="font-mono">{row.status}</span> · id <span className="font-mono">{row.id.slice(0, 8)}…</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {row.status === "draft" ? (
            <form action={publishMagazineIssueAction}>
              <input type="hidden" name="id" value={row.id} />
              <button
                type="submit"
                className={`${adminBtnSecondary} text-sm`}
                title="Move draft to published and include in public manifest (per hub rules)"
              >
                Publish issue
              </button>
            </form>
          ) : null}
          {row.status === "published" && !row.is_featured ? (
            <form action={setMagazineCurrentIssueAction}>
              <input type="hidden" name="id" value={row.id} />
              <button
                type="submit"
                className={`${adminBtnSecondary} text-sm`}
                title="Sets this published issue as current on cover; automatically archives the previous featured issue"
              >
                Mark as current issue
              </button>
            </form>
          ) : null}
          {row.status === "published" ? (
            <form action={archiveMagazineIssueAction}>
              <input type="hidden" name="id" value={row.id} />
              <button
                type="submit"
                className={`${adminBtnSecondary} text-sm text-amber-950`}
                title="Marks issue as archived (removed from cover if applicable)"
              >
                Archive issue
              </button>
            </form>
          ) : null}
          {row.status === "draft" ? (
            <form action={deleteMagazineDraftAction}>
              <input type="hidden" name="id" value={row.id} />
              <button
                type="submit"
                className={`${adminBtnSecondary} text-sm text-rose-900`}
                title="Deletes draft issues only from magazine_issues"
              >
                Delete draft
              </button>
            </form>
          ) : null}
        </div>
      </div>

      <form action={upsertMagazineIssueAction} className="space-y-2 border-t border-[#E8DFD0]/80 pt-3">
        <input type="hidden" name="id" value={row.id} />
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-[#5C5346]">Year</label>
            <input name="year" className={adminInputClass} defaultValue={row.year} required />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#5C5346]">Month</label>
            <select name="month_slug" className={adminInputClass} defaultValue={row.month_slug} required>
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-[#5C5346]">Title ES</label>
            <input name="title_es" className={adminInputClass} defaultValue={row.title_es} required />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#5C5346]">Title EN</label>
            <input name="title_en" className={adminInputClass} defaultValue={row.title_en} />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-[#5C5346]">Status</label>
          <select name="status" className={adminInputClass} defaultValue={row.status}>
            {row.status === "draft" ? <option value="draft">draft</option> : null}
            <option value="published">published</option>
            <option value="archived">archived</option>
            {row.status === "draft" ? null : (
              <option value="draft">draft (hidden from hub — only if you need to withdraw it)</option>
            )}
          </select>
          <p className="mt-1 text-[11px] text-[#7A7164]">
            Drafts do not appear on /magazine. Moving a published issue to draft removes it from the public manifest.
          </p>
        </div>
        <MagazineIssueEditAssets
          year={row.year}
          monthSlug={row.month_slug}
          coverDefault={row.cover_url ?? ""}
          pdfDefault={row.pdf_url ?? ""}
          flipbookDefault={row.flipbook_url ?? ""}
        />
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-[#5C5346]">Published (ISO)</label>
            <input
              name="published_at"
              className={adminInputClass}
              defaultValue={row.published_at ? row.published_at.slice(0, 19) : ""}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#5C5346]">Order</label>
            <input name="display_order" type="number" className={adminInputClass} defaultValue={row.display_order} />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-[#5C5346]">Internal notes</label>
          <textarea name="internal_notes" className={adminInputClass} rows={2} defaultValue={row.internal_notes ?? ""} />
        </div>
        <button
          type="submit"
          className={adminBtnSecondary}
          title="Updates issue metadata and URLs in magazine_issues (upsert by id)"
        >
          Save issue data
        </button>
      </form>
      <Link
        href={`/magazine/${row.year}/${row.month_slug}`}
        className="inline-block text-xs font-bold text-[#6B5B2E] underline"
        target="_blank"
        rel="noopener noreferrer"
        title="Public template preview (may differ from manifest if route is not generated)"
      >
        Public template preview →
      </Link>
    </div>
  );
}

export default async function AdminWorkspaceRevistaPage(props: {
  searchParams?: Promise<{ saved?: string; issue_saved?: string; issue_error?: string }>;
}) {
  const sp = props.searchParams ? await props.searchParams : {};
  const manifest = await getMagazineManifestForAdmin();
  const featured = manifest.featured;
  const { payload: spotRaw } = await getSiteSectionPayload("revista_spotlight");
  const spot = spotRaw as unknown as RevistaSpotlightPayload;
  const { rows: issues, error: issuesErr } = await fetchAllMagazineIssuesForAdmin();

  return (
    <div>
      <AdminPageHeader
        title="Magazine — issue manager"
        subtitle="The `/magazine` cover and public manifest come from Supabase when published or archived issues exist; if the table is empty or fails, `public/magazine/editions.json` is used as fallback."
        eyebrow="Workspace · Magazine"
        helperText="Upload cover/PDF to Blob (requires BLOB_READ_WRITE_TOKEN) or paste URLs. Only one published issue is “current”; marking another automatically archives the previous cover issue."
      />

      <div className={`${adminCardBase} mb-6 max-w-3xl border border-[#E8DFD0]/80 bg-[#FFFCF7]/90 p-4 text-xs text-[#5C5346]`}>
        <strong className="text-[#1E1810]">Public resolver:</strong> effective hub is{" "}
        <code className="rounded bg-white/80 px-1">/api/magazine/manifest</code> + routes under{" "}
        <code className="rounded bg-white/80 px-1">/magazine</code>. If an issue is published in{" "}
        <code className="rounded bg-white/80 px-1">magazine_issues</code> but the URL does not match the manifest yet, check
        <span className="font-mono"> published</span>, <span className="font-mono">is_featured</span>, and the{" "}
        <span className="font-mono">Public template preview</span> link on each card.
      </div>

      <AdminSectionOwnershipCallout
        sectionTitle="Magazine"
        publicPath="/magazine"
        sourceOfTruth={`Effective manifest: ${manifest.publicSource === "database" ? "magazine_issues table (API /api/magazine/manifest)" : "public/magazine/editions.json file"}. Internal notes: revista_spotlight.`}
        siteSectionKey="revista_spotlight"
        adminEditors={[
          { label: "Internal notes (form below)", href: "#revista-spotlight-form" },
          { label: "Home — content", href: "/admin/workspace/home/content" },
        ]}
        notYet={[
          "Automatically regenerate static /magazine/[year]/[month] routes from DB (today they remain repo pages).",
          "Public reading of archive blurbs from revista_spotlight if product requests it.",
        ]}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
            manifest.publicSource === "database"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border border-amber-200 bg-amber-50 text-amber-900"
          }`}
        >
          Public: {manifest.publicSource === "database" ? "Supabase" : "editions.json"}
        </span>
      </div>

      {sp.saved === "1" ? (
        <div className={`${adminCardBase} mb-6 border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-950`}>
          Workspace notes saved.
        </div>
      ) : null}
      {sp.issue_saved === "1" ? (
        <div className={`${adminCardBase} mb-6 border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-950`}>
          Issue changes saved (manifest revalidated).
        </div>
      ) : null}
      {sp.issue_error === "1" ? (
        <div className={`${adminCardBase} mb-6 border-rose-200 bg-rose-50/90 p-4 text-sm text-rose-950`}>
          Could not complete action (check issue status or Supabase permissions).
        </div>
      ) : null}

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <div className={`${adminCardBase} p-6`}>
          <p className="text-xs font-bold uppercase text-[#7A7164]">Preview — featured issue</p>
          {featured ? (
            <>
              <h2 className="mt-2 text-xl font-bold text-[#1E1810]">{featured.titleEs}</h2>
              <p className="text-sm text-[#5C5346]/95">
                {featured.month} · {featured.year} · {featured.updated}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/magazine"
                  className={adminBtnSecondary}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Public magazine hub (site)"
                >
                  Open hub /magazine
                </Link>
              </div>
            </>
          ) : (
            <p className="mt-2 text-sm text-[#7A7164]">No featured data.</p>
          )}
        </div>

        <div className={`${adminCardBase} p-6`}>
          <p className="text-xs font-bold uppercase text-[#7A7164]">New issue</p>
          <p className="mt-1 text-xs text-[#7A7164]">
            After creating, publish and mark as current. URLs can come from Blob or paths under /public.
          </p>
          <div className="mt-4">
            <MagazineIssueCreateCard />
          </div>
        </div>
      </div>

      {issuesErr ? (
        <div className={`${adminCardBase} mb-6 border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950`}>
          <strong>magazine_issues:</strong> {issuesErr} — apply migration{" "}
          <code className="rounded bg-white/80 px-1 text-[11px]">20260408140000_magazine_issues.sql</code> or check Supabase.
        </div>
      ) : null}

      <div className={`${adminCardBase} mb-8 p-6`}>
        <h2 className="text-lg font-bold text-[#1E1810]">Issues in database</h2>
        <p className="mt-1 text-xs text-[#7A7164]">
          {issues.length === 0
            ? "No rows — public site will follow JSON until you publish an issue."
            : `${issues.length} row(s). Drafts do not appear on /magazine.`}
        </p>
        <div className="mt-4 space-y-4 lg:hidden">
          {issues.map((row) => (
            <IssueEditCard key={row.id} row={row} />
          ))}
        </div>
        <div className={`mt-4 hidden lg:block ${adminTableWrap}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs font-bold uppercase text-[#7A7164]">
                <tr>
                  <th className="p-2">Year/Month</th>
                  <th className="p-2">Title ES</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Featured</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((row) => (
                  <tr key={row.id} className="border-t border-[#E8DFD0]/80">
                    <td className="p-2 font-mono text-xs">
                      {row.year}/{row.month_slug}
                    </td>
                    <td className="p-2">{row.title_es}</td>
                    <td className="p-2">{row.status}</td>
                    <td className="p-2">{row.is_featured ? "yes" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-6 hidden space-y-4 lg:block">
          {issues.map((row) => (
            <IssueEditCard key={`edit-${row.id}`} row={row} />
          ))}
        </div>
      </div>

      <form
        id="revista-spotlight-form"
        action={saveRevistaSpotlightAction}
        className={`${adminCardBase} mb-8 space-y-3 p-6`}
      >
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Internal notes (revista_spotlight)</h2>
        <p className="text-xs text-[#7A7164]">Optional; does not replace public manifest titles.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-[#5C5346]">Workspace note ES</label>
            <textarea name="note_es" className={adminInputClass} rows={3} defaultValue={spot.workspaceNoteEs ?? ""} />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#5C5346]">Workspace note EN</label>
            <textarea name="note_en" className={adminInputClass} rows={3} defaultValue={spot.workspaceNoteEn ?? ""} />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#5C5346]">Archive text (ES)</label>
            <textarea name="archive_es" className={adminInputClass} rows={2} defaultValue={spot.archiveBlurbEs ?? ""} />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#5C5346]">Archive text (EN)</label>
            <textarea name="archive_en" className={adminInputClass} rows={2} defaultValue={spot.archiveBlurbEn ?? ""} />
          </div>
        </div>
        <button type="submit" className={adminBtnSecondary}>
          Save notes
        </button>
      </form>

      <div className={`${adminCardBase} p-6`}>
        <h2 className="text-lg font-bold text-[#1E1810]">Archive (effective public view)</h2>
        <p className="text-xs text-[#7A7164]">Same source as the hub; duplicated for quick verification.</p>
        <div className={`mt-4 ${adminTableWrap}`}>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead className="text-left text-xs font-bold uppercase text-[#7A7164]">
                <tr>
                  <th className="p-2">Year</th>
                  <th className="p-2">Month</th>
                  <th className="p-2">Title (ES)</th>
                  <th className="p-2">Updated</th>
                </tr>
              </thead>
              <tbody>
                {manifest.archive.length === 0 ? (
                  <tr>
                    <td className="p-3 text-[#7A7164]" colSpan={4}>
                      No entries in the effective manifest.
                    </td>
                  </tr>
                ) : (
                  manifest.archive.map((row) => (
                    <tr key={`${row.year}-${row.month}`} className="border-t border-[#E8DFD0]/80">
                      <td className="p-2 font-mono text-xs">{row.year}</td>
                      <td className="p-2 font-mono text-xs">{row.month}</td>
                      <td className="p-2">{row.titleEs}</td>
                      <td className="p-2 text-xs text-[#5C5346]">{row.updated}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
