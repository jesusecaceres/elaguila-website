"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { LeonixDashboardShell } from "../../../components/LeonixDashboardShell";

type Lang = "es" | "en";

const ERROR_COPY: Record<string, { es: string; en: string }> = {
  claim_not_found: { es: "Este enlace de invitación no es válido.", en: "This invitation link is not valid." },
  claim_not_pending: { es: "Esta invitación ya fue usada, revocada o expiró.", en: "This invitation was already used, revoked, or expired." },
  claim_expired: { es: "Esta invitación ha expirado. Pide a tu representante de Leonix un nuevo enlace.", en: "This invitation has expired. Ask your Leonix representative for a new link." },
  claim_email_mismatch: { es: "Esta invitación está reservada para otro correo electrónico.", en: "This invitation is reserved for a different email address." },
  business_already_owned: { es: "Este negocio ya tiene un propietario registrado.", en: "This business already has a registered owner." },
  feature_disabled: { es: "Esta función no está disponible por el momento.", en: "This feature is not available right now." },
  unknown_error: { es: "Algo salió mal. Intenta de nuevo en unos minutos.", en: "Something went wrong. Please try again in a few minutes." },
};

function errorCopy(code: string, lang: Lang): string {
  return (ERROR_COPY[code] ?? ERROR_COPY.unknown_error)[lang];
}

/** Systemic Repair Build — owner-facing claim acceptance page. Requires real sign-in (never
 * bootstrap — this route is not under /admin). Redeems the invitation against the EXISTING
 * business_id via accept_business_ownership_claim(); never creates a new business. */
function ClaimPageContent() {
  const router = useRouter();
  const pathname = usePathname() ?? "/dashboard/business-tools/claim";
  const params = useParams<{ token: string }>();
  const token = typeof params?.token === "string" ? params.token : "";
  const lang: Lang = "es";

  const [status, setStatus] = useState<"checking_session" | "confirming" | "accepting" | "error" | "done">("checking_session");
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  useEffect(() => {
    const sb = createSupabaseBrowserClient();
    let mounted = true;
    (async () => {
      const { data } = await sb.auth.getUser();
      if (!mounted) return;
      if (!data.user) {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }
      setUserId(data.user.id);
      setEmail(data.user.email ?? null);
      setName((data.user.user_metadata?.full_name as string | undefined) || (data.user.user_metadata?.name as string | undefined) || null);
      setStatus("confirming");
    })();
    return () => {
      mounted = false;
    };
  }, [router, pathname]);

  async function acceptClaim() {
    setStatus("accepting");
    const sb = createSupabaseBrowserClient();
    const { data: sessionData } = await sb.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken || !token) {
      setErrorCode("unknown_error");
      setStatus("error");
      return;
    }
    try {
      const res = await fetch("/api/business/ownership-claim/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ token }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; businessId?: string; error?: string };
      if (!res.ok || !json.ok || !json.businessId) {
        setErrorCode(json.error ?? "unknown_error");
        setStatus("error");
        return;
      }
      setStatus("done");
      router.replace(`/dashboard/business-tools/business/${json.businessId}`);
    } catch {
      setErrorCode("unknown_error");
      setStatus("error");
    }
  }

  return (
    <LeonixDashboardShell lang={lang} activeNav="business" plan="free" userName={name} email={email} accountRef={null} ownerId={userId}>
      <div className="mx-auto max-w-xl rounded-3xl border border-[#E8DFD0] bg-[#FFFCF7]/90 p-10 text-center">
        {status === "checking_session" && (
          <p className="text-sm text-[#5C5346]">{lang === "es" ? "Verificando tu sesión…" : "Checking your session…"}</p>
        )}
        {status === "confirming" && (
          <div className="space-y-4">
            <h1 className="text-xl font-semibold text-[#2A2318]">
              {lang === "es" ? "Reclama tu negocio en Leonix" : "Claim your business on Leonix"}
            </h1>
            <p className="text-sm text-[#5C5346]">
              {lang === "es"
                ? "Un representante de Leonix ya comenzó a preparar tu perfil de negocio. Al continuar, quedarás registrado como el propietario de este negocio y conservarás todo lo que ya se preparó."
                : "A Leonix representative has already started preparing your business profile. Continuing will register you as this business's owner and keep everything already prepared."}
            </p>
            <button
              type="button"
              onClick={acceptClaim}
              className="inline-flex items-center justify-center rounded-full bg-[#2A6F4B] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#245F40]"
            >
              {lang === "es" ? "Reclamar mi negocio" : "Claim my business"}
            </button>
          </div>
        )}
        {status === "accepting" && (
          <p className="text-sm text-[#5C5346]">{lang === "es" ? "Confirmando…" : "Confirming…"}</p>
        )}
        {status === "error" && (
          <div className="space-y-3">
            <p className="text-sm text-[#8C2F2F]">{errorCopy(errorCode ?? "unknown_error", lang)}</p>
            <a href="/dashboard/business-tools" className="text-sm font-semibold text-[#2A6F4B] underline">
              {lang === "es" ? "Volver al panel" : "Back to dashboard"}
            </a>
          </div>
        )}
        {status === "done" && (
          <p className="text-sm text-[#2A6F4B]">{lang === "es" ? "¡Listo! Redirigiendo…" : "Done! Redirecting…"}</p>
        )}
      </div>
    </LeonixDashboardShell>
  );
}

export default function ClaimPage() {
  return <ClaimPageContent />;
}
