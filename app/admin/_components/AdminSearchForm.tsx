"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminInputClass } from "./adminTheme";

export function AdminSearchForm({
  placeholder,
  actionPath,
  paramName = "q",
  defaultValue = "",
}: {
  placeholder: string;
  /** e.g. /admin/usuarios */
  actionPath: string;
  paramName?: string;
  defaultValue?: string;
}) {
  const router = useRouter();
  const [v, setV] = useState(defaultValue);

  return (
    <form
      className="w-full"
      onSubmit={(e) => {
        e.preventDefault();
        const q = new URLSearchParams();
        if (v.trim()) q.set(paramName, v.trim());
        router.push(`${actionPath}?${q.toString()}`);
      }}
    >
      <label className="sr-only" htmlFor="admin-search-form">
        {placeholder}
      </label>
      <input
        id="admin-search-form"
        type="search"
        value={v}
        onChange={(e) => setV(e.target.value)}
        placeholder={placeholder}
        className={adminInputClass}
      />
    </form>
  );
}
