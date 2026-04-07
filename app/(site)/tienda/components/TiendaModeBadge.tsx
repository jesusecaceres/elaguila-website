import type { Lang, TiendaProductMode } from "../types/tienda";
import { pick, tiendaCopy } from "../data/tiendaCopy";

export function TiendaModeBadge(props: { mode: TiendaProductMode; lang: Lang }) {
  const label =
    props.mode === "design-online"
      ? pick(tiendaCopy.sections.modeLabels.designOnline, props.lang)
      : props.mode === "upload-ready"
        ? pick(tiendaCopy.sections.modeLabels.uploadReady, props.lang)
        : pick(tiendaCopy.sections.modeLabels.mixed, props.lang);

  return (
    <span className="inline-flex rounded-full border border-[rgba(201,168,74,0.35)] bg-[rgba(201,168,74,0.14)] px-3 py-1 text-[11px] font-semibold tracking-wide uppercase text-[rgba(255,247,226,0.88)]">
      {label}
    </span>
  );
}

export function TiendaModeBadgeRow(props: { mode: TiendaProductMode; lang: Lang; className?: string }) {
  return (
    <div className={props.className}>
      <TiendaModeBadge mode={props.mode} lang={props.lang} />
    </div>
  );
}
