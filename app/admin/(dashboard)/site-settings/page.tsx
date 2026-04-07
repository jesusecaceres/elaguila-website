import Link from "next/link";
import { AdminPageHeader } from "../../_components/AdminPageHeader";
import { adminBtnPrimary, adminBtnSecondary, adminCardBase, adminInputClass } from "../../_components/adminTheme";
import { getSiteSectionPayload } from "@/app/lib/siteSectionContent/siteSectionContentData";
import type { GlobalSitePayload } from "@/app/lib/siteSectionContent/payloadTypes";
import { mergeGlobalSite } from "@/app/lib/siteSectionContent/globalSiteMerge";
import { saveGlobalSiteAction } from "@/app/admin/globalSiteActions";

export const dynamic = "force-dynamic";

export default async function AdminGlobalSiteSettingsPage(props: { searchParams?: Promise<{ saved?: string }> }) {
  const sp = props.searchParams ? await props.searchParams : {};
  const { payload, updatedAt, error } = await getSiteSectionPayload("global_site");
  const patch = payload as unknown as GlobalSitePayload;
  const g = mergeGlobalSite(patch);

  return (
    <div>
      <AdminPageHeader
        title="Ajustes globales del sitio"
        subtitle="Avisos y franjas que pueden mostrarse en muchas páginas (debajo del menú principal). No sustituye al editor de la portada `/home`."
        eyebrow="Global admin"
        helperText="Activa cada franja con la casilla y escribe texto. Idioma en el sitio: parámetro ?lang= (como el resto de páginas públicas)."
        rightSlot={
          <Link href="/admin/workspace/home" className={adminBtnSecondary}>
            Editor Home `/home`
          </Link>
        }
      />

      {sp.saved === "1" ? (
        <div className={`${adminCardBase} mb-6 border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-950`}>Guardado.</div>
      ) : null}

      {error ? (
        <div className={`${adminCardBase} mb-6 border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950`}>
          No se pudo leer la base: {error}
        </div>
      ) : null}

      <p className="mb-4 text-xs text-[#7A7164]">Última actualización: {updatedAt ? new Date(updatedAt).toLocaleString() : "—"}</p>

      <form action={saveGlobalSiteAction} className={`${adminCardBase} space-y-6 p-6`}>
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Región bajo el menú</h2>
          <p className="mt-1 text-xs text-[#7A7164]">
            Apaga todo el bloque de franjas (aviso + promo) sin borrar textos — útil en emergencias o pruebas de diseño.
          </p>
          <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#3D3428]">
            <input
              type="checkbox"
              name="toggle_banner_region"
              defaultChecked={g.toggles.showSiteWideBanners}
              className="h-4 w-4 rounded border-[#E8DFD0]"
            />
            Mostrar franjas bajo la navegación
          </label>
        </section>

        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Aviso general (sitio)</h2>
          <p className="mt-1 text-xs text-[#7A7164]">Línea informativa (horarios especiales, mantenimiento corto, etc.).</p>
          <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#3D3428]">
            <input
              type="checkbox"
              name="toggle_notice"
              defaultChecked={g.toggles.showSitewideNotice}
              className="h-4 w-4 rounded border-[#E8DFD0]"
            />
            Mostrar aviso
          </label>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-[#5C5346]">Texto ES</label>
              <textarea name="notice_es" className={adminInputClass} rows={2} defaultValue={g.notice.es} />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#5C5346]">Texto EN</label>
              <textarea name="notice_en" className={adminInputClass} rows={2} defaultValue={g.notice.en} />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Franja promocional global</h2>
          <p className="mt-1 text-xs text-[#7A7164]">Segunda franja opcional (tono promo / campaña). Independiente del aviso.</p>
          <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#3D3428]">
            <input
              type="checkbox"
              name="toggle_promo"
              defaultChecked={g.toggles.showGlobalPromoStrip}
              className="h-4 w-4 rounded border-[#E8DFD0]"
            />
            Mostrar franja promo
          </label>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-[#5C5346]">Texto ES</label>
              <textarea name="promo_es" className={adminInputClass} rows={2} defaultValue={g.promo.es} />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#5C5346]">Texto EN</label>
              <textarea name="promo_en" className={adminInputClass} rows={2} defaultValue={g.promo.en} />
            </div>
          </div>
        </section>

        <button type="submit" className={adminBtnPrimary}>
          Guardar ajustes globales
        </button>
      </form>

      <div className={`${adminCardBase} mt-8 p-4 text-xs text-[#7A7164]`}>
        <strong className="text-[#5C5346]">Código vs contenido:</strong> el menú, pie y estructura responsive siguen en código. Aquí solo se guardan
        textos y encendido/apagado de estas dos franjas.
      </div>
    </div>
  );
}
