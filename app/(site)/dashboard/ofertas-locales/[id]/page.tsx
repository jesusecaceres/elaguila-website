"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { getSafeOfertaLocalSourceAssetHref } from "@/app/lib/ofertas-locales/ofertasLocalesClickableItemPreviewHelpers";
import type { OfertaLocalOwnerDetail } from "@/app/lib/ofertas-locales/ofertasLocalesOwnerHelpers";
import type { OfertaLocalOwnerUpdateInput } from "@/app/lib/ofertas-locales/ofertasLocalesOwnerUpdateMapper";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";

import { LeonixDashboardShell } from "../../components/LeonixDashboardShell";
import { OfertasLocalesOwnerAiManageSection } from "./OfertasLocalesOwnerAiManageSection";

type Lang = "es" | "en";

const INPUT =
  "mt-1 w-full rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm text-[#1E1810]";

export default function OfertasLocalesOwnerManagePage() {
  const params = useParams();
  const offerId = String(params?.id ?? "");
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang: Lang = searchParams?.get("lang") === "en" ? "en" : "es";
  const q = `lang=${lang}`;

  const t = useMemo(
    () =>
      lang === "es"
        ? {
            title: "Gestionar oferta local",
            loading: "Cargando…",
            notFound: "No encontramos esta oferta o no tienes acceso.",
            back: "Volver a mis ofertas",
            save: "Guardar y reenviar a revisión",
            saving: "Guardando…",
            saved: "Enviado a revisión.",
            editTitle: "Editar detalles",
            readOnly: "Solo lectura — contacta a Leonix para cambios en ofertas aprobadas.",
            contactLeonix: "Contactar a Leonix",
            assetsTitle: "Archivos subidos",
            socialTitle: "Redes y reseñas",
            aiTitle: "AI Searchable Specials",
            featuredTitle: "Featured placement",
            approvedBlock:
              "Esta oferta está aprobada. Para cambios, contacta al equipo Leonix — no puedes editarla directamente.",
            archivedBlock: "Esta oferta está archivada. Contacta a Leonix si necesitas reactivarla.",
            assetsReadOnly: "Los archivos no se pueden cambiar aquí. Envía una nueva oferta si necesitas reemplazarlos.",
            viewFile: "Ver archivo",
            publicLink: "Ver en resultados públicos",
          }
        : {
            title: "Manage local deal",
            loading: "Loading…",
            notFound: "We could not find this offer or you do not have access.",
            back: "Back to my deals",
            save: "Save and resubmit for review",
            saving: "Saving…",
            saved: "Submitted for review.",
            editTitle: "Edit details",
            readOnly: "Read-only — contact Leonix to update approved offers.",
            contactLeonix: "Contact Leonix",
            assetsTitle: "Uploaded files",
            socialTitle: "Social & reviews",
            aiTitle: "AI Searchable Specials",
            featuredTitle: "Featured placement",
            approvedBlock:
              "This offer is approved. Contact the Leonix team for changes — you cannot edit it directly.",
            archivedBlock: "This offer is archived. Contact Leonix if you need it restored.",
            assetsReadOnly: "Files cannot be changed here. Submit a new offer if you need to replace them.",
            viewFile: "View file",
            publicLink: "View in public results",
          },
    [lang]
  );

  const [loading, setLoading] = useState(true);
  const [offer, setOffer] = useState<OfertaLocalOwnerDetail | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [form, setForm] = useState<OfertaLocalOwnerUpdateInput>({});

  const loadOffer = useCallback(async () => {
    const sb = createSupabaseBrowserClient();
    const { data: userData } = await sb.auth.getUser();
    if (!userData.user) {
      router.replace(`/login?redirect=${encodeURIComponent(`/dashboard/ofertas-locales/${offerId}?${q}`)}`);
      return null;
    }
    const { data: sess } = await sb.auth.getSession();
    const token = sess.session?.access_token ?? "";
    if (!token) return null;
    const res = await fetch(`/api/ofertas-locales/owner/${offerId}?lang=${lang}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const j = (await res.json()) as { ok?: boolean; offer?: OfertaLocalOwnerDetail };
    if (!j.ok || !j.offer) return null;
    return j.offer;
  }, [offerId, lang, q, router]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const row = await loadOffer();
      if (cancelled) return;
      if (!row) {
        setOffer(null);
        setLoading(false);
        return;
      }
      setOffer(row);
      const social = row.metadata.socialLinks ?? {};
      setForm({
        title: row.title,
        description: row.description ?? "",
        couponText: row.couponText ?? "",
        flyerTitle: row.flyerTitle ?? "",
        validFrom: row.validFrom,
        validUntil: row.validUntil,
        address: row.address ?? "",
        city: row.city,
        state: row.state ?? "",
        zipCode: row.zipCode,
        phone: row.phone ?? "",
        whatsapp: row.whatsapp ?? "",
        websiteUrl: row.websiteHref ?? "",
        directionsUrl: row.directionsHref ?? "",
        membershipUrl: row.membershipUrl ?? "",
        membershipCtaLabel: row.membershipCtaLabel ?? "",
        membershipNote: row.membershipNote ?? "",
        requiresMembershipForDeals: row.requiresMembershipForDeals,
        digitalCouponUrl: row.digitalCouponUrl ?? "",
        digitalCouponNote: row.digitalCouponNote ?? "",
        facebookUrl: social.facebookUrl ?? "",
        instagramUrl: social.instagramUrl ?? "",
        tiktokUrl: social.tiktokUrl ?? "",
        youtubeUrl: social.youtubeUrl ?? "",
        googleBusinessUrl: social.googleBusinessUrl ?? "",
        googleReviewUrl: social.googleReviewUrl ?? "",
        yelpUrl: social.yelpUrl ?? "",
        wantsAiSearchableSpecials: row.metadata.wantsAiSearchableSpecials,
        wantsFeaturedPlacement: row.featuredRequested,
        featuredPlacementScope: row.featuredPlacementScope ?? "none",
      });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadOffer]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!offer?.canEdit) return;
    setSaving(true);
    setSaveMsg(null);
    const sb = createSupabaseBrowserClient();
    const { data: sess } = await sb.auth.getSession();
    const token = sess.session?.access_token ?? "";
    if (!token) {
      setSaving(false);
      return;
    }
    const res = await fetch(`/api/ofertas-locales/owner/${offerId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ updates: form }),
    });
    const j = (await res.json()) as { ok?: boolean; error?: string };
    setSaving(false);
    if (j.ok) {
      setSaveMsg(t.saved);
      setEditMode(false);
      const refreshed = await loadOffer();
      if (refreshed) setOffer(refreshed);
    }
  }

  if (loading) {
    return (
      <LeonixDashboardShell lang={lang} activeNav="listings" plan="free" userName={null} email={null} accountRef={null}>
        <p className="text-sm text-[#5C5346]">{t.loading}</p>
      </LeonixDashboardShell>
    );
  }

  if (!offer) {
    return (
      <LeonixDashboardShell lang={lang} activeNav="listings" plan="free" userName={null} email={null} accountRef={null}>
        <p className="text-sm text-[#5C5346]">{t.notFound}</p>
        <Link href={`/dashboard/ofertas-locales?${q}`} className="mt-4 inline-block text-[#6B5B2E] underline">
          {t.back}
        </Link>
      </LeonixDashboardShell>
    );
  }

  const social = offer.metadata.socialLinks ?? {};

  return (
    <LeonixDashboardShell lang={lang} activeNav="listings" plan="free" userName={null} email={null} accountRef={null}>
      <div className="mb-4">
        <Link href={`/dashboard/ofertas-locales?${q}`} className="text-sm text-[#6B5B2E] underline">
          ← {t.back}
        </Link>
      </div>

      <header className="mb-6">
        <h1 className="text-2xl font-bold text-[#1E1810]">{t.title}</h1>
        <p className="mt-1 text-lg font-semibold text-[#5C5346]">{offer.businessName}</p>
        <p className="text-sm text-[#7A7164]">{offer.title}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-[#FBF7EF] px-2 py-1 text-xs font-bold text-[#5C4E2E]">
            {offer.displayStatus}
          </span>
          {offer.publicResultsHref ? (
            <Link
              href={appendLangToPath(offer.publicResultsHref, lang)}
              className="text-xs font-semibold text-[#6B5B2E] underline"
              target="_blank"
              rel="noreferrer"
            >
              {t.publicLink}
            </Link>
          ) : null}
        </div>
        <p className="mt-3 rounded-xl border border-[#E8DFD0] bg-[#FFFCF7] p-3 text-sm text-[#5C5346]">
          {offer.statusMessage}
        </p>
      </header>

      {!offer.canEdit && offer.status === "approved" ? (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">{t.approvedBlock}</p>
      ) : null}
      {!offer.canEdit && offer.status === "archived" ? (
        <p className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">{t.archivedBlock}</p>
      ) : null}

      {offer.canEdit && !editMode ? (
        <button
          type="button"
          onClick={() => setEditMode(true)}
          className="mb-6 rounded-xl border border-[#C9B46A]/60 bg-[#FBF7EF] px-4 py-2 text-sm font-bold text-[#5C4E2E]"
        >
          {offer.status === "rejected"
            ? lang === "es"
              ? "Editar y reenviar"
              : "Edit and resubmit"
            : t.editTitle}
        </button>
      ) : null}

      {editMode && offer.canEdit ? (
        <form onSubmit={handleSave} className="mb-8 space-y-4 rounded-2xl border border-[#E8DFD0] bg-white p-5">
          <h2 className="text-base font-bold text-[#1E1810]">{t.editTitle}</h2>
          {[
            ["title", "title"],
            ["description", "description"],
            ["couponText", "couponText"],
            ["flyerTitle", "flyerTitle"],
            ["validFrom", "validFrom"],
            ["validUntil", "validUntil"],
            ["address", "address"],
            ["city", "city"],
            ["state", "state"],
            ["zipCode", "zipCode"],
            ["phone", "phone"],
            ["whatsapp", "whatsapp"],
            ["websiteUrl", "websiteUrl"],
            ["directionsUrl", "directionsUrl"],
          ].map(([key, label]) => (
            <label key={key} className="block text-xs font-semibold text-[#5C5346]">
              {label}
              <input
                className={INPUT}
                value={String((form as Record<string, unknown>)[key] ?? "")}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              />
            </label>
          ))}
          <p className="text-xs text-[#7A7164]">{t.assetsReadOnly}</p>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-gradient-to-br from-[#E8D48A] to-[#C9A84A] px-4 py-2 text-sm font-bold text-[#1E1810] disabled:opacity-50"
            >
              {saving ? t.saving : t.save}
            </button>
            <button
              type="button"
              onClick={() => setEditMode(false)}
              className="rounded-xl border border-[#E8DFD0] px-4 py-2 text-sm"
            >
              {lang === "es" ? "Cancelar" : "Cancel"}
            </button>
          </div>
          {saveMsg ? <p className="text-sm text-emerald-800">{saveMsg}</p> : null}
        </form>
      ) : null}

      {!offer.canEdit ? (
        <Link href={appendLangToPath("/contacto", lang)} className="mb-6 inline-block text-sm font-semibold text-[#6B5B2E] underline">
          {t.contactLeonix}
        </Link>
      ) : null}

      <OfertasLocalesOwnerAiManageSection
        lang={lang}
        offerId={offer.id}
        wantsAiSearchableSpecials={offer.metadata.wantsAiSearchableSpecials}
        flyerAssets={offer.flyerAssets}
        couponAssets={offer.couponAssets}
        offerStatus={offer.status}
      />

      <div className="space-y-6 text-sm">
        <section>
          <h2 className="text-xs font-bold uppercase text-[#7A7164]">{t.assetsTitle}</h2>
          <p className="mt-1 text-xs text-[#7A7164]">{t.assetsReadOnly}</p>
          <ul className="mt-2 space-y-2">
            {[...offer.flyerAssets, ...offer.couponAssets].map((a) => {
              const href = getSafeOfertaLocalSourceAssetHref(a.url);
              return (
                <li key={a.id} className="rounded-xl border border-[#E8DFD0] p-3">
                  {a.fileName || a.title || a.id}
                  {href ? (
                    <a href={href} target="_blank" rel="noreferrer" className="ml-2 underline">
                      {t.viewFile}
                    </a>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>

        <section>
          <h2 className="text-xs font-bold uppercase text-[#7A7164]">{t.socialTitle}</h2>
          <div className="mt-2 flex flex-wrap gap-3">
            {social.facebookUrl ? <a href={social.facebookUrl} target="_blank" rel="noreferrer" className="underline">Facebook</a> : null}
            {social.instagramUrl ? <a href={social.instagramUrl} target="_blank" rel="noreferrer" className="underline">Instagram</a> : null}
            {social.tiktokUrl ? <a href={social.tiktokUrl} target="_blank" rel="noreferrer" className="underline">TikTok</a> : null}
            {social.youtubeUrl ? <a href={social.youtubeUrl} target="_blank" rel="noreferrer" className="underline">YouTube</a> : null}
            {social.googleBusinessUrl ? <a href={social.googleBusinessUrl} target="_blank" rel="noreferrer" className="underline">Google Business</a> : null}
            {social.googleReviewUrl ? <a href={social.googleReviewUrl} target="_blank" rel="noreferrer" className="underline">Google Reviews</a> : null}
            {social.yelpUrl ? <a href={social.yelpUrl} target="_blank" rel="noreferrer" className="underline">Yelp</a> : null}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <div>
            <h2 className="text-xs font-bold uppercase text-[#7A7164]">{t.aiTitle}</h2>
            <p>{offer.metadata.wantsAiSearchableSpecials ? (lang === "es" ? "Solicitado" : "Requested") : "—"}</p>
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase text-[#7A7164]">{t.featuredTitle}</h2>
            <p>
              {offer.featuredRequested
                ? `${lang === "es" ? "Solicitado" : "Requested"}${offer.featuredPlacementScope ? ` · ${offer.featuredPlacementScope}` : ""}`
                : "—"}
            </p>
          </div>
        </section>

        <dl className="grid gap-2 text-xs text-[#7A7164] sm:grid-cols-3">
          <div>
            <dt className="font-bold">{lang === "es" ? "Enviado" : "Submitted"}</dt>
            <dd>{offer.submittedAt}</dd>
          </div>
          <div>
            <dt className="font-bold">{lang === "es" ? "Creado" : "Created"}</dt>
            <dd>{offer.createdAt}</dd>
          </div>
          <div>
            <dt className="font-bold">{lang === "es" ? "Actualizado" : "Updated"}</dt>
            <dd>{offer.updatedAt}</dd>
          </div>
        </dl>
      </div>
    </LeonixDashboardShell>
  );
}
