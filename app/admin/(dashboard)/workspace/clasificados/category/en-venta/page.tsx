import Link from "next/link";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { adminBtnPrimary, adminBtnSecondary, adminCardBase, adminCtaChipSecondary, adminInputClass } from "@/app/admin/_components/adminTheme";
import { saveEnVentaCategoryContentAction } from "@/app/admin/clasificadosCategoryContentActions";
import { getSiteSectionPayload } from "@/app/lib/siteSectionContent/siteSectionContentData";
import { getEnVentaContentPatchForAdmin } from "@/app/lib/clasificados/enVentaCategoryContentServer";
import { getCategorySchema } from "@/app/clasificados/config/categorySchema";
import {
  mergeDetailFieldPatch,
  mergeEnVentaHubLanding,
  mergeEnVentaPublishHub,
} from "@/app/lib/clasificados/mergeClasificadosCategoryContent";
import { DETAIL_FIELDS } from "@/app/clasificados/config/publishDetailFields";

export const dynamic = "force-dynamic";

function Field({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  return (
    <div>
      <label className="text-xs font-semibold text-[#5C5346]">{label}</label>
      <input name={name} className={`${adminInputClass} mt-1`} defaultValue={defaultValue} />
    </div>
  );
}

export default async function AdminEnVentaCategoryContentPage(props: { searchParams?: Promise<{ saved?: string }> }) {
  const sp = props.searchParams ? await props.searchParams : {};
  const [{ updatedAt }, patch] = await Promise.all([
    getSiteSectionPayload("clasificados_category_content"),
    getEnVentaContentPatchForAdmin(),
  ]);

  const hubEs = mergeEnVentaHubLanding("es", patch);
  const hubEn = mergeEnVentaHubLanding("en", patch);
  const pubEs = mergeEnVentaPublishHub("es", patch);
  const pubEn = mergeEnVentaPublishHub("en", patch);

  const staffEs = patch?.staffModerationNotes?.es ?? "";
  const staffEn = patch?.staffModerationNotes?.en ?? "";

  const schema = getCategorySchema("en-venta");
  const queueHref = "/admin/workspace/clasificados?category=en-venta";

  return (
    <div className="max-w-4xl space-y-6">
      <AdminPageHeader
        eyebrow="Workspace · Clasificados · En Venta"
        title="Contenido — hub y publicar"
        subtitle="Edita textos bilingües, CTA, emoji/imagen de cabecera y metadatos del selector de planes. Los valores vacíos en un par ES/EN quitan el override y vuelven al texto base del código."
        helperText='Clave en BD: site_section_content.clasificados_category_content → categories["en-venta"]. La lógica de negocio y validación siguen en código.'
        rightSlot={
          <Link href="/admin/workspace/clasificados" className={adminBtnSecondary}>
            ← Hub Clasificados
          </Link>
        }
      />

      {sp.saved === "1" ? (
        <div className={`${adminCardBase} border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-950`}>Guardado.</div>
      ) : null}

      <p className="text-xs text-[#7A7164]">
        Última actualización (sección): {updatedAt ? new Date(updatedAt).toLocaleString() : "—"}
      </p>

      <div className={`${adminCardBase} flex flex-wrap gap-3 p-4`}>
        <Link href={queueHref} className={`${adminCtaChipSecondary} justify-center font-bold`}>
          Cola de anuncios (en-venta) →
        </Link>
        <Link href="/admin/reportes" className={`${adminCtaChipSecondary} justify-center`}>
          Reportes →
        </Link>
        <Link href="/admin/categories" className={`${adminCtaChipSecondary} justify-center`}>
          Registro de categorías →
        </Link>
      </div>

      {schema ? (
        <div className={`${adminCardBase} p-4 text-sm text-[#5C5346]`}>
          <p className="text-xs font-bold uppercase text-[#7A7164]">Esquema en código (referencia)</p>
          <dl className="mt-2 grid gap-2 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold text-[#3D3428]">Planes</dt>
              <dd className="font-mono text-[#1E1810]">{schema.plans.join(", ")}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-[#3D3428]">Grupo DETAIL_FIELDS</dt>
              <dd className="font-mono text-[#1E1810]">{schema.formFieldGroupKey ?? "—"}</dd>
            </div>
          </dl>
        </div>
      ) : null}

      <div className={`${adminCardBase} border-[#7A9E6F]/35 bg-[#F8FCF6] p-4 text-sm text-[#2C4A22]`}>
        <p>
          <strong>Rutas públicas afectadas por este formulario:</strong>{" "}
          <Link className="font-bold underline" href="/clasificados/en-venta" target="_blank" rel="noreferrer">
            /clasificados/en-venta
          </Link>{" "}
          (hub) y{" "}
          <Link className="font-bold underline" href="/clasificados/publicar/en-venta" target="_blank" rel="noreferrer">
            /clasificados/publicar/en-venta
          </Link>{" "}
          (selector de plan). Los textos del asistente publicar (pasos) siguen leyendo definiciones en código hasta que se conecten los
          overrides de campos al orquestador.
        </p>
      </div>

      <form action={saveEnVentaCategoryContentAction} className={`${adminCardBase} space-y-6 p-6`}>
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Hub — branding / hero</h2>
          <p className="mt-1 text-xs text-[#7A7164]">
            Emoji opcional delante del título; imagen opcional encima del logo. Rutas de imagen: <code className="rounded bg-[#FBF7EF] px-1">/</code> o{" "}
            <code className="rounded bg-[#FBF7EF] px-1">https://</code>.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Hero — ES" name="hub_hero_es" defaultValue={hubEs.hero} />
            <Field label="Hero — EN" name="hub_hero_en" defaultValue={hubEn.hero} />
            <Field label="Subtítulo — ES" name="hub_sub_es" defaultValue={hubEs.sub} />
            <Field label="Subtítulo — EN" name="hub_sub_en" defaultValue={hubEn.sub} />
            <Field label="Emoji hero (opcional)" name="hub_hero_emoji" defaultValue={hubEs.heroEmoji} />
            <Field label="URL imagen hero (opcional)" name="hub_hero_image_url" defaultValue={hubEs.heroImageUrl} />
          </div>
        </section>

        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Hub — búsqueda y CTAs</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Placeholder búsqueda — ES" name="hub_searchPh_es" defaultValue={hubEs.searchPh} />
            <Field label="Placeholder búsqueda — EN" name="hub_searchPh_en" defaultValue={hubEn.searchPh} />
            <Field label="Botón buscar — ES" name="hub_search_es" defaultValue={hubEs.search} />
            <Field label="Botón buscar — EN" name="hub_search_en" defaultValue={hubEn.search} />
            <Field label="Publicar — ES" name="hub_publish_es" defaultValue={hubEs.publish} />
            <Field label="Publicar — EN" name="hub_publish_en" defaultValue={hubEn.publish} />
            <Field label="Ver listados — ES" name="hub_lista_es" defaultValue={hubEs.lista} />
            <Field label="Ver listados — EN" name="hub_lista_en" defaultValue={hubEn.lista} />
            <Field label="Línea de confianza — ES" name="hub_trust_es" defaultValue={hubEs.trust} />
            <Field label="Línea de confianza — EN" name="hub_trust_en" defaultValue={hubEn.trust} />
          </div>
        </section>

        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Publicar — selector de plan (hub)</h2>
          <p className="mt-1 text-xs text-[#7A7164]">
            Textos de las tres tarjetas y el enlace “volver”. <strong>URL volver</strong> (solo ruta, p. ej.{" "}
            <code className="rounded bg-[#FBF7EF] px-1">/clasificados/publicar</code>) sustituye el destino por defecto.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Título — ES" name="pub_title_es" defaultValue={pubEs.title} />
            <Field label="Título — EN" name="pub_title_en" defaultValue={pubEn.title} />
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[#5C5346]">Subtítulo — ES</label>
              <textarea name="pub_subtitle_es" className={`${adminInputClass} mt-1`} rows={2} defaultValue={pubEs.subtitle} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[#5C5346]">Subtítulo — EN</label>
              <textarea name="pub_subtitle_en" className={`${adminInputClass} mt-1`} rows={2} defaultValue={pubEn.subtitle} />
            </div>
            <Field label="Gratis — título ES" name="pub_freeTitle_es" defaultValue={pubEs.freeTitle} />
            <Field label="Gratis — título EN" name="pub_freeTitle_en" defaultValue={pubEn.freeTitle} />
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[#5C5346]">Gratis — descripción ES</label>
              <textarea name="pub_freeDesc_es" className={`${adminInputClass} mt-1`} rows={2} defaultValue={pubEs.freeDesc} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[#5C5346]">Gratis — descripción EN</label>
              <textarea name="pub_freeDesc_en" className={`${adminInputClass} mt-1`} rows={2} defaultValue={pubEn.freeDesc} />
            </div>
            <Field label="Pro — título ES" name="pub_proTitle_es" defaultValue={pubEs.proTitle} />
            <Field label="Pro — título EN" name="pub_proTitle_en" defaultValue={pubEn.proTitle} />
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[#5C5346]">Pro — descripción ES</label>
              <textarea name="pub_proDesc_es" className={`${adminInputClass} mt-1`} rows={2} defaultValue={pubEs.proDesc} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[#5C5346]">Pro — descripción EN</label>
              <textarea name="pub_proDesc_en" className={`${adminInputClass} mt-1`} rows={2} defaultValue={pubEn.proDesc} />
            </div>
            <Field label="Storefront — título ES" name="pub_sfTitle_es" defaultValue={pubEs.sfTitle} />
            <Field label="Storefront — título EN" name="pub_sfTitle_en" defaultValue={pubEn.sfTitle} />
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[#5C5346]">Storefront — descripción ES</label>
              <textarea name="pub_sfDesc_es" className={`${adminInputClass} mt-1`} rows={2} defaultValue={pubEs.sfDesc} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[#5C5346]">Storefront — descripción EN</label>
              <textarea name="pub_sfDesc_en" className={`${adminInputClass} mt-1`} rows={2} defaultValue={pubEn.sfDesc} />
            </div>
            <Field label="Volver — ES" name="pub_back_es" defaultValue={pubEs.back} />
            <Field label="Volver — EN" name="pub_back_en" defaultValue={pubEn.back} />
            <Field label="Volver — href (ruta)" name="pub_back_href" defaultValue={pubEs.backHref} />
            <Field label="Carril Gratis — emoji" name="pub_lane_free_emoji" defaultValue={pubEs.laneFreeEmoji} />
            <Field label="Carril Pro — badge / texto" name="pub_lane_pro_badge" defaultValue={pubEs.laneProBadge} />
            <Field label="Carril Storefront — emoji" name="pub_lane_sf_emoji" defaultValue={pubEs.laneSfEmoji} />
          </div>
          <p className="mt-2 text-xs text-[#7A7164]">
            El conmutador de idioma en la página publicar usa textos fijos en código (ES/EN) salvo que ampliemos el modelo.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Campos del formulario publicar (overrides)</h2>
          <p className="mt-1 text-xs text-[#7A7164]">
            Etiquetas / placeholders / ayuda por campo (grupo <code className="rounded bg-[#FBF7EF] px-1">en-venta</code> en código). En el sitio
            público, el asistente Gratis/Pro en{" "}
            <code className="rounded bg-[#FBF7EF] px-1">/clasificados/publicar/en-venta/free|pro</code> fusiona estos valores en servidor y los
            aplica en los pasos (categoría, precio, entrega, contacto, etc.). <code className="rounded bg-[#FBF7EF] px-1">getPublishCategoryFields</code>{" "}
            también acepta los mismos overrides para anexos / utilidades que los pasen.
          </p>
          <div className="mt-4 space-y-6">
            {(DETAIL_FIELDS["en-venta"] ?? []).map((row) => {
              const mEs = mergeDetailFieldPatch(row.label, row.placeholder, patch?.detailFields?.[row.key], "es");
              const mEn = mergeDetailFieldPatch(row.label, row.placeholder, patch?.detailFields?.[row.key], "en");
              return (
                <div key={row.key} className="rounded-xl border border-[#E8DFD0]/80 bg-[#FFFCF7]/80 p-4">
                  <p className="font-mono text-[11px] font-bold text-[#7A7164]">
                    {row.key} · {row.type}
                  </p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <Field label="Etiqueta ES" name={`df_${row.key}_label_es`} defaultValue={mEs.label} />
                    <Field label="Etiqueta EN" name={`df_${row.key}_label_en`} defaultValue={mEn.label} />
                    <Field label="Placeholder ES" name={`df_${row.key}_ph_es`} defaultValue={mEs.placeholder ?? ""} />
                    <Field label="Placeholder EN" name={`df_${row.key}_ph_en`} defaultValue={mEn.placeholder ?? ""} />
                    <Field label="Ayuda ES (opcional)" name={`df_${row.key}_help_es`} defaultValue={mEs.help ?? ""} />
                    <Field label="Ayuda EN (opcional)" name={`df_${row.key}_help_en`} defaultValue={mEn.help ?? ""} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Notas internas (moderación)</h2>
          <p className="mt-1 text-xs text-[#7A7164]">No se muestran en la web pública con la plantilla actual; sirven como referencia para el equipo.</p>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-[#5C5346]">ES</label>
              <textarea name="staff_mod_es" className={`${adminInputClass} mt-1`} rows={3} defaultValue={staffEs} />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#5C5346]">EN</label>
              <textarea name="staff_mod_en" className={`${adminInputClass} mt-1`} rows={3} defaultValue={staffEn} />
            </div>
          </div>
        </section>

        <button type="submit" className={adminBtnPrimary}>
          Guardar
        </button>
      </form>

      <div className="flex flex-wrap gap-3">
        <Link href="/admin/workspace/clasificados" className={adminBtnSecondary}>
          ← Hub Clasificados
        </Link>
      </div>
    </div>
  );
}
