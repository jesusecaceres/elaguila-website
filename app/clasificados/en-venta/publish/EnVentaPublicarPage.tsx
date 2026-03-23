"use client";

import { useSearchParams } from "next/navigation";
import { EnVentaComingSoon } from "@/app/clasificados/en-venta/EnVentaComingSoon";

/** En Venta–owned publish entry for `/clasificados/publicar/en-venta`. */
export default function EnVentaPublicarPage() {
  const searchParams = useSearchParams();
  const lang = searchParams?.get("lang") === "en" ? "en" : "es";
  return <EnVentaComingSoon variant="publish" lang={lang} />;
}
