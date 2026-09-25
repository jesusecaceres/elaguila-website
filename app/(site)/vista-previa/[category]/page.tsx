/**
 * PROSPECT PREVIEW — the page a prospect opens from the link a staff member sent them.
 *
 * The visitor here has no account, no session and no permissions, and must never acquire any. The
 * ONLY thing they present is a signed, expiring, read-only token scoped to one category and one
 * canonical row. This page verifies it, reads a whitelist of safe public fields, and renders a
 * Leonix-style category preview (not a JSON dump) under an unmissable "not published" banner.
 *
 * Every failure — no token, malformed, tampered, expired, wrong category, custody revoked, signing
 * secret absent — produces the SAME safe refusal.
 *
 * OWNER LOCK — Quick uses the SAME real presentation as Full/public. For the four business
 * families (servicios, restaurantes, autos dealer, bienes-raices negocio) the preview renders the
 * REAL public category components from the stored row (see ProspectRealCategoryPreview) inside a
 * full-width frame — no 720px wrap, no generic clone, no second Translate Ad. Only rentas, empleos,
 * autos-privado and comida-local (out of scope) keep the generic shell below.
 *
 * NOTHING ON THIS PAGE MUTATES ANYTHING.
 */
import type { Metadata } from "next";
import { PREVIEW_NOINDEX_METADATA } from "@/app/lib/seo/previewRouteMetadata";
import { readProspectPreviewContext, PROSPECT_PREVIEW_TOKEN_PARAM } from "@/app/lib/auth/prospectPreviewSession";
import { readProspectPreviewPayload } from "@/app/lib/sales/prospectPreviewReader";
import { QUICK_SALES_CATEGORY_MAP, isQuickSalesCategory } from "@/app/lib/sales/quickSalesCategories";
import { buildProspectLeonixPreviewVm } from "@/app/lib/sales/prospectPreviewDisplay";
import { ProspectPreviewTranslateAd } from "./ProspectPreviewTranslateAd";
import { ProspectCategoryPreviewShell } from "./ProspectCategoryPreviewShell";
import { isProspectRealComponentCategory } from "@/app/lib/sales/prospectPreviewRealCategories";
import { renderProspectRealCategoryPreview } from "./ProspectRealCategoryPreview";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export const metadata: Metadata = {
  ...PREVIEW_NOINDEX_METADATA,
  title: "Vista previa / Preview",
};

type PreviewLang = "es" | "en";

type PageProps = {
  params: Promise<{ category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function previewLang(value: string | string[] | undefined): PreviewLang {
  return firstParam(value)?.trim().toLowerCase() === "en" ? "en" : "es";
}

function SafeRefusal({ lang }: { lang: PreviewLang }) {
  const copy =
    lang === "en"
      ? {
          badge: "Preview",
          heading: "This link is no longer available",
          body: "This preview link has expired or is not valid. Ask your Leonix representative to send you a new one.",
        }
      : {
          badge: "Vista previa",
          heading: "Este enlace ya no está disponible",
          body: "El enlace de vista previa expiró o no es válido. Pídele a tu representante de Leonix que te envíe uno nuevo.",
        };

  return (
    <main style={styles.shell} data-prospect-preview-clears-navbar="1">
      <div style={styles.card}>
        <p style={styles.badge}>{copy.badge}</p>
        <h1 style={styles.heading} data-prospect-preview-heading="1">
          {copy.heading}
        </h1>
        <p style={styles.body}>{copy.body}</p>
      </div>
    </main>
  );
}

export default async function ProspectPreviewPage({ params, searchParams }: PageProps) {
  const { category } = await params;
  const query = await searchParams;
  const lang = previewLang(query.lang);

  if (!isQuickSalesCategory(category)) return <SafeRefusal lang={lang} />;

  const rawToken = firstParam(query[PROSPECT_PREVIEW_TOKEN_PARAM]);
  const ctx = readProspectPreviewContext(rawToken, category);
  if (!ctx) return <SafeRefusal lang={lang} />;

  const payload = await readProspectPreviewPayload(ctx);
  if (!payload) return <SafeRefusal lang={lang} />;

  const descriptor = QUICK_SALES_CATEGORY_MAP[category];
  const expires = new Date(payload.expiresAtMs);
  const vm = buildProspectLeonixPreviewVm({
    category,
    title: payload.title,
    city: payload.city,
    state: payload.state,
    content: payload.content,
  });
  const categoryLabel = lang === "en" ? descriptor.labelEn : descriptor.labelEs;
  const expiresLabel =
    lang === "en"
      ? `This link expires ${expires.toLocaleString("en-US")}`
      : `Este enlace expira el ${expires.toLocaleString("es-MX")}`;

  // The four business families: the REAL public components, full width, under the same banner.
  // If the stored content cannot produce a real render (e.g. no business name yet) we fall through
  // to the generic shell below instead of showing a blank page.
  if (isProspectRealComponentCategory(category)) {
    const real = await renderProspectRealCategoryPreview({ category, payload, lang });
    if (real) {
      return (
        <main style={styles.realShell} data-prospect-preview-clears-navbar="1" data-prospect-preview-real-components="1">
          <div style={styles.realNotice}>
            <div style={styles.banner}>
              <strong style={styles.bannerStrong}>{lang === "en" ? "Preview" : "Vista previa"}</strong>
              <span style={styles.bannerText}>{lang === "en" ? "Not published" : "No publicado"}</span>
            </div>
            <p style={styles.badge}>{categoryLabel}</p>
          </div>

          {real}

          <div style={styles.realNotice}>
            <p style={styles.body}>
              {lang === "en"
                ? "This is how your ad will look. It is not published yet and nobody else can find it."
                : "Así se verá tu anuncio. Todavía no está publicado y nadie más puede encontrarlo."}
            </p>
            <p style={styles.footnote}>{expiresLabel}</p>
            {payload.isPublic ? (
              <p style={styles.footnote}>
                {lang === "en"
                  ? `This ad is already live (${payload.lifecycleState})`
                  : `Este anuncio ya está activo (${payload.lifecycleState})`}
              </p>
            ) : null}
          </div>
        </main>
      );
    }
  }

  return (
    <main style={styles.shell} data-prospect-preview-clears-navbar="1">
      <div style={styles.wrap}>
        <div style={styles.banner}>
          <strong style={styles.bannerStrong}>{lang === "en" ? "Preview" : "Vista previa"}</strong>
          <span style={styles.bannerText}>{lang === "en" ? "Not published" : "No publicado"}</span>
        </div>

        <p style={styles.badge}>{categoryLabel}</p>
        <ProspectPreviewTranslateAd
          category={category}
          listingId={payload.listingId}
          title={payload.title}
          content={payload.content}
          siteLocale={lang}
        >
          {({ title, description }) => (
            <ProspectCategoryPreviewShell
              vm={vm}
              title={title ?? vm.title}
              description={description}
              listingId={payload.listingId}
              lang={lang}
            />
          )}
        </ProspectPreviewTranslateAd>

        <p style={styles.body}>
          {lang === "en"
            ? "This is how your ad will look. It is not published yet and nobody else can find it."
            : "Así se verá tu anuncio. Todavía no está publicado y nadie más puede encontrarlo."}
        </p>

        <p style={styles.footnote}>{expiresLabel}</p>
        {payload.isPublic ? (
          <p style={styles.footnote}>
            {lang === "en"
              ? `This ad is already live (${payload.lifecycleState})`
              : `Este anuncio ya está activo (${payload.lifecycleState})`}
          </p>
        ) : null}
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    minHeight: "100vh",
    background: "#F4EEE4",
    // Navbar is `fixed top-0` (~4.5–5rem). Clear it so headings never sit under chrome.
    paddingTop: "calc(5.25rem + env(safe-area-inset-top, 0px))",
    paddingRight: 16,
    paddingBottom: 16,
    paddingLeft: 16,
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
  },
  wrap: {
    width: "100%",
    maxWidth: 720,
  },
  // Real-component frame: full width under the fixed navbar. It sets NO width on the real component;
  // `realNotice` only bounds the banner / footnotes, never the component itself.
  realShell: {
    minHeight: "100vh",
    background: "#F4EEE4",
    paddingTop: "calc(5.25rem + env(safe-area-inset-top, 0px))",
    paddingBottom: 16,
  },
  realNotice: {
    width: "100%",
    maxWidth: 960,
    margin: "0 auto",
    padding: "0 16px",
  },
  card: {
    width: "100%",
    maxWidth: 720,
    background: "#FFFCF7",
    border: "1px solid #E8D9C4",
    borderRadius: 22,
    padding: "20px 18px",
  },
  banner: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    background: "#fef3c7",
    border: "1px solid #f59e0b",
    borderRadius: 10,
    padding: "10px 12px",
    marginBottom: 16,
  },
  bannerStrong: { fontSize: 14, fontWeight: 700, color: "#92400e" },
  bannerText: { fontSize: 13, color: "#92400e" },
  badge: { fontSize: 12, letterSpacing: 0.4, textTransform: "uppercase", color: "#64748b", margin: 0 },
  heading: { fontSize: 24, lineHeight: 1.2, margin: "6px 0 2px", color: "#0f172a" },
  sub: { fontSize: 14, color: "#475569", margin: "0 0 12px" },
  body: { fontSize: 15, color: "#0f172a", margin: "12px 0 4px" },
  bodyEn: { fontSize: 14, color: "#475569", margin: "0 0 12px" },
  footnote: { fontSize: 12, color: "#64748b", marginTop: 16 },
};
