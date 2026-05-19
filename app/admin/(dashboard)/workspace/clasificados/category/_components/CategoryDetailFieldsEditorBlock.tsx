import Link from "next/link";
import { adminBtnPrimary, adminBtnSecondary, adminCardBase, adminCtaChipSecondary, adminInputClass } from "@/app/admin/_components/adminTheme";
import { saveCategoryDetailFieldsContentAction } from "@/app/admin/clasificadosCategoryContentActions";
import { getSiteSectionPayload } from "@/app/lib/siteSectionContent/siteSectionContentData";
import type {
  ClasificadosCategoryContentRootPayload,
  ClasificadosCategoryDetailOnlyPatch,
} from "@/app/lib/clasificados/clasificadosCategoryContentTypes";
import { extractCategoryPatch, mergeDetailFieldPatch } from "@/app/lib/clasificados/mergeClasificadosCategoryContent";
import { DETAIL_FIELDS } from "@/app/clasificados/config/publishDetailFields";
import { adminCategoryWorkspaceQueueHref } from "@/app/admin/_lib/adminCategoryWorkspaceQueueHref";

function Field({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  return (
    <div>
      <label className="text-xs font-semibold text-[#5C5346]">{label}</label>
      <input name={name} className={`${adminInputClass} mt-1`} defaultValue={defaultValue} />
    </div>
  );
}

const EDITOR_SLUGS = new Set([
  "autos",
  "rentas",
  "servicios",
  "empleos",
  "restaurantes",
  "clases",
  "comunidad",
  "mascotas-y-perdidos",
  "travel",
  "bienes-raices",
]);

export async function CategoryDetailFieldsEditorBlock(props: {
  slug: string;
  searchParams?: Promise<{ saved?: string }>;
}) {
  const slug = props.slug;
  if (!EDITOR_SLUGS.has(slug)) return null;

  const sp = props.searchParams ? await props.searchParams : {};
  const [{ payload, updatedAt }] = await Promise.all([getSiteSectionPayload("clasificados_category_content")]);
  const root = payload as unknown as ClasificadosCategoryContentRootPayload;
  const rawPatch = extractCategoryPatch(root, slug) as ClasificadosCategoryDetailOnlyPatch | undefined;
  const patch = rawPatch ?? {};

  const rows = DETAIL_FIELDS[slug] ?? [];
  const title =
    slug === "travel"
      ? "Viajes (travel)"
      : slug === "bienes-raices"
        ? "Bienes raíces"
        : slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");

  const queueHref = adminCategoryWorkspaceQueueHref(slug);

  return (
    <div className="space-y-6">
      {sp.saved === "1" ? (
        <div className={`${adminCardBase} border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-950`}>Guardado.</div>
      ) : null}

      <p className="text-xs text-[#7A7164]">Última actualización (sección): {updatedAt ? new Date(updatedAt).toLocaleString() : "—"}</p>

      <div className={`${adminCardBase} flex flex-wrap gap-3 p-4`}>
        <Link href={queueHref} className={`${adminCtaChipSecondary} justify-center text-xs font-bold`}>
          Cola de anuncios →
        </Link>
        <Link href="/admin/reportes" className={`${adminCtaChipSecondary} justify-center text-xs`}>
          Reportes →
        </Link>
      </div>

      {slug === "rentas" || slug === "bienes-raices" ? (
        <div className={`${adminCardBase} border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950`}>
          {slug === "rentas"
            ? "Rentas usa filas dinámicas según subcategoría y tipo — DETAIL_FIELDS.rentas está vacío en código. Aquí puedes guardar notas internas hasta que definamos claves estables para overrides."
            : "Bienes raíces usa formularios BR dinámicos — DETAIL_FIELDS está vacío salvo que alineemos claves con el orquestador. Puedes guardar notas de moderación."}
        </div>
      ) : null}

      {slug === "clases" || slug === "comunidad" || slug === "mascotas-y-perdidos" ? (
        <div className={`${adminCardBase} border-sky-200 bg-sky-50/90 p-4 text-sm text-sky-950`}>
          Esta categoría aún no tiene filas en <code className="rounded bg-white/80 px-1">DETAIL_FIELDS</code>. Puedes dejar notas de staff;
          cuando existan campos en código, aparecerán aquí automáticamente.
        </div>
      ) : null}

      <form action={saveCategoryDetailFieldsContentAction} className={`${adminCardBase} space-y-6 p-6`}>
        <input type="hidden" name="category_slug" value={slug} />
        <p className="text-xs text-[#7A7164]">
          Editor de contenido — <strong>{title}</strong>. Persistido en{" "}
          <code className="rounded bg-[#FBF7EF] px-1">site_section_content.clasificados_category_content</code> →{" "}
          <code className="rounded bg-[#FBF7EF] px-1">categories[&quot;{slug}&quot;]</code>.
        </p>

        {rows.length ? (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Campos (DETAIL_FIELDS)</h2>
            <div className="mt-4 space-y-6">
              {rows.map((row) => {
                const mEs = mergeDetailFieldPatch(row.label, row.placeholder, patch.detailFields?.[row.key], "es");
                const mEn = mergeDetailFieldPatch(row.label, row.placeholder, patch.detailFields?.[row.key], "en");
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
                      <Field label="Ayuda ES" name={`df_${row.key}_help_es`} defaultValue={mEs.help ?? ""} />
                      <Field label="Ayuda EN" name={`df_${row.key}_help_en`} defaultValue={mEn.help ?? ""} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Notas internas (moderación)</h2>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-[#5C5346]">ES</label>
              <textarea
                name="staff_mod_es"
                className={`${adminInputClass} mt-1`}
                rows={3}
                defaultValue={patch.staffModerationNotes?.es ?? ""}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#5C5346]">EN</label>
              <textarea
                name="staff_mod_en"
                className={`${adminInputClass} mt-1`}
                rows={3}
                defaultValue={patch.staffModerationNotes?.en ?? ""}
              />
            </div>
          </div>
        </section>

        <button type="submit" className={adminBtnPrimary}>
          Guardar
        </button>
      </form>

      <Link href="/admin/workspace/clasificados" className={adminBtnSecondary}>
        ← Hub Clasificados
      </Link>
    </div>
  );
}
