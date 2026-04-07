"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ServiciosProfileView } from "@/app/servicios/components/ServiciosProfileView";
import { resolveServiciosProfile } from "@/app/servicios/lib/resolveServiciosProfile";
import type { ServiciosBusinessProfile } from "@/app/servicios/types/serviciosBusinessProfile";
import type { ServiciosLang } from "@/app/servicios/types/serviciosBusinessProfile";
import { readLocalServiciosPublish } from "../lib/localServiciosPublishStorage";

/** Local-only published profile fallback when the segment is not in Supabase. */
export function ServiciosPublicSlugClient({ slug, lang }: { slug: string; lang: ServiciosLang }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<ReturnType<typeof resolveServiciosProfile> | null>(null);

  useEffect(() => {
    const e = readLocalServiciosPublish(slug);
    if (!e) {
      setProfile(null);
      setReady(true);
      return;
    }
    try {
      const wire = JSON.parse(e.profileJson) as ServiciosBusinessProfile;
      delete wire.identity.leonixVerified;
      setProfile(resolveServiciosProfile(wire, lang));
    } catch {
      setProfile(null);
    }
    setReady(true);
  }, [slug, lang]);

  if (!ready) {
    return <div className="min-h-screen bg-[#F9F8F6]" aria-busy="true" />;
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-lg font-semibold text-neutral-900">
          {lang === "en" ? "Listing not found" : "No encontramos este listado"}
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          {lang === "en"
            ? "It may have been removed or the link is incorrect."
            : "Puede haberse quitado o el enlace no es válido."}
        </p>
        <Link
          href={`/clasificados/servicios?lang=${lang}`}
          className="mt-6 inline-block text-sm font-semibold text-[#3B66AD] underline underline-offset-2"
        >
          {lang === "en" ? "Browse Servicios" : "Ver Servicios"}
        </Link>
      </div>
    );
  }

  return (
    <ServiciosProfileView
      profile={profile}
      lang={lang}
      editBackHref={`/clasificados/publicar/servicios?lang=${lang}`}
    />
  );
}
