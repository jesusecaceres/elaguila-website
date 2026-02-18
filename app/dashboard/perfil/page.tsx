"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Navbar from "../../components/Navbar";
import { createSupabaseBrowserClient } from "../../lib/supabase/browser";

type Lang = "es" | "en";

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname() ?? "/dashboard/perfil";

  const urlLang = searchParams?.get("lang");
  const lang: Lang = urlLang === "en" ? "en" : "es";

  const t = useMemo(
    () => ({
      es: {
        title: "Perfil",
        subtitle:
          "Información básica de tu cuenta. (En la próxima fase añadimos edición de perfil y estado de plan.)",
        back: "Volver a mi cuenta",
        name: "Nombre",
        email: "Correo",
      },
      en: {
        title: "Profile",
        subtitle:
          "Basic account information. (Next phase we’ll add profile editing and plan state.)",
        back: "Back to my account",
        name: "Name",
        email: "Email",
      },
    }),
    []
  );
  const L = t[lang];

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let mounted = true;

    async function load() {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;

      if (!data.user) {
        const redirect = encodeURIComponent(
          `${pathname}${window.location.search || ""}`
        );
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
      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, [router, pathname]);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 pt-28 pb-16">
        <h1 className="text-3xl md:text-4xl font-semibold text-yellow-400">
          {L.title}
        </h1>
        <p className="mt-2 text-gray-300">{L.subtitle}</p>

        <div className="mt-8 rounded-2xl border border-yellow-600/20 bg-black/40 p-6">
          {loading ? (
            <div className="text-white/70">Loading…</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="text-xs text-white/60">{L.name}</div>
                  <div className="mt-1 text-base font-semibold text-white">
                    {name || "—"}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="text-xs text-white/60">{L.email}</div>
                  <div className="mt-1 text-base font-semibold text-white">
                    {email || "—"}
                  </div>
                </div>
              </div>

              <Link
                href={`/dashboard?lang=${lang}`}
                className="mt-6 inline-flex items-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
              >
                {L.back}
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
