"use client";

import { LeonixHeaderLanguageSelector } from "@/app/(site)/magazine/components/LeonixHeaderLanguageSelector";

export function TiendaContactLanguageBar() {
  return (
    <div className="flex justify-end">
      <LeonixHeaderLanguageSelector variant="full" pathnameOverride="/tienda/contacto" />
    </div>
  );
}
