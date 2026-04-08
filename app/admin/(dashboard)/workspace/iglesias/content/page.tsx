import Link from "next/link";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { adminBtnPrimary, adminBtnSecondary, adminCardBase, adminInputClass } from "@/app/admin/_components/adminTheme";
import { getSiteSectionPayload } from "@/app/lib/siteSectionContent/siteSectionContentData";
import type { IglesiasPagePayload } from "@/app/lib/siteSectionContent/payloadTypes";
import { mergeIglesiasPagePayload } from "@/app/lib/siteSectionContent/iglesiasPageMerge";
import { saveIglesiasPageAction } from "@/app/admin/sectionPageActions";

export const dynamic = "force-dynamic";

export default async function AdminIglesiasContentPage(props: { searchParams?: Promise<{ saved?: string }> }) {
  const sp = props.searchParams ? await props.searchParams : {};
  const { payload, updatedAt } = await getSiteSectionPayload("iglesias_page");
  const patch = payload as unknown as IglesiasPagePayload;
  const m = mergeIglesiasPagePayload(payload);

  return (
    <div className="max-w-3xl space-y-6">
      <AdminPageHeader
        eyebrow="Workspace · Iglesias"
        title="Página `/iglesias` — copy transicional"
        subtitle="Hasta que exista directorio con filas en base de datos, esta copia sustituye el texto de la landing. Sin listados editables aquí."
        helperText="site_section_content → iglesias_page. Vacío = defaults del código."
        rightSlot={
          <Link href="/admin/workspace/iglesias" className={adminBtnSecondary}>
            ← Vista workspace
          </Link>
        }
      />

      {sp.saved === "1" ? (
        <div className={`${adminCardBase} border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-950`}>Guardado.</div>
      ) : null}

      <p className="text-xs text-[#7A7164]">Última actualización: {updatedAt ? new Date(updatedAt).toLocaleString() : "—"}</p>

      <p className="text-xs text-[#5C5346]">
        <a href="/iglesias" className="font-bold text-[#6B5B2E] underline" target="_blank" rel="noreferrer">
          Abrir /iglesias
        </a>
      </p>

      <form action={saveIglesiasPageAction} className={`${adminCardBase} space-y-4 p-6`}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Título ES" name="title_es" defaultValue={patch.title?.es ?? ""} placeholder={m.es.title} />
          <Field label="Título EN" name="title_en" defaultValue={patch.title?.en ?? ""} placeholder={m.en.title} />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#5C5346]">Subtítulo ES</label>
          <textarea name="subtitle_es" className={adminInputClass} rows={4} defaultValue={patch.subtitle?.es ?? ""} placeholder={m.es.subtitle} />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#5C5346]">Subtítulo EN</label>
          <textarea name="subtitle_en" className={adminInputClass} rows={4} defaultValue={patch.subtitle?.en ?? ""} placeholder={m.en.subtitle} />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#5C5346]">Nota / CTA secundaria ES</label>
          <textarea name="note_es" className={adminInputClass} rows={3} defaultValue={patch.note?.es ?? ""} placeholder={m.es.note} />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#5C5346]">Nota / CTA secundaria EN</label>
          <textarea name="note_en" className={adminInputClass} rows={3} defaultValue={patch.note?.en ?? ""} placeholder={m.en.note} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Texto botón volver ES" name="back_es" defaultValue={patch.backCta?.es ?? ""} placeholder={m.es.backCta} />
          <Field label="Back button EN" name="back_en" defaultValue={patch.backCta?.en ?? ""} placeholder={m.en.backCta} />
        </div>
        <button type="submit" className={adminBtnPrimary}>
          Guardar
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
