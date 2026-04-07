import type { ReactNode } from "react";

export function TiendaSectionHeading(props: {
  eyebrow?: string;
  title: string;
  description?: string;
  rightSlot?: ReactNode;
}) {
  const { eyebrow, title, description, rightSlot } = props;
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow ? (
          <div className="inline-flex items-center gap-2">
            <span className="h-[1px] w-10 bg-[rgba(201,168,74,0.55)]" />
            <span className="text-[11px] tracking-[0.18em] uppercase text-[rgba(255,247,226,0.78)]">
              {eyebrow}
            </span>
          </div>
        ) : null}
        <h2 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight text-white">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-sm sm:text-base leading-relaxed text-[rgba(255,255,255,0.72)]">
            {description}
          </p>
        ) : null}
      </div>
      {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
    </div>
  );
}

