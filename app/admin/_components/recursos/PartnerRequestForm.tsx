"use client";

/**
 * Recursos Intake OS — Gate 7B new partner-request form. Client-only for the request-type
 * conditional field display (show just the 1-4 inputs relevant to the selected type, per Gate
 * 7B's "keep the form practical — do not force fields that are not needed"); submission itself
 * goes through the normal server action, unchanged from every other admin form in this app.
 */
import { useState } from "react";
import { adminBtnPrimary, adminCardBase, adminInputClass } from "@/app/admin/_components/adminTheme";
import { createPartnerUpdateRequestAction } from "@/app/admin/recursosPartnerRequestActions";
import { PARTNER_REQUEST_TYPES, REQUEST_TYPE_FIELDS, fieldLabel, type PartnerRequestType } from "@/app/lib/recursos/intake/partnerRequestFieldMap";

type ResourceOption = { id: string; label: string };

function Field({ name, label }: { name: string; label: string }) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">
        {label} — nuevo valor reportado
      </label>
      <input id={name} name={name} type="text" className={adminInputClass} />
    </div>
  );
}

export function PartnerRequestForm({ resources }: { resources: ResourceOption[] }) {
  const [requestType, setRequestType] = useState<PartnerRequestType>("phone_change");
  const activeFields = REQUEST_TYPE_FIELDS[requestType];

  return (
    <form action={createPartnerUpdateRequestAction} className={`${adminCardBase} flex flex-col gap-4 p-4 sm:p-5`}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="resourceId" className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">
            Recurso existente (opcional)
          </label>
          <select id="resourceId" name="resourceId" className={adminInputClass}>
            <option value="">— Ninguno / organización nueva —</option>
            {resources.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="organizationName" className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">
            Nombre de la organización
          </label>
          <input id="organizationName" name="organizationName" type="text" className={adminInputClass} placeholder="Requerido si no seleccionas un recurso existente" />
        </div>
        <div>
          <label htmlFor="submittedContactName" className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">
            Nombre del contacto
          </label>
          <input id="submittedContactName" name="submittedContactName" type="text" className={adminInputClass} />
        </div>
        <div>
          <label htmlFor="submittedContactEmail" className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">
            Correo del contacto
          </label>
          <input id="submittedContactEmail" name="submittedContactEmail" type="email" className={adminInputClass} />
        </div>
      </div>

      <div>
        <label htmlFor="requestType" className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">
          Tipo de solicitud
        </label>
        <select
          id="requestType"
          name="requestType"
          value={requestType}
          onChange={(e) => setRequestType(e.target.value as PartnerRequestType)}
          className={adminInputClass}
        >
          {PARTNER_REQUEST_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {activeFields.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {activeFields.map((f) => (
            <Field key={f} name={`field_${f}`} label={fieldLabel(f)} />
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-[color:var(--lx-border)] bg-white/60 px-3 py-2 text-xs text-[#7A7164]">
          El tipo &quot;Otro&quot; no genera un cambio propuesto automáticamente — usa las notas para describir lo reportado y
          da seguimiento manualmente.
        </p>
      )}

      <div>
        <label htmlFor="sourceNotes" className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">
          Notas (cómo se recibió el reporte, contexto adicional)
        </label>
        <textarea id="sourceNotes" name="sourceNotes" rows={3} className={adminInputClass} placeholder="Ej: Llamada telefónica el 20/08, la coordinadora confirmó el nuevo número." />
      </div>

      <div className="flex justify-end">
        <button type="submit" className={adminBtnPrimary}>
          Registrar solicitud
        </button>
      </div>
    </form>
  );
}
