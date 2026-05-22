/**
 * Customer password policy (Gate 2A/2B). Passwords live only in Supabase Auth — never profiles/metadata/storage.
 */

export type PasswordStrength = "weak" | "okay" | "strong";

export type PasswordChecks = {
  minLength: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  symbol: boolean;
  notContainsLocalPart: boolean;
};

export function getEmailLocalPart(email: string): string {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.indexOf("@");
  return at > 0 ? trimmed.slice(0, at) : trimmed;
}

export function evaluatePassword(password: string, email: string): {
  checks: PasswordChecks;
  strength: PasswordStrength;
  signupReady: boolean;
} {
  const p = password;
  const local = getEmailLocalPart(email);
  const checks: PasswordChecks = {
    minLength: p.length >= 10,
    uppercase: /[A-Z]/.test(p),
    lowercase: /[a-z]/.test(p),
    number: /\d/.test(p),
    symbol: /[^A-Za-z0-9]/.test(p),
    notContainsLocalPart: local.length < 2 || !p.toLowerCase().includes(local),
  };

  const passed = Object.values(checks).filter(Boolean).length;
  let strength: PasswordStrength = "weak";
  if (passed === 6) strength = "strong";
  else if (passed >= 4) strength = "okay";

  const signupReady = Object.values(checks).every(Boolean);
  return { checks, strength, signupReady };
}

export function mapAuthErrorMessage(
  raw: string | undefined,
  lang: "es" | "en"
): string {
  const m = (raw ?? "").toLowerCase();
  if (m.includes("rate") && m.includes("limit")) {
    return lang === "es"
      ? "Demasiados intentos. Espera un momento y vuelve a intentar."
      : "Too many attempts. Please wait a moment and try again.";
  }
  if (m.includes("invalid login credentials") || m.includes("invalid credentials")) {
    return lang === "es"
      ? "Correo o contraseña incorrectos."
      : "Incorrect email or password.";
  }
  if (m.includes("user already registered") || m.includes("already been registered")) {
    return lang === "es"
      ? "Este correo ya tiene cuenta. Inicia sesión o usa recuperar contraseña."
      : "This email is already registered. Sign in or use password reset.";
  }
  if (m.includes("password") && (m.includes("weak") || m.includes("least"))) {
    return lang === "es"
      ? "La contraseña no cumple los requisitos de seguridad."
      : "Password does not meet security requirements.";
  }
  if (m.includes("email not confirmed")) {
    return lang === "es"
      ? "Confirma tu correo antes de iniciar sesión con contraseña."
      : "Confirm your email before signing in with a password.";
  }
  return raw ?? (lang === "es" ? "No pudimos completar la acción." : "We could not complete that action.");
}
