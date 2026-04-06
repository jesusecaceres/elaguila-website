import Link from "next/link";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { adminBtnPrimary, adminBtnSecondary, adminCardBase, adminInputClass } from "@/app/admin/_components/adminTheme";
import { getSiteSectionPayload } from "@/app/lib/siteSectionContent/siteSectionContentData";
import type { ContactoPayload } from "@/app/lib/siteSectionContent/payloadTypes";
import { mergeContactoCopy } from "@/app/lib/siteSectionContent/contactoMerge";
import { saveContactoSectionAction } from "@/app/admin/contactoSectionActions";

export const dynamic = "force-dynamic";

export default async function AdminContactoContentPage(props: { searchParams?: Promise<{ saved?: string }> }) {
  const sp = props.searchParams ? await props.searchParams : {};
  const { payload, updatedAt } = await getSiteSectionPayload("contacto");
  const patch = payload as unknown as ContactoPayload;
  const es = mergeContactoCopy("es", patch);
  const en = mergeContactoCopy("en", patch);

  return (
    <div className="max-w-3xl space-y-6">
      <AdminPageHeader
        eyebrow="Workspace · Contacto"
        title="Página `/contacto`"
        subtitle="Textos de introducción, horario, correo visible y avisos. El formulario sigue siendo el componente global; la lógica de envío no cambia aquí."
        helperText="Vacío = texto por defecto del código. El email público sigue siendo mailto salvo que indiques otro."
        rightSlot={
          <Link href="/admin/workspace/contacto" className={adminBtnSecondary}>
            ← Vista workspace
          </Link>
        }
      />

      {sp.saved === "1" ? (
        <div className={`${adminCardBase} border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-950`}>Guardado.</div>
      ) : null}

      <p className="text-xs text-[#7A7164]">Última actualización: {updatedAt ? new Date(updatedAt).toLocaleString() : "—"}</p>

      <form action={saveContactoSectionAction} className={`${adminCardBase} space-y-4 p-6`}>
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Introducción</h2>
        <div className="grid gap-3">
          <div>
            <label className="text-xs font-semibold text-[#5C5346]">Intro ES</label>
            <textarea name="intro_es" className={adminInputClass} rows={3} defaultValue={patch.intro?.es ?? ""} placeholder={es.intro} />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#5C5346]">Intro EN</label>
            <textarea name="intro_en" className={adminInputClass} rows={3} defaultValue={patch.intro?.en ?? ""} placeholder={en.intro} />
          </div>
        </div>
        <h2 className="pt-2 text-sm font-bold uppercase tracking-wide text-[#5C5346]">Horario</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Horario ES" name="hours_es" defaultValue={patch.hours?.es ?? ""} placeholder={es.hours} />
          <Field label="Horario EN" name="hours_en" defaultValue={patch.hours?.en ?? ""} placeholder={en.hours} />
        </div>
        <h2 className="pt-2 text-sm font-bold uppercase tracking-wide text-[#5C5346]">Datos</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Email visible" name="email" defaultValue={patch.email ?? ""} placeholder={es.email} />
          <Field label="Teléfono (línea libre)" name="phone" defaultValue={patch.phone ?? ""} />
        </div>
        <div className="grid gap-3">
          <div>
            <label className="text-xs font-semibold text-[#5C5346]">Dirección ES</label>
            <textarea name="address_es" className={adminInputClass} rows={2} defaultValue={patch.address?.es ?? ""} />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#5C5346]">Dirección EN</label>
            <textarea name="address_en" className={adminInputClass} rows={2} defaultValue={patch.address?.en ?? ""} />
          </div>
          <Field label="URL de mapa (opcional)" name="map_url" defaultValue={patch.mapUrl ?? ""} />
        </div>
        <h2 className="pt-2 text-sm font-bold uppercase tracking-wide text-[#5C5346]">Aviso superior (opcional)</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Aviso ES" name="notice_es" defaultValue={patch.noticeBanner?.es ?? ""} />
          <Field label="Aviso EN" name="notice_en" defaultValue={patch.noticeBanner?.en ?? ""} />
        </div>
        <button type="submit" className={`${adminBtnPrimary} mt-4`}>
          Guardar contacto
        </button>
      </form>
    </div>
  );
}

function Field({ label, name, defaultValue, placeholder }: { label: string; name: string; defaultValue: string; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs font-semibold text-[#5C5346]">{label}</label>
      <input name={name} className={adminInputClass} defaultValue={defaultValue} placeholder={placeholder} />
    </div>
  );
}
