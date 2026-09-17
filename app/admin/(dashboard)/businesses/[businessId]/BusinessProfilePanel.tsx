"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { humanizeStaffWriteError } from "@/app/admin/_lib/staffWriteErrorMessages";

/**
 * Staff-Created Business Profile pipeline -- the staff builder panel. Self-contained (fetches its
 * own draft) matching OwnershipClaimPanel's pattern exactly. Only profile-presentation fields live
 * here -- business name/phone/email/website/address/socials are shown elsewhere on this same page
 * (canonical Business Identity), never duplicated into this panel.
 */

type ProfileHighlight = { title: string; description: string };

type ProfileState = {
  headline: string;
  shortDescription: string;
  aboutDescription: string;
  logoUrl: string;
  heroImageUrl: string;
  galleryImagesText: string;
  highlights: ProfileHighlight[];
};

type ProfileApiShape = {
  status: "draft" | "published";
  headline: string | null;
  shortDescription: string | null;
  aboutDescription: string | null;
  logoUrl: string | null;
  heroImageUrl: string | null;
  galleryImages: string[];
  featuredHighlights: ProfileHighlight[];
} | null;

type CommercialState = {
  eligible: boolean;
  state: "not_purchased" | "active" | "complimentary" | "expired";
  via: "listing_entitlement" | "business_profile_entitlement" | null;
};

type OwnershipClaimRow = { id: string; status: "pending" | "accepted" | "expired" | "revoked"; isEffectivelyExpired: boolean; acceptedByEmail: string | null };

const COMMERCIAL_LABEL: Record<CommercialState["state"], { text: string; className: string }> = {
  not_purchased: { text: "No comprado / Not purchased", className: "bg-[#EDE6D6] text-[#7A7164]" },
  active: { text: "Activo / Active", className: "bg-emerald-100 text-emerald-800" },
  complimentary: { text: "Cortesía / Complimentary", className: "bg-sky-100 text-sky-800" },
  expired: { text: "Expirado / Expired", className: "bg-amber-100 text-amber-900" },
};

const SOURCE_TYPE_LABELS: { value: "admin_manual" | "comp" | "partner" | "manual_cleared_payment"; label: string }[] = [
  { value: "admin_manual", label: "Verificado por staff / Staff-verified sale" },
  { value: "manual_cleared_payment", label: "Pago confirmado manualmente / Manually cleared payment" },
  { value: "comp", label: "Cortesía / Complimentary" },
  { value: "partner", label: "Socio / Partner" },
];

function emptyState(): ProfileState {
  return { headline: "", shortDescription: "", aboutDescription: "", logoUrl: "", heroImageUrl: "", galleryImagesText: "", highlights: [] };
}

function toState(profile: ProfileApiShape): ProfileState {
  if (!profile) return emptyState();
  return {
    headline: profile.headline ?? "",
    shortDescription: profile.shortDescription ?? "",
    aboutDescription: profile.aboutDescription ?? "",
    logoUrl: profile.logoUrl ?? "",
    heroImageUrl: profile.heroImageUrl ?? "",
    galleryImagesText: profile.galleryImages.join("\n"),
    highlights: profile.featuredHighlights.length > 0 ? profile.featuredHighlights : [],
  };
}

async function readApiError(res: Response, fallback: string): Promise<string> {
  const data = await res.json().catch(() => ({} as { error?: string }));
  return humanizeStaffWriteError(data.error, fallback);
}

export function BusinessProfilePanel({
  businessId,
  canManage,
  canGrantEntitlement,
  canRelease,
}: {
  businessId: string;
  canManage: boolean;
  canGrantEntitlement: boolean;
  canRelease: boolean;
}) {
  const [status, setStatus] = useState<"draft" | "published" | null>(null);
  const [form, setForm] = useState<ProfileState>(emptyState());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const [commercial, setCommercial] = useState<CommercialState | null>(null);
  const [claims, setClaims] = useState<OwnershipClaimRow[]>([]);
  const [commercialLoading, setCommercialLoading] = useState(true);
  const [releasing, setReleasing] = useState(false);
  const [releaseError, setReleaseError] = useState<string | null>(null);
  const [newClaimLink, setNewClaimLink] = useState<string | null>(null);
  const [granting, setGranting] = useState(false);
  const [grantError, setGrantError] = useState<string | null>(null);
  const [grantSourceType, setGrantSourceType] = useState<"admin_manual" | "comp" | "partner" | "manual_cleared_payment">("admin_manual");
  const [grantReference, setGrantReference] = useState("");
  const [grantExpiresAt, setGrantExpiresAt] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch(`/api/admin/businesses/${businessId}/profile`);
      if (cancelled) return;
      if (!res.ok) {
        setError(await readApiError(res, "No se pudo cargar el perfil. / Could not load the profile."));
        setLoading(false);
        return;
      }
      const data = (await res.json()) as { profile: ProfileApiShape };
      setStatus(data.profile?.status ?? null);
      setForm(toState(data.profile));
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  async function loadCommercialAndClaims() {
    setCommercialLoading(true);
    const [commercialRes, claimsRes] = await Promise.all([
      fetch(`/api/admin/businesses/${businessId}/profile-entitlement`),
      fetch(`/api/admin/businesses/${businessId}/ownership-claim`),
    ]);
    if (commercialRes.ok) {
      const data = (await commercialRes.json()) as { commercial: CommercialState };
      setCommercial(data.commercial);
    }
    if (claimsRes.ok) {
      const data = (await claimsRes.json()) as { claims: OwnershipClaimRow[] };
      setClaims(data.claims);
    }
    setCommercialLoading(false);
  }

  useEffect(() => {
    void loadCommercialAndClaims();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  const pendingClaim = claims.find((c) => c.status === "pending" && !c.isEffectivelyExpired) ?? null;
  const acceptedClaim = claims.find((c) => c.status === "accepted") ?? null;

  async function handleRelease() {
    setReleasing(true);
    setReleaseError(null);
    setNewClaimLink(null);
    const res = await fetch(`/api/admin/businesses/${businessId}/profile/release`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setReleasing(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setReleaseError(
        data.error === "no_active_entitlement"
          ? "El perfil está guardado. La entrega estará disponible cuando haya un paquete Leonix activo. / Profile saved. Release becomes available when a qualifying Leonix package is active."
          : humanizeStaffWriteError(data.error, "No se pudo entregar el perfil. / Could not release the profile."),
      );
      return;
    }
    const data = (await res.json()) as { claimLink: string };
    setNewClaimLink(typeof window !== "undefined" ? `${window.location.origin}${data.claimLink}` : data.claimLink);
    await loadCommercialAndClaims();
  }

  async function handleGrant() {
    setGranting(true);
    setGrantError(null);
    const res = await fetch(`/api/admin/businesses/${businessId}/profile-entitlement`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceType: grantSourceType,
        sourceReference: grantReference || null,
        expiresAt: grantExpiresAt || null,
      }),
    });
    setGranting(false);
    if (!res.ok) {
      setGrantError(await readApiError(res, "No se pudo registrar el paquete. / Could not record the package."));
      return;
    }
    setGrantReference("");
    setGrantExpiresAt("");
    await loadCommercialAndClaims();
  }

  function updateHighlight(index: number, field: keyof ProfileHighlight, value: string) {
    setForm((prev) => {
      const next = prev.highlights.slice();
      next[index] = { ...next[index], [field]: value };
      return { ...prev, highlights: next };
    });
  }

  function addHighlight() {
    setForm((prev) => (prev.highlights.length >= 8 ? prev : { ...prev, highlights: [...prev.highlights, { title: "", description: "" }] }));
  }

  function removeHighlight(index: number) {
    setForm((prev) => ({ ...prev, highlights: prev.highlights.filter((_, i) => i !== index) }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/businesses/${businessId}/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        headline: form.headline,
        shortDescription: form.shortDescription,
        aboutDescription: form.aboutDescription,
        logoUrl: form.logoUrl,
        heroImageUrl: form.heroImageUrl,
        galleryImages: form.galleryImagesText.split("\n").map((s) => s.trim()).filter(Boolean),
        featuredHighlights: form.highlights.filter((h) => h.title.trim()),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError(await readApiError(res, "No se pudo guardar el borrador. / Could not save the draft."));
      return;
    }
    const data = (await res.json()) as { profile: ProfileApiShape };
    setStatus(data.profile?.status ?? "draft");
    setSavedAt(Date.now());
  }

  if (loading) return <p className="text-sm text-[#7A7164]">Cargando… / Loading…</p>;

  if (!canManage) {
    return (
      <div className="space-y-3">
        <p className="text-xs text-[#7A7164]">Tu rol puede ver el perfil pero no editarlo. / Your role can view the profile but not edit it.</p>
        {status ? (
          <Link href={`/admin/businesses/${businessId}/profile/preview`} className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#C9A84A]/70 bg-white px-4 py-2 text-xs font-semibold text-[#1E1810]">
            Vista previa / Preview
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-[#7A7164]">
        Esto es lo que el cliente verá en su Perfil de Negocio Leonix — no duplica sus datos de contacto/dirección, que ya están arriba. / This is what the client will see on their Leonix Business Profile — it does not duplicate their contact/address data, already shown above.
      </p>
      {status ? (
        <span className={`inline-flex rounded px-2 py-0.5 text-[11px] font-semibold ${status === "published" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
          {status === "published" ? "Publicado / Published" : "Borrador / Draft"}
        </span>
      ) : (
        <span className="inline-flex rounded bg-[#EDE6D6] px-2 py-0.5 text-[11px] font-semibold text-[#7A7164]">Sin guardar aún / Not saved yet</span>
      )}

      {error ? <p role="alert" className="text-xs text-red-700">{error}</p> : null}
      {savedAt ? <p className="text-xs text-emerald-800">Borrador guardado. / Draft saved.</p> : null}

      <div className="rounded-xl border border-[#E8DFD0] bg-white p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Comercial / Commercial</span>
          {commercialLoading ? (
            <span className="text-xs text-[#7A7164]">…</span>
          ) : (
            <span className={`inline-flex rounded px-2 py-0.5 text-[11px] font-semibold ${COMMERCIAL_LABEL[commercial?.state ?? "not_purchased"].className}`}>
              {COMMERCIAL_LABEL[commercial?.state ?? "not_purchased"].text}
            </span>
          )}
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">· Propiedad / Ownership</span>
          <span className="inline-flex rounded bg-[#EDE6D6] px-2 py-0.5 text-[11px] font-semibold text-[#3D3428]">
            {acceptedClaim ? `Reclamado / Claimed${acceptedClaim.acceptedByEmail ? ` — ${acceptedClaim.acceptedByEmail}` : ""}` : pendingClaim ? "Entrega pendiente / Claim pending" : "No entregado / Not released"}
          </span>
        </div>

        {releaseError ? <p role="alert" className="mt-2 text-xs text-red-700">{releaseError}</p> : null}
        {newClaimLink ? (
          <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-900">
            <p className="font-semibold">Enlace generado — cópialo ahora. / Link generated — copy it now:</p>
            <code className="mt-1 block break-all rounded bg-white px-2 py-1 text-[11px] text-[#1E1810]">{newClaimLink}</code>
          </div>
        ) : null}

        {canRelease ? (
          <div className="mt-2">
            <button
              onClick={() => void handleRelease()}
              disabled={releasing || !commercial?.eligible || Boolean(pendingClaim) || Boolean(acceptedClaim)}
              className="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-[#7A1E2C] px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
            >
              {releasing ? "Entregando…" : acceptedClaim ? "Ya reclamado / Already claimed" : pendingClaim ? "Entrega ya pendiente / Release already pending" : "Entregar al cliente / Release to Client"}
            </button>
            {!commercialLoading && !commercial?.eligible && !pendingClaim && !acceptedClaim ? (
              <p className="mt-1 text-[11px] text-[#7A7164]">
                Perfil guardado. La entrega estará disponible cuando haya un paquete Leonix activo. / Profile saved. Release becomes available when a qualifying Leonix package is active.
              </p>
            ) : null}
          </div>
        ) : null}

        {canGrantEntitlement ? (
          <div className="mt-3 border-t border-dashed border-[#E8DFD0] pt-3">
            <p className="text-[11px] font-semibold text-[#8A6B1F]">Registrar paquete/venta / Record package or sale</p>
            {grantError ? <p role="alert" className="mt-1 text-xs text-red-700">{grantError}</p> : null}
            <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-2">
              <select
                value={grantSourceType}
                onChange={(e) => setGrantSourceType(e.target.value as typeof grantSourceType)}
                className="rounded-lg border border-[#E8DFD0] px-2 py-1.5 text-xs text-[#1E1810]"
              >
                {SOURCE_TYPE_LABELS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <input
                type="text"
                value={grantReference}
                onChange={(e) => setGrantReference(e.target.value)}
                placeholder="Referencia (factura, contrato…) / Reference (invoice, contract…)"
                className="flex-1 rounded-lg border border-[#E8DFD0] px-2 py-1.5 text-xs text-[#1E1810]"
              />
              <input
                type="date"
                value={grantExpiresAt}
                onChange={(e) => setGrantExpiresAt(e.target.value)}
                title="Fecha de vencimiento (opcional) / Expiration date (optional)"
                className="rounded-lg border border-[#E8DFD0] px-2 py-1.5 text-xs text-[#1E1810]"
              />
              <button
                onClick={() => void handleGrant()}
                disabled={granting}
                className="inline-flex min-h-[36px] items-center justify-center rounded-lg border border-[#C9A84A]/70 bg-[#FFFDF7] px-3 py-1.5 text-xs font-semibold text-[#7A1E2C] disabled:opacity-50"
              >
                {granting ? "Guardando…" : "Registrar / Record"}
              </button>
            </div>
            <p className="mt-1 text-[10px] text-[#9A9184]">
              Registra solo una venta/paquete real que ya verificaste. Nunca inventes un pago. / Only record a real sale/package you have already verified. Never invent a payment.
            </p>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block text-xs font-semibold text-[#8A6B1F]">
          Titular / Headline
          <input
            type="text"
            maxLength={120}
            value={form.headline}
            onChange={(e) => setForm((p) => ({ ...p, headline: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-[#E8DFD0] px-3 py-2 text-sm text-[#1E1810]"
            placeholder="Ej. Servicio de confianza desde 2010 / e.g. Trusted service since 2010"
          />
        </label>
        <label className="block text-xs font-semibold text-[#8A6B1F]">
          Logo (URL)
          <input
            type="url"
            value={form.logoUrl}
            onChange={(e) => setForm((p) => ({ ...p, logoUrl: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-[#E8DFD0] px-3 py-2 text-sm text-[#1E1810]"
            placeholder="https://…"
          />
        </label>
      </div>

      <label className="block text-xs font-semibold text-[#8A6B1F]">
        Descripción corta / Short description
        <textarea
          maxLength={240}
          rows={2}
          value={form.shortDescription}
          onChange={(e) => setForm((p) => ({ ...p, shortDescription: e.target.value }))}
          className="mt-1 w-full rounded-lg border border-[#E8DFD0] px-3 py-2 text-sm text-[#1E1810]"
        />
      </label>

      <label className="block text-xs font-semibold text-[#8A6B1F]">
        Acerca de / About
        <textarea
          maxLength={4000}
          rows={4}
          value={form.aboutDescription}
          onChange={(e) => setForm((p) => ({ ...p, aboutDescription: e.target.value }))}
          className="mt-1 w-full rounded-lg border border-[#E8DFD0] px-3 py-2 text-sm text-[#1E1810]"
        />
      </label>

      <label className="block text-xs font-semibold text-[#8A6B1F]">
        Imagen principal / Hero image (URL)
        <input
          type="url"
          value={form.heroImageUrl}
          onChange={(e) => setForm((p) => ({ ...p, heroImageUrl: e.target.value }))}
          className="mt-1 w-full rounded-lg border border-[#E8DFD0] px-3 py-2 text-sm text-[#1E1810]"
          placeholder="https://…"
        />
      </label>

      <label className="block text-xs font-semibold text-[#8A6B1F]">
        Galería — una URL por línea (máx. 12) / Gallery — one URL per line (max 12)
        <textarea
          rows={3}
          value={form.galleryImagesText}
          onChange={(e) => setForm((p) => ({ ...p, galleryImagesText: e.target.value }))}
          className="mt-1 w-full rounded-lg border border-[#E8DFD0] px-3 py-2 text-sm text-[#1E1810]"
          placeholder={"https://…\nhttps://…"}
        />
      </label>

      <div>
        <p className="text-xs font-semibold text-[#8A6B1F]">Destacados / Highlights</p>
        <div className="mt-1 space-y-2">
          {form.highlights.map((h, i) => (
            <div key={i} className="flex flex-col gap-1 rounded-lg border border-[#E8DFD0] p-2 sm:flex-row sm:items-start sm:gap-2">
              <input
                type="text"
                maxLength={120}
                value={h.title}
                onChange={(e) => updateHighlight(i, "title", e.target.value)}
                className="flex-1 rounded-lg border border-[#E8DFD0] px-2 py-1.5 text-sm text-[#1E1810]"
                placeholder="Título / Title"
              />
              <input
                type="text"
                maxLength={400}
                value={h.description}
                onChange={(e) => updateHighlight(i, "description", e.target.value)}
                className="flex-1 rounded-lg border border-[#E8DFD0] px-2 py-1.5 text-sm text-[#1E1810]"
                placeholder="Descripción / Description"
              />
              <button onClick={() => removeHighlight(i)} className="shrink-0 rounded-lg border border-red-200 px-2 py-1.5 text-xs font-semibold text-red-800">
                Quitar / Remove
              </button>
            </div>
          ))}
          {form.highlights.length < 8 ? (
            <button onClick={addHighlight} className="rounded-lg border border-[#C9A84A]/70 px-3 py-1.5 text-xs font-semibold text-[#7A1E2C]">
              + Agregar destacado / Add highlight
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => void handleSave()}
          disabled={saving}
          className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#1F3A2D] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Guardar borrador / Save draft"}
        </button>
        <Link href={`/admin/businesses/${businessId}/profile/preview`} target="_blank" className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#C9A84A]/70 bg-white px-4 py-2 text-xs font-semibold text-[#1E1810]">
          Vista previa / Preview
        </Link>
      </div>
    </div>
  );
}
