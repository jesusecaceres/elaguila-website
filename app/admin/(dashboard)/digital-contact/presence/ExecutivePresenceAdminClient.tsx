"use client";

import { useCallback, useEffect, useState } from "react";
import { listActiveDigitalContactProfiles } from "@/app/lib/digitalContact/digitalContactRegistry";

type PresenceRecord = {
  profileSlug: string;
  status: string;
  expiresAt: string;
  updatedAt: string;
  updatedBy: string | null;
};

type Row = {
  slug: string;
  fullName: string;
  record: PresenceRecord | null;
};

/**
 * Minimal internal presence controls for Build 04.
 * Not the final staff dashboard (Build 05).
 */
export function ExecutivePresenceAdminClient() {
  const [rows, setRows] = useState<Row[]>(() =>
    listActiveDigitalContactProfiles().map((p) => ({
      slug: p.slug,
      fullName: p.fullName,
      record: null,
    })),
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [supabaseConfigured, setSupabaseConfigured] = useState<boolean | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/digital-contact/presence", { cache: "no-store" });
      const json = (await res.json().catch(() => null)) as {
        ok?: boolean;
        rows?: Row[];
        supabaseConfigured?: boolean;
        error?: string;
      } | null;
      if (!res.ok || !json?.ok) {
        setError(json?.error ?? "load_failed");
        return;
      }
      setSupabaseConfigured(Boolean(json.supabaseConfigured));
      if (json.rows) setRows(json.rows);
    } catch {
      setError("network");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function setStatus(slug: string, status: "available" | "busy" | "away", durationMinutes: number) {
    setBusy(`${slug}:${status}:${durationMinutes}`);
    setError(null);
    try {
      const res = await fetch("/api/digital-contact/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileSlug: slug, status, durationMinutes, action: "set" }),
      });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok || !json?.ok) {
        setError(json?.error ?? "set_failed");
      } else {
        await refresh();
      }
    } catch {
      setError("network");
    } finally {
      setBusy(null);
    }
  }

  async function clearStatus(slug: string) {
    setBusy(`${slug}:clear`);
    setError(null);
    try {
      const res = await fetch("/api/digital-contact/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileSlug: slug, action: "clear" }),
      });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok || !json?.ok) {
        setError(json?.error ?? "clear_failed");
      } else {
        await refresh();
      }
    } catch {
      setError("network");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      {supabaseConfigured === false ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          Supabase service role is not configured locally. Presence writes will fail until env is set and the
          migration is applied.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          {error}
        </p>
      ) : null}

      <ul className="space-y-4">
        {rows.map((row) => {
          const fresh =
            row.record && Date.parse(row.record.expiresAt) > Date.now()
              ? row.record
              : null;
          return (
            <li key={row.slug} className="rounded-xl border border-[#D6C7AD] bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <p className="font-semibold text-[#1F241C]">{row.fullName}</p>
                  <p className="text-xs text-[#5F6258]">/{row.slug}</p>
                </div>
                <p className="text-sm text-[#3D3428]">
                  {fresh ? (
                    <>
                      <span className="font-bold uppercase">{fresh.status}</span>
                      {" · expires "}
                      {new Date(fresh.expiresAt).toLocaleString()}
                    </>
                  ) : (
                    <span className="text-[#5F6258]">No active presence</span>
                  )}
                </p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy != null}
                  onClick={() => void setStatus(row.slug, "available", 30)}
                  className="min-h-[44px] rounded-lg bg-[#1F241C] px-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Available — 30m
                </button>
                <button
                  type="button"
                  disabled={busy != null}
                  onClick={() => void setStatus(row.slug, "available", 60)}
                  className="min-h-[44px] rounded-lg bg-[#1F241C] px-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Available — 60m
                </button>
                <button
                  type="button"
                  disabled={busy != null}
                  onClick={() => void setStatus(row.slug, "busy", 30)}
                  className="min-h-[44px] rounded-lg border border-[#D6C7AD] px-3 text-sm font-semibold disabled:opacity-50"
                >
                  Busy — 30m
                </button>
                <button
                  type="button"
                  disabled={busy != null}
                  onClick={() => void setStatus(row.slug, "away", 30)}
                  className="min-h-[44px] rounded-lg border border-[#D6C7AD] px-3 text-sm font-semibold disabled:opacity-50"
                >
                  Away — 30m
                </button>
                <button
                  type="button"
                  disabled={busy != null}
                  onClick={() => void clearStatus(row.slug)}
                  className="min-h-[44px] rounded-lg border border-red-200 px-3 text-sm font-semibold text-red-800 disabled:opacity-50"
                >
                  Clear status
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
