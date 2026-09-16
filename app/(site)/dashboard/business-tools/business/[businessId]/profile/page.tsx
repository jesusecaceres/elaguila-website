"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { LeonixDashboardShell } from "../../../../components/LeonixDashboardShell";
import { businessApiFetch } from "../../../_components/businessApiClient";

/**
 * Staff-Created Business Profile pipeline -- owner's own Business Profile editor. Mirrors the
 * staff builder panel's fields exactly (app/admin/(dashboard)/businesses/[businessId]/
 * BusinessProfilePanel.tsx) so a claimed business continues from what Leonix already prepared
 * instead of starting over. Publication lives on this same page since it is the one consequential
 * action here; it never accepts a client-side price/entitlement claim -- the server-side RPC is
 * the sole authority.
 */

type ProfileHighlight = { title: string; description: string };

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

type CommercialState = { eligible: boolean; state: "not_purchased" | "active" | "complimentary" | "expired" };

type GetResponse = {
  profile: ProfileApiShape;
  business: { id: string; displayName: string; publicName: string | null } | null;
  commercial: CommercialState;
};

const COMMERCIAL_LABEL: Record<CommercialState["state"], { text: string; className: string }> = {
  not_purchased: { text: "Sin paquete activo / No active package", className: "bg-[#EDE6D6] text-[#7A7164]" },
  active: { text: "Paquete activo / Package active", className: "bg-emerald-100 text-emerald-800" },
  complimentary: { text: "Cortesía / Complimentary", className: "bg-sky-100 text-sky-800" },
  expired: { text: "Paquete expirado / Package expired", className: "bg-amber-100 text-amber-900" },
};

type FormState = {
  headline: string;
  shortDescription: string;
  aboutDescription: string;
  logoUrl: string;
  heroImageUrl: string;
  galleryImagesText: string;
  highlights: ProfileHighlight[];
};

function emptyForm(): FormState {
  return { headline: "", shortDescription: "", aboutDescription: "", logoUrl: "", heroImageUrl: "", galleryImagesText: "", highlights: [] };
}

function toForm(profile: ProfileApiShape): FormState {
  if (!profile) return emptyForm();
  return {
    headline: profile.headline ?? "",
    shortDescription: profile.shortDescription ?? "",
    aboutDescription: profile.aboutDescription ?? "",
    logoUrl: profile.logoUrl ?? "",
    heroImageUrl: profile.heroImageUrl ?? "",
    galleryImagesText: profile.galleryImages.join("\n"),
    highlights: profile.featuredHighlights,
  };
}

function BusinessProfileEditorContent() {
  const router = useRouter();
  const params = useParams<{ businessId: string }>();
  const pathname = usePathname() ?? "/dashboard/business-tools";
  const businessId = params?.businessId ?? "";

  const [checkedAuth, setCheckedAuth] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);
  const [status, setStatus] = useState<"draft" | "published" | null>(null);
  const [commercial, setCommercial] = useState<CommercialState | null>(null);
  const [businessName, setBusinessName] = useState<string>("");
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const sb = createSupabaseBrowserClient();
    let mounted = true;
    async function run() {
      const { data } = await sb.auth.getUser();
      if (!mounted) return;
      if (!data.user) {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }
      setUserId(data.user.id);
      setEmail(data.user.email ?? null);
      setName((data.user.user_metadata?.full_name as string | undefined) || null);
      setCheckedAuth(true);
    }
    void run();
    return () => {
      mounted = false;
    };
  }, [router, pathname]);

  useEffect(() => {
    if (!checkedAuth || !businessId) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setErrored(false);
      const result = await businessApiFetch<GetResponse>(`/api/business/profile?businessId=${encodeURIComponent(businessId)}`);
      if (cancelled) return;
      if (!result.ok) {
        setErrored(true);
      } else {
        setStatus(result.data.profile?.status ?? null);
        setCommercial(result.data.commercial ?? null);
        setBusinessName(result.data.business?.publicName || result.data.business?.displayName || "");
        setForm(toForm(result.data.profile));
      }
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [checkedAuth, businessId]);

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
    setNotice(null);
    const result = await businessApiFetch<{ profile: ProfileApiShape }>("/api/business/profile", {
      method: "PUT",
      body: JSON.stringify({
        businessId,
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
    if (!result.ok) {
      setError("No se pudo guardar. / Could not save.");
      return;
    }
    setStatus(result.data.profile?.status ?? "draft");
    setNotice("Borrador guardado. / Draft saved.");
  }

  async function handlePublishToggle(action: "publish" | "unpublish") {
    setPublishing(true);
    setError(null);
    setNotice(null);
    const result = await businessApiFetch<{ profile: ProfileApiShape }>("/api/business/profile/publish", {
      method: "POST",
      body: JSON.stringify({ businessId, action }),
    });
    setPublishing(false);
    if (!result.ok) {
      if (result.error === "no_active_entitlement") {
        setError(
          "Publicar requiere un paquete/anuncio activo de Leonix vinculado a este negocio. Contacta a tu representante de Leonix. / Publishing requires an active Leonix package/listing linked to this business. Contact your Leonix representative.",
        );
      } else {
        setError("No se pudo actualizar el estado de publicación. / Could not update publish status.");
      }
      return;
    }
    setStatus(result.data.profile?.status ?? null);
    setNotice(action === "publish" ? "¡Publicado! / Published!" : "Vuelto a borrador. / Back to draft.");
  }

  return (
    <LeonixDashboardShell lang="es" activeNav="business" plan="free" userName={name} email={email} accountRef={null} ownerId={userId}>
      {!checkedAuth || loading ? (
        <div role="status" aria-live="polite" className="rounded-3xl border border-[#E8DFD0] bg-[#FFFCF7]/90 p-10 text-center text-sm text-[#5C5346]">
          Cargando… / Loading…
        </div>
      ) : errored ? (
        <div role="alert" className="rounded-3xl border border-[#E8DFD0] bg-[#FFFCF7]/90 p-8 text-center text-sm text-[#5C5346]">
          No se pudo cargar. / Could not load.
        </div>
      ) : (
        <div className="space-y-6">
          <Link href={`/dashboard/business-tools/business/${businessId}`} className="text-xs font-semibold text-[#7A1E2C] underline">
            ← Volver / Back
          </Link>

          <header className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-6 shadow-[0_12px_40px_-14px_rgba(42,36,22,0.12)] sm:p-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8A6B1F]">Perfil de Negocio Leonix / Leonix Business Profile</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#1E1810] sm:text-3xl">{businessName}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className={`inline-flex rounded px-2 py-0.5 text-[11px] font-semibold ${status === "published" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                {status === "published" ? "Publicado / Published" : "Borrador / Draft"}
              </span>
              {commercial ? (
                <span className={`inline-flex rounded px-2 py-0.5 text-[11px] font-semibold ${COMMERCIAL_LABEL[commercial.state].className}`}>
                  {COMMERCIAL_LABEL[commercial.state].text}
                </span>
              ) : null}
              <Link href={`/dashboard/business-tools/business/${businessId}/profile/preview`} target="_blank" className="text-xs font-semibold text-[#3B66AD] underline">
                Vista previa / Preview
              </Link>
            </div>
            {status !== "published" && commercial && !commercial.eligible ? (
              <p className="mt-2 text-xs text-[#7A7164]">
                Publicar estará disponible cuando haya un paquete Leonix activo vinculado a este negocio. Contacta a tu representante de Leonix. / Publishing will be available once an active Leonix package is linked to this business. Contact your Leonix representative.
              </p>
            ) : null}
          </header>

          {error ? <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}
          {notice ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</p> : null}

          <section className="space-y-4 rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-6 sm:p-8">
            <label className="block text-xs font-semibold text-[#8A6B1F]">
              Titular / Headline
              <input
                type="text"
                maxLength={120}
                value={form.headline}
                onChange={(e) => setForm((p) => ({ ...p, headline: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-[#E8DFD0] px-3 py-2 text-sm text-[#1E1810]"
              />
            </label>
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block text-xs font-semibold text-[#8A6B1F]">
                Logo (URL)
                <input
                  type="url"
                  value={form.logoUrl}
                  onChange={(e) => setForm((p) => ({ ...p, logoUrl: e.target.value }))}
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
                />
              </label>
            </div>
            <label className="block text-xs font-semibold text-[#8A6B1F]">
              Galería — una URL por línea (máx. 12) / Gallery — one URL per line (max 12)
              <textarea
                rows={3}
                value={form.galleryImagesText}
                onChange={(e) => setForm((p) => ({ ...p, galleryImagesText: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-[#E8DFD0] px-3 py-2 text-sm text-[#1E1810]"
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

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={() => void handleSave()}
                disabled={saving}
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#1F3A2D] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                {saving ? "Guardando…" : "Guardar borrador / Save draft"}
              </button>
              {status === "published" ? (
                <button
                  onClick={() => void handlePublishToggle("unpublish")}
                  disabled={publishing}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-red-200 px-4 py-2 text-xs font-semibold text-red-800 disabled:opacity-50"
                >
                  {publishing ? "…" : "Despublicar / Unpublish"}
                </button>
              ) : (
                <button
                  onClick={() => void handlePublishToggle("publish")}
                  disabled={publishing || !commercial?.eligible}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#7A1E2C] px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
                >
                  {publishing ? "…" : "Publicar / Publish"}
                </button>
              )}
            </div>
          </section>
        </div>
      )}
    </LeonixDashboardShell>
  );
}

export default function BusinessProfileEditorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
      <BusinessProfileEditorContent />
    </Suspense>
  );
}
