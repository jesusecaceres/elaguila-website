import Link from "next/link";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { AdminPagePurposeCard } from "@/app/admin/_components/AdminPagePurposeCard";
import { adminCardBase, adminBtnPrimary, adminStubBadgeClass } from "@/app/admin/_components/adminTheme";
import { requireLeonixAdminPermission } from "@/app/admin/_lib/leonixAdminGate";

export const dynamic = "force-dynamic";

function IntakeChoiceCard({
  title,
  description,
  status,
  action,
}: {
  title: string;
  description: string;
  status: "real" | "pending";
  action: { label: string; href: string } | null;
}) {
  return (
    <div className={`${adminCardBase} flex flex-col gap-3 p-5`}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-bold text-[#1E1810]">{title}</h3>
        {status === "pending" ? <span className={adminStubBadgeClass}>Próximamente</span> : null}
      </div>
      <p className="text-sm leading-relaxed text-[#5C5346]">{description}</p>
      {action ? (
        <Link href={action.href} className={`${adminBtnPrimary} mt-auto w-fit`}>
          {action.label}
        </Link>
      ) : (
        <p className="mt-auto text-xs font-semibold text-[#8B7E70]">Aún no disponible en esta puerta (Gate) del sistema.</p>
      )}
    </div>
  );
}

export default async function RecursosIntakePage() {
  await requireLeonixAdminPermission("can_manage_recursos");

  return (
    <div>
      <AdminPageHeader
        eyebrow="Recursos"
        title="Nuevo intake"
        subtitle="Elige cómo entra un nuevo recurso comunitario al sistema. Ningún candidato se publica automáticamente — todo pasa por revisión humana antes de convertirse en un recurso verificado."
        rightSlot={
          <Link href="/admin/recursos" className={adminBtnPrimary}>
            ← Volver al panel
          </Link>
        }
      />

      <AdminPagePurposeCard
        title="Intake Center — Gate 2"
        purpose="Punto de entrada único para los cuatro tipos de intake aprobados. En este Gate, solo la entrada manual está completamente activa; PDF y URL muestran su estado honesto en lugar de simular un procesamiento que aún no existe."
        dataSource="No lee ni escribe ninguna tabla nueva por sí misma — cada opción enruta a su propio flujo real o muestra su estado pendiente."
        status="real"
        safeActions={["Elegir un tipo de intake", "Ir a la entrada manual existente", "Ver la cola de solicitudes de socios"]}
        nextGate="Gate 3 activa el intake por URL. Gate 4 activa el intake por PDF (almacenamiento + extracción)."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <IntakeChoiceCard
          title="PDF"
          description="Sube una guía o documento con múltiples organizaciones y genera candidatos automáticamente, con evidencia de página conservada."
          status="pending"
          action={null}
        />
        <IntakeChoiceCard
          title="Sitio web / URL"
          description="Pega la URL de una organización y el sistema prepara un candidato para revisión, con investigación asistida."
          status="pending"
          action={null}
        />
        <IntakeChoiceCard
          title="Entrada manual"
          description="Escribe directamente los datos de un recurso — el flujo existente, sin necesidad de código."
          status="real"
          action={{ label: "Ir a entrada manual →", href: "/admin/recursos/nuevo" }}
        />
        <IntakeChoiceCard
          title="Referido / socio"
          description="Una organización contactó a Leonix directamente. El registro directo de solicitudes de socio llega en Gate 7 — por ahora puedes ver la cola de solicitudes existentes."
          status="pending"
          action={{ label: "Ver solicitudes →", href: "/admin/recursos/solicitudes" }}
        />
      </div>
    </div>
  );
}
