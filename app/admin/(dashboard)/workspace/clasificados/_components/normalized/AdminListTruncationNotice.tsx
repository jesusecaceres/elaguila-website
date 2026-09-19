import type { AdminLang } from "@/app/admin/_lib/adminI18nCookie";
import { describeAdminListTruncation, type AdminListTruncationInput } from "@/app/admin/_lib/adminFilterTruth";

export type AdminListTruncationNoticeProps = AdminListTruncationInput & {
  lang?: AdminLang;
  className?: string;
  /** Optional test id prefix (defaults to `admin-list-truncation`). */
  testId?: string;
};

/**
 * LIST TRUTH NOTICE — rendered on every Admin category list. Says so when the list is exactly as long as
 * the requested limit, when a bounded application-level scan hit its cap (an empty / short list is then NOT
 * proof that nothing else matches), or when a search source could not be read. Renders nothing otherwise.
 * Server-component friendly (no hooks).
 */
export function AdminListTruncationNotice({ lang = "en", className, testId = "admin-list-truncation", ...input }: AdminListTruncationNoticeProps) {
  const notes = describeAdminListTruncation(lang, input);
  if (notes.length === 0) return null;
  return (
    <div className={`space-y-1 ${className ?? ""}`} data-testid={testId}>
      {notes.map((n) => (
        <p
          key={n.kind}
          role="status"
          data-testid={`${testId}-${n.kind}`}
          className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-snug text-amber-950"
        >
          {n.text}
        </p>
      ))}
    </div>
  );
}
