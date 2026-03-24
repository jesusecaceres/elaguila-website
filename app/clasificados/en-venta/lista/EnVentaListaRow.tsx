"use client";

import { EnVentaListaCard } from "./EnVentaListaCard";

type Lang = "es" | "en";

/** List row layout reusing card visual hierarchy (mobile-friendly). */
export function EnVentaListaRow(props: Parameters<typeof EnVentaListaCard>[0]) {
  return (
    <div className="max-w-xl">
      <EnVentaListaCard {...props} />
    </div>
  );
}
