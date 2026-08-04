"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { LeonixDashboardShell } from "../../components/LeonixDashboardShell";
import { IdeaBuilderWizard } from "./IdeaBuilderWizard";

type Lang = "es" | "en";

/** TODAY-1 — Idea Builder owner page. Requires sign-in, matching the existing business-tools/page.tsx pattern. */
export default function IdeaBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname() ?? "/dashboard/business-tools/idea-builder";
  const lang: Lang = searchParams?.get("lang") === "en" ? "en" : "es";

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const sb = createSupabaseBrowserClient();
    let mounted = true;
    (async () => {
      const { data } = await sb.auth.getUser();
      if (!mounted) return;
      if (!data.user) {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }
      setUserId(data.user.id);
      setEmail(data.user.email ?? null);
      setName((data.user.user_metadata?.full_name as string | undefined) || (data.user.user_metadata?.name as string | undefined) || null);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [router, pathname]);

  return (
    <LeonixDashboardShell lang={lang} activeNav="business" plan="free" userName={name} email={email} accountRef={null} ownerId={userId}>
      {loading ? (
        <div className="rounded-3xl border border-[#E8DFD0] bg-[#FFFCF7]/90 p-10 text-center text-sm text-[#5C5346]">{lang === "es" ? "Cargando…" : "Loading…"}</div>
      ) : (
        <IdeaBuilderWizard lang={lang} />
      )}
    </LeonixDashboardShell>
  );
}
