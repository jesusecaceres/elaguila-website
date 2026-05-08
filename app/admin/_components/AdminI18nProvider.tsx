"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { AdminLang } from "@/app/admin/_lib/adminI18nCookie";
import { adminMessages } from "@/app/admin/_lib/adminStrings";

const LangCtx = createContext<AdminLang>("en");

export function AdminI18nProvider({ lang, children }: { lang: AdminLang; children: ReactNode }) {
  return <LangCtx.Provider value={lang}>{children}</LangCtx.Provider>;
}

export function useAdminLang(): AdminLang {
  return useContext(LangCtx);
}

export function useAdminT() {
  const lang = useAdminLang();
  return (key: string, vars?: Record<string, string | number>) => adminMessages(lang)(key, vars);
}
