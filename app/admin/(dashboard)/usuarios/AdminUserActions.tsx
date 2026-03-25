"use client";

import { useRouter } from "next/navigation";
import { setUserDisabledAction } from "../../actions";
import { useState } from "react";

export default function AdminUserActions({
  userId,
  disabled,
  as = "td",
}: {
  userId: string;
  disabled: boolean | null;
  as?: "td" | "div";
}) {
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

  const btn = (
    <button
      type="button"
      disabled={loading}
      onClick={handleToggle}
      className={`text-xs font-semibold px-3 py-1.5 rounded-xl ${
        isDisabled
          ? "bg-emerald-100 text-emerald-900 hover:bg-emerald-200"
          : "bg-rose-100 text-rose-900 hover:bg-rose-200"
      } disabled:opacity-50`}
    >
      {loading ? "…" : isDisabled ? "Habilitar" : "Deshabilitar"}
    </button>
  );

  if (as === "div") {
    return <div className="inline-block">{btn}</div>;
  }

  return <td className="p-2.5 whitespace-nowrap">{btn}</td>;
}
