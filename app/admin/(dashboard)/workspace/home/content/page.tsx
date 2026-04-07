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

  const callouts = [...(patch.featuredCallouts ?? [])];
  while (callouts.length < 5) {
    callouts.push({ labelEs: "", labelEn: "", href: "" });
  }

  return (
    <div className="max-w-3xl space-y-6">
      <AdminPageHeader
        eyebrow="Workspace · Home"
        title="Portada `/home` — textos, enlaces y módulos"
        subtitle="Controla el hero de la entrada a la revista, avisos, franja promocional y enlaces destacados. Los avisos de todo el sitio (navbar) están en Ajustes globales."
        helperText="Los campos vacíos vuelven al texto base del código. Las casillas controlan qué bloques se muestran (no crean nuevos tipos de sección en código)."
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

        <h2 className="pt-4 text-sm font-bold uppercase tracking-wide text-[#5C5346]">Aviso superior (opcional)</h2>
        <p className="text-xs text-[#7A7164]">Franja fina sobre el hero — operativo o promo corta.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-[#5C5346]">Aviso ES</label>
            <textarea name="announce_es" className={adminInputClass} rows={2} defaultValue={patch.announcementBar?.es ?? ""} />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#5C5346]">Aviso EN</label>
            <textarea name="announce_en" className={adminInputClass} rows={2} defaultValue={patch.announcementBar?.en ?? ""} />
          </div>
        </div>

        <h2 className="pt-4 text-sm font-bold uppercase tracking-wide text-[#5C5346]">CTAs y enlaces</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="CTA primario ES" name="cta_primary_es" defaultValue={m.es.ctaPrimary} />
          <Field label="CTA primario EN" name="cta_primary_en" defaultValue={m.en.ctaPrimary} />
          <Field label="CTA secundario ES (texto)" name="cta_secondary_es" defaultValue={m.es.ctaSecondary} />
          <Field label="CTA secundario EN (texto)" name="cta_secondary_en" defaultValue={m.en.ctaSecondary} />
          <Field
            label="URL CTA primario (vacío = revista con idioma)"
            name="cta_primary_href"
            defaultValue={patch.ctaPrimaryHref ?? ""}
          />
          <Field
            label="URL CTA secundario (vacío = solo texto)"
            name="cta_secondary_href"
            defaultValue={patch.ctaSecondaryHref ?? ""}
          />
        </div>

        <h2 className="pt-4 text-sm font-bold uppercase tracking-wide text-[#5C5346]">Franja bajo el botón (opcional)</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-[#5C5346]">Promo / nota ES</label>
            <textarea name="promo_es" className={adminInputClass} rows={2} defaultValue={patch.promoStrip?.es ?? ""} />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#5C5346]">Promo / nota EN</label>
            <textarea name="promo_en" className={adminInputClass} rows={2} defaultValue={patch.promoStrip?.en ?? ""} />
          </div>
        </div>

        <h2 className="pt-4 text-sm font-bold uppercase tracking-wide text-[#5C5346]">Imagen de portada</h2>
        <Field label="URL o ruta (/… o https://)" name="cover_image_src" defaultValue={m.coverImageSrc} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Alt imagen ES" name="cover_alt_es" defaultValue={m.es.coverAlt} />
          <Field label="Alt imagen EN" name="cover_alt_en" defaultValue={m.en.coverAlt} />
        </div>

        <h2 className="pt-4 text-sm font-bold uppercase tracking-wide text-[#5C5346]">Visibilidad de bloques (plantilla actual)</h2>
        <div className="grid gap-2 text-sm text-[#3D3428]">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="mod_ann" defaultChecked={m.modules.showAnnouncement} className="h-4 w-4 rounded border-[#E8DFD0]" />
            Mostrar franja de aviso (si hay texto)
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="mod_hero_img" defaultChecked={m.modules.showHeroImage} className="h-4 w-4 rounded border-[#E8DFD0]" />
            Mostrar imagen grande del hero
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="mod_secondary" defaultChecked={m.modules.showSecondaryLine} className="h-4 w-4 rounded border-[#E8DFD0]" />
            Mostrar línea secundaria / promo bajo el CTA
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="mod_callouts" defaultChecked={m.modules.showCallouts} className="h-4 w-4 rounded border-[#E8DFD0]" />
            Mostrar enlaces destacados (chips)
          </label>
        </div>

        <h2 className="pt-4 text-sm font-bold uppercase tracking-wide text-[#5C5346]">Enlaces destacados (hasta 5)</h2>
        <p className="text-xs text-[#7A7164]">
          Rutas manuales (p. ej. a Clasificados). Debe empezar con <code className="rounded bg-[#FBF7EF] px-1">/</code> o{" "}
          <code className="rounded bg-[#FBF7EF] px-1">https://</code>. El orden guardado es el de los renglones #1–#5 (de izquierda a
          derecha en la página).
        </p>
        <div>
          <label className="text-xs font-semibold text-[#5C5346]">Posición de la fila de chips en el hero</label>
          <select name="callouts_placement" className={`${adminInputClass} mt-1`} defaultValue={m.calloutsPlacement}>
            <option value="below_precedent">Debajo de identidad y subtítulo (plantilla clásica)</option>
            <option value="below_title">Justo debajo del titular principal</option>
          </select>
          <p className="mt-1 text-xs text-[#7A7164]">Solo afecta `/home`; no cambia categorías de Tienda ni Clasificados automáticamente.</p>
        </div>
        {callouts.slice(0, 5).map((c, idx) => (
          <div key={idx} className="grid gap-2 rounded-xl border border-[#E8DFD0]/80 bg-[#FFFCF7]/80 p-3 sm:grid-cols-3">
            <Field label={`Etiqueta ES #${idx + 1}`} name={`callout_${idx + 1}_es`} defaultValue={c.labelEs} />
            <Field label={`Etiqueta EN #${idx + 1}`} name={`callout_${idx + 1}_en`} defaultValue={c.labelEn} />
            <Field label="URL" name={`callout_${idx + 1}_href`} defaultValue={c.href} />
          </div>
        ))}

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
