import Link from "next/link";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { adminBtnPrimary, adminBtnSecondary, adminCardBase, adminInputClass } from "@/app/admin/_components/adminTheme";
import { getSiteSectionPayload } from "@/app/lib/siteSectionContent/siteSectionContentData";
import type { NosotrosPayload } from "@/app/lib/siteSectionContent/payloadTypes";
import { saveNosotrosSectionAction } from "@/app/admin/nosotrosSectionActions";

export const dynamic = "force-dynamic";

export default async function AdminNosotrosContentPage(props: { searchParams?: Promise<{ saved?: string }> }) {
  const sp = props.searchParams ? await props.searchParams : {};
  const { payload, updatedAt } = await getSiteSectionPayload("nosotros");
  const patch = payload as unknown as NosotrosPayload;

  return (
    <div className="max-w-3xl space-y-6">
      <AdminPageHeader
        eyebrow="Workspace · Nosotros"
        title="Contenido — Nosotros (reserva)"
        subtitle="Persistido para cuando exista ruta pública /nosotros. Hoy el sitio puede no enlazar esta página aún."
        helperText="Los campos guían al equipo; publicar en el sitio requiere la plantilla de página."
        rightSlot={
          <Link href="/admin/workspace/nosotros" className={adminBtnSecondary}>
            ← Vista workspace
          </Link>
        }
      />

      {sp.saved === "1" ? (
        <div className={`${adminCardBase} border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-950`}>Guardado.</div>
      ) : null}

      <p className="text-xs text-[#7A7164]">Última actualización: {updatedAt ? new Date(updatedAt).toLocaleString() : "—"}</p>

      <form action={saveNosotrosSectionAction} className={`${adminCardBase} space-y-4 p-6`}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Titular ES" name="hero_title_es" defaultValue={patch.heroTitle?.es ?? ""} />
          <Field label="Titular EN" name="hero_title_en" defaultValue={patch.heroTitle?.en ?? ""} />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#5C5346]">Lead ES</label>
          <textarea name="lead_es" className={adminInputClass} rows={4} defaultValue={patch.lead?.es ?? ""} />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#5C5346]">Lead EN</label>
          <textarea name="lead_en" className={adminInputClass} rows={4} defaultValue={patch.lead?.en ?? ""} />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#5C5346]">Misión ES</label>
          <textarea name="mission_es" className={adminInputClass} rows={3} defaultValue={patch.mission?.es ?? ""} />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#5C5346]">Misión EN</label>
          <textarea name="mission_en" className={adminInputClass} rows={3} defaultValue={patch.mission?.en ?? ""} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="CTA ES" name="cta_es" defaultValue={patch.ctaPrimary?.es ?? ""} />
          <Field label="CTA EN" name="cta_en" defaultValue={patch.ctaPrimary?.en ?? ""} />
        </div>
        <button type="submit" className={adminBtnPrimary}>
          Guardar
        </button>
      </form>
    </div>
  );
}

function Field({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  return (
    <div>
      <label className="text-xs font-semibold text-[#5C5346]">{label}</label>
      <input name={name} className={adminInputClass} defaultValue={defaultValue} />
    </div>
  );
}
