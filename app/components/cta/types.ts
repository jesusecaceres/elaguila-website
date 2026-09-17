/** Shared Leonix CTA action taxonomy (Gate 2A foundation). */

export type CtaActionKind =
  | "share_ad"
  | "share_social"
  | "copy_link"
  | "call"
  | "send_message"
  | "get_quote"
  | "send_email"
  | "website"
  | "booking"
  | "menu"
  | "order"
  | "directions"
  | "social_link"
  | "lead_form"
  | "contact_form"
  | "other";

export type CtaLang = "es" | "en";

/** Future analytics / tracking hook — no-op unless callers wire it. */
export type CtaActionCallback = (info: { kind: CtaActionKind; actionId: string; meta?: Record<string, unknown> }) => void;

/** Canonical ad label inputs for titles, share text, and “Otro servicio” safety. */
export type CtaAdLabelInput = {
  customServiceText?: string | null;
  serviceName?: string | null;
  categoryName?: string | null;
  /** When `"otro"` / `"other"`, custom service text is preferred for public labels. */
  categorySlug?: string | null;
  serviceSlug?: string | null;
  adTitle?: string | null;
  businessName?: string | null;
};

export type CtaShareBuildInput = CtaAdLabelInput & {
  lang?: CtaLang;
  /** Must be the public/canonical listing URL when known. */
  publicUrl?: string | null;
};

export type CtaMessageBuildInput = CtaAdLabelInput & {
  lang?: CtaLang;
  /** Extra line(s) appended after intro. */
  detail?: string | null;
};

export type CtaQuoteBuildInput = CtaMessageBuildInput;

export type CtaEmailBuildInput = CtaAdLabelInput & {
  lang?: CtaLang;
};

/** Discriminated intent passed to `CtaActionSheet`. */
export type CtaSheetIntent =
  | {
      /** Share hub: native share first, then copy rows, then SMS/WhatsApp/Facebook/X/email/Instagram-safe copy. */
      kind: "share_ad";
      publicUrl: string;
      shareTitle: string;
      shareText?: string | null;
    }
  | {
      /** Confirmed share to WhatsApp / Facebook / X — no `window.open` until the user taps a launch row. */
      kind: "share_social";
      platform: "whatsapp" | "facebook" | "twitter";
      publicUrl: string;
      shareTitle?: string | null;
      /** Full suggested message (e.g. title + URL) for WhatsApp / X; omitted for Facebook-only flows. */
      shareText?: string | null;
    }
  | { kind: "copy_link"; publicUrl: string }
  | { kind: "call"; phone: string; contactShareExtras?: CtaContactShareExtras | null }
  | {
      kind: "send_message";
      message: string;
      phone?: string | null;
      /** Digits for wa.me (country code included, no +). */
      whatsappDigits?: string | null;
      contactShareExtras?: CtaContactShareExtras | null;
    }
  | {
      kind: "get_quote";
      quoteMessage: string;
      phone?: string | null;
      whatsappDigits?: string | null;
      email?: string | null;
      contactShareExtras?: CtaContactShareExtras | null;
    }
  | {
      kind: "send_email";
      /** When empty, mailto opens with subject/body only (share-by-email style). */
      email?: string | null;
      subject: string;
      body: string;
      contactShareExtras?: CtaContactShareExtras | null;
      /** When set, show “Open in Gmail” (Leonix share / contact parity). */
      gmailComposeHref?: string | null;
      /**
       * Owner doctrine (2026-09-17): the approved Autos/Servicios contact sheet no longer
       * exposes an "Abrir app de correo"/"Open email app" mailto launcher — Copy email/Copy
       * full message/Share are the reliable, cross-app path, since mailto's actual
       * app-opening behavior depends on an OS-registered handler Leonix cannot guarantee.
       * Defaults to `true` so every OTHER category (Restaurantes, Rentas, Bienes Raíces,
       * Empleos, En Venta, Viajes, Comida Local, Recursos) keeps its current behavior
       * unchanged unless it explicitly opts out — this never deletes the underlying
       * `openMailto` infrastructure, only whether this one sheet exposes it.
       */
      showOpenEmailApp?: boolean;
    }
  | {
      kind: "website" | "booking" | "menu" | "order" | "social_link" | "other";
      url: string;
      /** Optional screen-reader / heading hint */
      headline?: string | null;
    }
  | {
      kind: "directions";
      addressOrUrl: string;
      /** When true, `addressOrUrl` is already a maps https URL. */
      isMapsUrl?: boolean;
      contactShareExtras?: CtaContactShareExtras | null;
    }
  | { kind: "lead_form" | "contact_form"; helpText?: string | null };

export type CtaContactShareExtras = {
  email?: string | null;
  websiteUrl?: string | null;
  publicUrl?: string | null;
};
