"use client";

/**
 * Shared pdf.js document cache for the Ofertas Locales public Preview page.
 *
 * Before this cache existed, every product-crop card, the inline flyer
 * preview, and the full-screen flyer viewer modal each called
 * `pdfjs.getDocument({ url })` independently — for a flyer with 127 approved
 * items that meant well over a hundred full re-downloads of the SAME PDF on
 * a single page load (confirmed live: 55+ requests, 564+ MB transferred,
 * eventual 403s once the signed URL was hammered past its rate limit).
 *
 * Every caller below now shares ONE in-flight/loaded document per URL,
 * reference-counted so the document is only destroyed once nothing on the
 * page still needs it (with a short grace period so a normal re-render —
 * search, filter, load more — never tears down and reloads the same PDF).
 */

type PdfjsModule = Awaited<ReturnType<typeof loadPdfjsModule>>;
type PdfDocument = Awaited<ReturnType<PdfjsModule["getDocument"]>["promise"]>;
type PdfPage = Awaited<ReturnType<PdfDocument["getPage"]>>;

type CacheEntry = {
  promise: Promise<PdfDocument>;
  refCount: number;
  destroyTimer: ReturnType<typeof setTimeout> | null;
  pages: Map<number, Promise<PdfPage>>;
};

const DESTROY_GRACE_MS = 15000;
const documentCache = new Map<string, CacheEntry>();

async function loadPdfjsModule() {
  return import("pdfjs-dist/legacy/build/pdf.mjs");
}

async function loadPdfDocument(url: string): Promise<PdfDocument> {
  const pdfjs = await loadPdfjsModule();
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.mjs`;
  }
  return pdfjs.getDocument({ url, withCredentials: false }).promise;
}

/**
 * Acquire a shared handle to the PDF document at `url`. Every acquisition
 * MUST be paired with exactly one `releaseSharedPdfDocument(url)` call
 * (typically in a `useEffect` cleanup) once the caller no longer needs it.
 */
export function acquireSharedPdfDocument(url: string): Promise<PdfDocument> {
  let entry = documentCache.get(url);
  if (!entry) {
    entry = {
      promise: loadPdfDocument(url),
      refCount: 0,
      destroyTimer: null,
      pages: new Map(),
    };
    documentCache.set(url, entry);
    entry.promise.catch(() => {
      // A failed load must not poison the cache for a later retry.
      documentCache.delete(url);
    });
  }
  entry.refCount += 1;
  if (entry.destroyTimer) {
    clearTimeout(entry.destroyTimer);
    entry.destroyTimer = null;
  }
  return entry.promise;
}

/** Release a handle previously returned by `acquireSharedPdfDocument`. */
export function releaseSharedPdfDocument(url: string): void {
  const entry = documentCache.get(url);
  if (!entry) return;
  entry.refCount = Math.max(0, entry.refCount - 1);
  if (entry.refCount > 0) return;

  entry.destroyTimer = setTimeout(() => {
    const current = documentCache.get(url);
    if (!current || current.refCount > 0) return;
    documentCache.delete(url);
    void current.promise
      .then((doc) => {
        // pdf.js's PDFDocumentProxy.destroy() exists at runtime but is
        // missing from this version's type declarations.
        const destroyable = doc as unknown as { destroy?: () => void | Promise<void> };
        return destroyable.destroy?.();
      })
      .catch(() => {
        /* already gone / never loaded — nothing to clean up */
      });
  }, DESTROY_GRACE_MS);
}

export type SharedPdfPage = {
  page: PdfPage;
  /** Total page count of the parent document — PDFPageProxy has no such field of its own. */
  numPages: number;
};

/**
 * Acquire a shared document AND a shared page within it — every crop card
 * on the same page of the same flyer reuses one `getPage()` call too, not
 * just the document. Pairs with `releaseSharedPdfDocument(url)`.
 */
export async function acquireSharedPdfPage(url: string, pageNumber: number): Promise<SharedPdfPage> {
  const doc = await acquireSharedPdfDocument(url);
  const liveEntry = documentCache.get(url);
  const numPages = doc.numPages || 1;
  const safePage = Math.min(Math.max(1, Math.floor(pageNumber) || 1), numPages);

  if (!liveEntry) {
    // Extremely unlikely (entry was evicted between acquire and lookup) —
    // fall back to a direct, uncached getPage rather than throwing.
    return { page: await doc.getPage(safePage), numPages };
  }

  let pagePromise = liveEntry.pages.get(safePage);
  if (!pagePromise) {
    pagePromise = doc.getPage(safePage);
    liveEntry.pages.set(safePage, pagePromise);
    pagePromise.catch(() => liveEntry.pages.delete(safePage));
  }
  return { page: await pagePromise, numPages };
}
