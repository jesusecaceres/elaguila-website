"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import SectionShell from "@/app/clasificados/en-venta/shared/components/SectionShell";
import type { EnVentaFreeApplicationState } from "../schema/enVentaFreeFormState";
import type { EnVentaFreeSectionProps } from "../types/sectionProps";
import { inputClass, labelClass } from "../helpers/fieldCx";

function phoneDigits(raw: string): string {
  return (raw || "").replace(/\D/g, "");
}

/** Same shaping as dashboard perfil — US-style display, max 10 digits */
function formatPhoneInput(raw: string): string {
  const d = phoneDigits(raw).slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

const COPY = {
  es: {
    title: "Vendedor y contacto",
    desc: "Datos de contacto claros generan más respuestas serias. Marca lo opcional sin miedo.",
    kind: "Tipo de vendedor",
    ind: "Persona",
    biz: "Negocio",
    name: "Nombre para mostrar",
    nameH: "Cómo quieres aparecer frente a los compradores.",
    phone: "Teléfono",
    email: "Correo",
    wa: "WhatsApp (opcional)",
    waH: "Si lo dejas, los compradores pueden escribirte por WhatsApp.",
    pref: "Método de contacto preferido",
    pPhone: "Teléfono",
    pEmail: "Correo",
    pBoth: "Teléfono y correo",
    pWa: "WhatsApp",
    profileInlineNote:
      "Para cambiar este número o correo, actualízalo en tu Perfil.",
    accountContactMissing:
      "Aún no tenemos teléfono ni correo guardados en tu cuenta. Puedes escribirlos aquí o actualizarlos en tu Perfil.",
    guestNote:
      "Si inicias sesión, podremos rellenar automáticamente tu nombre, teléfono y correo desde tu cuenta.",
  },
  en: {
    title: "Seller & contact",
    desc: "Clear contact details get more serious replies. Optional fields can stay blank.",
    kind: "Seller type",
    ind: "Individual",
    biz: "Business",
    name: "Display name",
    nameH: "How you want to appear to buyers.",
    phone: "Phone",
    email: "Email",
    wa: "WhatsApp (optional)",
    waH: "If provided, buyers can reach you on WhatsApp.",
    pref: "Preferred contact method",
    pPhone: "Phone",
    pEmail: "Email",
    pBoth: "Phone & email",
    pWa: "WhatsApp",
    profileInlineNote:
      "To change this phone number or email, update it in your Profile.",
    accountContactMissing:
      "We do not have a phone or email saved on your account yet. You can enter them here or update them in your Profile.",
    guestNote: "Sign in to pre-fill your name, phone, and email from your account.",
  },
} as const;

export function SellerContactSection<S extends EnVentaFreeApplicationState>({
  lang,
  state,
  setState,
  showSellerKind = true,
}: EnVentaFreeSectionProps<S> & { showSellerKind?: boolean }) {
  const t = COPY[lang];
  const [accountUi, setAccountUi] = useState<{
    ready: boolean;
    loggedIn: boolean;
    hadPhoneOrEmailFromAccount: boolean;
  }>({ ready: false, loggedIn: false, hadPhoneOrEmailFromAccount: false });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data } = await supabase.auth.getUser();
        if (cancelled) return;
        const u = data.user;
        if (!u) {
          setAccountUi({ ready: true, loggedIn: false, hadPhoneOrEmailFromAccount: false });
          return;
        }

        const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
        let displayName = String(meta.full_name ?? meta.name ?? "").trim();
        let emailVal = String(u.email ?? "").trim();
        let phoneRaw = String(meta.phone ?? meta.contact_phone ?? "").trim();

        try {
          const { data: row, error } = await supabase
            .from("profiles")
            .select("display_name, phone, email")
            .eq("id", u.id)
            .maybeSingle();
          if (!cancelled && !error && row && typeof row === "object") {
            const r = row as { display_name?: string | null; phone?: string | null; email?: string | null };
            const dn = String(r.display_name ?? "").trim();
            const em = String(r.email ?? "").trim();
            const ph = String(r.phone ?? "").trim();
            if (dn) displayName = dn;
            if (em) emailVal = em || emailVal;
            if (ph) phoneRaw = ph;
          }
        } catch {
          /* ignore */
        }

        const phoneFmt = phoneRaw ? formatPhoneInput(phoneRaw) : "";
        const hadPhoneOrEmailFromAccount = Boolean(phoneFmt || emailVal);

        if (!cancelled) {
          setAccountUi({ ready: true, loggedIn: true, hadPhoneOrEmailFromAccount });
          setState((prev) => {
            const s = prev as EnVentaFreeApplicationState;
            const next: EnVentaFreeApplicationState = { ...s };
            if (displayName) next.displayName = displayName;
            if (emailVal) next.email = emailVal;
            if (phoneFmt) next.phone = phoneFmt;
            if (phoneFmt && !String(s.whatsapp ?? "").trim()) next.whatsapp = phoneFmt;
            return next as S;
          });
        }
      } catch {
        if (!cancelled) setAccountUi({ ready: true, loggedIn: false, hadPhoneOrEmailFromAccount: false });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setState]);

  return (
    <SectionShell lang={lang} title={t.title} description={t.desc}>
      {accountUi.ready && accountUi.loggedIn ? (
        <div className="mb-4 space-y-2">
          <p className="text-xs leading-relaxed text-[#111111]/60">{t.profileInlineNote}</p>
          {!accountUi.hadPhoneOrEmailFromAccount ? (
            <p className="text-xs leading-relaxed text-[#111111]/55">{t.accountContactMissing}</p>
          ) : null}
        </div>
      ) : accountUi.ready && !accountUi.loggedIn ? (
        <p className="mb-4 text-xs leading-relaxed text-[#111111]/55">{t.guestNote}</p>
      ) : null}
      {showSellerKind ? (
        <div>
          <label className={labelClass}>{t.kind}</label>
          <select
            className={`${inputClass} mt-2`}
            value={state.seller_kind}
            onChange={(e) =>
              setState((s) => ({
                ...s,
                seller_kind: e.target.value as EnVentaFreeApplicationState["seller_kind"],
              }))
            }
          >
            <option value="">{lang === "es" ? "Selecciona…" : "Choose…"}</option>
            <option value="individual">{t.ind}</option>
            <option value="business">{t.biz}</option>
          </select>
        </div>
      ) : null}
      <div>
        <label className={labelClass}>{t.name}</label>
        <p className="mt-1 text-xs text-[#111111]/60">{t.nameH}</p>
        <input
          className={`${inputClass} mt-2`}
          value={state.displayName}
          onChange={(e) => setState((s) => ({ ...s, displayName: e.target.value }))}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>{t.phone}</label>
          <input
            className={`${inputClass} mt-2`}
            inputMode="tel"
            value={state.phone}
            onChange={(e) => setState((s) => ({ ...s, phone: e.target.value }))}
          />
        </div>
        <div>
          <label className={labelClass}>{t.email}</label>
          <input
            className={`${inputClass} mt-2`}
            type="email"
            autoComplete="email"
            value={state.email}
            onChange={(e) => setState((s) => ({ ...s, email: e.target.value }))}
          />
        </div>
      </div>
      <div>
        <label className={labelClass}>{t.wa}</label>
        <p className="mt-1 text-xs text-[#111111]/60">{t.waH}</p>
        <input
          className={`${inputClass} mt-2`}
          inputMode="tel"
          value={state.whatsapp}
          onChange={(e) => setState((s) => ({ ...s, whatsapp: e.target.value }))}
        />
      </div>
      <div>
        <label className={labelClass}>{t.pref}</label>
        <p className="mt-1 text-xs text-[#111111]/60">
          {lang === "es"
            ? "Elige cómo prefieres que te contacten primero."
            : "Choose how buyers should reach you first."}
        </p>
        <select
          className={`${inputClass} mt-2`}
          value={state.contactMethod}
          onChange={(e) =>
            setState((s) => ({
              ...s,
              contactMethod: e.target.value as EnVentaFreeApplicationState["contactMethod"],
            }))
          }
        >
          <option value="phone">{t.pPhone}</option>
          <option value="email">{t.pEmail}</option>
          <option value="both">{t.pBoth}</option>
          <option value="whatsapp">{t.pWa}</option>
        </select>
      </div>
    </SectionShell>
  );
}
