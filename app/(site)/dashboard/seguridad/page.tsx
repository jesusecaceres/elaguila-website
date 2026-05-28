"use client";

/**
 * Gate 2A/2B QA audit (customer dashboard security):
 * - GOOGLE_LOGIN_PRESERVED: TRUE (OAuth-only users can create a Leonix password without current password)
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
import {
  formatOAuthProviderNames,
  getOAuthProviderIds,
  resolveDashboardPasswordMode,
  type DashboardPasswordMode,
} from "@/app/lib/auth/dashboardPasswordMode";
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

  const [passwordMode, setPasswordMode] = useState<DashboardPasswordMode | null>(
    null
  );
  const [oauthProviderIds, setOauthProviderIds] = useState<string[]>([]);

  const t = useMemo(
    () =>
      lang === "es"
        ? {
            title: "Seguridad",
            subtitle: "Administra la contraseña de tu cuenta Leonix.",
            createTitle: "Crea tu contraseña de Leonix",
            createSubtitle:
              "Podrás iniciar sesión con tu correo y esta contraseña además de tu cuenta social.",
            reauthHint:
              "Por tu seguridad, ingresa tu contraseña actual antes de crear una nueva.",
            recoveryTitle: "Crea tu nueva contraseña",
            recoverySubtitle:
              "Completaste la verificación por correo. Elige una contraseña segura para tu cuenta.",
            oauthHint: (providers: string) =>
              `Iniciaste sesión con ${providers}. Puedes crear una contraseña de Leonix para iniciar sesión también con correo y contraseña.`,
            noEmailTitle: "Correo necesario",
            noEmailBody:
              "Para crear una contraseña de Leonix, primero agrega y verifica un correo en tu perfil.",
            emailUnverifiedTitle: "Verifica tu correo",
            emailUnverifiedBody:
              "Confirma tu correo antes de crear o cambiar tu contraseña de Leonix. Revisa tu bandeja de entrada o carpeta de spam.",
            profileLink: "Ir a mi perfil",
            current: "Contraseña actual",
            new: "Nueva contraseña",
            confirm: "Confirmar nueva contraseña",
            save: "Actualizar contraseña",
            createSave: "Crear contraseña",
            saving: "Guardando…",
            success: "Tu contraseña se actualizó correctamente.",
            createSuccess:
              "Tu contraseña de Leonix se creó correctamente. Ya puedes iniciar sesión con correo y contraseña.",
            mismatch: "Las contraseñas nuevas no coinciden.",
            short: "La contraseña debe tener al menos 8 caracteres.",
            weak: "La nueva contraseña no cumple los requisitos.",
            wrongCurrent:
              "La contraseña actual no es correcta. Si entraste con Google o Facebook, usa el flujo para crear tu primera contraseña.",
            resetLink: "Recuperar contraseña",
            back: "Volver al resumen",
            loading: "Cargando…",
            forgotCurrent: "¿Olvidaste tu contraseña actual?",
          }
        : {
            title: "Security",
            subtitle: "Manage your Leonix account password.",
            createTitle: "Create your Leonix password",
            createSubtitle:
              "You can sign in with your email and this password in addition to your social account.",
            reauthHint:
              "For your security, enter your current password before creating a new one.",
            recoveryTitle: "Create your new password",
            recoverySubtitle:
              "You verified your email. Choose a strong password for your account.",
            oauthHint: (providers: string) =>
              `You signed in with ${providers}. You can create a Leonix password to also sign in with email and password.`,
            noEmailTitle: "Email required",
            noEmailBody:
              "To create a Leonix password, add and verify an email on your profile first.",
            emailUnverifiedTitle: "Verify your email",
            emailUnverifiedBody:
              "Confirm your email before creating or changing your Leonix password. Check your inbox or spam folder.",
            profileLink: "Go to my profile",
            current: "Current password",
            new: "New password",
            confirm: "Confirm new password",
            save: "Update password",
            createSave: "Create password",
            saving: "Saving…",
            success: "Your password was updated successfully.",
            createSuccess:
              "Your Leonix password was created. You can now sign in with email and password.",
            mismatch: "New passwords do not match.",
            short: "Password must be at least 8 characters.",
            weak: "New password does not meet requirements.",
            wrongCurrent:
              "Current password is incorrect. If you sign in with Google or Facebook, use the create-password flow instead.",
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
      setOauthProviderIds(getOAuthProviderIds(u));
      setPasswordMode(resolveDashboardPasswordMode(u, recoveryMode));
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
  }, [router, pathname, recoveryMode]);

  const mode = passwordMode ?? "password_change";
  const isBlocked = mode === "no_email" || mode === "email_unverified";
  const needsCurrentPassword = mode === "password_change";
  const isCreateFlow =
    mode === "oauth_create" || mode === "recovery";

  const oauthHint = useMemo(() => {
    if (mode !== "oauth_create") return "";
    return t.oauthHint(formatOAuthProviderNames(oauthProviderIds, lang));
  }, [mode, oauthProviderIds, lang, t]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setSuccess(false);

    if (isBlocked) return;

    if (!email?.trim()) {
      setMsg(lang === "es" ? "No hay correo en la sesión." : "No email on session.");
      return;
    }

    if (newPassword.length < 8) {
      setMsg(t.short);
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

      if (needsCurrentPassword) {
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
          const lower = verifyErr.message?.toLowerCase() ?? "";
          if (
            lower.includes("invalid") ||
            lower.includes("credentials")
          ) {
            setMsg(t.wrongCurrent);
          } else {
            setMsg(mapAuthErrorMessage(verifyErr.message, lang));
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
      setMsg(isCreateFlow ? t.createSuccess : t.success);

      if (mode === "oauth_create") {
        const { data: refreshed } = await supabase.auth.getUser();
        if (refreshed.user) {
          setPasswordMode(resolveDashboardPasswordMode(refreshed.user, false));
        }
      }

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
    !isBlocked &&
    passwordEval.signupReady &&
    newPassword.length >= 8 &&
    confirmPassword.length > 0 &&
    (!needsCurrentPassword || currentPassword.length > 0) &&
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
              {mode === "recovery"
                ? t.recoveryTitle
                : mode === "oauth_create"
                  ? t.createTitle
                  : t.title}
            </h1>
            <p className="mt-2 text-sm text-[#5C5346]/95">
              {mode === "recovery"
                ? t.recoverySubtitle
                : mode === "oauth_create"
                  ? t.createSubtitle
                  : t.subtitle}
            </p>
            {needsCurrentPassword ? (
              <p className="mt-3 text-sm font-medium text-[#6B5B2E]">{t.reauthHint}</p>
            ) : null}
            {mode === "oauth_create" && oauthHint ? (
              <p className="mt-3 text-sm font-medium text-[#6B5B2E]">{oauthHint}</p>
            ) : null}
          </header>

          {isBlocked ? (
            <div className="mt-8 max-w-lg rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-5 shadow-[0_14px_44px_-16px_rgba(42,36,22,0.12)] sm:p-7">
              <h2 className="text-lg font-semibold text-[#1E1810]">
                {mode === "no_email" ? t.noEmailTitle : t.emailUnverifiedTitle}
              </h2>
              <p className="mt-2 text-sm text-[#5C5346]/95">
                {mode === "no_email" ? t.noEmailBody : t.emailUnverifiedBody}
              </p>
              <Link
                href={`/dashboard/perfil?${q}`}
                className="mt-5 inline-flex min-h-[44px] items-center rounded-2xl bg-gradient-to-br from-[#E8D48A] via-[#D4BC6A] to-[#C9A84A] px-5 py-2.5 text-sm font-bold text-[#1E1810] shadow-md transition hover:brightness-[1.03]"
              >
                {t.profileLink}
              </Link>
            </div>
          ) : (
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

            {needsCurrentPassword ? (
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

            <label className={`block ${needsCurrentPassword ? "mt-4" : ""}`}>
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
              {saving
                ? t.saving
                : isCreateFlow
                  ? t.createSave
                  : t.save}
            </button>

            {needsCurrentPassword ? (
              <p className="mt-4 text-sm text-[#5C5346]/95">
                {t.forgotCurrent}{" "}
                <Link
                  href={`/login?mode=reset&lang=${lang}&redirect=${encodeURIComponent(`/dashboard/seguridad?${q}`)}`}
                  className="font-semibold text-[#6B5B2E] underline decoration-[#C9B46A]/55"
                >
                  {t.resetLink}
                </Link>
              </p>
            ) : null}
          </form>
          )}

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
