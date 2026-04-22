"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";

import { LeonixDashboardShell } from "../../components/LeonixDashboardShell";

type Lang = "es" | "en";

type ListingRow = {
  id: string;
  slug: string;
  title: string;
  company_name: string;
  lifecycle_status: string;
  lane: string;
  moderation_reason: string | null;
  apply_count?: number | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

type AppRow = {
  id: string;
  applicant_name: string;
  applicant_email: string;
  message: string;
  answers_json: unknown;
  status: string;
  created_at: string;
};

const BTN =
  "inline-flex items-center justify-center rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-xs font-bold text-[#1E1810] hover:bg-[#FAF7F2] disabled:opacity-40";

export default function EmpleosEmployerManagePage() {
  const params = useParams();
  const listingId = String(params?.listingId ?? "");
  const router = useRouter();
  const sp = useSearchParams();
  const lang: Lang = sp?.get("lang") === "en" ? "en" : "es";
  const q = `lang=${lang}`;

  const t = useMemo(
    () =>
      lang === "es"
        ? {
            title: "Gestionar vacante",
            loading: "Cargando…",
            notFound: "No encontramos este listado o no tienes acceso.",
            back: "Volver a mis vacantes",
            applications: "Solicitudes",
            noApps: "Sin solicitudes aún.",
            status: "Estado",
            actions: "Acciones",
            moderation: "Moderación",
            applyCount: "Solicitudes",
            setViewed: "Marcar visto",
            setShort: "Preseleccionar",
            setReject: "Rechazar",
          }
        : {
            title: "Manage listing",
            loading: "Loading…",
            notFound: "We could not find this listing or you do not have access.",
            back: "Back to my listings",
            applications: "Applications",
            noApps: "No applications yet.",
            status: "Status",
            actions: "Actions",
          },
    [lang],
  );

  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState<ListingRow | null>(null);
  const [apps, setApps] = useState<AppRow[]>([]);

  const refresh = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.replace(`/login?redirect=${encodeURIComponent(`/dashboard/empleos/${listingId}`)}`);
      return;
    }
    const { data: listing, error } = await supabase.from("empleos_public_listings").select("*").eq("id", listingId).maybeSingle();
    if (error || !listing) {
      setRow(null);
      setLoading(false);
      return;
    }
    setRow(listing as ListingRow);
    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token;
    if (token) {
      const res = await fetch(`/api/clasificados/empleos/listings/${listingId}/applications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = (await res.json()) as { ok?: boolean; rows?: AppRow[] };
      if (json.ok && json.rows) setApps(json.rows);
    }
    setLoading(false);
  }, [listingId, router]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function patchAppStatus(appId: string, status: "viewed" | "shortlisted" | "rejected") {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return;
    const res = await fetch(`/api/clasificados/empleos/applications/${appId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    const json = (await res.json()) as { ok?: boolean };
    if (json.ok) void refresh();
  }

  async function patchStatus(next: "published" | "paused" | "archived") {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return;
    const res = await fetch(`/api/clasificados/empleos/listings/${listingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ lifecycle_status: next }),
    });
    const json = (await res.json()) as { ok?: boolean };
    if (json.ok) void refresh();
  }

  if (loading) {
    return (
      <LeonixDashboardShell lang={lang} activeNav="listings" plan="free" userName={null} email={null} accountRef={null}>
        <p className="text-sm text-[#5C5346]">{t.loading}</p>
      </LeonixDashboardShell>
    );
  }

  if (!row) {
    return (
      <LeonixDashboardShell lang={lang} activeNav="listings" plan="free" userName={null} email={null} accountRef={null}>
        <p className="text-[#5C5346]">{t.notFound}</p>
        <Link href={`/dashboard/empleos?${q}`} className="mt-4 inline-block font-semibold underline">
          {t.back}
        </Link>
      </LeonixDashboardShell>
    );
  }

  return (
    <LeonixDashboardShell lang={lang} activeNav="listings" plan="free" userName={null} email={null} accountRef={null}>
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-[#1E1810]">{t.title}</h1>
        <p className="mt-2 text-sm text-[#5C5346]">{row.title}</p>
        <p className="text-xs text-[#7A7164]">{row.company_name}</p>
        <p className="mt-2 text-xs">
          <span className="font-semibold">{t.status}:</span> {row.lifecycle_status}
        </p>
        {typeof row.apply_count === "number" ? (
          <p className="mt-1 text-xs">
            <span className="font-semibold">{t.applyCount}:</span> {row.apply_count}
          </p>
        ) : null}
        {row.moderation_reason ? (
          <p className="mt-2 rounded-lg border border-amber-200/80 bg-amber-50/90 p-2 text-xs text-[#5C5346]">
            <span className="font-semibold">{t.moderation}:</span> {row.moderation_reason}
          </p>
        ) : null}
      </header>

      <div className="mb-8 flex flex-wrap gap-2">
        <button type="button" className={BTN} onClick={() => void patchStatus("published")}>
          Publish
        </button>
        <button type="button" className={BTN} onClick={() => void patchStatus("paused")}>
          Pause
        </button>
        <button type="button" className={BTN} onClick={() => void patchStatus("archived")}>
          Archive
        </button>
        {row.lifecycle_status === "published" ? (
          <Link href={appendLangToPath(`/clasificados/empleos/${row.slug}`, lang)} className={`${BTN} border-[#C9B46A]`}>
            Public
          </Link>
        ) : null}
      </div>

      <section className="rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7]/95 p-5">
        <h2 className="text-sm font-bold uppercase text-[#7A7164]">{t.applications}</h2>
        {apps.length === 0 ? (
          <p className="mt-2 text-sm text-[#5C5346]">{t.noApps}</p>
        ) : (
          <ul className="mt-3 space-y-3 text-sm">
            {apps.map((a) => (
              <li key={a.id} className="rounded-lg border border-[#E8DFD0]/80 bg-white p-3">
                <p className="font-semibold text-[#1E1810]">{a.applicant_name}</p>
                <p className="text-xs text-[#7A7164]">{a.applicant_email}</p>
                <p className="mt-2 text-[#4A4744]">{a.message}</p>
                {a.answers_json && typeof a.answers_json === "object" && Object.keys(a.answers_json as object).length ? (
                  <pre className="mt-2 max-h-32 overflow-auto rounded bg-[#FAF7F2] p-2 text-[11px] text-[#4A4744]">
                    {JSON.stringify(a.answers_json, null, 2)}
                  </pre>
                ) : null}
                <p className="mt-1 text-[10px] uppercase text-[#9A9084]">{a.status}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" className={BTN} onClick={() => void patchAppStatus(a.id, "viewed")}>
                    {t.setViewed}
                  </button>
                  <button type="button" className={BTN} onClick={() => void patchAppStatus(a.id, "shortlisted")}>
                    {t.setShort}
                  </button>
                  <button type="button" className={BTN} onClick={() => void patchAppStatus(a.id, "rejected")}>
                    {t.setReject}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link href={`/dashboard/empleos?${q}`} className="mt-10 inline-flex text-sm font-semibold underline">
        ← {t.back}
      </Link>
    </LeonixDashboardShell>
  );
}
