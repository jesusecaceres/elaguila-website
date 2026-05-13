"use client";

import { useCallback, useEffect, useId, useState, type MouseEvent, type ReactNode } from "react";

import {
  buildContactShareText,
  buildShareText,
  copyToClipboard,
  getCleanPhone,
  getFormattedPhone,
  getSafePublicAdUrl,
  normalizeExternalUrl,
} from "./ctaDataHelpers";
import {
  openExternalUrl,
  openFacebookShareLink,
  openMailto,
  openMaps,
  openSms,
  openSmsShareComposer,
  openTel,
  openTwitterShareLink,
  openWhatsApp,
  openWhatsAppWebShare,
} from "./ctaLaunchers";
import type { CtaActionCallback, CtaActionKind, CtaLang, CtaSheetIntent } from "./types";

const COPY = {
  es: {
    close: "Cerrar",
    cancel: "Cancelar",
    shareDevice: "Compartir con el dispositivo",
    sharePhone: "Compartir con el teléfono",
    sectionNative: "Este dispositivo",
    sectionCopy: "Copiar",
    sectionShareTo: "Compartir en",
    shareSms: "SMS / Mensajes",
    shareFacebook: "Facebook",
    shareEmail: "Correo",
    shareInstagram: "Instagram",
    shareXTwitter: "X (Twitter)",
    copyFullShareMessage: "Copiar mensaje completo",
    instagramCopiedHint: "Listo. Pega el texto en Instagram.",
    nativeShareFallback: "No hay menú nativo; enlace copiado.",
    messengerNote:
      "Facebook Messenger no tiene un enlace web fiable sin un id de app de Meta — usa “Compartir con el teléfono” para Messenger y otras apps.",
    ogHint:
      "Las vistas previas en redes usan este enlace; la calidad depende del título, la descripción y la imagen Open Graph de la página pública.",
    copyAdLink: "Copiar enlace del anuncio",
    copyAdText: "Copiar texto del anuncio",
    linkCopied: "Enlace del anuncio copiado.",
    copyFailed: "No se pudo copiar.",
    callNow: "Llamar ahora",
    copyNumber: "Copiar número",
    shareContact: "Compartir datos de contacto",
    noPhone: "No hay número de teléfono disponible.",
    openEmailApp: "Abrir app de correo",
    copyEmail: "Copiar correo",
    copyFullMessage: "Copiar mensaje completo",
    email: "Correo",
    subject: "Asunto",
    body: "Mensaje",
    noEmail: "No hay correo disponible.",
    emailDraftMissing: "No hay asunto ni mensaje para enviar.",
    recipientOptional: "Sin destinatario fijo: se abrirá tu app de correo con este borrador.",
    openGmail: "Abrir en Gmail",
    prefilledMessage: "Mensaje",
    sendWhatsApp: "Enviar por WhatsApp",
    sendSms: "Enviar por SMS",
    copyMessage: "Copiar mensaje",
    quoteMessage: "Mensaje de cotización",
    sendEmail: "Enviar por correo",
    copyQuote: "Copiar mensaje de cotización",
    noMessage: "No hay mensaje disponible.",
    destination: "Enlace",
    openLink: "Abrir enlace",
    copyLink: "Copiar enlace",
    shareLink: "Compartir enlace",
    noLink: "No hay enlace disponible.",
    mapsOpen: "Abrir mapas",
    copyAddress: "Copiar dirección",
    shareAddress: "Compartir dirección",
    noAddress: "No hay dirección disponible.",
    unavailable: "No disponible",
    leadFormHint: "Usa el formulario en esta página para enviar tu información.",
    contactFormHint: "Usa el formulario de contacto en esta página.",
    shareTextLabel: "Texto para compartir",
    openWhatsAppShare: "WhatsApp",
    openFacebookShare: "Abrir Facebook para compartir",
    openTwitterShare: "Abrir X para compartir",
    copyShareText: "Copiar texto para compartir",
  },
  en: {
    close: "Close",
    cancel: "Cancel",
    shareDevice: "Share using device",
    sharePhone: "Share with phone",
    sectionNative: "This device",
    sectionCopy: "Copy",
    sectionShareTo: "Share to",
    shareSms: "SMS / Messages",
    shareFacebook: "Facebook",
    shareEmail: "Email",
    shareInstagram: "Instagram",
    shareXTwitter: "X (Twitter)",
    copyFullShareMessage: "Copy full message",
    instagramCopiedHint: "Copied. Paste into Instagram.",
    nativeShareFallback: "Native share unavailable — link copied.",
    messengerNote:
      "Facebook Messenger has no reliable web share URL without a Meta app id — use “Share with phone” for Messenger and other apps.",
    ogHint:
      "Social previews use this link; quality depends on the public page’s Open Graph title, description, and image.",
    copyAdLink: "Copy ad link",
    copyAdText: "Copy ad text",
    linkCopied: "Ad link copied.",
    copyFailed: "Could not copy.",
    callNow: "Call now",
    copyNumber: "Copy number",
    shareContact: "Share contact info",
    noPhone: "No phone number available.",
    openEmailApp: "Open email app",
    copyEmail: "Copy email",
    copyFullMessage: "Copy full email message",
    email: "Email",
    subject: "Subject",
    body: "Message",
    noEmail: "No email available.",
    emailDraftMissing: "No subject or message to send.",
    recipientOptional: "No fixed recipient — your mail app opens with this draft.",
    openGmail: "Open in Gmail",
    prefilledMessage: "Message",
    sendWhatsApp: "Send via WhatsApp",
    sendSms: "Send via SMS",
    copyMessage: "Copy message",
    quoteMessage: "Quote message",
    sendEmail: "Send via email",
    copyQuote: "Copy quote message",
    noMessage: "No message available.",
    destination: "Link",
    openLink: "Open link",
    copyLink: "Copy link",
    shareLink: "Share link",
    noLink: "No link available.",
    mapsOpen: "Open maps",
    copyAddress: "Copy address",
    shareAddress: "Share address",
    noAddress: "No address available.",
    unavailable: "Unavailable",
    leadFormHint: "Use the form on this page to send your details.",
    contactFormHint: "Use the contact form on this page.",
    shareTextLabel: "Share text",
    openWhatsAppShare: "WhatsApp",
    openFacebookShare: "Open Facebook to share",
    openTwitterShare: "Open X to share",
    copyShareText: "Copy share text",
  },
} as const;

const BTN_PRIMARY =
  "inline-flex min-h-[44px] w-full items-center justify-center rounded-xl px-3 py-2.5 text-sm font-semibold transition border border-transparent bg-[#E67E22] text-[#FFFCF7] hover:brightness-105";
const BTN_SECONDARY =
  "inline-flex min-h-[44px] w-full items-center justify-center rounded-xl px-3 py-2.5 text-sm font-semibold transition border border-black/15 bg-white text-[#111111] hover:bg-[#F5F5F5]";
const MONO = "break-all font-mono text-sm text-[#111111]";

export type CtaActionSheetProps = {
  open: boolean;
  onClose: () => void;
  intent: CtaSheetIntent | null;
  lang?: CtaLang;
  onAction?: CtaActionCallback;
};

function fireAction(onAction: CtaActionCallback | undefined, kind: CtaActionKind, actionId: string, meta?: Record<string, unknown>) {
  onAction?.({ kind, actionId, meta });
}

export function CtaActionSheet({ open, onClose, intent, lang = "es", onAction }: CtaActionSheetProps) {
  const t = COPY[lang];
  const titleId = useId();
  const [status, setStatus] = useState<{ text: string; tone: "ok" | "err" } | null>(null);

  useEffect(() => {
    if (!open) setStatus(null);
  }, [open, intent]);

  const flash = useCallback((msg: string, tone: "ok" | "err" = "ok") => {
    setStatus({ text: msg, tone });
    window.setTimeout(() => setStatus(null), 2400);
  }, []);

  const onBackdrop = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  if (!open || !intent) return null;

  const kind = intent.kind;

  /** `emit()` records analytics only when the handler calls it (e.g. after successful copy/share, or when launching an external app). */
  const btnRow = (
    label: string,
    actionId: string,
    className: string,
    run: (emit: (meta?: Record<string, unknown>) => void) => void | Promise<void>,
    disabled?: boolean,
  ) => (
    <button
      key={actionId}
      type="button"
      disabled={disabled}
      className={className + (disabled ? " cursor-not-allowed opacity-45" : "")}
      onClick={() => {
        const emit = (meta?: Record<string, unknown>) => fireAction(onAction, kind, actionId, meta);
        void (async () => {
          try {
            await run(emit);
          } catch {
            flash(t.copyFailed, "err");
          }
        })();
      }}
    >
      {label}
    </button>
  );

  let heading = "";
  let body: ReactNode = null;

  if (intent.kind === "share_ad") {
    const url = getSafePublicAdUrl({ publicUrl: intent.publicUrl });
    const hasUrl = Boolean(url);
    const titleLine = trim(intent.shareTitle);
    const text =
      trim(intent.shareText) ||
      buildShareText({
        lang,
        publicUrl: url,
        adTitle: intent.shareTitle,
      });
    const waComposeBody =
      trim(intent.shareText) || (hasUrl ? (titleLine ? `${titleLine}\n${url}`.trim() : url) : titleLine);
    const smsBody = text || url;
    const subjectLine = titleLine || (lang === "en" ? "Leonix listing" : "Anuncio Leonix");
    const fullShareMessage = text ? `${text}\n\n— Leonix Media` : hasUrl ? `${url}\n\n— Leonix Media` : "";
    const canMailto = Boolean(text || url);
    const instagramBlock = (text || (titleLine && hasUrl ? `${titleLine}\n${url}`.trim() : url || "")).trim();

    heading = lang === "en" ? "Share ad" : "Compartir anuncio";
    body = (
      <div className="mt-3 flex max-h-[min(70vh,520px)] flex-col gap-2 overflow-y-auto pr-0.5">
        {/* OG cards: public listing page metadata. TODO: optional navigator.canShare({ files }) when product supplies share images. */}
        <p className="text-xs leading-snug text-[#5C564E]">{t.ogHint}</p>

        {titleLine ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#5C564E]">{lang === "en" ? "Title" : "Título"}</p>
            <p className="text-sm font-semibold text-[#111111]">{titleLine}</p>
          </div>
        ) : null}
        {hasUrl ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#5C564E]">{t.destination}</p>
            <p className={MONO}>{url}</p>
          </div>
        ) : null}
        {text ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#5C564E]">{t.shareTextLabel}</p>
            <p className="max-h-28 overflow-y-auto whitespace-pre-wrap text-sm text-[#111111]">{text}</p>
          </div>
        ) : null}

        <p className="pt-1 text-xs font-semibold uppercase tracking-wide text-[#5C564E]">{t.sectionNative}</p>
        {btnRow(t.sharePhone, "hub_native_share", BTN_PRIMARY, async (emit) => {
          if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
            try {
              await navigator.share(hasUrl ? { title: titleLine || subjectLine, text, url } : { title: titleLine || subjectLine, text });
              emit({ outcome: "native" });
              onClose();
              return;
            } catch (err: unknown) {
              const n = err && typeof err === "object" && "name" in err ? (err as { name: string }).name : "";
              if (n === "AbortError") return;
            }
          }
          if (hasUrl) {
            const ok = await copyToClipboard(url);
            flash(ok ? t.nativeShareFallback : t.copyFailed, ok ? "ok" : "err");
            if (ok) emit({ outcome: "fallback_copy" });
            return;
          }
          const ok = await copyToClipboard(text);
          flash(ok ? (lang === "en" ? "Text copied." : "Texto copiado.") : t.copyFailed, ok ? "ok" : "err");
          if (ok) emit({ outcome: "fallback_copy" });
        })}

        <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-[#5C564E]">{t.sectionCopy}</p>
        {btnRow(
          t.copyLink,
          "hub_copy_link",
          BTN_SECONDARY,
          async (emit) => {
            if (!hasUrl) return;
            const ok = await copyToClipboard(url);
            flash(ok ? t.linkCopied : t.copyFailed, ok ? "ok" : "err");
            if (ok) emit();
          },
          !hasUrl,
        )}
        {btnRow(t.copyShareText, "hub_copy_share_text", BTN_SECONDARY, async (emit) => {
          if (!text) return;
          const ok = await copyToClipboard(text);
          flash(ok ? (lang === "en" ? "Text copied." : "Texto copiado.") : t.copyFailed, ok ? "ok" : "err");
          if (ok) emit();
        }, !text)}
        {btnRow(t.copyFullShareMessage, "hub_copy_full_share", BTN_SECONDARY, async (emit) => {
          if (!fullShareMessage) return;
          const ok = await copyToClipboard(fullShareMessage);
          flash(ok ? (lang === "en" ? "Message copied." : "Mensaje copiado.") : t.copyFailed, ok ? "ok" : "err");
          if (ok) emit();
        }, !fullShareMessage)}

        <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-[#5C564E]">{t.sectionShareTo}</p>
        <p className="text-[11px] leading-snug text-[#7A7268]">{t.messengerNote}</p>
        {btnRow(
          t.openWhatsAppShare,
          "hub_whatsapp",
          BTN_SECONDARY,
          (emit) => {
            if (!waComposeBody) return;
            emit();
            openWhatsAppWebShare(waComposeBody);
          },
          !waComposeBody,
        )}
        {btnRow(
          t.shareSms,
          "hub_sms",
          BTN_SECONDARY,
          (emit) => {
            if (!smsBody) return;
            emit();
            openSmsShareComposer(smsBody);
          },
          !smsBody,
        )}
        {btnRow(
          t.shareFacebook,
          "hub_facebook",
          BTN_SECONDARY,
          (emit) => {
            if (!hasUrl) return;
            emit();
            openFacebookShareLink(url);
          },
          !hasUrl,
        )}
        {btnRow(
          t.shareXTwitter,
          "hub_twitter",
          BTN_SECONDARY,
          (emit) => {
            if (!hasUrl && !titleLine) return;
            emit();
            openTwitterShareLink(titleLine || (lang === "en" ? "Leonix" : "Leonix"), url);
          },
          !hasUrl && !titleLine,
        )}
        {btnRow(
          t.shareEmail,
          "hub_email",
          BTN_SECONDARY,
          (emit) => {
            if (!canMailto) return;
            const body = text || url || "";
            emit();
            openMailto("", subjectLine, body);
          },
          !canMailto,
        )}
        {btnRow(
          t.shareInstagram,
          "hub_instagram",
          BTN_SECONDARY,
          async (emit) => {
            if (!instagramBlock) return;
            const ok = await copyToClipboard(instagramBlock);
            flash(ok ? t.instagramCopiedHint : t.copyFailed, ok ? "ok" : "err");
            if (ok) emit();
          },
          !instagramBlock,
        )}
      </div>
    );
  } else if (intent.kind === "share_social") {
    const url = getSafePublicAdUrl({ publicUrl: intent.publicUrl });
    const hasUrl = Boolean(url);
    const titleLine = trim(intent.shareTitle);
    const shareLine =
      trim(intent.shareText) || (hasUrl && titleLine ? `${titleLine}\n${url}`.trim() : titleLine || url);
    const waBody = trim(intent.shareText) || (hasUrl ? `${titleLine} ${url}`.trim() : titleLine);
    const plat = intent.platform;
    const metaBase = { platform: plat };
    heading =
      plat === "whatsapp"
        ? lang === "en"
          ? "Share via WhatsApp"
          : "Compartir por WhatsApp"
        : plat === "facebook"
          ? lang === "en"
            ? "Share on Facebook"
            : "Compartir en Facebook"
          : lang === "en"
            ? "Share on X"
            : "Compartir en X";
    body = (
      <div className="mt-3 flex flex-col gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#5C564E]">{t.destination}</p>
          <p className={MONO}>{hasUrl ? url : "—"}</p>
        </div>
        {(plat === "whatsapp" || plat === "twitter") && shareLine ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#5C564E]">{t.shareTextLabel}</p>
            <p className="max-h-36 overflow-y-auto whitespace-pre-wrap text-sm text-[#111111]">{shareLine}</p>
          </div>
        ) : null}
        {plat === "whatsapp" ? (
          <>
            {btnRow(
              t.openWhatsAppShare,
              "social_open_whatsapp",
              BTN_PRIMARY,
              (emit) => {
                if (!waBody) return;
                emit(metaBase);
                openWhatsAppWebShare(waBody);
              },
              !waBody,
            )}
            {btnRow(
              t.copyAdLink,
              "social_copy_link",
              BTN_SECONDARY,
              async (emit) => {
                if (!hasUrl) return;
                const ok = await copyToClipboard(url);
                flash(ok ? t.linkCopied : t.copyFailed, ok ? "ok" : "err");
                if (ok) emit(metaBase);
              },
              !hasUrl,
            )}
            {btnRow(
              t.copyShareText,
              "social_copy_share_text",
              BTN_SECONDARY,
              async (emit) => {
                if (!waBody) return;
                const ok = await copyToClipboard(waBody);
                flash(ok ? (lang === "en" ? "Text copied." : "Texto copiado.") : t.copyFailed, ok ? "ok" : "err");
                if (ok) emit(metaBase);
              },
              !waBody,
            )}
          </>
        ) : null}
        {plat === "facebook" ? (
          <>
            {btnRow(
              t.openFacebookShare,
              "social_open_facebook",
              BTN_PRIMARY,
              (emit) => {
                if (!hasUrl) return;
                emit(metaBase);
                openFacebookShareLink(url);
              },
              !hasUrl,
            )}
            {btnRow(
              t.copyAdLink,
              "social_copy_link",
              BTN_SECONDARY,
              async (emit) => {
                if (!hasUrl) return;
                const ok = await copyToClipboard(url);
                flash(ok ? t.linkCopied : t.copyFailed, ok ? "ok" : "err");
                if (ok) emit(metaBase);
              },
              !hasUrl,
            )}
          </>
        ) : null}
        {plat === "twitter" ? (
          <>
            {btnRow(
              t.openTwitterShare,
              "social_open_twitter",
              BTN_PRIMARY,
              (emit) => {
                if (!hasUrl && !titleLine) return;
                emit(metaBase);
                openTwitterShareLink(titleLine, url);
              },
              !hasUrl && !titleLine,
            )}
            {btnRow(
              t.copyAdLink,
              "social_copy_link",
              BTN_SECONDARY,
              async (emit) => {
                if (!hasUrl) return;
                const ok = await copyToClipboard(url);
                flash(ok ? t.linkCopied : t.copyFailed, ok ? "ok" : "err");
                if (ok) emit(metaBase);
              },
              !hasUrl,
            )}
            {btnRow(
              t.copyShareText,
              "social_copy_share_text",
              BTN_SECONDARY,
              async (emit) => {
                const line = shareLine || `${titleLine}\n${url}`.trim();
                if (!line) return;
                const ok = await copyToClipboard(line);
                flash(ok ? (lang === "en" ? "Text copied." : "Texto copiado.") : t.copyFailed, ok ? "ok" : "err");
                if (ok) emit(metaBase);
              },
              !(shareLine || (titleLine && hasUrl)),
            )}
          </>
        ) : null}
      </div>
    );
  } else if (intent.kind === "copy_link") {
    const url = getSafePublicAdUrl({ publicUrl: intent.publicUrl });
    heading = lang === "en" ? "Copy link" : "Copiar enlace";
    body = (
      <div className="mt-3 flex flex-col gap-2">
        <p className={MONO}>{url || "—"}</p>
        {btnRow(
          t.copyAdLink,
          "copy_link",
          BTN_PRIMARY,
          async (emit) => {
            if (!url) return;
            const ok = await copyToClipboard(url);
            flash(ok ? t.linkCopied : t.copyFailed, ok ? "ok" : "err");
            if (ok) emit();
          },
          !url,
        )}
      </div>
    );
  } else if (intent.kind === "call") {
    const formatted = getFormattedPhone(intent.phone);
    const has = Boolean(trim(intent.phone));
    heading = lang === "en" ? "Call" : "Llamar";
    body = (
      <div className="mt-3 flex flex-col gap-2">
        {!has ? <p className="text-sm text-red-900">{t.noPhone}</p> : <p className={MONO}>{formatted}</p>}
        {btnRow(t.callNow, "call_now", BTN_PRIMARY, (emit) => {
          emit();
          openTel(intent.phone);
        }, !has)}
        {btnRow(t.copyNumber, "copy_number", BTN_SECONDARY, async (emit) => {
          const ok = await copyToClipboard(formatted || intent.phone);
          flash(ok ? (lang === "en" ? "Number copied." : "Número copiado.") : t.copyFailed, ok ? "ok" : "err");
          if (ok) emit();
        }, !has)}
        {btnRow(t.shareContact, "share_contact", BTN_SECONDARY, async (emit) => {
          const block = buildContactShareText(intent.contactShareExtras, {
            lang,
            phone: intent.phone,
            formattedPhone: formatted,
          });
          const ok = await copyToClipboard(block);
          flash(ok ? (lang === "en" ? "Contact info copied." : "Datos copiados.") : t.copyFailed, ok ? "ok" : "err");
          if (ok) emit();
        }, !buildContactShareText(intent.contactShareExtras, { lang, phone: intent.phone, formattedPhone: formatted }).trim())}
      </div>
    );
  } else if (intent.kind === "send_email") {
    const em = trim(intent.email);
    const sub = trim(intent.subject);
    const bod = trim(intent.body);
    const gmailHref = trim(intent.gmailComposeHref ?? "");
    const canCompose = Boolean(em || sub || bod);
    const hasAddr = Boolean(em);
    heading = t.email;
    body = (
      <div className="mt-3 flex flex-col gap-3">
        {!canCompose ? <p className="text-sm text-red-900">{t.emailDraftMissing}</p> : null}
        {canCompose && !hasAddr ? <p className="text-xs leading-snug text-[#5C564E]">{t.recipientOptional}</p> : null}
        {hasAddr ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#5C564E]">{t.email}</p>
            <p className={MONO}>{em}</p>
          </div>
        ) : null}
        {canCompose ? (
          <>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#5C564E]">{t.subject}</p>
              <p className="whitespace-pre-wrap text-sm text-[#111111]">{sub || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#5C564E]">{t.body}</p>
              <p className="max-h-40 overflow-y-auto whitespace-pre-wrap text-sm text-[#111111]">{bod || "—"}</p>
            </div>
          </>
        ) : null}
        <button
          type="button"
          disabled={!canCompose}
          className={BTN_PRIMARY + (!canCompose ? " cursor-not-allowed opacity-45" : "")}
          onClick={() => {
            fireAction(onAction, "send_email", "open_email");
            openMailto(em, sub, bod);
          }}
        >
          {t.openEmailApp}
        </button>
        <button
          type="button"
          disabled={!hasAddr}
          className={BTN_SECONDARY + (!hasAddr ? " cursor-not-allowed opacity-45" : "")}
          onClick={async () => {
            const ok = await copyToClipboard(em);
            flash(ok ? (lang === "en" ? "Email copied." : "Correo copiado.") : t.copyFailed, ok ? "ok" : "err");
            if (ok) fireAction(onAction, "send_email", "copy_email");
          }}
        >
          {t.copyEmail}
        </button>
        <button
          type="button"
          disabled={!canCompose}
          className={BTN_SECONDARY + (!canCompose ? " cursor-not-allowed opacity-45" : "")}
          onClick={async () => {
            const fullText = hasAddr
              ? [`To: ${em}`, sub ? `Subject: ${sub}` : "", "", bod].filter(Boolean).join("\n")
              : [sub ? `${lang === "en" ? "Subject" : "Asunto"}: ${sub}` : "", "", bod].filter(Boolean).join("\n");
            const ok = await copyToClipboard(fullText);
            flash(ok ? (lang === "en" ? "Message copied." : "Mensaje copiado.") : t.copyFailed, ok ? "ok" : "err");
            if (ok) fireAction(onAction, "send_email", "copy_full_email");
          }}
        >
          {t.copyFullMessage}
        </button>
        {gmailHref ? (
          <a
            href={gmailHref}
            target="_blank"
            rel="noopener noreferrer"
            className={`${BTN_SECONDARY} min-h-[44px]`}
            onClick={() => {
              fireAction(onAction, "send_email", "gmail_open");
            }}
          >
            {t.openGmail}
          </a>
        ) : null}
        <button
          type="button"
          disabled={!canCompose}
          className={BTN_SECONDARY + (!canCompose ? " cursor-not-allowed opacity-45" : "")}
          onClick={async () => {
            const block = buildContactShareText(intent.contactShareExtras, { lang, formattedPhone: undefined, phone: null });
            const lines = [block, hasAddr ? `Email: ${em}` : "", sub ? `${lang === "en" ? "Subject" : "Asunto"}: ${sub}` : "", bod].filter(Boolean).join("\n\n");
            const ok = await copyToClipboard(lines);
            flash(ok ? (lang === "en" ? "Copied." : "Copiado.") : t.copyFailed, ok ? "ok" : "err");
            if (ok) fireAction(onAction, "send_email", "share_contact_email");
          }}
        >
          {t.shareContact}
        </button>
      </div>
    );
  } else if (intent.kind === "send_message") {
    const msg = trim(intent.message);
    const phone = trim(intent.phone);
    const waDigits = trim(intent.whatsappDigits) || getCleanPhone(phone);
    const hasMsg = Boolean(msg);
    const hasPhone = waDigits.length >= 8;
    heading = lang === "en" ? "Message" : "Mensaje";
    body = (
      <div className="mt-3 flex flex-col gap-3">
        {!hasMsg && !hasPhone ? <p className="text-sm text-red-900">{t.noMessage}</p> : null}
        {!hasMsg && hasPhone ? (
          <p className="text-xs leading-snug text-[#5C564E]">{lang === "en" ? "No preset message (optional)." : "Sin mensaje previo (opcional)."}</p>
        ) : null}
        {hasMsg ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#5C564E]">{t.prefilledMessage}</p>
            <p className="max-h-36 overflow-y-auto whitespace-pre-wrap text-sm text-[#111111]">{msg}</p>
          </div>
        ) : null}
        {btnRow(t.sendWhatsApp, "msg_whatsapp", BTN_PRIMARY, (emit) => {
          emit();
          openWhatsApp(waDigits, msg);
        }, !hasPhone)}
        {btnRow(t.sendSms, "msg_sms", BTN_SECONDARY, (emit) => {
          emit();
          openSms(phone || waDigits, msg);
        }, !hasPhone)}
        {btnRow(t.copyMessage, "msg_copy", BTN_SECONDARY, async (emit) => {
          const ok = await copyToClipboard(msg);
          flash(ok ? (lang === "en" ? "Message copied." : "Mensaje copiado.") : t.copyFailed, ok ? "ok" : "err");
          if (ok) emit();
        }, !hasMsg)}
        {btnRow(t.copyNumber, "msg_copy_phone", BTN_SECONDARY, async (emit) => {
          const ok = await copyToClipboard(getFormattedPhone(phone || waDigits));
          flash(ok ? (lang === "en" ? "Number copied." : "Número copiado.") : t.copyFailed, ok ? "ok" : "err");
          if (ok) emit();
        }, !hasPhone)}
        {btnRow(t.shareContact, "msg_share_contact", BTN_SECONDARY, async (emit) => {
          const block = buildContactShareText(intent.contactShareExtras, {
            lang,
            phone: phone || waDigits,
            formattedPhone: getFormattedPhone(phone || waDigits),
          });
          const merged = [block, msg].filter(Boolean).join("\n\n");
          const ok = await copyToClipboard(merged);
          flash(ok ? (lang === "en" ? "Copied." : "Copiado.") : t.copyFailed, ok ? "ok" : "err");
          if (ok) emit();
        }, !buildContactShareText(intent.contactShareExtras, {
          lang,
          phone: phone || waDigits,
          formattedPhone: getFormattedPhone(phone || waDigits),
        }).trim() && !msg)}
      </div>
    );
  } else if (intent.kind === "get_quote") {
    const qm = trim(intent.quoteMessage);
    const phone = trim(intent.phone);
    const waDigits = trim(intent.whatsappDigits) || getCleanPhone(phone);
    const email = trim(intent.email);
    const hasMsg = Boolean(qm);
    const hasPhone = waDigits.replace(/\D/g, "").length >= 8;
    const hasEmail = Boolean(email);
    heading = lang === "en" ? "Request quote" : "Cotización";
    body = (
      <div className="mt-3 flex flex-col gap-3">
        {!hasMsg ? <p className="text-sm text-red-900">{t.noMessage}</p> : null}
        {hasMsg ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#5C564E]">{t.quoteMessage}</p>
            <p className="max-h-36 overflow-y-auto whitespace-pre-wrap text-sm text-[#111111]">{qm}</p>
          </div>
        ) : null}
        {btnRow(t.sendWhatsApp, "quote_whatsapp", BTN_PRIMARY, (emit) => {
          emit();
          openWhatsApp(waDigits, qm);
        }, !hasMsg || !hasPhone)}
        {btnRow(t.sendSms, "quote_sms", BTN_SECONDARY, (emit) => {
          emit();
          openSms(phone || waDigits, qm);
        }, !hasMsg || !hasPhone)}
        {btnRow(t.sendEmail, "quote_email", BTN_SECONDARY, (emit) => {
          emit();
          openMailto(email, lang === "en" ? "Quote request" : "Solicitud de cotización", qm);
        }, !hasMsg || !hasEmail)}
        {btnRow(t.copyQuote, "quote_copy", BTN_SECONDARY, async (emit) => {
          const ok = await copyToClipboard(qm);
          flash(ok ? (lang === "en" ? "Quote copied." : "Cotización copiada.") : t.copyFailed, ok ? "ok" : "err");
          if (ok) emit();
        }, !hasMsg)}
        {btnRow(t.shareContact, "quote_share_contact", BTN_SECONDARY, async (emit) => {
          const block = buildContactShareText(intent.contactShareExtras, {
            lang,
            phone: phone || waDigits,
            formattedPhone: getFormattedPhone(phone || waDigits),
          });
          const merged = [block, qm].filter(Boolean).join("\n\n");
          const ok = await copyToClipboard(merged);
          flash(ok ? (lang === "en" ? "Copied." : "Copiado.") : t.copyFailed, ok ? "ok" : "err");
          if (ok) emit();
        }, !buildContactShareText(intent.contactShareExtras, {
          lang,
          phone: phone || waDigits,
          formattedPhone: getFormattedPhone(phone || waDigits),
        }).trim() && !qm)}
      </div>
    );
  } else if (
    intent.kind === "website" ||
    intent.kind === "booking" ||
    intent.kind === "menu" ||
    intent.kind === "order" ||
    intent.kind === "social_link" ||
    intent.kind === "other"
  ) {
    const raw = trim(intent.url);
    const normalized = normalizeExternalUrl(raw);
    const has = Boolean(normalized);
    heading = trim(intent.headline) || (lang === "en" ? "External link" : "Enlace externo");
    body = (
      <div className="mt-3 flex flex-col gap-2">
        {!has ? <p className="text-sm text-red-900">{t.noLink}</p> : <p className={MONO}>{normalized}</p>}
        {btnRow(t.openLink, "ext_open", BTN_PRIMARY, (emit) => {
          emit();
          openExternalUrl(normalized!);
        }, !has)}
        {btnRow(t.copyLink, "ext_copy", BTN_SECONDARY, async (emit) => {
          const ok = await copyToClipboard(normalized!);
          flash(ok ? t.linkCopied : t.copyFailed, ok ? "ok" : "err");
          if (ok) emit();
        }, !has)}
        {btnRow(t.shareLink, "ext_share", BTN_SECONDARY, async (emit) => {
          const ok = await copyToClipboard(normalized!);
          flash(ok ? t.linkCopied : t.copyFailed, ok ? "ok" : "err");
          if (ok) emit();
        }, !has)}
      </div>
    );
  } else if (intent.kind === "directions") {
    const raw = trim(intent.addressOrUrl);
    const has = Boolean(raw);
    heading = lang === "en" ? "Directions" : "Direcciones";
    body = (
      <div className="mt-3 flex flex-col gap-2">
        {!has ? <p className="text-sm text-red-900">{t.noAddress}</p> : <p className={MONO}>{raw}</p>}
        {btnRow(t.mapsOpen, "maps_open", BTN_PRIMARY, (emit) => {
          emit();
          openMaps(raw);
        }, !has)}
        {btnRow(t.copyAddress, "maps_copy", BTN_SECONDARY, async (emit) => {
          const ok = await copyToClipboard(raw);
          flash(ok ? (lang === "en" ? "Copied." : "Copiado.") : t.copyFailed, ok ? "ok" : "err");
          if (ok) emit();
        }, !has)}
        {btnRow(t.shareAddress, "maps_share", BTN_SECONDARY, async (emit) => {
          const ok = await copyToClipboard(raw);
          flash(ok ? (lang === "en" ? "Copied." : "Copiado.") : t.copyFailed, ok ? "ok" : "err");
          if (ok) emit();
        }, !has)}
      </div>
    );
  } else if (intent.kind === "lead_form" || intent.kind === "contact_form") {
    heading = lang === "en" ? "Form" : "Formulario";
    const hint = trim(intent.helpText) || (intent.kind === "lead_form" ? t.leadFormHint : t.contactFormHint);
    body = <p className="mt-3 text-sm leading-relaxed text-[#333333]">{hint}</p>;
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onBackdrop}
    >
      <div className="w-full max-w-md rounded-2xl border border-black/10 bg-[#FCF9F2] p-5 text-[#333333] shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-lg font-bold">
            {heading}
          </h2>
          <button type="button" className="rounded-lg px-2 py-1 text-sm font-semibold hover:bg-black/5" onClick={onClose}>
            {t.close}
          </button>
        </div>
        {body}
        {status ? (
          <p
            className={`mt-3 text-sm font-semibold ${status.tone === "err" ? "text-red-800" : "text-emerald-900"}`}
            role="status"
          >
            {status.text}
          </p>
        ) : null}
        <div className="mt-4">
          <button type="button" className="text-sm font-semibold text-[#5C564E] underline-offset-2 hover:underline" onClick={onClose}>
            {t.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}

function trim(s: string | null | undefined): string {
  return String(s ?? "").trim();
}
