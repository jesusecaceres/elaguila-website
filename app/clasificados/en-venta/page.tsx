"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { EnVentaComingSoon } from "./EnVentaComingSoon";

export default function EnVentaHubPage() {
  const sp = useSearchParams();
  const lang = useMemo(() => (sp?.get("lang") === "en" ? "en" : "es"), [sp]);
  return <EnVentaComingSoon variant="hub" lang={lang} />;
}
