"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import Navbar from "../../../../components/Navbar";
import { createSupabaseBrowserClient } from "../../../../lib/supabase/browser";

type Lang = "es" | "en";

const EDIT_WINDOW_MINUTES = 30;

function minutesSince(iso?: string | null) {
  if (!iso) return null;
  const ms = new Date(iso).getTime();
  if (!Number.isFinite(ms)) return null;
  return (Date.now() - ms) / 1000 / 60;
}

export default function EditListingPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname() ?? `/dashboard/mis-anuncios/${id}/editar`;

  const urlLang = searchParams?.get("lang");
  const lang: Lang = urlLang === "en" ? "en" : "es";

  const t = useMemo(
    () => ({
      es: {
        title: "Editar anuncio",
        back: "Volver a Mis anuncios",
        loading: "Cargando…",
        notFound: "No encontramos este anuncio.",
        notAllowed: "No tienes permiso para editar este anuncio.",
        lockedTitle: `Edición bloqueada` ,
        lockedBody: `Solo puedes editar dentro de los primeros ${EDIT_WINDOW_MINUTES} minutos después de publicar.`,
        fieldsTitle: "Título",
        fieldsPrice: "Precio",
        fieldsDesc: "Descripción",
        save: "Guardar cambios",
        saving: "Guardando…",
        saved: "Guardado",
        view: "Ver anuncio",
        markSold: "Marcar como vendido",
        markActive: "Marcar como activo",
        delete: "Eliminar",
        deleting: "Eliminando…",
        confirmDelete: "¿Eliminar este anuncio? Esta acción no se puede deshacer.",
        errorTitle: "Ocurrió un error",
      },
      en: {
        title: "Edit listing",
        back: "Back to My listings",
        loading: "Loading…",
        notFound: "We couldn’t find this listing.",
        notAllowed: "You don’t have permission to edit this listing.",
        lockedTitle: "Editing locked",
        lockedBody: `You can only edit within the first ${EDIT_WINDOW_MINUTES} minutes after posting.`,
        fieldsTitle: "Title",
        fieldsPrice: "Price",
        fieldsDesc: "Description",
        save: "Save changes",
        saving: "Saving…",
        saved: "Saved",
        view: "View listing",
        markSold: "Mark sold",
        markActive: "Mark active",
        delete: "Delete",
        deleting: "Deleting…",
        confirmDelete: "Delete this listing? This can’t be undone.",
        errorTitle: "Something went wrong",
      },
    }),
    []
  );

  const L = t[lang];

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyAction, setBusyAction] = useState<null | "delete" | "status" >(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [listing, setListing] = useState<any>(null);
  const [title, setTitle] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  useEffect(() => {
    if (!id) return;
    const supabase = createSupabaseBrowserClient();
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      const { data } = await supabase.auth.getUser();
      if (!mounted) return;

      if (!data.user) {
        const redirect = encodeURIComponent(`${pathname}${window.location.search || ""}`);
        router.replace(`/login?redirect=${redirect}`);
        return;
      }

      const u = data.user;

      const { data: row, error: qErr } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id)
        .eq("user_id", u.id)
        .maybeSingle();

      if (!mounted) return;

      if (qErr) {
        setError(qErr.message);
        setListing(null);
        setLoading(false);
        return;
      }

      if (!row) {
        setError(L.notFound);
        setListing(null);
        setLoading(false);
        return;
      }

      setListing(row);
      setTitle(String(row.title ?? ""));
      setPrice(row.price === null || row.price === undefined ? "" : String(row.price));
      setDescription(String((row as any).description ?? ""));

      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, [id, router, pathname, L.notFound]);

  const createdIso: string | null = listing?.created_at || listing?.created || null;
  const mins = minutesSince(createdIso);
  const isEditable = mins !== null && mins <= EDIT_WINDOW_MINUTES;

  async function save() {
    if (!id) return;
    const supabase = createSupabaseBrowserClient();

    setSaving(true);
    setSuccess(null);
    setError(null);

    // Only update fields that are safe/expected.
    const payload: Record<string, any> = {
      title: title.trim() || null,
      price: price.trim() === "" ? null : price.trim(),
    };

    // Only include description if it exists in the row object (avoids guessing schema).
    if (listing && "description" in listing) {
      payload.description = description.trim() || null;
    }

    const { error: uErr } = await supabase.from("listings").update(payload).eq("id", id);

    if (uErr) {
      setError(uErr.message);
      setSaving(false);
      return;
    }

    setSuccess(L.saved);
    setSaving(false);
  }

  async function markStatus(status: "active" | "sold") {
    if (!id) return;
    const supabase = createSupabaseBrowserClient();

    setBusyAction("status");
    setError(null);
    setSuccess(null);

    const { error: uErr } = await supabase.from("listings").update({ status }).eq("id", id);

    if (uErr) {
      setError(uErr.message);
      setBusyAction(null);
      return;
    }

    setListing((prev: any) => ({ ...(prev || {}), status }));
    setBusyAction(null);
  }

  async function deleteListing() {
    if (!id) return;
    if (!confirm(L.confirmDelete)) return;

    const supabase = createSupabaseBrowserClient();

    setBusyAction("delete");
    setError(null);

    const { error: dErr } = await supabase.from("listings").delete().eq("id", id);

    if (dErr) {
      setError(dErr.message);
      setBusyAction(null);
      return;
    }

    router.replace(`/dashboard/mis-anuncios?lang=${lang}`);
  }

  const status = String(listing?.status || "active").toLowerCase();
  const isSold = status === "sold";

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 pt-28 pb-16">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold text-yellow-400">{L.title}</h1>
            <p className="mt-2 text-gray-300">ID: {id}</p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Link
              href={`/clasificados/anuncio/${id}?lang=${lang}`}
              className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
            >
              {L.view}
            </Link>
            <Link
              href={`/dashboard/mis-anuncios?lang=${lang}`}
              className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
            >
              {L.back}
            </Link>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-yellow-600/20 bg-black/40 p-6">
          {loading ? <div className="text-white/70">{L.loading}</div> : null}

          {error ? (
            <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
              <div className="text-base font-semibold text-red-200">{L.errorTitle}</div>
              <p className="mt-2 text-sm text-red-100/80">{error}</p>
            </div>
          ) : null}

          {success ? (
            <div className="mt-4 rounded-2xl border border-green-500/30 bg-green-500/10 p-5 text-green-100">
              {success}
            </div>
          ) : null}

          {!loading && listing ? (
            <>
              {!isEditable ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="text-base font-semibold text-white">{L.lockedTitle}</div>
                  <p className="mt-2 text-sm text-white/70">{L.lockedBody}</p>
                </div>
              ) : null}

              <div className="mt-6 grid gap-4">
                <label className="grid gap-2">
                  <span className="text-sm text-white/70">{L.fieldsTitle}</span>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={!isEditable || saving}
                    className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-yellow-500/40 disabled:opacity-60"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm text-white/70">{L.fieldsPrice}</span>
                  <input
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    disabled={!isEditable || saving}
                    inputMode="decimal"
                    className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-yellow-500/40 disabled:opacity-60"
                  />
                </label>

                {listing && "description" in listing ? (
                  <label className="grid gap-2">
                    <span className="text-sm text-white/70">{L.fieldsDesc}</span>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={!isEditable || saving}
                      rows={5}
                      className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-yellow-500/40 disabled:opacity-60"
                    />
                  </label>
                ) : null}

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={save}
                    disabled={!isEditable || saving}
                    className="inline-flex items-center justify-center rounded-full bg-yellow-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-yellow-400 transition disabled:opacity-50"
                  >
                    {saving ? L.saving : L.save}
                  </button>

                  {isSold ? (
                    <button
                      onClick={() => markStatus("active")}
                      disabled={busyAction !== null}
                      className="inline-flex items-center rounded-full border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-sm font-semibold text-yellow-200 hover:bg-yellow-500/15 transition disabled:opacity-50"
                    >
                      {busyAction ? "…" : L.markActive}
                    </button>
                  ) : (
                    <button
                      onClick={() => markStatus("sold")}
                      disabled={busyAction !== null}
                      className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition disabled:opacity-50"
                    >
                      {busyAction ? "…" : L.markSold}
                    </button>
                  )}

                  <button
                    onClick={deleteListing}
                    disabled={busyAction !== null}
                    className="inline-flex items-center rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/15 transition disabled:opacity-50"
                  >
                    {busyAction === "delete" ? L.deleting : L.delete}
                  </button>
                </div>

                <div className="text-xs text-white/50">
                  {createdIso ? `created_at: ${createdIso}` : ""}
                  {mins !== null ? ` · ${Math.max(0, Math.floor(mins))} min` : ""}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}
