"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function PublicarRootPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const lang = searchParams?.get("lang");
    const query = lang ? `?lang=${lang}` : "";
    router.replace(`/clasificados/publicar/en-venta${query}`);
  }, [router, searchParams]);

  return null;
}
