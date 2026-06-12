import Link from "next/link";
import type { ReactNode } from "react";
import {
  adminDashboardCtaActive,
  adminDashboardCtaDanger,
  adminDashboardCtaNeutral,
  adminDashboardCtaPremium,
  adminDashboardCtaPrimary,
  adminDashboardCtaView,
  adminDashboardCtaWarning,
} from "./adminTheme";

export type AdminDashboardCtaVariant =
  | "primary"
  | "active"
  | "view"
  | "warning"
  | "neutral"
  | "danger"
  | "premium";

const VARIANT_CLASS: Record<AdminDashboardCtaVariant, string> = {
  primary: adminDashboardCtaPrimary,
  active: adminDashboardCtaActive,
  view: adminDashboardCtaView,
  warning: adminDashboardCtaWarning,
  neutral: adminDashboardCtaNeutral,
  danger: adminDashboardCtaDanger,
  premium: adminDashboardCtaPremium,
};

export function AdminDashboardCta({
  href,
  label,
  variant = "neutral",
  title,
  external,
  icon,
  className = "",
}: {
  href: string;
  label: string;
  variant?: AdminDashboardCtaVariant;
  title?: string;
  external?: boolean;
  icon?: ReactNode;
  className?: string;
}) {
  const cls = `${VARIANT_CLASS[variant]} ${className}`.trim();
  if (external) {
    return (
      <Link href={href} target="_blank" rel="noopener noreferrer" className={cls} title={title}>
        {icon ? <span aria-hidden>{icon}</span> : null}
        {label}
      </Link>
    );
  }
  return (
    <Link href={href} className={cls} title={title}>
      {icon ? <span aria-hidden>{icon}</span> : null}
      {label}
    </Link>
  );
}

export function AdminDashboardCtaButton({
  label,
  variant = "neutral",
  title,
  disabled,
  onClick,
  className = "",
  type = "button",
}: {
  label: string;
  variant?: AdminDashboardCtaVariant;
  title?: string;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit";
}) {
  const cls = `${VARIANT_CLASS[variant]} ${className}`.trim();
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={cls} title={title}>
      {label}
    </button>
  );
}

export function AdminDashboardCtaGrid({ children, columns = 2 }: { children: ReactNode; columns?: 1 | 2 | 3 }) {
  const colClass =
    columns === 1
      ? "grid grid-cols-1 gap-2"
      : columns === 3
        ? "grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3"
        : "grid grid-cols-1 gap-2 sm:grid-cols-2";
  return <div className={colClass}>{children}</div>;
}
