"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { adminActionProofErr, adminActionProofOk } from "./adminTheme";

/**
 * Short-lived toast-style feedback for real server redirects (?saved=1, ?error=1, etc.).
 * Not for passive help text — only action outcomes.
 */
export function AdminQueryFlash() {
  const sp = useSearchParams();
  const [open, setOpen] = useState<{ tone: "ok" | "err"; message: string } | null>(null);

  const saved = sp?.get("saved");
  const registrySaved = sp?.get("registry_saved");
  const registryError = sp?.get("registry_error");
  const issueSaved = sp?.get("issue_saved");
  const issueError = sp?.get("issue_error");
  const catSaved = sp?.get("cat_saved");
  const catError = sp?.get("cat_error");
  const inviteSaved = sp?.get("invite_saved");
  const inviteError = sp?.get("invite_error");
  const err = sp?.get("error");

  useEffect(() => {
    if (saved === "1") {
      setOpen({ tone: "ok", message: "Saved successfully." });
    } else if (registrySaved === "1") {
      setOpen({ tone: "ok", message: "Magazine registry updated." });
    } else if (issueSaved === "1") {
      setOpen({ tone: "ok", message: "Magazine issue saved (Supabase)." });
    } else if (catSaved === "1") {
      setOpen({ tone: "ok", message: "Category posture saved in Supabase." });
    } else if (inviteSaved === "1") {
      setOpen({ tone: "ok", message: "Invite intent saved in Supabase (Auth is separate)." });
    } else if (registryError === "1") {
      setOpen({ tone: "err", message: "Could not save draft (missing title or server error)." });
    } else if (issueError === "1") {
      setOpen({ tone: "err", message: "Could not complete the magazine issue action." });
    } else if (catError === "1") {
      setOpen({ tone: "err", message: "Could not save category (invalid data or server error)." });
    } else if (inviteError === "duplicate") {
      setOpen({ tone: "err", message: "That email already has a pending invite." });
    } else if (inviteError === "1") {
      setOpen({ tone: "err", message: "Could not save invite (data or permissions)." });
    } else if (err === "1") {
      setOpen({ tone: "err", message: "Action failed. Check permissions or try again." });
    } else {
      setOpen(null);
      return;
    }
    const t = window.setTimeout(() => setOpen(null), 5200);
    return () => window.clearTimeout(t);
  }, [saved, registrySaved, registryError, issueSaved, issueError, catSaved, catError, inviteSaved, inviteError, err]);

  if (!open) return null;

  const bg = open.tone === "ok" ? adminActionProofOk : adminActionProofErr;

  return (
    <div
      className="pointer-events-none fixed bottom-4 left-1/2 z-[200] w-[min(100%,22rem)] -translate-x-1/2 px-3 sm:left-auto sm:right-6 sm:translate-x-0"
      role="status"
    >
      <div className={`pointer-events-auto shadow-lg ${bg}`}>
        <div className="flex items-start justify-between gap-3">
          <span>{open.message}</span>
          <button
            type="button"
            onClick={() => setOpen(null)}
            className="shrink-0 rounded-md px-2 py-0.5 text-xs font-bold opacity-80 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
