import type { ReactNode } from "react";

/**
 * Standard visibility for CMS-driven CTAs: stored URL, effective public target, and blank fallback.
 * Use {@link AdminCtaRoutingCallout} when the destination is fixed in code (no URL field in the form).
 */

export function AdminCtaDestinationHint(props: {
  /** Short label, e.g. "CTA primario" */
  label: string;
  /** Value in the form / payload (may be empty) */
  hrefStored: string;
  /** What visitors actually get (resolved behavior) */
  effectiveLine: string;
  /** Extra line when the URL is blank or behavior is non-obvious */
  whenBlank?: string;
}) {
  const { label, hrefStored, effectiveLine, whenBlank } = props;
  const trimmed = hrefStored.trim();
  return (
    <div className="mt-1 rounded-lg border border-[#E8DFD0]/90 bg-[#FBF7EF]/80 px-3 py-2 text-[11px] leading-snug text-[#5C5346]">
      <p className="font-semibold text-[#3D3428]">{label}</p>
      <p>
        <span className="text-[#7A7164]">URL guardada: </span>
        {trimmed ? <code className="break-all rounded bg-white/80 px-1">{trimmed}</code> : <span className="italic">(vacía)</span>}
      </p>
      <p className="mt-0.5">
        <span className="text-[#7A7164]">Destino efectivo en público: </span>
        <span>{effectiveLine}</span>
      </p>
      {whenBlank ? <p className="mt-0.5 text-[#7A7164]">{whenBlank}</p> : null}
    </div>
  );
}

export function AdminCtaRoutingCallout(props: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-[#C9B46A]/35 bg-[#FFFCF7] px-3 py-2 text-[11px] leading-snug text-[#5C5346] ${props.className ?? ""}`}
    >
      <p className="font-semibold text-[#1E1810]">{props.title}</p>
      <div className="mt-1 space-y-1">{props.children}</div>
    </div>
  );
}
