import type { AppProps } from "next/app";

/**
 * Minimal Pages Router root — the app is App Router–first; `pages/` only hosts legacy API routes.
 * Next.js expects `_app` when the Pages manifest is generated during `next build`.
 */
export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
