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

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export const metadata: Metadata = {
  ...PREVIEW_NOINDEX_METADATA,
  title: "Vista previa / Preview",
};

type PageProps = {
  params: Promise<{ category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function SafeRefusal() {
  return (
    <main style={styles.shell}>
      <div style={styles.card}>
        <p style={styles.badge}>Vista previa / Preview</p>
        <h1 style={styles.heading}>Este enlace ya no está disponible</h1>
        <p style={styles.sub}>This link is no longer available</p>
        <p style={styles.body}>
          El enlace de vista previa expiró o no es válido. Pídele a tu representante de Leonix que
          te envíe uno nuevo.
        </p>
        <p style={styles.bodyEn}>
          This preview link has expired or is not valid. Ask your Leonix representative to send you
          a new one.
        </p>
      </div>
    </main>
  );
}

export default async function ProspectPreviewPage({ params, searchParams }: PageProps) {
  const { category } = await params;
  const query = await searchParams;

  if (!isQuickSalesCategory(category)) return <SafeRefusal />;

  const rawToken = firstParam(query[PROSPECT_PREVIEW_TOKEN_PARAM]);
  const ctx = readProspectPreviewContext(rawToken, category);
  if (!ctx) return <SafeRefusal />;

  const payload = await readProspectPreviewPayload(ctx);
  if (!payload) return <SafeRefusal />;

  const descriptor = QUICK_SALES_CATEGORY_MAP[category];
  const expires = new Date(payload.expiresAtMs);
  const vm = buildProspectLeonixPreviewVm({
    category,
    title: payload.title,
    city: payload.city,
    state: payload.state,
    content: payload.content,
  });

  return (
    <main style={styles.shell}>
      <div style={styles.wrap}>
        <div style={styles.banner}>
          <strong style={styles.bannerStrong}>Vista previa / Preview</strong>
          <span style={styles.bannerText}>No publicado / Not published</span>
        </div>

        <p style={styles.badge}>
          {descriptor.labelEs} / {descriptor.labelEn}
        </p>
        <ProspectPreviewTranslateAd
          category={category}
          listingId={payload.listingId}
          title={payload.title}
          content={payload.content}
        >
          {({ title, description }) => (
            <ProspectCategoryPreviewShell
              vm={vm}
              title={title ?? vm.title}
              description={description}
              listingId={payload.listingId}
            />
          )}
        </ProspectPreviewTranslateAd>

        <p style={styles.body}>
          Así se verá tu anuncio. Todavía no está publicado y nadie más puede encontrarlo.
        </p>
        <p style={styles.bodyEn}>
          This is how your ad will look. It is not published yet and nobody else can find it.
        </p>

        <p style={styles.footnote}>
          Este enlace expira el {expires.toLocaleString("es-MX")} · This link expires{" "}
          {expires.toLocaleString("en-US")}
        </p>
        {payload.isPublic ? (
          <p style={styles.footnote}>
            Este anuncio ya está activo / This ad is already live ({payload.lifecycleState})
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
    padding: "16px",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
  },
  wrap: {
    width: "100%",
    maxWidth: 720,
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
