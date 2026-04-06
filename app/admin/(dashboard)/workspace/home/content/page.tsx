import Link from "next/link";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { adminBtnPrimary, adminBtnSecondary, adminCardBase, adminInputClass } from "@/app/admin/_components/adminTheme";
import { getSiteSectionPayload } from "@/app/lib/siteSectionContent/siteSectionContentData";
import type { HomeMarketingPayload } from "@/app/lib/siteSectionContent/payloadTypes";
import { mergeHomeMarketing } from "@/app/lib/siteSectionContent/homeMarketingMerge";
import { saveHomeMarketingAction } from "@/app/admin/homeMarketingActions";

export const dynamic = "force-dynamic";

export default async function AdminHomeContentPage(props: { searchParams?: Promise<{ saved?: string }> }) {
  const sp = props.searchParams ? await props.searchParams : {};
  const { payload, updatedAt } = await getSiteSectionPayload("home_marketing");
  const patch = payload as unknown as HomeMarketingPayload;
  const m = mergeHomeMarketing(patch);

  return (
    <div className="max-w-3xl space-y-6">
      <AdminPageHeader
        eyebrow="Workspace · Home"
        title="Portada `/home` — textos e imagen"
        subtitle="Controla el hero de la entrada principal (revista). Los módulos transversales del sitio siguen en Ajustes globales."
        helperText="Los campos vacíos vuelven al texto base del código. La imagen por defecto es /home_thumbnail.png."
        rightSlot={
          <Link href="/admin/workspace/home" className={adminBtnSecondary}>
            ← Vista Home workspace
          </Link>
        }
      />

      {sp.saved === "1" ? (
        <div className={`${adminCardBase} border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-950`}>Guardado.</div>
      ) : null}

      <p className="text-xs text-[#7A7164]">Última actualización: {updatedAt ? new Date(updatedAt).toLocaleString() : "—"}</p>

      <form action={saveHomeMarketingAction} className={`${adminCardBase} space-y-4 p-6`}>
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Marca y titulares</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Título ES" name="title_es" defaultValue={m.es.title} />
          <Field label="Título EN" name="title_en" defaultValue={m.en.title} />
          <Field label="Identidad ES" name="identity_es" defaultValue={m.es.identity} />
          <Field label="Identidad EN" name="identity_en" defaultValue={m.en.identity} />
          <Field label="Subtítulo ES" name="precedent_es" defaultValue={m.es.precedent} />
          <Field label="Subtítulo EN" name="precedent_en" defaultValue={m.en.precedent} />
        </div>
        <h2 className="pt-4 text-sm font-bold uppercase tracking-wide text-[#5C5346]">CTAs</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="CTA primario ES" name="cta_primary_es" defaultValue={m.es.ctaPrimary} />
          <Field label="CTA primario EN" name="cta_primary_en" defaultValue={m.en.ctaPrimary} />
          <Field label="CTA secundario ES" name="cta_secondary_es" defaultValue={m.es.ctaSecondary} />
          <Field label="CTA secundario EN" name="cta_secondary_en" defaultValue={m.en.ctaSecondary} />
        </div>
        <h2 className="pt-4 text-sm font-bold uppercase tracking-wide text-[#5C5346]">Imagen de portada</h2>
        <Field label="URL o ruta (/… o https://)" name="cover_image_src" defaultValue={m.coverImageSrc} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Alt imagen ES" name="cover_alt_es" defaultValue={m.es.coverAlt} />
          <Field label="Alt imagen EN" name="cover_alt_en" defaultValue={m.en.coverAlt} />
        </div>
        <button type="submit" className={`${adminBtnPrimary} mt-4`}>
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
