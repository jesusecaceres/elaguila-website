"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import {
  buildPathWithLang,
  isPublicLangPersistenceExcludedPath,
  readClientStoredLangPreference,
  readUrlLang,
  resolveRouteLang,
  writePersistedLangPreference,
} from "@/app/lib/language";

function LanguagePreferenceSyncInner() {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const router = useRouter();
  const restoreAttemptedRef = useRef<string | null>(null);

  useEffect(() => {
    if (isPublicLangPersistenceExcludedPath(pathname)) return;

    const rawLangParam = searchParams?.get("lang");
    const urlLang = readUrlLang(rawLangParam);
    if (rawLangParam && !urlLang) {
      const fallback = resolveRouteLang(null);
      writePersistedLangPreference(fallback);
      document.documentElement.lang = fallback;
      return;
    }
    if (urlLang) {
      writePersistedLangPreference(urlLang);
      document.documentElement.lang = urlLang;
      return;
    }

    const stored = readClientStoredLangPreference();
    if (!stored) {
      document.documentElement.lang = resolveRouteLang(null);
      return;
    }

    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const nextPath = buildPathWithLang(
      pathname,
      new URLSearchParams(searchParams?.toString() ?? ""),
      stored,
      hash,
    );
    const currentPath =
      typeof window !== "undefined"
        ? `${pathname}${window.location.search}${hash}`
        : null;

    if (currentPath === nextPath) {
      document.documentElement.lang = stored;
      return;
    }

    const attemptKey = `${pathname}?${searchParams?.toString() ?? ""}->${stored}`;
    if (restoreAttemptedRef.current === attemptKey) return;
    restoreAttemptedRef.current = attemptKey;

    router.replace(nextPath, { scroll: false });
    document.documentElement.lang = stored;
  }, [pathname, router, searchParams]);

  return null;
}

export function LanguagePreferenceSync() {
  return (
    <Suspense fallback={null}>
      <LanguagePreferenceSyncInner />
    </Suspense>
  );
}
