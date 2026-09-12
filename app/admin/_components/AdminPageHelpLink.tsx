"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { getAdminGuideEntryForRoute } from "../_lib/adminGuideRegistry";

/**
 * Shared "Help with this page" affordance (Master Operating Book V2 §0C). Wired ONCE into the
 * dashboard shell (`app/admin/(dashboard)/layout.tsx`) rather than patched into every page —
 * looks up the current route in the single Admin Guide registry and links straight to that
 * entry's detail. Renders nothing (fails honestly, not incorrectly) when no entry covers the
 * current route yet, per the Guide's own "never fabricate" rule.
 */
export function AdminPageHelpLink() {
  const pathname = usePathname() ?? "";
  const entry = getAdminGuideEntryForRoute(pathname);
  if (!entry) return null;

  return (
    <Link
      href={`/admin/guide/${entry.id}`}
      className="fixed bottom-4 right-4 z-40 flex min-h-[40px] items-center gap-1.5 rounded-full border border-[#C9B46A]/60 bg-[#FFFCF7] px-3.5 py-2 text-xs font-bold text-[#5C4E2E] shadow-md hover:bg-[#F3EAD8] sm:bottom-6 sm:right-6"
      title={`Help with this page: ${entry.title}`}
    >
      <span aria-hidden="true">?</span>
      <span className="hidden sm:inline">Help with this page</span>
    </Link>
  );
}
