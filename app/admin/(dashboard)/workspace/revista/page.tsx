import Link from "next/link";
import { AdminPageHeader } from "../../../_components/AdminPageHeader";
import { AdminSectionOwnershipCallout } from "../../../_components/AdminSectionOwnershipCallout";
import { adminCardBase, adminBtnPrimary, adminBtnSecondary, adminInputClass } from "../../../_components/adminTheme";
import { getMagazineManifestForAdmin } from "../../../_lib/magazineAdminData";
import { getSiteSectionPayload } from "@/app/lib/siteSectionContent/siteSectionContentData";
import type { RevistaIssueRegistryPayload, RevistaSpotlightPayload } from "@/app/lib/siteSectionContent/payloadTypes";
import { saveRevistaSpotlightAction } from "@/app/admin/revistaSpotlightActions";
import { appendRevistaIssueDraftAction, removeRevistaIssueDraftAction } from "@/app/admin/revistaIssueRegistryActions";

export const dynamic = "force-dynamic";

export default async function AdminWorkspaceRevistaPage(props: {
  searchParams?: Promise<{ saved?: string; registry_saved?: string; registry_error?: string }>;
}) {
  const sp = props.searchParams ? await props.searchParams : {};
  const manifest = await getMagazineManifestForAdmin();
  const featured = manifest.featured;
  const { payload: spotRaw } = await getSiteSectionPayload("revista_spotlight");
  const spot = spotRaw as unknown as RevistaSpotlightPayload;
  const { payload: regRaw, updatedAt: registryUpdatedAt } = await getSiteSectionPayload("revista_issue_registry");
  const issueReg = regRaw as unknown as RevistaIssueRegistryPayload;
  const plannedIssues = issueReg.plannedIssues ?? [];

  return (
    <div>
      <AdminPageHeader
        title="Revista — números y portada"
        subtitle="El número destacado y el listado de archivo público siguen definidos en public/magazine/editions.json (no en la base). Abajo solo se guardan notas internas (clave revista_spotlight)."
        eyebrow="Workspace · Revista"
        helperText="Número en portada y archivo público. No es el catálogo de Tienda ni la cola de Clasificados."
      />

      <AdminSectionOwnershipCallout
        sectionTitle="Revista"
        publicPath="/magazine · /magazine/…"
        sourceOfTruth="Featured + archivo público: `public/magazine/editions.json`. Notas internas: `revista_spotlight`. Planificación de números (BD): `revista_issue_registry` — no reemplaza el manifiesto aún."
        siteSectionKey="revista_spotlight"
        adminEditors={[
          { label: "Notas internas / archive blurbs (formulario abajo)", href: "#revista-spotlight-form" },
          { label: "Home — contenido (enlaces a revista)", href: "/admin/workspace/home/content" },
        ]}
        notYet={[
          "Subida automática de PDF a Storage + escritura de `editions.json` o resolver BD en runtime (el bloque de carga masiva sigue sin cablear).",
          "Hacer que páginas públicas lean blurbs de `revista_spotlight` si producto lo pide.",
        ]}
      />

      {sp.saved === "1" ? (
        <div className={`${adminCardBase} mb-6 border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-950`}>
          Notas del workspace guardadas.
        </div>
      ) : null}

      <form
        id="revista-spotlight-form"
        action={saveRevistaSpotlightAction}
        className={`${adminCardBase} mb-8 space-y-3 p-6`}
      >
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Notas internas / archivo (texto libre)</h2>
        <p className="text-xs text-[#7A7164]">
          Para alinear al equipo antes de automatizar el manifiesto. No afecta `/magazine` hasta que una página pública lea estos campos.
        </p>
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

      <div className="mb-6 rounded-2xl border border-[#E8DFD0]/90 bg-[#FAF7F2]/90 p-4 text-sm text-[#5C5346]">
        <p className="font-semibold text-[#1E1810]">Qué controla este workspace</p>
        <p className="mt-1 text-xs text-[#7A7164]">
          Solo la sección Revista del sitio público (número en portada y archivo). No sustituye al catálogo de Tienda ni a la cola de Clasificados. La ruta antigua{" "}
          <code className="rounded bg-white/90 px-1 text-[11px]">/admin/magazine</code> redirige aquí.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={`${adminCardBase} p-6`}>
          <p className="text-xs font-bold uppercase text-[#7A7164]">Número destacado (featured)</p>
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
                  Ver número en el sitio público
                </Link>
              </div>
            </>
          ) : (
            <p className="mt-2 text-sm text-[#7A7164]">No se pudo leer el bloque featured en editions.json.</p>
          )}
        </div>

        <div className={`${adminCardBase} p-6`}>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-bold uppercase text-[#7A7164]">Planificación de números</p>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-900">
              Persistido (BD)
            </span>
          </div>
          <p className="mt-1 text-xs text-[#7A7164]">
            Clave <code className="rounded bg-white/90 px-1 text-[11px]">revista_issue_registry</code>. Sirve para coordinar título, fechas, URLs y estado antes de automatizar Storage + manifiesto.{" "}
            <span className="font-semibold text-[#1E1810]">No cambia</span> <code className="rounded bg-white/90 px-1 text-[11px]">editions.json</code> todavía.
          </p>
          <p className="mt-2 text-[11px] text-[#9A9084]">Última escritura en registro: {registryUpdatedAt ? new Date(registryUpdatedAt).toLocaleString() : "—"}</p>
          <form action={appendRevistaIssueDraftAction} className="mt-4 grid gap-3">
            <input name="title_es" className={adminInputClass} placeholder="Título (ES)" />
            <input name="title_en" className={adminInputClass} placeholder="Título (EN)" />
            <div className="grid gap-3 sm:grid-cols-3">
              <input name="year" className={adminInputClass} placeholder="Año (ej. 2026)" />
              <input name="month_slug" className={adminInputClass} placeholder="Mes slug (ej. april)" />
              <select name="lang" className={adminInputClass} defaultValue="es">
                <option value="es">Idioma principal ES</option>
                <option value="en">Idioma principal EN</option>
              </select>
            </div>
            <input name="cover_url" className={adminInputClass} placeholder="URL portada (https o /ruta)" />
            <input name="file_url" className={adminInputClass} placeholder="URL PDF o activo (cuando exista)" />
            <input name="published_at_iso" className={adminInputClass} placeholder="Fecha ISO (opcional)" />
            <select name="status" className={adminInputClass} defaultValue="draft">
              <option value="draft">Borrador</option>
              <option value="scheduled">Programado</option>
              <option value="live">En vivo (planificado)</option>
              <option value="archived">Archivado</option>
            </select>
            <textarea name="internal_notes" className={adminInputClass} rows={2} placeholder="Notas internas (equipo)" />
            <button type="submit" className={adminBtnPrimary}>
              Añadir al registro
            </button>
          </form>
        </div>
      </div>

      {plannedIssues.length > 0 ? (
        <div className={`${adminCardBase} mb-8 p-6`}>
          <h2 className="text-lg font-bold text-[#1E1810]">Registro planificado (Supabase)</h2>
          <p className="mt-1 text-xs text-[#7A7164]">
            Filas guardadas en <code className="rounded bg-white/90 px-1 text-[11px]">site_section_content</code> — úsalas como checklist hasta conectar subida y manifiesto.
          </p>
          <ul className="mt-4 space-y-3 text-sm">
            {plannedIssues.map((row) => (
              <li key={row.id} className="rounded-2xl border border-[#E8DFD0]/80 bg-[#FFFCF7]/90 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-[#1E1810]">{row.titleEs || row.titleEn || "(sin título)"}</p>
                    <p className="text-xs text-[#7A7164]">
                      {row.year}/{row.monthSlug} · {row.lang} ·{" "}
                      <span className="font-mono uppercase">{row.status}</span>
                    </p>
                    {row.internalNotes ? <p className="mt-2 text-xs text-[#5C5346]">{row.internalNotes}</p> : null}
                    <p className="mt-1 break-all text-[11px] text-[#9A9084]">Cover: {row.coverUrl || "—"}</p>
                    <p className="break-all text-[11px] text-[#9A9084]">Archivo: {row.fileUrl || "—"}</p>
                  </div>
                  <form action={removeRevistaIssueDraftAction}>
                    <input type="hidden" name="id" value={row.id} />
                    <button type="submit" className={`${adminBtnSecondary} text-rose-900`} title="Quitar del registro (no borra archivos)">
                      Quitar
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className={`${adminCardBase} mt-8 p-6`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#1E1810]">Archivo</h2>
            <p className="text-xs text-[#7A7164]">
              Derivado del manifiesto (años/meses). “Marcar como actual” reordenaría featured — aún no automatizado.
            </p>
          </div>
          <button type="button" disabled className={adminBtnSecondary} title="Requiere escritor de manifiesto o pipeline desde el registro BD">
            Hacer actual el seleccionado
          </button>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead className="text-left text-xs font-bold uppercase text-[#7A7164]">
              <tr>
                <th className="p-2">Año</th>
                <th className="p-2">Mes</th>
                <th className="p-2">Título (ES)</th>
                <th className="p-2">Actualizado</th>
                <th className="p-2 text-right">Abrir</th>
              </tr>
            </thead>
            <tbody>
              {manifest.archive.length === 0 ? (
                <tr>
                  <td className="p-3 text-[#7A7164]" colSpan={5}>
                    No hay filas de archivo.
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
                        Ver
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
        <strong>Estrategia de almacenamiento (futuro):</strong> subir PDF + portada a bucket privado; metadata en{" "}
        <code className="rounded bg-white/80 px-1">magazine_issues</code> con slug público; CI o server action regenera{" "}
        <code className="rounded bg-white/80 px-1">editions.json</code> o un resolver desde BD para las páginas públicas.
      </div>
    </div>
  );
}
