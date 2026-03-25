import Link from "next/link";
import { AdminPageHeader } from "../../_components/AdminPageHeader";
import { adminCardBase, adminBtnPrimary, adminBtnSecondary, adminInputClass } from "../../_components/adminTheme";
import { getMagazineManifestForAdmin } from "../../_lib/magazineAdminData";

export const dynamic = "force-dynamic";

export default async function AdminMagazinePage() {
  const manifest = await getMagazineManifestForAdmin();
  const featured = manifest.featured;

  return (
    <div>
      <AdminPageHeader
        title="Magazine"
        subtitle="Operations for issues backed by `public/magazine/editions.json`. Upload / make-current actions are stubbed until storage + manifest writers exist."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={`${adminCardBase} p-6`}>
          <p className="text-xs font-bold uppercase text-[#7A7164]">Current featured</p>
          {featured ? (
            <>
              <h2 className="mt-2 text-xl font-bold text-[#1E1810]">{featured.titleEs}</h2>
              <p className="text-sm text-[#5C5346]/95">
                {featured.month} · {featured.year} · manifest {featured.updated}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/magazine/${featured.year}/${featured.month}`}
                  className={adminBtnSecondary}
                  target="_blank"
                >
                  View public issue
                </Link>
              </div>
            </>
          ) : (
            <p className="mt-2 text-sm text-[#7A7164]">Could not read featured block from editions.json.</p>
          )}
        </div>

        <div className={`${adminCardBase} p-6`}>
          <p className="text-xs font-bold uppercase text-[#7A7164]">Upload new issue (stub)</p>
          <p className="mt-1 text-xs text-[#7A7164]">
            Wire to Supabase Storage or secure upload API; then update manifest or DB row. This form does not persist.
          </p>
          <div className="mt-4 grid gap-3">
            <input className={adminInputClass} disabled placeholder="Title (ES)" />
            <div className="grid gap-3 sm:grid-cols-3">
              <input className={adminInputClass} disabled placeholder="Year" />
              <input className={adminInputClass} disabled placeholder="Month slug" />
              <select className={adminInputClass} disabled defaultValue="es">
                <option value="es">Language: ES</option>
                <option value="en">Language: EN</option>
              </select>
            </div>
            <input className={adminInputClass} disabled placeholder="Cover image URL" />
            <input className={adminInputClass} disabled placeholder="PDF or issue asset URL" />
            <input className={adminInputClass} disabled placeholder="Publish date (ISO)" />
            <select className={adminInputClass} disabled defaultValue="draft">
              <option value="draft">Status: draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="live">Live</option>
              <option value="archived">Archived</option>
            </select>
            <button type="button" disabled className={`${adminBtnPrimary} opacity-60`}>
              Save issue (not wired)
            </button>
          </div>
        </div>
      </div>

      <div className={`${adminCardBase} mt-8 p-6`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#1E1810]">Archive</h2>
            <p className="text-xs text-[#7A7164]">Derived from manifest years/months. “Make current” would reorder featured + move prior — not automated yet.</p>
          </div>
          <button type="button" disabled className={adminBtnSecondary} title="Requires manifest writer">
            Make selected current
          </button>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead className="text-left text-xs font-bold uppercase text-[#7A7164]">
              <tr>
                <th className="p-2">Year</th>
                <th className="p-2">Month</th>
                <th className="p-2">Title (ES)</th>
                <th className="p-2">Updated</th>
                <th className="p-2 text-right">Open</th>
              </tr>
            </thead>
            <tbody>
              {manifest.archive.length === 0 ? (
                <tr>
                  <td className="p-3 text-[#7A7164]" colSpan={5}>
                    No archive rows parsed.
                  </td>
                </tr>
              ) : (
                manifest.archive.map((row) => (
                  <tr key={`${row.year}-${row.month}`} className="border-t border-[#E8DFD0]/80">
                    <td className="p-2 font-mono text-xs">{row.year}</td>
                    <td className="p-2 font-mono text-xs">{row.month}</td>
                    <td className="p-2">{row.titleEs}</td>
                    <td className="p-2 text-xs text-[#5C5346]">{row.updated}</td>
                    <td className="p-2 text-right">
                      <Link
                        href={`/magazine/${row.year}/${row.month}`}
                        className="text-xs font-bold text-[#6B5B2E] underline"
                        target="_blank"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-dashed border-[#C9B46A]/50 bg-[#FFF8F0]/80 p-4 text-xs text-[#5C5346]/95">
        <strong>Storage strategy (future):</strong> upload PDF + cover to a private bucket; store metadata in{" "}
        <code className="rounded bg-white/80 px-1">magazine_issues</code> with public slug; CI or server action regenerates{" "}
        <code className="rounded bg-white/80 px-1">editions.json</code> or switches DB-backed resolver for public pages.
      </div>
    </div>
  );
}
