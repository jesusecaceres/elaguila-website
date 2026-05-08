"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setAdminUiLang } from "@/app/admin/_actions/setAdminUiLang";
import type { AdminLang } from "@/app/admin/_lib/adminI18nCookie";
import { useAdminT } from "./AdminI18nProvider";

function cx(...p: Array<string | false | undefined>) {
  return p.filter(Boolean).join(" ");
}

export function AdminLangToggle({ active }: { active: AdminLang }) {
  const router = useRouter();
  const t = useAdminT();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function pick(next: AdminLang) {
    setErr(null);
    start(async () => {
      try {
        await setAdminUiLang(next);
        router.refresh();
      } catch {
        setErr("Could not save language preference.");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div
        className="inline-flex items-center gap-0.5 rounded-xl border border-[#E8DFD0]/90 bg-white/90 p-0.5 shadow-sm"
        role="group"
        aria-label={t("shell.langAria")}
      >
        <button
          type="button"
          disabled={pending}
          aria-pressed={active === "en"}
          onClick={() => pick("en")}
          className={cx(
            "rounded-lg px-2.5 py-1 text-[11px] font-bold transition sm:px-3 sm:text-xs",
            active === "en" ? "bg-[#2A2620] text-[#FAF7F2]" : "text-[#5C5346] hover:bg-[#F4EFE4]",
          )}
        >
          EN
        </button>
        <button
          type="button"
          disabled={pending}
          aria-pressed={active === "es"}
          onClick={() => pick("es")}
          className={cx(
            "rounded-lg px-2.5 py-1 text-[11px] font-bold transition sm:px-3 sm:text-xs",
            active === "es" ? "bg-[#2A2620] text-[#FAF7F2]" : "text-[#5C5346] hover:bg-[#F4EFE4]",
          )}
        >
          ES
        </button>
      </div>
      {err ? <p className="max-w-[14rem] text-right text-[10px] text-red-800">{err}</p> : null}
    </div>
  );
}
