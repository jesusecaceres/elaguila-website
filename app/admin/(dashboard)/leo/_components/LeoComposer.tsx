"use client";

import { useId } from "react";

import { adminBtnPrimary, adminBtnSecondary, adminInputClass } from "@/app/admin/_components/adminTheme";

export function LeoComposer({
  value,
  onChange,
  onSubmit,
  pending,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  pending: boolean;
  disabled?: boolean;
}) {
  const inputId = useId();

  return (
    <form
      className="sticky bottom-0 z-20 -mx-4 border-t border-[color:var(--lx-border)]/60 bg-[color:var(--lx-card)]/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm sm:-mx-5 sm:px-5"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label htmlFor={inputId} className="sr-only">
            Message LEO
          </label>
          <textarea
            id={inputId}
            name="question"
            rows={2}
            autoComplete="off"
            disabled={pending || disabled}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmit();
              }
            }}
            placeholder="Ask LEO…"
            className={`${adminInputClass} min-h-[52px] resize-y text-base leading-relaxed`}
          />
        </div>
        <button
          type="submit"
          disabled={pending || disabled || !value.trim()}
          className={`${adminBtnPrimary} min-h-[48px] w-full shrink-0 px-6 disabled:cursor-not-allowed disabled:opacity-60 sm:mb-0.5 sm:w-auto`}
        >
          {pending ? "Asking…" : "Ask LEO"}
        </button>
      </div>
      <p className="mt-1.5 text-[10px] text-[#5C5346]/80">
        Enter to send · Shift+Enter for a new line
      </p>
    </form>
  );
}

export function LeoNewConversationButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`${adminBtnSecondary} min-h-[40px] px-3 text-xs disabled:opacity-60`}
    >
      New conversation
    </button>
  );
}
