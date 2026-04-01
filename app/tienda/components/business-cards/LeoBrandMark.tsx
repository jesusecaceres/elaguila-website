type LeoBrandMarkProps = {
  /** Max width in CSS pixels — height follows asset aspect ratio. */
  width?: number;
  className?: string;
};

/**
 * LEO assistant mark for Tienda (gateway, intake, helper panels).
 * Vector at `/ai/leo-mark.svg` (committed). Optional `/ai/leo-mark.png` can replace for raster-only pipelines.
 */
export function LeoBrandMark(props: LeoBrandMarkProps) {
  const { width = 160, className = "" } = props;
  return (
    <span
      className={[
        "inline-flex items-center justify-center rounded-2xl border border-[rgba(201,168,74,0.28)] bg-[rgba(0,0,0,0.35)] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- local SVG mark; explicit dimensions */}
      <img
        src="/ai/leo-mark.svg"
        alt=""
        role="presentation"
        width={360}
        height={120}
        decoding="async"
        className="h-auto object-contain object-center drop-shadow-[0_0_20px_rgba(201,168,74,0.22)]"
        style={{ width, maxWidth: "100%", height: "auto" }}
      />
    </span>
  );
}
