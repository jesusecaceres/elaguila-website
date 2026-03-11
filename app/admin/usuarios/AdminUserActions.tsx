"use client";

import { useRouter } from "next/navigation";
import { setUserDisabledAction } from "../actions";
import { useState } from "react";

export default function AdminUserActions({ userId, disabled }: { userId: string; disabled: boolean | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isDisabled = disabled === true;

  async function handleToggle() {
    setLoading(true);
    try {
      await setUserDisabledAction(userId, !isDisabled);
      router.refresh();
    } catch {
      setLoading(false);
    }
    setLoading(false);
  }

  return (
    <td className="p-2.5 whitespace-nowrap">
      <button
        type="button"
        disabled={loading}
        onClick={handleToggle}
        className={`text-xs font-medium px-2 py-1 rounded ${isDisabled ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30" : "bg-red-500/20 text-red-300 hover:bg-red-500/30"} disabled:opacity-50`}
      >
        {loading ? "…" : isDisabled ? "Habilitar" : "Deshabilitar"}
      </button>
    </td>
  );
}
