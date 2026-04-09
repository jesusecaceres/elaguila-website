"use client";

import { useEffect, useRef, useState } from "react";

import { viajesDraftMediaGetBlob } from "./viajesDraftMediaIdb";

/**
 * Resolves a draft hero blob id to an object URL; revokes on change/unmount.
 */
export function useViajesLocalHeroObjectUrl(scope: "privado" | "negocios", blobId: string | null) {
  const [url, setUrl] = useState<string | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!blobId) {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
      setUrl(null);
      return;
    }

    let cancelled = false;
    void viajesDraftMediaGetBlob(scope, blobId).then((blob) => {
      if (cancelled || !blob) return;
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      const u = URL.createObjectURL(blob);
      urlRef.current = u;
      setUrl(u);
    });

    return () => {
      cancelled = true;
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
      setUrl(null);
    };
  }, [scope, blobId]);

  return url;
}
