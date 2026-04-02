import type { ReactNode } from "react";
import { FaStar } from "react-icons/fa";

export function ServiciosStarRating({
  value,
  max = 5,
  size = "md",
}: {
  value: number;
  max?: number;
  size?: "sm" | "md";
}) {
  const clamped = Math.max(0, Math.min(value, max));
  const full = Math.floor(clamped);
  const hasHalf = clamped - full >= 0.45 && full < max;
  const empty = max - full - (hasHalf ? 1 : 0);
  const iconClass = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  const stars: ReactNode[] = [];
  for (let i = 0; i < full; i++) {
    stars.push(<FaStar key={`f-${i}`} className={`${iconClass} text-[#C9A84A]`} aria-hidden />);
  }
  if (hasHalf) {
    stars.push(
      <span key="half" className="relative inline-flex h-[1em] w-[1em] shrink-0 items-center justify-center" aria-hidden>
        <FaStar className={`${iconClass} absolute text-black/[0.12]`} />
        <span className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
          <FaStar className={`${iconClass} text-[#C9A84A]`} />
        </span>
      </span>
    );
  }
  for (let i = 0; i < empty; i++) {
    stars.push(
      <FaStar key={`e-${i}`} className={`${iconClass} text-black/[0.12]`} aria-hidden />
    );
  }

  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${value} de ${max} estrellas`}>
      {stars}
    </span>
  );
}
