"use client";

import Link from "next/link";

type ActionItem = {
  href?: string;
  label: string;
  tone?: "primary" | "secondary" | "subtle";
  onClick?: () => void;
  disabled?: boolean;
};

function actionClass(tone: ActionItem["tone"]): string {
  if (tone === "primary") {
    return "border-transparent bg-[color:var(--lx-cta-primary-bg)] text-[color:var(--lx-cta-primary-fg)] hover:opacity-90";
  }
  if (tone === "subtle") {
    return "border-[color:var(--lx-border)] bg-[color:var(--lx-section)] text-[color:var(--lx-text)]";
  }
  return "border-[color:var(--lx-border)] bg-[color:var(--lx-card)] text-[color:var(--lx-text)]";
}

export function DashboardListingActionBar({ actions }: { actions: ActionItem[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) =>
        action.href ? (
          <Link
            key={`${action.label}-${action.href}`}
            href={action.href}
            className={`inline-flex min-h-[40px] items-center rounded-xl border px-4 py-2 text-sm font-semibold ${actionClass(action.tone)}`}
          >
            {action.label}
          </Link>
        ) : (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            disabled={action.disabled}
            className={`inline-flex min-h-[40px] items-center rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-50 ${actionClass(action.tone)}`}
          >
            {action.label}
          </button>
        ),
      )}
    </div>
  );
}
