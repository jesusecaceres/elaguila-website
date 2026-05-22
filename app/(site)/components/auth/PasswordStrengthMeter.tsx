"use client";

import type { PasswordChecks, PasswordStrength } from "@/app/lib/auth/customerPassword";

type Lang = "es" | "en";

const STRENGTH_COLORS: Record<PasswordStrength, string> = {
  weak: "bg-red-500/80",
  okay: "bg-amber-400/90",
  strong: "bg-emerald-500/90",
};

export function PasswordStrengthMeter({
  strength,
  checks,
  lang,
  variant = "dark",
}: {
  strength: PasswordStrength;
  checks: PasswordChecks;
  lang: Lang;
  variant?: "dark" | "light";
}) {
  const labels: Record<PasswordStrength, { es: string; en: string }> = {
    weak: { es: "Débil", en: "Weak" },
    okay: { es: "Aceptable", en: "Okay" },
    strong: { es: "Fuerte", en: "Strong" },
  };

  const hints = [
    {
      ok: checks.minLength,
      es: "Al menos 10 caracteres",
      en: "At least 10 characters",
    },
    {
      ok: checks.uppercase,
      es: "Una mayúscula",
      en: "One uppercase letter",
    },
    {
      ok: checks.lowercase,
      es: "Una minúscula",
      en: "One lowercase letter",
    },
    {
      ok: checks.number,
      es: "Un número",
      en: "One number",
    },
    {
      ok: checks.symbol,
      es: "Un símbolo",
      en: "One symbol",
    },
    {
      ok: checks.notContainsLocalPart,
      es: "Sin usar la parte local del correo",
      en: "Must not include your email username",
    },
  ];

  const barTrack = variant === "dark" ? "bg-white/10" : "bg-[#E8DFD0]";
  const labelText = variant === "dark" ? "text-white/70" : "text-[#5C5346]";
  const hintText = variant === "dark" ? "text-white/55" : "text-[#7A7164]";
  const hintOk = variant === "dark" ? "text-emerald-300/90" : "text-emerald-700";

  const fillWidth = strength === "weak" ? "33%" : strength === "okay" ? "66%" : "100%";

  return (
    <div className="space-y-2 min-w-0">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className={labelText}>
          {lang === "es" ? "Seguridad de contraseña" : "Password strength"}
        </span>
        <span className={`font-semibold ${labelText}`}>{labels[strength][lang]}</span>
      </div>
      <div className={`h-2 w-full overflow-hidden rounded-full ${barTrack}`}>
        <div
          className={`h-full rounded-full transition-all duration-300 ${STRENGTH_COLORS[strength]}`}
          style={{ width: fillWidth }}
          role="progressbar"
          aria-valuenow={strength === "weak" ? 1 : strength === "okay" ? 2 : 3}
          aria-valuemin={0}
          aria-valuemax={3}
        />
      </div>
      <ul className={`grid gap-1 text-[11px] leading-snug sm:grid-cols-2 ${hintText}`}>
        {hints.map((h) => (
          <li key={h.en} className={h.ok ? hintOk : undefined}>
            {h.ok ? "✓ " : "○ "}
            {lang === "es" ? h.es : h.en}
          </li>
        ))}
      </ul>
    </div>
  );
}
