"use client";

import { LeonixHeaderLanguageSelector } from "@/app/(site)/magazine/components/LeonixHeaderLanguageSelector";

/** Language selector bar for public form destinations (Contact, Tienda contact). */
export function ContactoLanguageBar() {
  return (
    <div className="mb-6 flex justify-end">
      <LeonixHeaderLanguageSelector variant="full" pathnameOverride="/contacto" />
    </div>
  );
}
