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
    return "border-[#C9B46A]/40 bg-[#FBF7EF] text-[#5C4E2E]";
  }
  if (tone === "subtle") {
    return "border-[#E8DFD0] bg-[#FAF7F2] text-[#2C2416]";
  }
  return "border-[#E8DFD0] bg-white text-[#2C2416]";
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
