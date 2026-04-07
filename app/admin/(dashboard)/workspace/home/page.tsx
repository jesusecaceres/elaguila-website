import Link from "next/link";
import { AdminPageHeader } from "../../../_components/AdminPageHeader";
import { adminCardBase, adminBtnSecondary } from "../../../_components/adminTheme";
import { getSiteSectionPayload } from "@/app/lib/siteSectionContent/siteSectionContentData";
import { mergeHomeMarketing } from "@/app/lib/siteSectionContent/homeMarketingMerge";

export const dynamic = "force-dynamic";

function yn(v: boolean): string {
  return v ? "Sí" : "No";
}

/**
 * Home workspace hub — summary of persisted `home_marketing` (no form here; editor is `/content`).
 */
export default async function AdminWorkspaceHomePage() {
  const { payload, updatedAt } = await getSiteSectionPayload("home_marketing");
  const m = mergeHomeMarketing(payload as Parameters<typeof mergeHomeMarketing>[0]);

  const hasAnnouncementCopy = m.es.announcement.trim().length > 0 || m.en.announcement.trim().length > 0;

  const rows: { step: string; detail: string }[] = [
    {
      step: "1. Aviso fino sobre el hero",
      detail: `${yn(m.modules.showAnnouncement && hasAnnouncementCopy)} · casilla “Mostrar franja de aviso” + texto en Contenido`,
    },
    {
      step: "2. Titular, identidad y subtítulo",
      detail: "Siempre visibles (textos en Contenido)",
    },
    {
      step: "3. Enlaces destacados (chips)",
      detail: `${yn(m.modules.showCallouts && m.callouts.length > 0)} · ${m.callouts.length} enlace(s) válido(s) · posición: ${
        m.calloutsPlacement === "below_title" ? "bajo titular" : "bajo identidad + subtítulo"
      }`,
    },
    {
      step: "4. Imagen de portada + CTA primario",
      detail: `${yn(m.modules.showHeroImage)} · imagen: ${m.coverImageSrc}`,
    },
    {
      step: "5. Línea secundaria / CTA secundario y franja promo",
      detail: `${yn(m.modules.showSecondaryLine)} · promo con texto: ${yn(m.modules.showSecondaryLine && (m.es.promoStrip.trim() !== "" || m.en.promoStrip.trim() !== ""))}`,
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Home — portada principal"
        subtitle="La ruta pública es `/home` (entrada a la revista). La pantalla `/` es otra experiencia (selector de idioma) y no se edita aquí. Los avisos bajo el menú de todo el sitio están en Ajustes globales."
        eyebrow="Workspace · Home"
        helperText="Esta página solo resume lo guardado en la base (clave home_marketing). Para cambiar textos, enlaces y casillas, abre Contenido."
      />

      <div className={`${adminCardBase} mb-6 border-[#7A9E6F]/35 bg-[#F8FCF6] p-4`}>
        <p className="text-sm text-[#2C4A22]">
          <strong>Editor persistente:</strong>{" "}
          <Link href="/admin/workspace/home/content" className="font-bold underline">
            Abrir contenido de `/home`
          </Link>
          {" · "}
          <Link href="/admin/site-settings" className="font-bold underline">
            Ajustes globales del sitio
          </Link>{" "}
          (franjas bajo la navegación en todas las páginas).
        </p>
      </div>

      <p className="mb-4 text-xs text-[#7A7164]">
        Última actualización (BD): {updatedAt ? new Date(updatedAt).toLocaleString() : "—"}
      </p>

      <div className={`${adminCardBase} mb-8 p-6`}>
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Orden fijo en la plantilla `/home`</h2>
        <p className="mt-1 text-xs text-[#7A7164]">
          Los bloques siguen este orden en código; puedes encender/apagar y editar copy en Contenido. La única variación de orden es la fila de
          chips (debajo del titular vs. debajo del subtítulo).
        </p>
        <ul className="mt-4 space-y-3 text-sm text-[#3D3428]">
          {rows.map((r) => (
            <li key={r.step} className="rounded-2xl border border-[#E8DFD0]/80 bg-[#FFFCF7]/80 px-4 py-3">
              <p className="font-semibold text-[#1E1810]">{r.step}</p>
              <p className="mt-1 text-xs text-[#5C5346]/95">{r.detail}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className={`${adminCardBase} p-6`}>
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Casillas de visibilidad (resumen)</h2>
        <ul className="mt-3 grid gap-2 text-sm text-[#3D3428] sm:grid-cols-2">
          <li>Aviso superior: {yn(m.modules.showAnnouncement)}</li>
          <li>Imagen hero: {yn(m.modules.showHeroImage)}</li>
          <li>Línea secundaria / CTA secundario / soporte promo: {yn(m.modules.showSecondaryLine)}</li>
          <li>Enlaces destacados: {yn(m.modules.showCallouts)}</li>
        </ul>
      </div>

      <div className="mt-8">
        <Link href="/admin/workspace/home/content" className={`${adminBtnSecondary} inline-flex`}>
          Editar contenido de `/home` →
        </Link>
      </div>
    </div>
  );
}
