export function EnVentaModerationFields({ lang }: { lang: "es" | "en" }) {
  return (
    <p className="text-xs text-white/60">
      {lang === "es" ? "Campos de moderación En Venta (configuración futura)." : "En Venta moderation fields (future configuration)."}
    </p>
  );
}
