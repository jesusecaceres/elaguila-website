"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function ReglasPage() {
  const searchParams = useSearchParams();
  const lang = (searchParams?.get("lang") || "es") === "en" ? "en" : "es";
  const returnUrl = searchParams?.get("return") || `/clasificados/publicar/en-venta?lang=${lang}`;

  const t =
    lang === "es"
      ? {
          title: "Reglas de la comunidad",
          intro:
            "Al publicar en LEONIX Clasificados aceptas que tu anuncio cumple con estas reglas. Esto nos ayuda a mantener un espacio útil para todos.",
          rules: [
            "El contenido debe ser real y corresponder a lo que ofreces (producto, servicio, renta, etc.).",
            "No está permitido el spam, contenido engañoso ni duplicados abusivos.",
            "Respeta a la comunidad: sin contenido ofensivo, discriminatorio o ilegal.",
            "Los anuncios gratuitos tienen duración y límites (por ejemplo 7 días, 3 fotos). Los planes Pro ofrecen más fotos, video y mayor visibilidad.",
          ],
          back: "Volver a publicar",
        }
      : {
          title: "Community rules",
          intro:
            "By posting on LEONIX Classifieds you confirm your listing complies with these rules. This helps us keep the space useful for everyone.",
          rules: [
            "Content must be real and match what you offer (item, service, rental, etc.).",
            "Spam, misleading content, and abusive duplicates are not allowed.",
            "Respect the community: no offensive, discriminatory, or illegal content.",
            "Free listings have duration and limits (e.g. 7 days, 3 photos). Pro plans offer more photos, video, and visibility.",
          ],
          back: "Back to publish",
        };

  return (
    <main className="min-h-screen bg-[#F5F5F5] text-[#111111] pt-28 pb-16">
      <div className="max-w-2xl mx-auto px-6">
        <h1 className="text-2xl font-bold text-[#111111]">{t.title}</h1>
        <p className="mt-3 text-[#111111]/80">{t.intro}</p>
        <ul className="mt-4 space-y-2 text-sm text-[#111111]/90 list-disc list-inside">
          {t.rules.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
        <Link
          href={returnUrl.startsWith("/") ? returnUrl : `/clasificados/publicar/en-venta?lang=${lang}`}
          className="mt-6 inline-block rounded-xl border border-[#C9B46A]/50 bg-[#F8F6F0] px-4 py-2.5 text-sm font-semibold text-[#111111] hover:bg-[#EFE7D8]"
        >
          {t.back}
        </Link>
      </div>
    </main>
  );
}
