"use client";

export function LeonixApplicationDataLossNotice({ lang }: { lang: "es" | "en" }) {
  const copy =
    lang === "es"
      ? {
          title: "Importante: datos solo en esta sesión",
          body:
            "Si cierras esta pestaña, actualizas la página o sales del flujo de publicación, se borra el progreso no publicado (textos, archivos y medios temporales). Solo permanece lo que ya esté publicado o guardado con un flujo persistente aprobado.",
        }
      : {
          title: "Important: in-session data only",
          body:
            "If you close this tab, refresh the page, or leave the publishing flow, any unpublished progress is removed (text, uploads, and temporary media). Only what is already published—or saved through an approved persistent flow—remains.",
        };

  return (
    <aside
      className="rounded-2xl border border-amber-200/90 bg-amber-50/95 px-4 py-3 text-sm leading-snug text-amber-950 shadow-sm sm:px-5 sm:py-4"
      role="note"
    >
      <p className="font-bold text-amber-950">{copy.title}</p>
      <p className="mt-1.5 text-amber-950/95">{copy.body}</p>
    </aside>
  );
}
