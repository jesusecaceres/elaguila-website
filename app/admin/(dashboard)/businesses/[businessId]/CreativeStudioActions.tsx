"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CREATIVE_LANES } from "@/app/lib/business/creativeStudio/constants";

export type CreativeProviderAvailability = {
  gemini: boolean;
  openai: boolean;
};

function readApiError(data: { error?: string; detail?: string }, fallback: string): string {
  if (typeof data.detail === "string" && data.detail.trim()) return data.detail;
  if (typeof data.error === "string" && data.error.trim()) return data.error;
  return fallback;
}

export function ProviderAvailabilityRow({ providerAvailability }: { providerAvailability?: CreativeProviderAvailability }) {
  if (!providerAvailability) return null;
  const anyConfigured = providerAvailability.gemini || providerAvailability.openai;
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-[#7A7164]">Proveedores de generación: / Generation providers:</span>
        {([
          { label: "Gemini", configured: providerAvailability.gemini },
          { label: "OpenAI", configured: providerAvailability.openai },
        ] as const).map((entry) => (
          <span
            key={entry.label}
            className={`rounded px-2 py-0.5 font-medium ${entry.configured ? "bg-emerald-100 text-emerald-800" : "bg-[#EDE6D6] text-[#7A7164]"}`}
          >
            {entry.label} {entry.configured ? "configurado / configured" : "no configurado / not configured"}
          </span>
        ))}
      </div>
      {!anyConfigured ? (
        <p className="text-sm text-[#7A7164]">El proveedor de generación creativa no está disponible. / Creative generation provider is not available.</p>
      ) : null}
    </div>
  );
}

export function GenerateDraftButton({
  businessId,
  jobId,
  canGenerate,
  hasBrief,
  providerAvailable,
}: {
  businessId: string;
  jobId: string;
  canGenerate: boolean;
  hasBrief: boolean;
  providerAvailable: boolean;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canGenerate) {
    return <p className="text-xs text-[#7A7164]">Solo gerentes o super-admins pueden generar. / Generation remains a manager / super-admin action.</p>;
  }
  if (!hasBrief) {
    return <p className="text-xs text-[#7A7164]">Se requiere un Brief Creativo antes de generar. / A Creative Brief is required before generation.</p>;
  }
  if (!providerAvailable) {
    return <p className="text-sm text-[#7A7164]">El proveedor de generación creativa no está disponible. / Creative generation provider is not available.</p>;
  }

  async function run() {
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/admin/businesses/${businessId}/creative-studio/jobs/${jobId}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json().catch(() => ({} as { error?: string; detail?: string }));
    setSubmitting(false);
    if (!res.ok) {
      setError(readApiError(data, "No se pudo generar. No se creó ningún resultado. / Could not generate. No output was created."));
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={submitting}
        onClick={() => void run()}
        className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#7A1E2C] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
      >
        {submitting ? "Generando… / Generating…" : "Generar borrador / Generate draft"}
      </button>
      {error ? <p role="alert" className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}

// Ship-ready completion — the Bible requires materially different intake questions per creative
// job type (magazine/digital ad vs. sponsored editorial vs. logo/brand vs. website), but
// business_creative_briefs is a fixed, already-shipped schema with no lane-specific columns and
// this branch's standing rule across every prior gate is zero new migrations. Every field below
// maps to a REAL existing CreativeBrief column (businessGoal..desiredAction are all already
// required by the API; supportingMessage/prohibitedClaims/requiredDisclaimers/trustEvidence are
// real, already-wired columns the generic form simply never populated). Only the on-screen LABELS
// and which extra fields are shown change per lane — no new table, no new Creative Studio.
export type BriefLane = "logo" | "website" | "sponsored_editorial" | "ad";

export function briefLaneForAssetType(assetType: string | undefined): BriefLane {
  if (assetType === "logo_direction") return "logo";
  if (assetType === "website_strategy") return "website";
  if (assetType === "sponsored_insert") return "sponsored_editorial";
  return "ad";
}

type BriefFieldCopy = {
  businessGoal: string;
  campaignObjective: string;
  readerNeed: string;
  targetAudience: string;
  primaryMessage: string;
  cta: string;
  contactPath: string;
  imageStrategy: string;
  desiredAction: string;
  extra: { label: string; placeholder: string } | null;
  avoid: { label: string; placeholder: string } | null;
  disclosure: { label: string; placeholder: string } | null;
};

export const BRIEF_FIELD_COPY: Record<BriefLane, BriefFieldCopy> = {
  ad: {
    businessGoal: "Objetivo de negocio / Business goal",
    campaignObjective: "Objetivo de campaña / Campaign objective",
    readerNeed: "Necesidad del lector / Reader need",
    targetAudience: "Público objetivo / Target audience",
    primaryMessage: "Mensaje principal / Primary message",
    cta: "CTA",
    contactPath: "Ruta de contacto / Contact path",
    imageStrategy: "Estrategia de imagen / Image strategy",
    desiredAction: "Acción deseada / Desired action",
    extra: null,
    avoid: { label: "Palabras a evitar / Wording to avoid (opcional / optional)", placeholder: "p. ej. \"el mejor\", superlativos sin prueba / e.g. \"the best\", unproven superlatives" },
    disclosure: null,
  },
  logo: {
    businessGoal: "Nombre exacto del negocio y categoría / Exact business name and category",
    campaignObjective: "Diferenciador — ¿qué los hace únicos? / Differentiator — what makes them unique?",
    readerNeed: "Historia / origen del negocio / Business story / origin",
    targetAudience: "Público objetivo / Target audience",
    primaryMessage: "Personalidad y emoción deseada / Personality and desired emotion",
    cta: "Casos de uso principales (letrero, empaque, digital) / Primary use cases (signage, packaging, digital)",
    contactPath: "Contacto para preguntas de seguimiento / Contact for follow-up questions",
    imageStrategy: "Colores actuales, si los hay / Current colors, if any",
    desiredAction: "Símbolos o significado cultural/local a incluir / Symbols or cultural/local meaning to include",
    extra: { label: "Notas adicionales de marca (opcional) / Additional brand notes (optional)", placeholder: "cualquier otra preferencia de marca / any other brand preference" },
    avoid: { label: "Colores/símbolos a evitar / Colors/symbols to avoid", placeholder: "p. ej. rojo, imágenes agresivas / e.g. red, aggressive imagery" },
    disclosure: null,
  },
  website: {
    businessGoal: "Objetivo del sitio web / Website goal",
    campaignObjective: "URL actual, si existe / Current URL, if any",
    readerNeed: "Problemas actuales del sitio / Current pain points",
    targetAudience: "Tipo de visitante objetivo / Target visitor type",
    primaryMessage: "Dirección de marca / mensaje / Brand direction / message",
    cta: "CTA principal / Primary CTA",
    contactPath: "Ruta de contacto o reserva / Contact or booking path",
    imageStrategy: "Recursos reales disponibles (fotos, logo, etc.) / Real assets available (photos, logo, etc.)",
    desiredAction: "Acción deseada del visitante (llamar, reservar, comprar) / Desired visitor action (call, book, buy)",
    extra: { label: "Páginas necesarias y vacíos de contenido (opcional) / Pages needed and content gaps (optional)", placeholder: "p. ej. página de servicios, galería, reseñas / e.g. services page, gallery, reviews" },
    avoid: null,
    disclosure: null,
  },
  sponsored_editorial: {
    businessGoal: "Tema editorial / Editorial topic",
    campaignObjective: "Autoridad del socio — ¿por qué está calificado para hablar de esto? / Partner authority — why is this business qualified to speak on this topic?",
    readerNeed: "Valor para el lector / Reader value",
    targetAudience: "Público objetivo / Target audience",
    primaryMessage: "Mensaje/ángulo clave / Key message or angle",
    cta: "CTA",
    contactPath: "Destino del Business Hub / perfil / Business Hub / profile destination",
    imageStrategy: "Participación factual aprobada — qué hechos podemos afirmar / Approved factual participation — what facts we can state",
    desiredAction: "Acción deseada del lector / Desired reader action",
    extra: { label: "Afirmaciones que requieren verificación (opcional) / Claims requiring verification (optional)", placeholder: "cualquier dato que deba confirmarse antes de publicar / any fact that must be confirmed before publishing" },
    avoid: null,
    disclosure: { label: "Requisitos de divulgación de patrocinio / Sponsorship disclosure requirements", placeholder: "p. ej. \"Contenido patrocinado por...\" / e.g. \"Sponsored content by...\"" },
  },
};

export function CreateBriefForm({
  businessId,
  jobId,
  canCreateBrief,
  creativeLane,
  assetType,
  prefill,
}: {
  businessId: string;
  jobId: string;
  canCreateBrief: boolean;
  creativeLane: string;
  assetType?: string;
  prefill?: {
    businessGoal: string;
    campaignObjective: string;
    readerNeed: string;
    targetAudience: string;
    primaryMessage: string;
    cta: string;
    contactPath: string;
    keyServicesText: string;
    offer: string;
  } | null;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [businessGoal, setBusinessGoal] = useState(prefill?.businessGoal ?? "");
  const [campaignObjective, setCampaignObjective] = useState(prefill?.campaignObjective ?? "");
  const [readerNeed, setReaderNeed] = useState(prefill?.readerNeed ?? "");
  const [targetAudience, setTargetAudience] = useState(prefill?.targetAudience ?? "");
  const [primaryMessage, setPrimaryMessage] = useState(prefill?.primaryMessage ?? "");
  const [cta, setCta] = useState(prefill?.cta ?? "");
  const [contactPath, setContactPath] = useState(prefill?.contactPath ?? "");
  const [keyServicesText, setKeyServicesText] = useState(prefill?.keyServicesText ?? "");
  const [imageStrategy, setImageStrategy] = useState("");
  const [desiredAction, setDesiredAction] = useState("");
  const [extraNotes, setExtraNotes] = useState("");
  const [avoidText, setAvoidText] = useState("");
  const [disclosureText, setDisclosureText] = useState("");
  const [lane, setLane] = useState(creativeLane || CREATIVE_LANES[0]);

  if (!canCreateBrief) {
    return <p className="text-xs text-[#7A7164]">Solo gerentes o super-admins pueden crear un Brief Creativo. / Creating a Creative Brief remains a manager / super-admin action.</p>;
  }

  const briefLane = briefLaneForAssetType(assetType);
  const copy = BRIEF_FIELD_COPY[briefLane];

  async function submit() {
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/admin/businesses/${businessId}/creative-studio/jobs/${jobId}/briefs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessGoal,
        campaignObjective,
        readerNeed,
        targetAudience,
        primaryMessage,
        cta,
        contactPath,
        imageStrategy,
        desiredAction,
        keyServices: keyServicesText.trim() ? [keyServicesText.trim()] : [],
        supportingMessage: extraNotes.trim() ? extraNotes.trim() : null,
        prohibitedClaims: avoidText.trim() ? [avoidText.trim()] : [],
        requiredDisclaimers: disclosureText.trim() ? [disclosureText.trim()] : [],
        creativeLane: lane,
      }),
    });
    const data = await res.json().catch(() => ({} as { error?: string; detail?: string }));
    setSubmitting(false);
    if (!res.ok) {
      setError(readApiError(data, "No se pudo guardar el Brief Creativo. / Could not save the Creative Brief."));
      return;
    }
    router.refresh();
  }

  const fieldClass = "min-h-[44px] w-full rounded-lg border border-[#E8DFD0] px-3 py-2 text-xs text-[#1E1810]";

  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <p className="text-xs text-[#7A7164]">El Brief Creativo es una dirección de trabajo derivada. No es el Paquete de Verdad. El prellenado es editable y no se guarda hasta que hagas clic en Guardar. / Creative Brief is derived working direction. It is not the Truth Packet. Prefill is editable and is not saved until you click Save.</p>
      <input className={fieldClass} value={businessGoal} onChange={(e) => setBusinessGoal(e.target.value)} placeholder={copy.businessGoal} required />
      <input className={fieldClass} value={campaignObjective} onChange={(e) => setCampaignObjective(e.target.value)} placeholder={copy.campaignObjective} required />
      <input className={fieldClass} value={readerNeed} onChange={(e) => setReaderNeed(e.target.value)} placeholder={copy.readerNeed} required />
      <input className={fieldClass} value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} placeholder={copy.targetAudience} required />
      <textarea className={fieldClass} value={primaryMessage} onChange={(e) => setPrimaryMessage(e.target.value)} placeholder={copy.primaryMessage} rows={2} required />
      <input className={fieldClass} value={cta} onChange={(e) => setCta(e.target.value)} placeholder={copy.cta} required />
      <input className={`${fieldClass} break-all`} value={contactPath} onChange={(e) => setContactPath(e.target.value)} placeholder={copy.contactPath} required />
      <input className={fieldClass} value={keyServicesText} onChange={(e) => setKeyServicesText(e.target.value)} placeholder="Servicios clave (opcional) / Key services (optional)" />
      <input className={fieldClass} value={imageStrategy} onChange={(e) => setImageStrategy(e.target.value)} placeholder={copy.imageStrategy} required />
      <input className={fieldClass} value={desiredAction} onChange={(e) => setDesiredAction(e.target.value)} placeholder={copy.desiredAction} required />
      {copy.extra ? (
        <textarea className={fieldClass} value={extraNotes} onChange={(e) => setExtraNotes(e.target.value)} placeholder={copy.extra.placeholder} rows={2} />
      ) : null}
      {copy.avoid ? (
        <input className={fieldClass} value={avoidText} onChange={(e) => setAvoidText(e.target.value)} placeholder={copy.avoid.placeholder} />
      ) : null}
      {copy.disclosure ? (
        <input className={fieldClass} value={disclosureText} onChange={(e) => setDisclosureText(e.target.value)} placeholder={copy.disclosure.placeholder} />
      ) : null}
      <select className={fieldClass} value={lane} onChange={(e) => setLane(e.target.value)}>
        {CREATIVE_LANES.map((option) => (
          <option key={option} value={option}>{option.replace(/_/g, " ")}</option>
        ))}
      </select>
      <button
        type="submit"
        disabled={submitting}
        className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#7A1E2C] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
      >
        {submitting ? "Guardando… / Saving…" : "Guardar Brief Creativo / Save Creative Brief"}
      </button>
      {error ? <p role="alert" className="text-xs text-red-700">{error}</p> : null}
    </form>
  );
}

export function CreativeStudioPanel({
  providerAvailability,
}: {
  businessId: string;
  jobs?: unknown;
  providerAvailability?: CreativeProviderAvailability;
}) {
  return <ProviderAvailabilityRow providerAvailability={providerAvailability} />;
}
