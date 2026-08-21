import Link from "next/link";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { AdminPagePurposeCard } from "@/app/admin/_components/AdminPagePurposeCard";
import { adminActionProofErr, adminBtnPrimary } from "@/app/admin/_components/adminTheme";
import { requireLeonixAdminPermission } from "@/app/admin/_lib/leonixAdminGate";
import { PartnerRequestForm } from "@/app/admin/_components/recursos/PartnerRequestForm";
import { dbListCommunityResources } from "@/app/lib/recursos/server/communityResourcesDb";

export const dynamic = "force-dynamic";

export default async function NuevaSolicitudPage(props: { searchParams?: Promise<{ error?: string }> }) {
  await requireLeonixAdminPermission("can_manage_recursos");
  const sp = props.searchParams ? await props.searchParams : {};

  const { rows } = await dbListCommunityResources();
  const resources = rows
    .map((r) => ({ id: r.id, label: r.programName ? `${r.organizationName} — ${r.programName}` : r.organizationName }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div>
      <AdminPageHeader
        eyebrow="Recursos — Solicitudes"
        title="Nueva solicitud / Registrar actualización"
        subtitle="Registra lo que una organización reportó por teléfono, correo o en persona. Esto NUNCA cambia un recurso publicado directamente — solo crea una solicitud que luego se convierte en cambios revisables."
        rightSlot={
          <Link href="/admin/recursos/solicitudes" className={adminBtnPrimary}>
            ← Volver a solicitudes
          </Link>
        }
      />

      <AdminPagePurposeCard
        title="Registro admin-only — V1"
        purpose="El equipo de Leonix registra correcciones reportadas por socios. No existe ni existirá en este build un formulario público de envío ni un portal de socios."
        dataSource="Escribe en public.partner_update_requests. La conversión a cambios revisables usa el mismo motor de comparación de campos de Gate 5 (resourceChangeDetection.ts) — sin un segundo sistema de diff."
        status="real"
        safeActions={["Registrar una solicitud vinculada a un recurso existente u organización nueva"]}
        nextGate="Ninguno planeado — V1 permanece admin-only."
        warningNote="Los campos disponibles por tipo de solicitud están limitados a una lista fija en el servidor — nunca se acepta un nombre de campo arbitrario del cliente."
      />

      {sp.error ? <p className={`${adminActionProofErr} mb-6`}>{sp.error}</p> : null}

      <PartnerRequestForm resources={resources} />
    </div>
  );
}
