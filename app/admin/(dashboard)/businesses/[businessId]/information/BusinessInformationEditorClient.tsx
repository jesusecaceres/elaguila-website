"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BROAD_BUSINESS_TYPES } from "@/app/lib/business/constants";
import { humanizeStaffWriteError } from "@/app/admin/_lib/staffWriteErrorMessages";
import type { BusinessApplicationContext } from "@/app/lib/business/applicationContext/businessApplicationContext";

type IdentityGetResponse = {
  ok: boolean;
  business?: {
    displayName: string;
    publicName: string | null;
    broadBusinessType: string;
    specificBusinessType: string | null;
    customSpecificType: string | null;
    businessPrimaryLanguage: string | null;
  };
  context?: BusinessApplicationContext;
  canEdit?: boolean;
  error?: string;
};

type FormState = {
  displayName: string;
  publicName: string;
  broadBusinessType: string;
  businessPrimaryLanguage: string;
  phone: string;
  email: string;
  website: string;
  whatsapp: string;
  street: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
  serviceAreaText: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  youtube: string;
  linkedin: string;
  x: string;
  googleBusiness: string;
  yelp: string;
};

const EMPTY_FORM: FormState = {
  displayName: "", publicName: "", broadBusinessType: "other", businessPrimaryLanguage: "",
  phone: "", email: "", website: "", whatsapp: "",
  street: "", city: "", stateProvince: "", postalCode: "", country: "",
  serviceAreaText: "",
  instagram: "", facebook: "", tiktok: "", youtube: "", linkedin: "", x: "", googleBusiness: "", yelp: "",
};

function contextToForm(business: NonNullable<IdentityGetResponse["business"]>, ctx: BusinessApplicationContext): FormState {
  return {
    displayName: business.displayName,
    publicName: business.publicName ?? "",
    broadBusinessType: business.broadBusinessType,
    businessPrimaryLanguage: business.businessPrimaryLanguage ?? "",
    phone: ctx.phone ?? "",
    email: ctx.email ?? "",
    website: ctx.website ?? "",
    whatsapp: ctx.whatsapp ?? "",
    street: ctx.address.street ?? "",
    city: ctx.address.city ?? "",
    stateProvince: ctx.address.stateProvince ?? "",
    postalCode: ctx.address.postalCode ?? "",
    country: ctx.address.country ?? "",
    serviceAreaText: ctx.serviceAreaText ?? "",
    instagram: ctx.socials.instagram ?? "",
    facebook: ctx.socials.facebook ?? "",
    tiktok: ctx.socials.tiktok ?? "",
    youtube: ctx.socials.youtube ?? "",
    linkedin: ctx.socials.linkedin ?? "",
    x: ctx.socials.x ?? "",
    googleBusiness: ctx.googleBusinessUrl ?? "",
    yelp: ctx.yelpUrl ?? "",
  };
}

/**
 * LIVE QA BLOCKER 01 (Gate 5) — actionable, per-field save messages. Identifies the affected
 * area without leaking raw SQL/schema internals (the server's `error` string, e.g. a Postgres
 * constraint name, is intentionally never shown to staff — logged server-side only).
 */
const FIELD_LABEL_ES_EN: Record<string, string> = {
  business: "La información básica del negocio / Basic business info",
  "business.displayName": "El nombre del negocio / Business name",
  "business.broadBusinessType": "El tipo de negocio / Business type",
  "contacts.phone": "El teléfono / Phone",
  "contacts.whatsapp": "WhatsApp",
  "contacts.email": "El correo / Email",
  "contacts.website": "El sitio web / Website",
  address: "La dirección / Address",
  serviceAreaText: "El área de servicio / Service area",
  "socials.instagram": "Instagram",
  "socials.facebook": "Facebook",
  "socials.tiktok": "TikTok",
  "socials.youtube": "YouTube",
  "socials.linkedin": "LinkedIn",
  "socials.x": "X (Twitter)",
  "socials.google_business": "Google Business Profile",
  "socials.yelp": "Yelp",
};

function fieldLabel(field: string): string {
  return FIELD_LABEL_ES_EN[field] ?? field;
}

function describeFieldErrors(fields: string[], kind: "invalid" | "not_saved"): string {
  const labels = fields.map(fieldLabel);
  if (kind === "invalid") {
    return labels.length === 1
      ? `${labels[0]} no es válido/a. / ${labels[0]} is not valid.`
      : `Estos campos no son válidos: ${labels.join(", ")}. / These fields are not valid: ${labels.join(", ")}.`;
  }
  return labels.length === 1
    ? `${labels[0]} no se pudo guardar. Los demás cambios sí se guardaron. / ${labels[0]} could not be saved. The other changes were saved.`
    : `Estos campos no se pudieron guardar: ${labels.join(", ")}. Los demás cambios sí se guardaron. / These fields could not be saved: ${labels.join(", ")}. The other changes were saved.`;
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-[#6B5E47]">{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full min-h-[44px] rounded-lg border border-[#E8DFD0] px-3 text-sm text-[#1E1810]"
      />
    </label>
  );
}

export function BusinessInformationEditorClient({ businessId, businessName }: { businessId: string; businessName: string }) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch(`/api/admin/businesses/${businessId}/identity`, { credentials: "include", cache: "no-store" });
      const data = (await res.json().catch(() => null)) as IdentityGetResponse | null;
      if (cancelled) return;
      if (!res.ok || !data?.ok || !data.business || !data.context) {
        setLoadError(humanizeStaffWriteError(data?.error, "No se pudo cargar la información del negocio. / Could not load business information."));
        setLoading(false);
        return;
      }
      setForm(contextToForm(data.business, data.context));
      setCanEdit(Boolean(data.canEdit));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    const payload = {
      business: {
        displayName: form.displayName,
        publicName: form.publicName || null,
        broadBusinessType: form.broadBusinessType,
        businessPrimaryLanguage: form.businessPrimaryLanguage || null,
      },
      contacts: { phone: form.phone, email: form.email, website: form.website, whatsapp: form.whatsapp },
      address: { street: form.street, city: form.city, stateProvince: form.stateProvince, postalCode: form.postalCode, country: form.country },
      serviceAreaText: form.serviceAreaText,
      socials: {
        instagram: form.instagram,
        facebook: form.facebook,
        tiktok: form.tiktok,
        youtube: form.youtube,
        linkedin: form.linkedin,
        x: form.x,
        google_business: form.googleBusiness,
        yelp: form.yelp,
      },
    };
    const res = await fetch(`/api/admin/businesses/${businessId}/identity`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => null)) as {
      ok?: boolean;
      error?: string;
      fieldErrors?: { field: string; error: string }[];
      partial?: boolean;
      savedSections?: string[];
      failedSections?: { field: string; error: string }[];
      business?: IdentityGetResponse["business"];
      context?: BusinessApplicationContext;
    } | null;
    setSaving(false);

    // LIVE QA BLOCKER 01 (Gate 4/5) — field-level validation failure, zero writes attempted.
    if (!res.ok && data?.error === "validation_failed" && data.fieldErrors?.length) {
      setSaveError(describeFieldErrors(data.fieldErrors.map((e) => e.field), "invalid"));
      return;
    }
    if (!res.ok || !data?.ok) {
      setSaveError(humanizeStaffWriteError(data?.error, "No se pudo guardar. Intenta de nuevo. / Could not save. Try again."));
      return;
    }

    // Truthful reconciliation: whatever actually persisted is reflected in the form immediately,
    // whether this was a full success or a partial one — never a guess about what's really saved.
    const freshContext = data.context;
    if (freshContext) {
      setForm((f) => ({
        ...f,
        phone: freshContext.phone ?? f.phone,
        email: freshContext.email ?? f.email,
        website: freshContext.website ?? f.website,
        whatsapp: freshContext.whatsapp ?? f.whatsapp,
        street: freshContext.address.street ?? f.street,
        city: freshContext.address.city ?? f.city,
        stateProvince: freshContext.address.stateProvince ?? f.stateProvince,
        postalCode: freshContext.address.postalCode ?? f.postalCode,
        country: freshContext.address.country ?? f.country,
        serviceAreaText: freshContext.serviceAreaText ?? f.serviceAreaText,
        instagram: freshContext.socials.instagram ?? f.instagram,
        facebook: freshContext.socials.facebook ?? f.facebook,
        tiktok: freshContext.socials.tiktok ?? f.tiktok,
        youtube: freshContext.socials.youtube ?? f.youtube,
        linkedin: freshContext.socials.linkedin ?? f.linkedin,
        x: freshContext.socials.x ?? f.x,
        googleBusiness: freshContext.googleBusinessUrl ?? f.googleBusiness,
        yelp: freshContext.yelpUrl ?? f.yelp,
      }));
    }

    if (data.partial && data.failedSections?.length) {
      setSaveError(describeFieldErrors(data.failedSections.map((e) => e.field), "not_saved"));
      return;
    }
    setSaved(true);
  }

  if (loading) {
    return <p className="p-4 text-sm text-[#6B5E47]" role="status">Cargando… / Loading…</p>;
  }
  if (loadError) {
    return <p role="alert" className="p-4 text-sm text-red-700">{loadError}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#8A6B1F]">Identidad / Identity</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Nombre del negocio / Business name" value={form.displayName} onChange={(v) => set("displayName", v)} />
          <Field label="Nombre público (si es distinto) / Public name (if different)" value={form.publicName} onChange={(v) => set("publicName", v)} />
          <label className="block">
            <span className="text-xs font-semibold text-[#6B5E47]">Tipo de negocio / Business type</span>
            <select
              value={form.broadBusinessType}
              onChange={(e) => set("broadBusinessType", e.target.value)}
              className="mt-1 block w-full min-h-[44px] rounded-lg border border-[#E8DFD0] px-3 text-sm text-[#1E1810]"
            >
              {BROAD_BUSINESS_TYPES.map((o) => (
                <option key={o.value} value={o.value}>{o.es} / {o.en}</option>
              ))}
            </select>
          </label>
          <Field label="Idioma principal del negocio / Business primary language" value={form.businessPrimaryLanguage} onChange={(v) => set("businessPrimaryLanguage", v)} placeholder="es, en…" />
        </div>
      </div>

      <div className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#8A6B1F]">Contacto / Contact</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Teléfono / Phone" value={form.phone} onChange={(v) => set("phone", v)} />
          <Field label="WhatsApp" value={form.whatsapp} onChange={(v) => set("whatsapp", v)} />
          <Field label="Correo / Email" value={form.email} onChange={(v) => set("email", v)} />
          <Field label="Sitio web / Website" value={form.website} onChange={(v) => set("website", v)} />
        </div>
      </div>

      <div className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#8A6B1F]">Ubicación / Location</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Dirección / Street address" value={form.street} onChange={(v) => set("street", v)} />
          <Field label="Ciudad / City" value={form.city} onChange={(v) => set("city", v)} />
          <Field label="Estado / State" value={form.stateProvince} onChange={(v) => set("stateProvince", v)} />
          <Field label="Código postal / Postal code" value={form.postalCode} onChange={(v) => set("postalCode", v)} />
          <Field label="País / Country" value={form.country} onChange={(v) => set("country", v)} />
          <Field label="Área de servicio (texto libre) / Service area (free text)" value={form.serviceAreaText} onChange={(v) => set("serviceAreaText", v)} />
        </div>
        <p className="mt-2 text-[11px] text-[#9A9184]">
          Guardar una dirección la marca como pública y exacta. / Saving a street address marks it public and exact.
        </p>
      </div>

      <div className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#8A6B1F]">Presencia digital / Digital presence</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Instagram" value={form.instagram} onChange={(v) => set("instagram", v)} />
          <Field label="Facebook" value={form.facebook} onChange={(v) => set("facebook", v)} />
          <Field label="TikTok" value={form.tiktok} onChange={(v) => set("tiktok", v)} />
          <Field label="YouTube" value={form.youtube} onChange={(v) => set("youtube", v)} />
          <Field label="LinkedIn" value={form.linkedin} onChange={(v) => set("linkedin", v)} />
          <Field label="X (Twitter)" value={form.x} onChange={(v) => set("x", v)} />
          <Field label="Google Business Profile" value={form.googleBusiness} onChange={(v) => set("googleBusiness", v)} />
          <Field label="Yelp" value={form.yelp} onChange={(v) => set("yelp", v)} />
        </div>
      </div>

      {saveError ? <p role="alert" className="text-sm text-red-700">{saveError}</p> : null}
      {saved ? <p role="status" className="text-sm font-semibold text-emerald-700">Guardado. / Saved.</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        {canEdit ? (
          <button
            type="button"
            disabled={saving}
            onClick={() => void save()}
            className="min-h-[48px] rounded-xl bg-[#7A1E2C] px-6 text-sm font-bold text-white disabled:opacity-50"
          >
            {saving ? "Guardando… / Saving…" : "Guardar / Save"}
          </button>
        ) : (
          <p className="text-sm text-[#6B5E47]">No tienes permiso para editar. / You don't have permission to edit.</p>
        )}
        <Link href={`/admin/businesses/${businessId}#prospect-journey`} className="text-sm font-semibold text-[#7A1E2C] underline underline-offset-2">
          ← Volver a {businessName} / Back to {businessName}
        </Link>
      </div>
    </div>
  );
}
