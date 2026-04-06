import Link from "next/link";
import { AdminPageHeader } from "../../../_components/AdminPageHeader";
import { adminCardBase, adminBtnPrimary, adminBtnSecondary, adminInputClass } from "../../../_components/adminTheme";
import { getMagazineManifestForAdmin } from "../../../_lib/magazineAdminData";

export const dynamic = "force-dynamic";

export default async function AdminWorkspaceRevistaPage() {
  const manifest = await getMagazineManifestForAdmin();
  const featured = manifest.featured;

  return (
    <div>
      <AdminPageHeader
        title="Revista — números y portada"
        subtitle="Aquí vive la operación de la revista pública: número destacado, archivo por año/mes, y formularios de carga cuando exista almacenamiento. Los datos actuales salen de `public/magazine/editions.json`."
        eyebrow="Workspace · Revista"
      />

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
          <p className="text-xs font-bold uppercase text-[#7A7164]">Subir nuevo número (esqueleto)</p>
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
