import type { CategoryStandardKey } from "./categoryStandardTheme";

type Props = { category: CategoryStandardKey; className?: string };

export function CategoryStandardMark({ category, className = "h-8 w-8" }: Props) {
  const stroke = "#2A4536";
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke,
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true as const,
  };

  switch (category) {
    case "en-venta":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="7" height="7" rx="1" />
          <rect x="13" y="4" width="7" height="7" rx="1" />
          <rect x="4" y="13" width="7" height="7" rx="1" />
          <rect x="13" y="13" width="7" height="7" rx="1" />
        </svg>
      );
    case "rentas":
      return (
        <svg {...common}>
          <path d="M4 10l8-6 8 6v10H4z" />
          <path d="M10 20v-6h4v6" />
        </svg>
      );
    case "empleos":
      return (
        <svg {...common}>
          <rect x="3" y="7" width="18" height="12" rx="1.5" />
          <path d="M8 7V6a4 4 0 018 0v1" />
        </svg>
      );
    case "autos":
      return (
        <svg {...common}>
          <path d="M5 16h14l-1.5-5H6.5L5 16z" />
          <circle cx="8" cy="17" r="1.5" />
          <circle cx="16" cy="17" r="1.5" />
        </svg>
      );
    case "bienes-raices":
      return (
        <svg {...common}>
          <path d="M3 20h18" />
          <path d="M6 20V9l6-4 6 4v11" />
          <path d="M10 20v-5h4v5" />
        </svg>
      );
    case "servicios":
      return (
        <svg {...common}>
          <path d="M14 4l2 2-8 8-2-2 8-8z" />
          <path d="M16 6l2 2" />
        </svg>
      );
    case "restaurantes":
      return (
        <svg {...common}>
          <path d="M8 3v9M6 3h4" />
          <path d="M16 3v18M14 3h4" />
        </svg>
      );
    case "viajes":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="7" />
          <path d="M12 5v2M12 17v2M5 12h2M17 12h2" />
        </svg>
      );
    case "comunidad":
      return (
        <svg {...common}>
          <rect x="4" y="5" width="16" height="14" rx="1.5" />
          <path d="M8 3v4M16 3v4M4 10h16" />
        </svg>
      );
    case "clases":
      return (
        <svg {...common}>
          <path d="M5 6h14v12H5z" />
          <path d="M9 6V4h6v2" />
          <path d="M8 11h8" />
        </svg>
      );
    case "busco":
      return (
        <svg {...common}>
          <circle cx="10" cy="10" r="5.5" />
          <path d="M14.5 14.5L19 19" />
        </svg>
      );
    case "mascotas-y-perdidos":
      return (
        <svg {...common}>
          <ellipse cx="8" cy="14" rx="2.5" ry="3" />
          <ellipse cx="12" cy="11" rx="2" ry="2.5" />
          <ellipse cx="16" cy="14" rx="2.5" ry="3" />
          <ellipse cx="10" cy="7" rx="2" ry="2.5" />
          <ellipse cx="14" cy="7" rx="2" ry="2.5" />
        </svg>
      );
    case "iglesias":
      return (
        <svg {...common}>
          <path d="M12 4v16" />
          <path d="M8 8h8" />
          <path d="M6 20h12" />
          <path d="M10 20V12h4v8" />
        </svg>
      );
    default:
      return null;
  }
}
