"use client";

import type { EnVentaContactAction } from "../utils/enVentaContactActions";

type Props = {
  actions: EnVentaContactAction[];
  lang: "es" | "en";
  onAction: (action: EnVentaContactAction) => void;
  layout?: "stack" | "wrap";
};

function IconWhatsApp({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path
        fill="currentColor"
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
      />
    </svg>
  );
}

function IconPhone({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
    </svg>
  );
}

function IconMessage({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}

function IconEmail({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <path d="M22 6l-10 7L2 6" />
    </svg>
  );
}

function actionIcon(id: EnVentaContactAction["id"]) {
  if (id === "whatsapp") return IconWhatsApp;
  if (id === "call") return IconPhone;
  if (id === "sms") return IconMessage;
  return IconEmail;
}

function actionClass(id: EnVentaContactAction["id"]): string {
  const base =
    "inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A84A]/60";
  if (id === "whatsapp") {
    return `${base} border-[#128C7E]/40 bg-[#25D366]/12 text-[#0b3d32] hover:bg-[#25D366]/22`;
  }
  if (id === "call") {
    return `${base} border-[#7A1E2C]/25 bg-[#7A1E2C] text-[#FFFCF7] hover:bg-[#631824]`;
  }
  return `${base} border-[#C9B46A]/45 bg-[#FFFCF7] text-[#1E1810] hover:border-[#C9A84A]/65 hover:bg-white`;
}

function smsLabel(lang: "es" | "en"): string {
  return lang === "es" ? "Mensaje" : "Message";
}

export function EnVentaContactButtons({ actions, lang, onAction, layout = "stack" }: Props) {
  if (actions.length === 0) {
    return (
      <p className="text-sm leading-relaxed text-[#5C5346]/90">
        {lang === "es"
          ? "El vendedor no indicó un método de contacto público."
          : "The seller did not provide a public contact method."}
      </p>
    );
  }

  const containerClass = layout === "stack" ? "flex flex-col gap-2" : "flex flex-wrap gap-2";

  return (
    <div className={containerClass}>
      {actions.map((action) => {
        const Icon = actionIcon(action.id);
        const label = action.id === "sms" ? smsLabel(lang) : action.label.replace(/\s*\(recomendado\)|\s*\(recommended\)/i, "");
        return (
          <button
            key={action.id}
            type="button"
            onClick={() => onAction(action)}
            className={layout === "wrap" ? actionClass(action.id).replace("w-full", "") : actionClass(action.id)}
          >
            <Icon className="shrink-0" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
