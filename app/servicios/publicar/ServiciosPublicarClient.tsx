"use client";

import { useSearchParams } from "next/navigation";
import type { ServiciosLang } from "../types/serviciosBusinessProfile";
import { ServiciosApplicationForm } from "./components/ServiciosApplicationForm";

export function ServiciosPublicarClient() {
  const searchParams = useSearchParams();
  const lang: ServiciosLang = searchParams?.get("lang") === "en" ? "en" : "es";
  return <ServiciosApplicationForm lang={lang} />;
}
