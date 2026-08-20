import Link from "next/link";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { AdminPagePurposeCard } from "@/app/admin/_components/AdminPagePurposeCard";
import { adminCardBase, adminBtnPrimary, adminInputClass, adminStubBadgeClass } from "@/app/admin/_components/adminTheme";
import { requireLeonixAdminPermission } from "@/app/admin/_lib/leonixAdminGate";
import { analyzeUrlIntakeAction } from "@/app/admin/recursosUrlIntakeAction";

export const dynamic = "force-dynamic";

function IntakeChoiceCard({
  title,
  description,
  status,
  action,
  children,
}: {
  title: string;
  description: string;
  status: "real" | "pending";
  action: { label: string; href: string } | null;
  children?: React.ReactNode;
}) {
  return (
    <div className={`${adminCardBase} flex flex-col gap-3 p-5`}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-bold text-[#1E1810]">{title}</h3>
        {status === "pending" ? <span className={adminStubBadgeClass}>Próximamente</span> : null}
      </div>
      <p className="text-sm leading-relaxed text-[#5C5346]">{description}</p>
      {children}
      {action ? (
        <Link href={action.href} className={`${adminBtnPrimary} mt-auto w-fit`}>
          {action.label}
        </Link>
      ) : !children ? (
        <p className="mt-auto text-xs font-semibold text-[#8B7E70]">Aún no disponible en esta puerta (Gate) del sistema.</p>
      ) : null}
    </div>
  );
}

export default async function RecursosIntakePage(props: { searchParams?: Promise<{ error?: string; jobId?: string }> }) {
  await requireLeonixAdminPermission("can_manage_recursos");
  const sp = props.searchParams ? await props.searchParams : {};

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
        title="Intake Center — Gate 3"
        purpose="Punto de entrada único para los cuatro tipos de intake aprobados. Intake por URL está activo: Leonix obtiene la página oficial de forma segura, propone campos (determinísticamente y, cuando está disponible, con asistencia de IA) y crea un candidato revisable. Nada se verifica ni se publica automáticamente."
        dataSource="URL: fetch server-side seguro + Vercel AI Gateway (si está configurado) -> public.source_documents + public.resource_intake_jobs + public.community_resource_candidate_reviews."
        status="real"
        safeActions={["Analizar una URL oficial", "Ir a la entrada manual existente", "Ver la cola de solicitudes de socios"]}
        nextGate="Gate 4 activa el intake por PDF (almacenamiento + extracción)."
        warningNote="La IA solo propone — nunca verifica ni publica. Cada candidato queda en estado 'researching', sin verificar, esperando revisión humana."
      />

      {sp.error ? (
        <p className="mb-6 rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          No se pudo analizar la URL: {sp.error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <IntakeChoiceCard
          title="PDF"
          description="Sube una guía o documento con múltiples organizaciones y genera candidatos automáticamente, con evidencia de página conservada."
          status="pending"
          action={null}
        />

        <IntakeChoiceCard title="Sitio web / URL" description="Pega la URL oficial de una organización o programa. Leonix preparará un candidato — el resultado sigue requiriendo verificación humana. Nada se publica automáticamente." status="real" action={null}>
          <form action={analyzeUrlIntakeAction} className="mt-1 flex flex-col gap-3">
            <div>
              <label htmlFor="url" className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">
                URL oficial
              </label>
              <input id="url" name="url" type="url" required placeholder="https://organizacion.org/programa" className={adminInputClass} />
            </div>
            <button type="submit" className={`${adminBtnPrimary} w-fit`}>
              Analizar sitio
            </button>
          </form>
        </IntakeChoiceCard>

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
