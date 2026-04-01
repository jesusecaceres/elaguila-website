type LeoBrandMarkProps = {
  /** Max width in CSS pixels — height follows asset aspect ratio. */
  width?: number;
  className?: string;
};

/**
 * LEO assistant mark for Tienda (gateway, intake, helper panels).
 * Asset: `/ai/leo-mark.png` (replace file in `public/ai/` to update branding).
 */
export function LeoBrandMark(props: LeoBrandMarkProps) {
  const { width = 160, className = "" } = props;
  return (
    <img
      src="/ai/leo-mark.png"
      alt=""
      role="presentation"
      style={{ width, maxWidth: "100%", height: "auto" }}
      className={["object-contain object-left", className].filter(Boolean).join(" ")}
      decoding="async"
    />
  );
}
