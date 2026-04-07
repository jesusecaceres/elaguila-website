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
        subtitle="Titular, introducción, datos y aviso. El formulario de envío sigue siendo el componente global (webhook/API no se edita aquí)."
        helperText="Vacío = texto por defecto del código. El bloque Tienda puede personalizarse abajo."
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
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Titular</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="H1 ES" name="headline_es" defaultValue={patch.headline?.es ?? ""} placeholder={es.h1} />
          <Field label="H1 EN" name="headline_en" defaultValue={patch.headline?.en ?? ""} placeholder={en.h1} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-[#5C5346]">Subtítulo ES (opcional)</label>
            <textarea name="subhead_es" className={adminInputClass} rows={2} defaultValue={patch.subheadline?.es ?? ""} />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#5C5346]">Subtítulo EN (opcional)</label>
            <textarea name="subhead_en" className={adminInputClass} rows={2} defaultValue={patch.subheadline?.en ?? ""} />
          </div>
        </div>

        <h2 className="pt-2 text-sm font-bold uppercase tracking-wide text-[#5C5346]">Introducción</h2>
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
          <Field label="URL de mapa (Maps u otra)" name="map_url" defaultValue={patch.mapUrl ?? ""} />
        </div>
        <h2 className="pt-2 text-sm font-bold uppercase tracking-wide text-[#5C5346]">Aviso superior (opcional)</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Aviso ES" name="notice_es" defaultValue={patch.noticeBanner?.es ?? ""} />
          <Field label="Aviso EN" name="notice_en" defaultValue={patch.noticeBanner?.en ?? ""} />
        </div>

        <h2 className="pt-2 text-sm font-bold uppercase tracking-wide text-[#5C5346]">Tarjeta Tienda (bloque medio)</h2>
        <p className="text-xs text-[#7A7164]">Textos del recuadro que enlaza a la ayuda de Tienda. Vacío = valores por defecto.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Título ES" name="tienda_title_es" defaultValue={patch.tiendaCard?.title?.es ?? ""} placeholder={es.tiendaTitle} />
          <Field label="Título EN" name="tienda_title_en" defaultValue={patch.tiendaCard?.title?.en ?? ""} placeholder={en.tiendaTitle} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-[#5C5346]">Cuerpo ES</label>
            <textarea name="tienda_body_es" className={adminInputClass} rows={2} defaultValue={patch.tiendaCard?.body?.es ?? ""} placeholder={es.tiendaBody} />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#5C5346]">Cuerpo EN</label>
            <textarea name="tienda_body_en" className={adminInputClass} rows={2} defaultValue={patch.tiendaCard?.body?.en ?? ""} placeholder={en.tiendaBody} />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="CTA ES" name="tienda_cta_es" defaultValue={patch.tiendaCard?.cta?.es ?? ""} placeholder={es.tiendaCta} />
          <Field label="CTA EN" name="tienda_cta_en" defaultValue={patch.tiendaCard?.cta?.en ?? ""} placeholder={en.tiendaCta} />
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
