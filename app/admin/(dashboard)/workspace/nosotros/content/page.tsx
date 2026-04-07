import Link from "next/link";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { adminBtnPrimary, adminBtnSecondary, adminCardBase, adminInputClass } from "@/app/admin/_components/adminTheme";
import { getSiteSectionPayload } from "@/app/lib/siteSectionContent/siteSectionContentData";
import type { NosotrosPayload } from "@/app/lib/siteSectionContent/payloadTypes";
import { mergeNosotrosCopy } from "@/app/lib/siteSectionContent/nosotrosMerge";
import { saveNosotrosSectionAction } from "@/app/admin/nosotrosSectionActions";

export const dynamic = "force-dynamic";

export default async function AdminNosotrosContentPage(props: { searchParams?: Promise<{ saved?: string }> }) {
  const sp = props.searchParams ? await props.searchParams : {};
  const { payload, updatedAt } = await getSiteSectionPayload("nosotros");
  const patch = payload as unknown as NosotrosPayload;
  const m = mergeNosotrosCopy(patch);

  return (
    <div className="max-w-3xl space-y-6">
      <AdminPageHeader
        eyebrow="Workspace · Nosotros"
        title="Contenido público — `/about`"
        subtitle="Esta copia alimenta la página “Sobre…” en el sitio. CTAs usan rutas internas salvo que indiques otra URL."
        helperText="Vacío = texto base del código. Imagen opcional (https o /ruta)."
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

      <p className="text-xs text-[#5C5346]">
        Vista previa ES: <strong>{m.es.heroTitle}</strong> —{" "}
        <a href="/about?lang=es" className="font-bold text-[#6B5B2E] underline" target="_blank" rel="noreferrer">
          Abrir /about
        </a>
      </p>

      <form action={saveNosotrosSectionAction} className={`${adminCardBase} space-y-4 p-6`}>
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Hero</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Titular ES" name="hero_title_es" defaultValue={patch.heroTitle?.es ?? ""} placeholder={m.es.heroTitle} />
          <Field label="Titular EN" name="hero_title_en" defaultValue={patch.heroTitle?.en ?? ""} placeholder={m.en.heroTitle} />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#5C5346]">Párrafo principal ES</label>
          <textarea name="lead_es" className={adminInputClass} rows={4} defaultValue={patch.lead?.es ?? ""} />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#5C5346]">Párrafo principal EN</label>
          <textarea name="lead_en" className={adminInputClass} rows={4} defaultValue={patch.lead?.en ?? ""} />
        </div>

        <h2 className="pt-4 text-sm font-bold uppercase tracking-wide text-[#5C5346]">Imagen (opcional)</h2>
        <Field label="URL imagen" name="media_src" defaultValue={patch.mediaImageSrc ?? ""} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Alt ES" name="media_alt_es" defaultValue={patch.mediaImageAlt?.es ?? ""} />
          <Field label="Alt EN" name="media_alt_en" defaultValue={patch.mediaImageAlt?.en ?? ""} />
        </div>

        <h2 className="pt-4 text-sm font-bold uppercase tracking-wide text-[#5C5346]">Misión / visión / valores</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-[#5C5346]">Misión ES</label>
            <textarea name="mission_es" className={adminInputClass} rows={3} defaultValue={patch.mission?.es ?? ""} />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#5C5346]">Misión EN</label>
            <textarea name="mission_en" className={adminInputClass} rows={3} defaultValue={patch.mission?.en ?? ""} />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#5C5346]">Visión ES</label>
            <textarea name="vision_es" className={adminInputClass} rows={3} defaultValue={patch.vision?.es ?? ""} />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#5C5346]">Visión EN</label>
            <textarea name="vision_en" className={adminInputClass} rows={3} defaultValue={patch.vision?.en ?? ""} />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-[#5C5346]">Valores ES (puede ser varias líneas)</label>
          <textarea name="values_es" className={adminInputClass} rows={4} defaultValue={patch.values?.es ?? ""} />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#5C5346]">Valores EN</label>
          <textarea name="values_en" className={adminInputClass} rows={4} defaultValue={patch.values?.en ?? ""} />
        </div>

        <h2 className="pt-4 text-sm font-bold uppercase tracking-wide text-[#5C5346]">Botones</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="CTA primario ES" name="cta_primary_es" defaultValue={patch.ctaPrimary?.es ?? ""} />
          <Field label="CTA primario EN" name="cta_primary_en" defaultValue={patch.ctaPrimary?.en ?? ""} />
          <Field label="CTA secundario ES" name="cta_secondary_es" defaultValue={patch.ctaSecondary?.es ?? ""} />
          <Field label="CTA secundario EN" name="cta_secondary_en" defaultValue={patch.ctaSecondary?.en ?? ""} />
          <Field label="URL CTA primario" name="cta_primary_href" defaultValue={patch.ctaPrimaryHref ?? "/contacto"} />
          <Field label="URL CTA secundario" name="cta_secondary_href" defaultValue={patch.ctaSecondaryHref ?? "/tienda"} />
        </div>

        <button type="submit" className={adminBtnPrimary}>
          Guardar
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-[#5C5346]">{label}</label>
      <input name={name} className={adminInputClass} defaultValue={defaultValue} placeholder={placeholder} />
    </div>
  );
}
