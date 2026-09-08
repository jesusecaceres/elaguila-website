"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CanvassDuplicateWarning, CanvassIntakeInput, CanvassMode } from "@/app/lib/business/fieldDiscovery/types";

type FormState = Partial<CanvassIntakeInput> & { mode: CanvassMode };

const INITIAL_STATE: FormState = {
  mode: "quick_visit",
  preferredLanguage: "es",
  preferredFollowUpChannel: null,
  consentPhotoCapture: false,
  consentFileUpload: false,
  consentSourceResearch: false,
  consentFollowupContact: false,
  confirmCreateDespiteDuplicates: false,
};

const MODE_LABELS: Record<CanvassMode, { es: string; en: string }> = {
  quick_visit: { es: "Visita rápida", en: "Quick Visit" },
  full_discovery: { es: "Descubrimiento completo", en: "Full Discovery" },
  finish_later: { es: "Terminar después", en: "Finish Later" },
};

type SubmitState = "idle" | "submitting" | "error" | "duplicate" | "success";

export function CanvassForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [state, setState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<CanvassDuplicateWarning | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(confirmDespiteDuplicates: boolean) {
    if (!form.businessName || !form.businessName.trim()) {
      setState("error");
      setErrorMessage("El nombre del negocio es obligatorio. / Business name is required.");
      return;
    }
    setState("submitting");
    setErrorMessage(null);

    const res = await fetch("/api/admin/businesses/canvass", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, confirmCreateDespiteDuplicates: confirmDespiteDuplicates }),
    });
    const body = (await res.json().catch(() => null)) as
      | { ok: true; businessId: string; nextRoute: string }
      | { ok: false; error: string; duplicateWarning?: CanvassDuplicateWarning }
      | null;

    if (!body) {
      setState("error");
      setErrorMessage(`Error de red (HTTP ${res.status}). / Network error.`);
      return;
    }
    if (!body.ok) {
      if (body.error === "duplicate_business_warning" && body.duplicateWarning) {
        setDuplicateWarning(body.duplicateWarning);
        setState("duplicate");
        return;
      }
      setState("error");
      setErrorMessage(`No se pudo guardar: ${body.error}. / Could not save: ${body.error}.`);
      return;
    }

    setState("success");
    if (form.mode !== "finish_later") {
      router.push(body.nextRoute);
    }
  }

  return (
    <div className="space-y-4">
      <fieldset className="rounded-2xl border border-[#E8DFD0] bg-white p-3">
        <legend className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Modo / Mode</legend>
        <div className="mt-2 grid grid-cols-1 gap-2">
          {(Object.keys(MODE_LABELS) as CanvassMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => set("mode", mode)}
              className={`min-h-[44px] rounded-lg border px-3 py-2 text-sm font-semibold ${
                form.mode === mode ? "border-[#7A1E2C] bg-[#7A1E2C]/10 text-[#7A1E2C]" : "border-[#E8DFD0] text-[#3D3428]"
              }`}
            >
              {MODE_LABELS[mode].es} / {MODE_LABELS[mode].en}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-3 rounded-2xl border border-[#E8DFD0] bg-white p-3">
        <legend className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Negocio / Business</legend>

        <TextField label="Nombre del negocio / Business name" required value={form.businessName ?? ""} onChange={(v) => set("businessName", v)} />
        <TextField label="Nombre público / Public-facing name" value={form.publicFacingName ?? ""} onChange={(v) => set("publicFacingName", v)} />
        <TextField label="Nombre de contacto / Contact name" value={form.contactName ?? ""} onChange={(v) => set("contactName", v)} />
        <TextField label="Teléfono / Phone" value={form.phone ?? ""} onChange={(v) => set("phone", v)} type="tel" />
        <TextField label="Correo / Email" value={form.email ?? ""} onChange={(v) => set("email", v)} type="email" />
        <TextField label="Sitio web / Website" value={form.website ?? ""} onChange={(v) => set("website", v)} />
        <TextField label="Google Business" value={form.googleBusinessLink ?? ""} onChange={(v) => set("googleBusinessLink", v)} />
        <TextField label="Facebook" value={form.facebook ?? ""} onChange={(v) => set("facebook", v)} />
        <TextField label="Instagram" value={form.instagram ?? ""} onChange={(v) => set("instagram", v)} />
        <TextField label="TikTok" value={form.tiktok ?? ""} onChange={(v) => set("tiktok", v)} />
        <TextField label="Dirección / zona de servicio / Address / service area" value={form.serviceAreaSummary ?? ""} onChange={(v) => set("serviceAreaSummary", v)} />
        <TextArea label="¿Qué vende el negocio? / What does the business sell?" value={form.whatBusinessSells ?? ""} onChange={(v) => set("whatBusinessSells", v)} />
        <TextArea label="Preocupación inmediata / Immediate concern" value={form.immediateConcern ?? ""} onChange={(v) => set("immediateConcern", v)} />
        <TextArea label="Notas / Notes" value={form.notes ?? ""} onChange={(v) => set("notes", v)} />

        <div>
          <label htmlFor="canvass-lang" className="block text-xs font-semibold text-[#3D3428]">Idioma preferido / Preferred language</label>
          <select
            id="canvass-lang"
            value={form.preferredLanguage ?? "es"}
            onChange={(e) => set("preferredLanguage", e.target.value as "es" | "en")}
            className="mt-1 min-h-[44px] w-full rounded-lg border border-[#E8DFD0] bg-white px-2 py-1.5 text-sm"
          >
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </div>

        <TextField
          label="Próxima fecha de seguimiento / Next follow-up date"
          value={form.nextFollowUpDate ?? ""}
          onChange={(v) => set("nextFollowUpDate", v)}
          type="date"
        />
      </fieldset>

      <fieldset className="space-y-2 rounded-2xl border border-[#E8DFD0] bg-white p-3">
        <legend className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Consentimiento / Consent</legend>
        <ConsentCheckbox label="Captura de fotos / Photo capture" checked={Boolean(form.consentPhotoCapture)} onChange={(v) => set("consentPhotoCapture", v)} />
        <ConsentCheckbox label="Subida de archivos / File upload" checked={Boolean(form.consentFileUpload)} onChange={(v) => set("consentFileUpload", v)} />
        <ConsentCheckbox label="Investigación de fuentes / Source research" checked={Boolean(form.consentSourceResearch)} onChange={(v) => set("consentSourceResearch", v)} />
        <ConsentCheckbox label="Contacto de seguimiento / Follow-up contact" checked={Boolean(form.consentFollowupContact)} onChange={(v) => set("consentFollowupContact", v)} />
      </fieldset>

      {state === "duplicate" && duplicateWarning ? (
        <div role="alert" className="rounded-xl border border-amber-400 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-semibold">
            Posible negocio duplicado ({duplicateWarning.level}) / Possible duplicate business ({duplicateWarning.level})
          </p>
          <ul className="mt-1 list-inside list-disc">
            {duplicateWarning.candidates.map((c) => (
              <li key={c.businessId}>{c.displayNameMasked}</li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => void submit(true)}
            className="mt-2 min-h-[40px] rounded-lg bg-amber-700 px-4 py-2 text-xs font-bold text-white"
          >
            Crear de todos modos / Create anyway
          </button>
        </div>
      ) : null}

      {state === "error" && errorMessage ? <p role="alert" className="text-sm text-red-700">{errorMessage}</p> : null}
      {state === "success" ? <p role="status" className="text-sm text-green-700">Guardado. / Saved.</p> : null}

      <button
        type="button"
        onClick={() => void submit(false)}
        disabled={state === "submitting"}
        className="min-h-[48px] w-full rounded-xl bg-[#7A1E2C] px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
      >
        {state === "submitting" ? "Guardando… / Saving…" : "Guardar / Save"}
      </button>
    </div>
  );
}

function TextField(props: { label: string; value: string; onChange: (v: string) => void; required?: boolean; type?: string }) {
  const id = `field-${props.label.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-[#3D3428]">
        {props.label}
        {props.required ? " *" : ""}
      </label>
      <input
        id={id}
        type={props.type ?? "text"}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        className="mt-1 min-h-[44px] w-full rounded-lg border border-[#E8DFD0] bg-white px-3 py-2 text-sm"
      />
    </div>
  );
}

function TextArea(props: { label: string; value: string; onChange: (v: string) => void }) {
  const id = `field-${props.label.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-[#3D3428]">{props.label}</label>
      <textarea
        id={id}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        rows={2}
        className="mt-1 w-full rounded-lg border border-[#E8DFD0] bg-white px-3 py-2 text-sm"
      />
    </div>
  );
}

function ConsentCheckbox(props: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  const id = `consent-${props.label.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <label htmlFor={id} className="flex min-h-[44px] items-center gap-2 text-sm text-[#3D3428]">
      <input id={id} type="checkbox" checked={props.checked} onChange={(e) => props.onChange(e.target.checked)} className="h-5 w-5" />
      {props.label}
    </label>
  );
}
