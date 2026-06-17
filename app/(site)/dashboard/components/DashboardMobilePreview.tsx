"use client";

type Lang = "es" | "en";

/**
 * Compact preview of a listing’s metrics — data comes from the parent when a row is selected.
 * The shell only shows this panel from `2xl` breakpoints up so laptop/tablet layouts stay single-main-column.
 */
export function DashboardMobilePreview({
  lang,
  mode = "listing",
  title,
  priceLine,
  city,
  views,
  saves,
  likes,
  messages,
  showSaves = true,
  showMessages = true,
  variant = "default",
}: {
  lang: Lang;
  mode?: "listing" | "placeholder";
  title?: string;
  priceLine?: string;
  city?: string;
  views?: number;
  saves?: number;
  likes?: number;
  messages?: number;
  showSaves?: boolean;
  showMessages?: boolean;
  variant?: "default" | "varios";
}) {
  const isVarios = variant === "varios";
  const L =
    lang === "es"
      ? {
          preview: "Vista móvil",
          views: "Visualizaciones",
          saves: "Favoritos",
          likes: "Me gusta",
          msgs: "Mensajes",
          hint: "Así ven tus compradores el anuncio en el teléfono.",
          placeholder: "Selecciona un anuncio para la vista previa.",
        }
      : {
          preview: "Mobile view",
          views: "Views",
          saves: "Favorites",
          likes: "Likes",
          msgs: "Messages",
          hint: "How buyers see your listing on mobile.",
          placeholder: "Select a listing to preview.",
        };

  if (mode === "placeholder") {
    return (
      <aside
        className={
          isVarios
            ? "sticky top-24 rounded-[2rem] border border-[#D6C7AD]/85 bg-[#FFFDF7]/95 p-6 shadow-[0_16px_48px_-18px_rgba(31,36,28,0.16)] ring-1 ring-[#C9A84A]/10"
            : "sticky top-24 rounded-[2rem] border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-6 shadow-[0_16px_48px_-18px_rgba(42,36,22,0.18)]"
        }
      >
        <p className={`text-center text-[10px] font-bold uppercase tracking-[0.2em] ${isVarios ? "text-[#8A6B1F]" : "text-[#7A7164]"}`}>
          {L.preview}
        </p>
        <div
          className="relative mx-auto mt-4 flex w-full max-w-[260px] items-center justify-center overflow-hidden rounded-[2rem] border-[10px] border-[#2A2620] bg-[#F3EBDD] shadow-xl"
          style={{ aspectRatio: "9/18" }}
        >
          <p className="max-w-[200px] px-4 text-center text-sm font-semibold leading-snug text-[#5C5346]">{L.placeholder}</p>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={
        isVarios
          ? "sticky top-24 rounded-[2rem] border border-[#D6C7AD]/85 bg-[#FFFDF7]/95 p-4 shadow-[0_16px_48px_-18px_rgba(31,36,28,0.16)] ring-1 ring-[#C9A84A]/10"
          : "sticky top-24 rounded-[2rem] border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-4 shadow-[0_16px_48px_-18px_rgba(42,36,22,0.18)]"
      }
    >
      <p className={`text-center text-[10px] font-bold uppercase tracking-[0.2em] ${isVarios ? "text-[#8A6B1F]" : "text-[#7A7164]"}`}>
        {L.preview}
      </p>
      <div
        className={`relative mx-auto mt-3 w-full max-w-[260px] overflow-hidden rounded-[2rem] border-[10px] shadow-xl ${
          isVarios ? "border-[#7A1E2C]/90 bg-[#7A1E2C]" : "border-[#2A2620] bg-[#2A2620]"
        }`}
        style={{ aspectRatio: "9/18" }}
      >
        <div className="absolute inset-0 flex flex-col bg-[#F8F4EA]">
          <div className={`h-[42%] ${isVarios ? "bg-gradient-to-br from-[#FBF7EF] via-[#F3EBDD] to-[#EDE4D4]" : "bg-gradient-to-br from-[#FAF4EA] to-[#EDE4D4]"}`} />
          <div className="flex flex-1 flex-col gap-2 p-3">
            <p className={`line-clamp-2 text-[13px] font-bold leading-tight ${isVarios ? "font-serif text-[#1F241C]" : "text-[#1E1810]"}`}>
              {title ?? "—"}
            </p>
            <p className={`text-[15px] font-bold ${isVarios ? "font-serif text-[#7A1E2C]" : "text-[#1E1810]"}`}>{priceLine ?? "—"}</p>
            <p className="text-[11px] text-[#5C5346]">{city ?? "—"}</p>
            <div
              className={`mt-auto grid gap-1 rounded-xl border bg-[#FFFCF7] p-2 text-center ${
                isVarios ? "border-[#D6C7AD]/70 ring-1 ring-[#C9A84A]/10" : "border-[#E8DFD0]"
              } ${!showSaves && !showMessages ? "grid-cols-2" : "grid-cols-3"}`}
            >
              <div>
                <p className={`text-[9px] font-semibold uppercase ${isVarios ? "text-[#8A6B1F]" : "text-[#7A7164]"}`}>{L.views}</p>
                <p className={`text-sm font-bold ${isVarios ? "font-serif text-[#1F241C]" : "text-[#1E1810]"}`}>{views ?? 0}</p>
              </div>
              {showSaves ? (
                <div>
                  <p className={`text-[9px] font-semibold uppercase ${isVarios ? "text-[#8A6B1F]" : "text-[#7A7164]"}`}>{L.saves}</p>
                  <p className={`text-sm font-bold ${isVarios ? "font-serif text-[#1F241C]" : "text-[#1E1810]"}`}>{saves ?? 0}</p>
                </div>
              ) : (
                <div>
                  <p className={`text-[9px] font-semibold uppercase ${isVarios ? "text-[#8A6B1F]" : "text-[#7A7164]"}`}>{L.likes}</p>
                  <p className={`text-sm font-bold ${isVarios ? "font-serif text-[#1F241C]" : "text-[#1E1810]"}`}>{likes ?? 0}</p>
                </div>
              )}
              {showMessages ? (
                <div>
                  <p className={`text-[9px] font-semibold uppercase ${isVarios ? "text-[#8A6B1F]" : "text-[#7A7164]"}`}>{L.msgs}</p>
                  <p className={`text-sm font-bold ${isVarios ? "font-serif text-[#1F241C]" : "text-[#1E1810]"}`}>{messages ?? 0}</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      <p className={`mt-3 text-center text-[11px] leading-snug ${isVarios ? "text-[#7A7164]" : "text-[#7A7164]/95"}`}>{L.hint}</p>
    </aside>
  );
}
