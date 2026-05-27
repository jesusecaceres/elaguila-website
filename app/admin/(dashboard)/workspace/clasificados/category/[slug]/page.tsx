import Link from "next/link";
import { notFound } from "next/navigation";
import { ADMIN_CATEGORIES_ADVANCED_REGISTRY_HREF } from "@/app/admin/_lib/adminGlobalNav";
import { getCategorySchema } from "@/app/clasificados/config/categorySchema";
import { getClasificadosCategoryRegistryMerged } from "@/app/lib/clasificados/clasificadosCategoryRegistry";
import { AdminSectionCard } from "@/app/admin/_components/AdminSectionCard";
import { adminCardBase, adminCtaChipSecondary } from "@/app/admin/_components/adminTheme";
import { EnVentaModerationFields } from "@/app/clasificados/en-venta/admin/EnVentaModerationFields";
import { adminCategoryWorkspaceQueueHref } from "@/app/admin/_lib/adminCategoryWorkspaceQueueHref";
import { clasificadosQueueSurfaceForSlug } from "@/app/admin/(dashboard)/workspace/clasificados/_lib/clasificadosQueueSurfaceMeta";
import { ClasificadosQueueHeader } from "@/app/admin/(dashboard)/workspace/clasificados/_components/ClasificadosQueueHeader";
import { EnVentaCategoryContentBlock } from "../_components/EnVentaCategoryContentBlock";
import { CategoryDetailFieldsEditorBlock } from "../_components/CategoryDetailFieldsEditorBlock";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ saved?: string }>;
};

export default async function ClasificadosCategoryWorkspacePage(props: PageProps) {
  const { slug: raw } = await props.params;
  const slug = decodeURIComponent(raw).trim().toLowerCase();
  const schema = getCategorySchema(slug);
  if (!schema) notFound();

  const registry = await getClasificadosCategoryRegistryMerged();
  const entry = registry.find((e) => e.slug === slug);
  if (!entry) notFound();

  const queueHref = adminCategoryWorkspaceQueueHref(slug);
  const isEnVenta = slug === "en-venta";
  const surface = clasificadosQueueSurfaceForSlug(slug);

  return (
    <div className="max-w-4xl space-y-10">
      <ClasificadosQueueHeader
        title={`${entry.displayNameEs} — operación y contenido`}
        sourceTable="site_section_content.clasificados_category_content · app/(site)/clasificados/config/categorySchema.ts"
        subtitle={`Categoría “${slug}”: espacio operativo (#operacion) y editor de textos / campos (#contenido).`}
        publicHref={surface.publicHref}
        publishHref={surface.publishHref}
      />

      <section id="operacion" className="scroll-mt-6 space-y-8">
        <h2 className="text-lg font-bold text-[#1E1810]">Operación</h2>

        <div className={`${adminCardBase} flex flex-wrap gap-3 p-4`}>
          <Link href={queueHref} className={`${adminCtaChipSecondary} justify-center font-bold`}>
            Abrir cola de anuncios →
          </Link>
          <Link href="/admin/reportes" className={`${adminCtaChipSecondary} justify-center`}>
            Reportes →
          </Link>
          <Link href={ADMIN_CATEGORIES_ADVANCED_REGISTRY_HREF} className={`${adminCtaChipSecondary} justify-center`}>
            Registro de categorías →
          </Link>
          {slug === "servicios" ? (
            <Link
              href="/admin/workspace/clasificados/servicios"
              className={`${adminCtaChipSecondary} justify-center border-dashed border-emerald-700/40 bg-emerald-50/80 text-emerald-950`}
            >
              Servicios (tabla pública) →
            </Link>
          ) : null}
          {slug === "empleos" ? (
            <Link
              href="/admin/workspace/clasificados/empleos"
              className={`${adminCtaChipSecondary} justify-center border-dashed border-amber-800/40 bg-amber-50/90 text-amber-950`}
            >
              Empleos — moderación (Supabase) →
            </Link>
          ) : null}
          {slug === "travel" ? (
            <Link
              href="/admin/clasificados/viajes"
              className={`${adminCtaChipSecondary} justify-center border-dashed border-sky-800/40 bg-sky-50/90 text-sky-950`}
            >
              Viajes — panel legacy →
            </Link>
          ) : null}
        </div>

        <AdminSectionCard
          title="Esquema (código) — planes y publicación"
          subtitle="Fuente: app/(site)/clasificados/config/categorySchema.ts"
        >
          <dl className="grid gap-2 text-sm text-[#5C5346] sm:grid-cols-2">
            <div>
              <dt className="text-xs font-bold uppercase text-[#7A7164]">Planes permitidos</dt>
              <dd className="mt-1 font-mono text-[#1E1810]">{schema.plans.join(", ")}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-[#7A7164]">Grupo de campos (DETAIL_FIELDS)</dt>
              <dd className="mt-1 font-mono text-[#1E1810]">{schema.formFieldGroupKey ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-[#7A7164]">Orden de pasos</dt>
              <dd className="mt-1 font-mono text-[11px] leading-snug text-[#1E1810]">{schema.stepOrder.join(" → ")}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-[#7A7164]">Preview / Pro preview</dt>
              <dd className="mt-1">
                {schema.previewEligible ? "free preview sí" : "free preview no"} ·{" "}
                {schema.proPreviewEligible ? "pro preview sí" : "pro preview no"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-[#7A7164]">Rama negocio (business branch)</dt>
              <dd className="mt-1">{schema.businessBranchEligible ? "elegible" : "no aplica / desactivado"}</dd>
            </div>
            {schema.subcategories?.length ? (
              <div className="sm:col-span-2">
                <dt className="text-xs font-bold uppercase text-[#7A7164]">Subcategorías (taxonomía)</dt>
                <dd className="mt-1 text-xs text-[#3D3428]">{schema.subcategories.length} definidas en taxonomía</dd>
              </div>
            ) : null}
          </dl>
        </AdminSectionCard>

        <AdminSectionCard
          title="Textos y campos del formulario publicar"
          subtitle="Definiciones base en código; overrides persistidos en la sección Contenido (#contenido)."
        >
          <ul className="list-inside list-disc space-y-2 text-sm text-[#5C5346]">
            <li>
              Definiciones compartidas de campos por grupo:{" "}
              <code className="rounded bg-[#FBF7EF] px-1 text-[11px]">app/(site)/clasificados/config/publishDetailFields.ts</code>{" "}
              (<code className="rounded bg-[#FBF7EF] px-1 text-[11px]">DETAIL_FIELDS</code>).
            </li>
            {isEnVenta ? (
              <li>
                Copy y taxonomía Varios:{" "}
                <code className="rounded bg-[#FBF7EF] px-1 text-[11px]">app/clasificados/en-venta/</code> (wizards, visibilidad, contrato
                Leonix).
              </li>
            ) : (
              <li>
                Campos adicionales por vertical pueden vivir bajo{" "}
                <code className="rounded bg-[#FBF7EF] px-1 text-[11px]">app/clasificados/{slug}/</code> o en el orquestador unificado.
              </li>
            )}
          </ul>
        </AdminSectionCard>

        <AdminSectionCard title="Vista previa y rutas públicas" subtitle="Desde registro fusionado">
          <p className="text-sm text-[#5C5346]">
            Objetivo publicar / landing:{" "}
            <Link href={entry.landingTarget} className="font-bold text-[#6B5B2E] underline" target="_blank" rel="noreferrer">
              {entry.landingTarget}
            </Link>
          </p>
          <p className="mt-2 text-xs text-[#7A7164]">
            Capa config: {entry.configLayer === "database" ? "Supabase overlay" : "solo código"}. Notas: {entry.notes}
          </p>
        </AdminSectionCard>

        <AdminSectionCard title="Moderación operativa" subtitle="Cola global + reportes; reglas por categoría en evolución">
          <p className="text-sm text-[#5C5346]">
            La moderación de listings (estados, reportes, banderas) usa la{" "}
            <Link href={queueHref} className="font-bold text-[#6B5B2E] underline">
              cola filtrada
            </Link>{" "}
            y <Link href="/admin/reportes" className="font-bold text-[#6B5B2E] underline">/admin/reportes</Link>. Los motivos específicos
            Varios están documentados abajo.
          </p>
        </AdminSectionCard>

        {isEnVenta ? (
          <AdminSectionCard
            title="Varios — referencia de moderación (campos de contrato)"
            subtitle="Solo documentación; no persiste en BD desde aquí."
          >
            <EnVentaModerationFields lang="es" />
          </AdminSectionCard>
        ) : null}
      </section>

      <section id="contenido" className="scroll-mt-6 space-y-6 border-t border-[#E8DFD0] pt-8">
        <h2 className="text-lg font-bold text-[#1E1810]">Contenido (editor)</h2>
        <p className="text-sm text-[#5C5346]">
          Edita textos bilingües, etiquetas de campos, ayudas y notas de moderación. Los valores vacíos en un par ES/EN quitan el override y
          vuelven al texto base del código.
        </p>
        {isEnVenta ? (
          <EnVentaCategoryContentBlock searchParams={props.searchParams} />
        ) : (
          <CategoryDetailFieldsEditorBlock slug={slug} searchParams={props.searchParams} />
        )}
      </section>
    </div>
  );
}
