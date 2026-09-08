"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { learningCopy, type Lang } from "../learningCopy";

type Status = "checking_auth" | "signed_out" | "started" | "completed" | "saving";

async function getBearerToken(): Promise<string | null> {
  const sb = createSupabaseBrowserClient();
  const { data } = await sb.auth.getSession();
  return data.session?.access_token ?? null;
}

/** TODAY-1 — start/complete a lesson for a signed-in user. Signed-out visitors see a sign-in prompt, never a broken button. */
export function LessonProgressButton({ lessonKey, lang }: { lessonKey: string; lang: Lang }) {
  const t = learningCopy(lang);
  const [status, setStatus] = useState<Status>("checking_auth");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await getBearerToken();
      if (!token) {
        if (!cancelled) setStatus("signed_out");
        return;
      }
      try {
        const res = await fetch("/api/dashboard/business/learning/progress", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ lessonKey, action: "start" }),
        });
        const json = (await res.json().catch(() => ({}))) as { ok?: boolean; progress?: { status?: string } };
        if (cancelled) return;
        setStatus(json.ok && json.progress?.status === "completed" ? "completed" : "started");
      } catch {
        if (!cancelled) setStatus("signed_out");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lessonKey]);

  async function markComplete() {
    setStatus("saving");
    const token = await getBearerToken();
    if (!token) {
      setStatus("signed_out");
      return;
    }
    try {
      const res = await fetch("/api/dashboard/business/learning/progress", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ lessonKey, action: "complete" }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean };
      setStatus(json.ok ? "completed" : "started");
    } catch {
      setStatus("started");
    }
  }

  if (status === "checking_auth") return null;

  if (status === "signed_out") {
    return <p className="rounded-xl border border-[#E8DFD0] bg-[#FAF7F2] px-4 py-2.5 text-xs text-[#5C5346]">{t.signInPrompt}</p>;
  }

  if (status === "completed") {
    return (
      <p className="inline-flex min-h-11 items-center rounded-xl bg-[#2F6B3A]/10 px-4 text-sm font-semibold text-[#2F6B3A]">
        ✓ {t.completedLabel}
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={markComplete}
      disabled={status === "saving"}
      className="inline-flex min-h-11 items-center rounded-xl bg-gradient-to-br from-[#E8D48A] via-[#D4BC6A] to-[#C9A84A] px-4 text-sm font-semibold text-[#1E1810] disabled:opacity-60"
    >
      {t.completeButton}
    </button>
  );
}
