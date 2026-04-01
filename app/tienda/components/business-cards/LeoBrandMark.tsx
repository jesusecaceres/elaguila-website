type LeoBrandMarkProps = {
  /** Pixel width; height scales with asset aspect. */
  width?: number;
  className?: string;
};

/**
 * LEO by Leonix — premium mark for Tienda (gateway, intake, panels).
 * Asset: `/tienda/leo-mark.svg`
 */
export function LeoBrandMark(props: LeoBrandMarkProps) {
  const { width = 200, className = "" } = props;
  const height = Math.round((width * 40) / 120);
  return (
    <img
      src="/tienda/leo-mark.svg"
      alt=""
      width={width}
      height={height}
      className={className}
      decoding="async"
    />
  );
}
