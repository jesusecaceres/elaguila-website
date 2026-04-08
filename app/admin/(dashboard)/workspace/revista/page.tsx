import Link from "next/link";
import { AdminPageHeader } from "../../../_components/AdminPageHeader";
import { AdminSectionOwnershipCallout } from "../../../_components/AdminSectionOwnershipCallout";
import { adminCardBase, adminBtnPrimary, adminBtnSecondary, adminInputClass, adminStubBadgeClass } from "../../../_components/adminTheme";
import { getMagazineManifestForAdmin } from "../../../_lib/magazineAdminData";
import { getSiteSectionPayload } from "@/app/lib/siteSectionContent/siteSectionContentData";
import type { RevistaSpotlightPayload } from "@/app/lib/siteSectionContent/payloadTypes";
import { saveRevistaSpotlightAction } from "@/app/admin/revistaSpotlightActions";

export const dynamic = "force-dynamic";

export default async function AdminWorkspaceRevistaPage(props: { searchParams?: Promise<{ saved?: string }> }) {
  const sp = props.searchParams ? await props.searchParams : {};
  const manifest = await getMagazineManifestForAdmin();
  const featured = manifest.featured;
  const { payload: spotRaw } = await getSiteSectionPayload("revista_spotlight");
  const spot = spotRaw as unknown as RevistaSpotlightPayload;

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
        sourceOfTruth="Featured + archivo público: `public/magazine/editions.json` (manifiesto). Notas de equipo: `site_section_content.revista_spotlight`."
        siteSectionKey="revista_spotlight"
        adminEditors={[
          { label: "Notas internas / archive blurbs (formulario abajo)", href: "#revista-spotlight-form" },
          { label: "Home — contenido (enlaces a revista)", href: "/admin/workspace/home/content" },
        ]}
        notYet={[
          "Subida de PDF/issue a Storage + fila en BD o manifiesto vía admin (bloque deshabilitado abajo).",
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
            <p className="text-xs font-bold uppercase text-[#7A7164]">Subir nuevo número (esqueleto)</p>
            <span className={adminStubBadgeClass}>Próximamente</span>
            <span className={adminStubBadgeClass}>No persistido</span>
          </div>
          <p className="mt-1 text-xs text-[#7A7164]">
            Conectar a Supabase Storage o API segura; luego actualizar manifiesto o fila en BD. Este formulario no guarda aún.
          </p>
          <div className="mt-4 grid gap-3">
            <input className={adminInputClass} disabled placeholder="Título (ES)" />
            <div className="grid gap-3 sm:grid-cols-3">
              <input className={adminInputClass} disabled placeholder="Año" />
              <input className={adminInputClass} disabled placeholder="Slug del mes" />
              <select className={adminInputClass} disabled defaultValue="es">
                <option value="es">Idioma: ES</option>
                <option value="en">Idioma: EN</option>
              </select>
            </div>
            <input className={adminInputClass} disabled placeholder="URL de portada" />
            <input className={adminInputClass} disabled placeholder="URL de PDF o activo del número" />
            <input className={adminInputClass} disabled placeholder="Fecha de publicación (ISO)" />
            <select className={adminInputClass} disabled defaultValue="draft">
              <option value="draft">Estado: borrador</option>
              <option value="scheduled">Programado</option>
              <option value="live">En vivo</option>
              <option value="archived">Archivado</option>
            </select>
            <button type="button" disabled className={`${adminBtnPrimary} opacity-60`}>
              Guardar número (sin cablear)
            </button>
          </div>
        </div>
      </div>

      <div className={`${adminCardBase} mt-8 p-6`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#1E1810]">Archivo</h2>
            <p className="text-xs text-[#7A7164]">
              Derivado del manifiesto (años/meses). “Marcar como actual” reordenaría featured — aún no automatizado.
            </p>
          </div>
          <button type="button" disabled className={adminBtnSecondary} title="Requiere escritor de manifiesto">
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
