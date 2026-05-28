"use client";

import { useEffect, useId, useState } from "react";

type Lang = "es" | "en";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const TOGGLE_COPY = {
  es: { show: "Mostrar", hide: "Ocultar", showAria: "Mostrar contraseña", hideAria: "Ocultar contraseña" },
  en: { show: "Show", hide: "Hide", showAria: "Show password", hideAria: "Hide password" },
} as const;

export function PasswordInputField({
  lang,
  variant = "dark",
  value,
  onChange,
  disabled = false,
  autoComplete,
  placeholder,
  id: idProp,
  className,
}: {
  lang: Lang;
  variant?: "dark" | "light";
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  autoComplete?: string;
  placeholder?: string;
  id?: string;
  className?: string;
}) {
  const autoId = useId();
  const inputId = idProp ?? autoId;
  const [visible, setVisible] = useState(false);
  const copy = TOGGLE_COPY[lang];

  useEffect(() => {
    if (!value) setVisible(false);
  }, [value]);

  const toggleBtnClass =
    variant === "light"
      ? "text-xs font-semibold text-[#6B5B2E] hover:text-[#1E1810] disabled:opacity-50"
      : "text-xs font-semibold text-yellow-400/90 hover:text-yellow-300 disabled:opacity-50";

  return (
    <div className="relative w-full min-w-0">
      <input
        id={inputId}
        name={inputId}
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        disabled={disabled}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className={cx(className, "pr-[4.75rem]")}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => setVisible((v) => !v)}
        className={cx(
          "absolute right-3 top-1/2 z-10 min-h-[44px] min-w-[44px] -translate-y-1/2 px-1",
          toggleBtnClass
        )}
        aria-label={visible ? copy.hideAria : copy.showAria}
        aria-controls={inputId}
        aria-pressed={visible}
      >
        {visible ? copy.hide : copy.show}
      </button>
    </div>
  );
}
