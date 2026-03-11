"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import { createSupabaseBrowserClient } from "../../lib/supabase/browser";

type Lang = "es" | "en";

export default function GuardadosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang: Lang = (searchParams?.get("lang") || "es") === "en" ? "en" : "es";

  const t = lang === "es"
    ? { title: "Anuncios guardados", back: "Volver a mi cuenta", empty: "Aún no tienes anuncios guardados.", view: "Ver" }
    : { title: "Saved listings", back: "Back to my account", empty: "You don't have any saved listings yet.", view: "View" };

  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState<Array<{ listing_id: string; title?: string | null }>>([]);

  useEffect(() => {
    let mounted = true;
    async function run() {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace(`/login?redirect=${encodeURIComponent("/dashboard/guardados")}`);
        return;
      }
      const { data: rows } = await supabase
        .from("user_saved_listings")
        .select("listing_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      const ids = (rows ?? []).map((r: { listing_id: string }) => r.listing_id);
      if (ids.length === 0) {
        if (!mounted) return;
        setSaved([]);
        setLoading(false);
        return;
      }
      const { data: listings } = await supabase
        .from("listings")
        .select("id, title")
        .in("id", ids);
      const byId = new Map((listings ?? []).map((l: { id: string; title?: string | null }) => [l.id, l.title]));
      if (!mounted) return;
      setSaved(ids.map((id) => ({ listing_id: id, title: byId.get(id) ?? null })));
      setLoading(false);
    }
    run();
    return () => { mounted = false; };
  }, [router]);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 pt-28 pb-16">
        <h1 className="text-2xl font-semibold text-yellow-400">{t.title}</h1>
        {loading ? (
          <p className="mt-4 text-white/70">{lang === "es" ? "Cargando…" : "Loading…"}</p>
        ) : saved.length === 0 ? (
          <p className="mt-4 text-white/70">{t.empty}</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {saved.map(({ listing_id, title }) => (
              <li key={listing_id}>
                <Link
                  href={`/clasificados/anuncio/${listing_id}?lang=${lang}`}
                  className="block rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white hover:bg-white/10"
                >
                  {title || listing_id}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link
          href={`/dashboard?lang=${lang}`}
          className="mt-6 inline-block rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
        >
          {t.back}
        </Link>
      </main>
    </div>
  );
}
