"use client";

/**
 * Gate 2A/2B QA audit (customer dashboard security):
 * - GOOGLE_LOGIN_PRESERVED: TRUE (unaffected; Google-only users see recovery guidance)
 * - MAGIC_LINK_PRESERVED: TRUE
 * - PASSWORD_LOGIN_ADDED: TRUE
 * - PASSWORD_SIGNUP_ADDED: TRUE
 * - PASSWORD_STRENGTH_METER_ADDED: TRUE
 * - PASSWORD_RESET_ADDED: TRUE
 * - USER_DASHBOARD_CHANGE_PASSWORD_ADDED: TRUE
 * - ADMIN_EMERGENCY_RESET_NOT_ADDED_THIS_GATE: TRUE
 * - NO_PASSWORD_STORAGE_OUTSIDE_SUPABASE: TRUE
 * - NO_IMPERSONATION: TRUE
 */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { PasswordStrengthMeter } from "../../components/auth/PasswordStrengthMeter";
import { evaluatePassword, mapAuthErrorMessage } from "@/app/lib/auth/customerPassword";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { LeonixDashboardShell } from "../components/LeonixDashboardShell";
import { fetchDashboardProfile } from "../lib/dashboardProfile";

type Lang = "es" | "en";
type Plan = "free" | "pro";

function normalizePlanFromMembershipTier(raw: unknown): Plan {
  void raw;
  return "free";
}

export default function DashboardSecurityPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname() ?? "/dashboard/seguridad";

  const lang: Lang = searchParams?.get("lang") === "en" ? "en" : "es";
  const q = `lang=${lang}`;
  const recoveryMode = searchParams?.get("recovery") === "1";

  const t = useMemo(
    () =>
      lang === "es"
        ? {
            title: "Seguridad",
            subtitle: "Administra la contraseña de tu cuenta Leonix.",
            reauthHint:
              "Por tu seguridad, ingresa tu contraseña actual antes de crear una nueva.",
            recoveryTitle: "Crea tu nueva contraseña",
            recoverySubtitle:
              "Completaste la verificación por correo. Elige una contraseña segura para tu cuenta.",
            current: "Contraseña actual",
            new: "Nueva contraseña",
            confirm: "Confirmar nueva contraseña",
            save: "Actualizar contraseña",
            saving: "Guardando…",
            success: "Tu contraseña se actualizó correctamente.",
            mismatch: "Las contraseñas nuevas no coinciden.",
            weak: "La nueva contraseña no cumple los requisitos.",
            noPasswordProvider:
              "Usa recuperar contraseña para crear o recuperar tu contraseña.",
            resetLink: "Recuperar contraseña",
            back: "Volver al resumen",
            loading: "Cargando…",
            forgotCurrent: "¿Olvidaste tu contraseña actual?",
          }
        : {
            title: "Security",
            subtitle: "Manage your Leonix account password.",
            reauthHint:
              "For your security, enter your current password before creating a new one.",
            recoveryTitle: "Create your new password",
            recoverySubtitle:
              "You verified your email. Choose a strong password for your account.",
            current: "Current password",
            new: "New password",
            confirm: "Confirm new password",
            save: "Update password",
            saving: "Saving…",
            success: "Your password was updated successfully.",
            mismatch: "New passwords do not match.",
            weak: "New password does not meet requirements.",
            noPasswordProvider:
              "Use password reset to create or recover your password.",
            resetLink: "Reset password",
            back: "Back to overview",
            loading: "Loading…",
            forgotCurrent: "Forgot your current password?",
          },
    [lang]
  );

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [shellName, setShellName] = useState<string | null>(null);
  const [accountPlan, setAccountPlan] = useState<Plan>("free");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const passwordEval = useMemo(
    () => evaluatePassword(newPassword, email ?? ""),
    [newPassword, email]
  );

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let mounted = true;

    async function load() {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;

      if (!data.user) {
        const redirect = encodeURIComponent(`${pathname}${window.location.search || ""}`);
        router.replace(`/login?redirect=${redirect}`);
        return;
      }

      const u = data.user;
      setEmail(u.email ?? null);
      const existingName =
        (u.user_metadata?.full_name as string | undefined) ||
        (u.user_metadata?.name as string | undefined) ||
        "";
      setShellName(existingName.trim() || null);

      try {
        const { row } = await fetchDashboardProfile(supabase, u.id);
        if (row?.display_name?.trim()) setShellName(row.display_name.trim());
        setAccountPlan(normalizePlanFromMembershipTier(row?.membership_tier));
      } catch {
        /* ignore */
      }

      setLoading(false);
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [router, pathname]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setSuccess(false);

    if (!email?.trim()) {
      setMsg(lang === "es" ? "No hay correo en la sesión." : "No email on session.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMsg(t.mismatch);
      return;
    }

    if (!passwordEval.signupReady) {
      setMsg(t.weak);
      return;
    }

    setSaving(true);
    try {
      const supabase = createSupabaseBrowserClient();

      if (!recoveryMode) {
        const trimmedCurrent = currentPassword;
        if (!trimmedCurrent) {
          setMsg(
            lang === "es"
              ? "Ingresa tu contraseña actual."
              : "Enter your current password."
          );
          setSaving(false);
          return;
        }

        const { error: verifyErr } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: trimmedCurrent,
        });

        if (verifyErr) {
          const mapped = mapAuthErrorMessage(verifyErr.message, lang);
          if (
            verifyErr.message?.toLowerCase().includes("invalid") ||
            verifyErr.message?.toLowerCase().includes("credentials")
          ) {
            setMsg(t.noPasswordProvider);
          } else {
            setMsg(mapped);
          }
          setSaving(false);
          return;
        }
      }

      const { error: updateErr } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateErr) {
        setMsg(mapAuthErrorMessage(updateErr.message, lang));
        setSaving(false);
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess(true);
      setMsg(t.success);

      if (recoveryMode) {
        router.replace(`/dashboard/seguridad?${q}`);
      }
    } catch (e: unknown) {
      setMsg((e as { message?: string })?.message ?? "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  const canSubmit =
    passwordEval.signupReady &&
    newPassword.length > 0 &&
    confirmPassword.length > 0 &&
    (recoveryMode || currentPassword.length > 0) &&
    !saving;

  const inputClass =
    "mt-2 w-full min-w-0 rounded-xl border border-[#E8DFD0] bg-[#FFFCF7] px-4 py-3 text-sm text-[#1E1810] outline-none placeholder:text-[#7A7164]/60 focus:border-[#C9B46A]/70";

  return (
    <LeonixDashboardShell
      lang={lang}
      activeNav="security"
      plan={accountPlan}
      userName={shellName}
      email={email}
      accountRef={null}
    >
      {loading ? (
        <div className="rounded-3xl border border-[#E8DFD0] bg-[#FFFCF7]/90 p-10 text-center text-sm text-[#5C5346]">
          {t.loading}
        </div>
      ) : (
        <>
          <header>
            <h1 className="text-2xl font-bold tracking-tight text-[#1E1810] sm:text-3xl">
              {recoveryMode ? t.recoveryTitle : t.title}
            </h1>
            <p className="mt-2 text-sm text-[#5C5346]/95">
              {recoveryMode ? t.recoverySubtitle : t.subtitle}
            </p>
            {!recoveryMode ? (
              <p className="mt-3 text-sm font-medium text-[#6B5B2E]">{t.reauthHint}</p>
            ) : null}
          </header>

          <form
            onSubmit={(e) => void handleSubmit(e)}
            className="mt-8 max-w-lg rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-5 shadow-[0_14px_44px_-16px_rgba(42,36,22,0.12)] sm:p-7"
          >
            {msg ? (
              <div
                className={`mb-4 rounded-2xl border p-4 text-sm font-medium ${
                  success
                    ? "border-emerald-200/90 bg-emerald-50/95 text-emerald-950"
                    : "border-red-200/80 bg-red-50/90 text-red-900"
                }`}
              >
                {msg}
              </div>
            ) : null}

            {!recoveryMode ? (
              <label className="block">
                <span className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">
                  {t.current}
                </span>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={inputClass}
                  disabled={saving}
                />
              </label>
            ) : null}

            <label className={`block ${recoveryMode ? "" : "mt-4"}`}>
              <span className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">
                {t.new}
              </span>
              <input
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass}
                disabled={saving}
              />
            </label>

            {newPassword.length > 0 ? (
              <div className="mt-3">
                <PasswordStrengthMeter
                  strength={passwordEval.strength}
                  checks={passwordEval.checks}
                  lang={lang}
                  variant="light"
                />
              </div>
            ) : null}

            <label className="mt-4 block">
              <span className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">
                {t.confirm}
              </span>
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
                disabled={saving}
              />
            </label>

            <button
              type="submit"
              disabled={!canSubmit}
              className="mt-6 flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8D48A] via-[#D4BC6A] to-[#C9A84A] px-5 py-3 text-sm font-bold text-[#1E1810] shadow-md transition hover:brightness-[1.03] disabled:opacity-60 sm:w-auto"
            >
              {saving ? t.saving : t.save}
            </button>

            <p className="mt-4 text-sm text-[#5C5346]/95">
              {t.forgotCurrent}{" "}
              <Link
                href={`/login?mode=reset&lang=${lang}&redirect=${encodeURIComponent(`/dashboard/seguridad?${q}`)}`}
                className="font-semibold text-[#6B5B2E] underline decoration-[#C9B46A]/55"
              >
                {t.resetLink}
              </Link>
            </p>
          </form>

          <div className="mt-6">
            <Link
              href={`/dashboard?${q}`}
              className="inline-flex min-h-[44px] items-center rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7] px-4 py-2.5 text-sm font-semibold text-[#3D3428] transition hover:bg-[#FAF7F2]"
            >
              {t.back}
            </Link>
          </div>
        </>
      )}
    </LeonixDashboardShell>
  );
}
