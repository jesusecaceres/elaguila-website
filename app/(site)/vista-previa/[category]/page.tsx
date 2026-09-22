/**
 * PROSPECT PREVIEW — the page a prospect opens from the link a staff member sent them.
 *
 * The visitor here has no account, no session and no permissions, and must never acquire any. The
 * ONLY thing they present is a signed, expiring, read-only token scoped to one category and one
 * canonical row. This page verifies it, reads a whitelist of safe public fields, and renders them
 * under an unmissable "not published" banner in both Spanish and English.
 *
 * Every failure — no token, malformed, tampered, expired, wrong category, custody revoked, signing
 * secret absent — produces the SAME safe refusal. A preview link that has stopped working must not
 * explain why: "this row exists but your token is for another category" is an oracle.
 *
 * It renders a compact, read-only summary rather than reusing a category's full public component.
 * Those components are built for a complete, published listing and reach for fields an unfinished
 * draft has not got; feeding one a partial draft is how a preview starts rendering placeholders,
 * throwing, or surfacing a field nobody meant to show a prospect. The whitelist in
 * `prospectPreviewReader.ts` is the contract, and this page shows exactly what it returns.
 *
 * NOTHING ON THIS PAGE MUTATES ANYTHING. There is no form, no action, no write, and no endpoint it
 * can reach with this token. Viewing a preview never publishes the ad — the lifecycle value it
 * shows is read back from the row untouched.
 */
import type { Metadata } from "next";
import { PREVIEW_NOINDEX_METADATA } from "@/app/lib/seo/previewRouteMetadata";
import { readProspectPreviewContext, PROSPECT_PREVIEW_TOKEN_PARAM } from "@/app/lib/auth/prospectPreviewSession";
import { readProspectPreviewPayload } from "@/app/lib/sales/prospectPreviewReader";
import { QUICK_SALES_CATEGORY_MAP, isQuickSalesCategory } from "@/app/lib/sales/quickSalesCategories";
import { ProspectPreviewTranslateAd } from "./ProspectPreviewTranslateAd";

export const dynamic = "force-dynamic";
/** A preview link is per-recipient and expiring. It is never stored by a cache, anywhere. */
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

  // The reader states which category it is serving. The token is checked against it, so a token
  // minted for one category can never open another category's preview.
  if (!isQuickSalesCategory(category)) return <SafeRefusal />;

  const rawToken = firstParam(query[PROSPECT_PREVIEW_TOKEN_PARAM]);
  const ctx = readProspectPreviewContext(rawToken, category);
  if (!ctx) return <SafeRefusal />;

  const payload = await readProspectPreviewPayload(ctx);
  if (!payload) return <SafeRefusal />;

  const descriptor = QUICK_SALES_CATEGORY_MAP[category];
  const expires = new Date(payload.expiresAtMs);
  const location = [payload.city, payload.state].filter(Boolean).join(", ");

  return (
    <main style={styles.shell}>
      <div style={styles.card}>
        {/* The banner is the point of the page, so it is first, unconditional and bilingual. */}
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
            <>
              <h1 style={styles.heading}>{title ?? "Borrador sin título / Untitled draft"}</h1>
              {location ? <p style={styles.sub}>{location}</p> : null}
              {description ? <p style={styles.body}>{description}</p> : null}
            </>
          )}
        </ProspectPreviewTranslateAd>

        <p style={styles.body}>
          Así se verá tu anuncio. Todavía no está publicado y nadie más puede encontrarlo.
        </p>
        <p style={styles.bodyEn}>
          This is how your ad will look. It is not published yet and nobody else can find it.
        </p>

        <PreviewContent content={payload.content} />

        <p style={styles.footnote}>
          Este enlace expira el {expires.toLocaleString("es-MX")} · This link expires{" "}
          {expires.toLocaleString("en-US")}
        </p>
        {/* Truthful even in the case nobody expects: if the row IS already live, say so rather
            than showing a "not published" claim the row contradicts. */}
        {payload.isPublic ? (
          <p style={styles.footnote}>
            Este anuncio ya está activo / This ad is already live ({payload.lifecycleState})
          </p>
        ) : null}
      </div>
    </main>
  );
}

/** Renders only simple scalar fields from the whitelisted content blob — never raw HTML. */
function PreviewContent({ content }: { content: Record<string, unknown> | null }) {
  if (!content) return null;
  const rows: { key: string; value: string }[] = [];
  for (const [key, value] of Object.entries(content)) {
    if (rows.length >= 14) break;
    if (typeof value === "string" && value.trim()) {
      rows.push({ key, value: value.trim().slice(0, 400) });
    } else if (typeof value === "number" || typeof value === "boolean") {
      rows.push({ key, value: String(value) });
    }
  }
  if (!rows.length) return null;
  return (
    <dl style={styles.list}>
      {rows.map((row) => (
        <div key={row.key} style={styles.listRow}>
          <dt style={styles.listKey}>{row.key}</dt>
          <dd style={styles.listValue}>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/* Mobile-first, self-contained styles: a prospect opens this on a phone, usually on data, often
   while the staff member is standing next to them. No external stylesheet to wait for. */
const styles: Record<string, React.CSSProperties> = {
  shell: {
    minHeight: "100vh",
    background: "#0b1220",
    padding: "16px",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
  },
  card: {
    width: "100%",
    maxWidth: 560,
    background: "#ffffff",
    borderRadius: 16,
    padding: "20px 16px",
    boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
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
  list: { margin: "12px 0 0", padding: 0 },
  listRow: { display: "flex", gap: 8, padding: "6px 0", borderTop: "1px solid #e2e8f0" },
  listKey: { flex: "0 0 40%", fontSize: 12, color: "#64748b", margin: 0, wordBreak: "break-word" },
  listValue: { flex: 1, fontSize: 14, color: "#0f172a", margin: 0, wordBreak: "break-word" },
  footnote: { fontSize: 12, color: "#64748b", marginTop: 16 },
};
