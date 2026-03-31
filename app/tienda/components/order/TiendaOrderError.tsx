import type { Lang } from "../../types/tienda";

export function TiendaOrderError(props: { lang: Lang; message: string }) {
  const { lang, message } = props;
  return (
    <div
      role="alert"
      className="rounded-2xl border border-[rgba(220,120,100,0.45)] bg-[rgba(180,60,50,0.12)] px-4 py-3 text-sm text-[rgba(255,230,220,0.95)]"
    >
      <p className="font-semibold">{lang === "en" ? "Couldn’t submit" : "No se pudo enviar"}</p>
      <p className="mt-1 text-[rgba(255,255,255,0.78)]">{message}</p>
    </div>
  );
}
