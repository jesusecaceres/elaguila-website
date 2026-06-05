"use client";

import { useSearchParams } from "next/navigation";

export type OfertasLocalesAppLang = "es" | "en";

export function useOfertasLocalesAppLang(): OfertasLocalesAppLang {
  const params = useSearchParams();
  return params?.get("lang") === "en" ? "en" : "es";
}
