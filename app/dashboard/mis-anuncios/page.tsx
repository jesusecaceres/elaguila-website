"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Navbar from "../../components/Navbar";
import { createSupabaseBrowserClient } from "../../lib/supabase/browser";

type Lang = "es" | "en";

type ListingStatus = "active" | "sold" | string;

type ListingRow = {
  id: string;
  title?: string | null;
  price?: number | string | null;
  city?: string | null;
  zip?: string | null;
  status?: ListingStatus | null;
  created_at?: string | null;
  created?: string | null;
  image_urls?: string[] | null;
  image?: string | null;
  category?: string | null;
};

function formatPrice(v: ListingRow["price"], lang: Lang) {
  if (v === null || v === undefined || v === "") return lang === "es" ? "Gratis" : "Free";
  const n = typeof v === "number" ? v : Number(String(v).replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n)) return String(v);
  try {
    return new Intl.NumberFormat(lang === "es" ? "es-US" : "en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `$${Math.round(n)}`;
  }
}

function formatDateIso(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function MyListingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname() ?? "/dashboard/mis-anuncios";

  const urlLang = searchParams?.get("lang");
  const lang: Lang = urlLang === "en" ? "en" : "es";

  const t = useMemo(
    () => ({
      es: {
        title: "Mis anuncios",
        back: "Volver a mi cuenta",
        subtitle: "Administra tus anuncios publicados en LEONIX.",
        cta: "Publicar anuncio",
        loading: "Cargando…",
        emptyTitle: "Aún no tienes anuncios",
        emptyBody: "Publica tu primer anuncio para empezar.",
        view: "Ver",
        markSold: "Marcar como vendido",
        markActive: "Marcar como activo",
        deleting: "Eliminando…",
        delete: "Eliminar",
        confirmDelete: "¿Eliminar este anuncio? Esta acción no se puede deshacer.",
        statusActive: "Activo",
        statusSold: "Vendido",
        errorTitle: "No pudimos cargar tus anuncios",
        errorHint:
          "Si esto ocurre en desarrollo, dime el mensaje exacto para ajustar la consulta según tu esquema (nombre de tabla/columnas).",
      },
      en: {
        title: "My listings",
        back: "Back to my account",
        subtitle: "Manage your posted listings on LEONIX.",
        cta: "Post an ad",
        loading: "Loading…",
        emptyTitle: "You don’t have any listings yet",
        emptyBody: "Post your first listing to get started.",
        view: "View",
        markSold: "Mark sold",
        markActive: "Mark active",
        deleting: "Deleting…",
        delete: "Delete",
        confirmDelete: "Delete this listing? This can’t be undone.",
        statusActive: "Active",
        statusSold: "Sold",
        errorTitle: "We couldn’t load your listings",
        errorHint:
          "If this happens in development, send me the exact error so we can match your table/column names.",
      },
    }),
    []
  );
  const L = t[lang];

  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);

  const [listingsLoading, setListingsLoading] = useState(false);
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let mounted = true;

    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;

      if (!data.user) {
        const redirect = encodeURIComponent(`${pathname}${window.location.search || ""}`);
        router.replace(`/login?redirect=${redirect}`);
        return;
      }

      const u = data.user;
      setEmail(u.email ?? null);
      setName(
        (u.user_metadata?.full_name as string | undefined) ||
          (u.user_metadata?.name as string | undefined) ||
          null
      );
      setAuthLoading(false);

      // Now load listings
      setListingsLoading(true);
      setError(null);

      const { data: rows, error: qErr } = await supabase
        .from("listings")
        .select("id,title,price,city,zip,status,created_at,created,category,image_urls,image")
        .eq("user_id", u.id)
        .order("created_at", { ascending: false });

      if (!mounted) return;

      if (qErr) {
        setError(qErr.message);
        setListings([]);
      } else {
        setListings((rows as ListingRow[]) ?? []);
      }
      setListingsLoading(false);
    }

    loadUser();
    return () => {
      mounted = false;
    };
  }, [router, pathname]);

  async function markStatus(id: string, status: "active" | "sold") {
    const supabase = createSupabaseBrowserClient();
    setBusyId(id);
    setError(null);

    const { error: uErr } = await supabase.from("listings").update({ status }).eq("id", id);

    if (uErr) {
      setError(uErr.message);
      setBusyId(null);
      return;
    }

    setListings((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));
    setBusyId(null);
  }

  async function deleteListing(id: string) {
    if (!confirm(L.confirmDelete)) return;

    const supabase = createSupabaseBrowserClient();
    setBusyId(id);
    setError(null);

    const { error: dErr } = await supabase.from("listings").delete().eq("id", id);

    if (dErr) {
      setError(dErr.message);
      setBusyId(null);
      return;
    }

    setListings((prev) => prev.filter((x) => x.id !== id));
    setBusyId(null);
  }

  const showLoading = authLoading || listingsLoading;

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 pt-28 pb-16">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold text-yellow-400">{L.title}</h1>
            <p className="mt-2 text-gray-300">{L.subtitle}</p>
          </div>
          <Link
            href={`/clasificados/publicar?lang=${lang}`}
            className="inline-flex items-center justify-center rounded-full bg-yellow-500 px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-400 transition"
          >
            {L.cta}
          </Link>
        </div>

        <div className="mt-8 rounded-2xl border border-yellow-600/20 bg-black/40 p-6">
          <div className="text-sm text-white/70">{name || "—"} · {email || "—"}</div>

          {error ? (
            <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
              <div className="text-base font-semibold text-red-200">{L.errorTitle}</div>
              <p className="mt-2 text-sm text-red-100/80">{error}</p>
              <p className="mt-2 text-xs text-red-100/60">{L.errorHint}</p>
            </div>
          ) : null}

          {showLoading ? (
            <div className="mt-6 text-white/70">{L.loading}</div>
          ) : listings.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="text-base font-semibold text-white">{L.emptyTitle}</div>
              <p className="mt-2 text-sm text-white/70">{L.emptyBody}</p>
              <Link
                href={`/clasificados/publicar?lang=${lang}`}
                className="mt-4 inline-flex items-center rounded-full bg-yellow-500 px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-400 transition"
              >
                {L.cta}
              </Link>
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              {listings.map((x) => {
                const status = (x.status || "active").toLowerCase();
                const isSold = status === "sold";
                const dateText = formatDateIso(x.created_at || x.created) || "";
                const priceText = formatPrice(x.price, lang);
                const busy = busyId === x.id;

                return (
                  <div
                    key={x.id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="text-lg font-semibold text-white truncate">
                          {x.title || "—"}
                        </div>
                        <span
                          className={
                            "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold " +
                            (isSold
                              ? "bg-white/10 text-white/80 border border-white/10"
                              : "bg-yellow-500/15 text-yellow-200 border border-yellow-500/20")
                          }
                        >
                          {isSold ? L.statusSold : L.statusActive}
                        </span>
                        <span className="text-sm text-white/70">{priceText}</span>
                      </div>

                      <div className="mt-2 text-sm text-white/60">
                        {(x.city || "").trim()}
                        {x.zip ? ` · ${x.zip}` : ""}
                        {dateText ? ` · ${dateText}` : ""}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <Link
                        href={`/clasificados/anuncio/${x.id}?lang=${lang}`}
                        className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
                      >
                        {L.view}
                      </Link>

                      {isSold ? (
                        <button
                          onClick={() => markStatus(x.id, "active")}
                          disabled={busy}
                          className="inline-flex items-center rounded-full border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-sm font-semibold text-yellow-200 hover:bg-yellow-500/15 transition disabled:opacity-50"
                        >
                          {busy ? "…" : L.markActive}
                        </button>
                      ) : (
                        <button
                          onClick={() => markStatus(x.id, "sold")}
                          disabled={busy}
                          className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition disabled:opacity-50"
                        >
                          {busy ? "…" : L.markSold}
                        </button>
                      )}

                      <button
                        onClick={() => deleteListing(x.id)}
                        disabled={busy}
                        className="inline-flex items-center rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/15 transition disabled:opacity-50"
                      >
                        {busy ? L.deleting : L.delete}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <Link
            href={`/dashboard?lang=${lang}`}
            className="mt-8 inline-flex items-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
          >
            {L.back}
          </Link>
        </div>
      </main>
    </div>
  );
}
