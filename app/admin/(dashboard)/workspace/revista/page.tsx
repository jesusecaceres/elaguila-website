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
                Actual en portada
              </span>
            ) : null}
          </p>
          <p className="text-xs text-[#7A7164]">
            Estado: <span className="font-mono">{row.status}</span> · id <span className="font-mono">{row.id.slice(0, 8)}…</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {row.status === "draft" ? (
            <form action={publishMagazineIssueAction}>
              <input type="hidden" name="id" value={row.id} />
              <button
                type="submit"
                className={`${adminBtnSecondary} text-sm`}
                title="Pasa el borrador a published y entra al manifiesto público (según reglas del hub)"
              >
                Publicar número
              </button>
            </form>
          ) : null}
          {row.status === "published" && !row.is_featured ? (
            <form action={setMagazineCurrentIssueAction}>
              <input type="hidden" name="id" value={row.id} />
              <button
                type="submit"
                className={`${adminBtnSecondary} text-sm`}
                title="Pone este publicado como actual en portada; archiva automáticamente el anterior destacado"
              >
                Marcar como número actual
              </button>
            </form>
          ) : null}
          {row.status === "published" ? (
            <form action={archiveMagazineIssueAction}>
              <input type="hidden" name="id" value={row.id} />
              <button
                type="submit"
                className={`${adminBtnSecondary} text-sm text-amber-950`}
                title="Marca el número como archivado (sale de portada si aplicaba)"
              >
                Archivar número
              </button>
            </form>
          ) : null}
          {row.status === "draft" ? (
            <form action={deleteMagazineDraftAction}>
              <input type="hidden" name="id" value={row.id} />
              <button
                type="submit"
                className={`${adminBtnSecondary} text-sm text-rose-900`}
                title="Elimina solo borradores (draft) de magazine_issues"
              >
                Borrar borrador
              </button>
            </form>
          ) : null}
        </div>
      </div>

      <form action={upsertMagazineIssueAction} className="space-y-2 border-t border-[#E8DFD0]/80 pt-3">
        <input type="hidden" name="id" value={row.id} />
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-[#5C5346]">Año</label>
            <input name="year" className={adminInputClass} defaultValue={row.year} required />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#5C5346]">Mes</label>
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
            <label className="text-xs font-semibold text-[#5C5346]">Título ES</label>
            <input name="title_es" className={adminInputClass} defaultValue={row.title_es} required />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#5C5346]">Título EN</label>
            <input name="title_en" className={adminInputClass} defaultValue={row.title_en} />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-[#5C5346]">Estado</label>
          <select name="status" className={adminInputClass} defaultValue={row.status}>
            {row.status === "draft" ? <option value="draft">draft</option> : null}
            <option value="published">published</option>
            <option value="archived">archived</option>
            {row.status === "draft" ? null : (
              <option value="draft">draft (oculta del hub — solo si necesitas retirarlo)</option>
            )}
          </select>
          <p className="mt-1 text-[11px] text-[#7A7164]">
            Borradores no salen en /magazine. Pasar un publicado a draft lo quita del manifiesto público.
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
            <label className="text-xs font-semibold text-[#5C5346]">Publicado (ISO)</label>
            <input
              name="published_at"
              className={adminInputClass}
              defaultValue={row.published_at ? row.published_at.slice(0, 19) : ""}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#5C5346]">Orden</label>
            <input name="display_order" type="number" className={adminInputClass} defaultValue={row.display_order} />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-[#5C5346]">Notas internas</label>
          <textarea name="internal_notes" className={adminInputClass} rows={2} defaultValue={row.internal_notes ?? ""} />
        </div>
        <button
          type="submit"
          className={adminBtnSecondary}
          title="Actualiza metadatos y URLs del número en magazine_issues (upsert por id)"
        >
          Guardar datos del número
        </button>
      </form>
      <Link
        href={`/magazine/${row.year}/${row.month_slug}`}
        className="inline-block text-xs font-bold text-[#6B5B2E] underline"
        target="_blank"
        rel="noopener noreferrer"
        title="Vista pública de plantilla (puede diferir del manifiesto si la ruta no está generada)"
      >
        Vista plantilla pública →
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
        title="Revista — gestor de números"
        subtitle="La portada `/magazine` y el manifiesto público salen de Supabase cuando hay números publicados o archivados; si la tabla está vacía o falla, se usa `public/magazine/editions.json` como respaldo."
        eyebrow="Workspace · Revista"
        helperText="Sube portada/PDF a Blob (requiere BLOB_READ_WRITE_TOKEN) o pega URLs. Un solo publicado es “actual”; al marcar otro, el anterior en portada se archiva automáticamente."
      />

      <div className={`${adminCardBase} mb-6 max-w-3xl border border-[#E8DFD0]/80 bg-[#FFFCF7]/90 p-4 text-xs text-[#5C5346]`}>
        <strong className="text-[#1E1810]">Resolver público:</strong> el hub efectivo es{" "}
        <code className="rounded bg-white/80 px-1">/api/magazine/manifest</code> + rutas bajo{" "}
        <code className="rounded bg-white/80 px-1">/magazine</code>. Si un número está publicado en{" "}
        <code className="rounded bg-white/80 px-1">magazine_issues</code> pero la URL aún no coincide con el manifiesto, revisa
        estado <span className="font-mono">published</span>, <span className="font-mono">is_featured</span> y el enlace{" "}
        <span className="font-mono">Vista plantilla pública</span> en cada tarjeta.
      </div>

      <AdminSectionOwnershipCallout
        sectionTitle="Revista"
        publicPath="/magazine"
        sourceOfTruth={`Manifiesto efectivo: ${manifest.publicSource === "database" ? "tabla magazine_issues (API /api/magazine/manifest)" : "archivo public/magazine/editions.json"}. Notas internas: revista_spotlight.`}
        siteSectionKey="revista_spotlight"
        adminEditors={[
          { label: "Notas internas (formulario abajo)", href: "#revista-spotlight-form" },
          { label: "Home — contenido", href: "/admin/workspace/home/content" },
        ]}
        notYet={[
          "Regenerar automáticamente rutas estáticas /magazine/[year]/[month] desde BD (hoy siguen siendo páginas en repo).",
          "Lectura pública de archive blurbs desde revista_spotlight si producto lo pide.",
        ]}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
            manifest.publicSource === "database"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border border-sky-200 bg-sky-50 text-sky-900"
          }`}
        >
          Público: {manifest.publicSource === "database" ? "Supabase" : "editions.json"}
        </span>
      </div>

      {sp.saved === "1" ? (
        <div className={`${adminCardBase} mb-6 border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-950`}>
          Notas del workspace guardadas.
        </div>
      ) : null}
      {sp.issue_saved === "1" ? (
        <div className={`${adminCardBase} mb-6 border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-950`}>
          Cambios de número guardados (manifiesto revalidado).
        </div>
      ) : null}
      {sp.issue_error === "1" ? (
        <div className={`${adminCardBase} mb-6 border-rose-200 bg-rose-50/90 p-4 text-sm text-rose-950`}>
          No se pudo completar la acción (revisa estado del número o permisos Supabase).
        </div>
      ) : null}

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <div className={`${adminCardBase} p-6`}>
          <p className="text-xs font-bold uppercase text-[#7A7164]">Vista previa — número destacado</p>
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
                  title="Hub público de la revista (sitio)"
                >
                  Abrir hub /magazine
                </Link>
              </div>
            </>
          ) : (
            <p className="mt-2 text-sm text-[#7A7164]">Sin datos de destacado.</p>
          )}
        </div>

        <div className={`${adminCardBase} p-6`}>
          <p className="text-xs font-bold uppercase text-[#7A7164]">Nuevo número</p>
          <p className="mt-1 text-xs text-[#7A7164]">
            Tras crear, publica y marca como actual. Las URLs pueden venir de Blob o rutas bajo /public.
          </p>
          <div className="mt-4">
            <MagazineIssueCreateCard />
          </div>
        </div>
      </div>

      {issuesErr ? (
        <div className={`${adminCardBase} mb-6 border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950`}>
          <strong>magazine_issues:</strong> {issuesErr} — aplica la migración{" "}
          <code className="rounded bg-white/80 px-1 text-[11px]">20260408140000_magazine_issues.sql</code> o revisa Supabase.
        </div>
      ) : null}

      <div className={`${adminCardBase} mb-8 p-6`}>
        <h2 className="text-lg font-bold text-[#1E1810]">Números en base de datos</h2>
        <p className="mt-1 text-xs text-[#7A7164]">
          {issues.length === 0
            ? "Sin filas — el sitio público seguirá el JSON hasta que publiques un número."
            : `${issues.length} fila(s). Borradores no aparecen en /magazine.`}
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
                  <th className="p-2">Año/Mes</th>
                  <th className="p-2">Título ES</th>
                  <th className="p-2">Estado</th>
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
                    <td className="p-2">{row.is_featured ? "sí" : "—"}</td>
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
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Notas internas (revista_spotlight)</h2>
        <p className="text-xs text-[#7A7164]">Opcional; no sustituye títulos del manifiesto público.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-[#5C5346]">Nota workspace ES</label>
            <textarea name="note_es" className={adminInputClass} rows={3} defaultValue={spot.workspaceNoteEs ?? ""} />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#5C5346]">Nota workspace EN</label>
            <textarea name="note_en" className={adminInputClass} rows={3} defaultValue={spot.workspaceNoteEn ?? ""} />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#5C5346]">Texto archivo (ES)</label>
            <textarea name="archive_es" className={adminInputClass} rows={2} defaultValue={spot.archiveBlurbEs ?? ""} />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#5C5346]">Texto archivo (EN)</label>
            <textarea name="archive_en" className={adminInputClass} rows={2} defaultValue={spot.archiveBlurbEn ?? ""} />
          </div>
        </div>
        <button type="submit" className={adminBtnSecondary}>
          Guardar notas
        </button>
      </form>

      <div className={`${adminCardBase} p-6`}>
        <h2 className="text-lg font-bold text-[#1E1810]">Archivo (vista efectiva pública)</h2>
        <p className="text-xs text-[#7A7164]">Misma fuente que el hub; duplicado para verificación rápida.</p>
        <div className={`mt-4 ${adminTableWrap}`}>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead className="text-left text-xs font-bold uppercase text-[#7A7164]">
                <tr>
                  <th className="p-2">Año</th>
                  <th className="p-2">Mes</th>
                  <th className="p-2">Título (ES)</th>
                  <th className="p-2">Actualizado</th>
                </tr>
              </thead>
              <tbody>
                {manifest.archive.length === 0 ? (
                  <tr>
                    <td className="p-3 text-[#7A7164]" colSpan={4}>
                      Sin entradas en el manifiesto efectivo.
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
