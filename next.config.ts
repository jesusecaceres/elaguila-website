import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Gate BCO-3R-B.5/B.6 — the Next.js dev-tools indicator (the floating circular "N" control) is
   * development-only chrome, never rendered in a production build (`next build && next start`
   * strips it entirely — this setting has zero effect on production behavior). Repositioning it
   * (Gate B.5, top-right) still collided with the wizard's language/menu controls at narrow
   * widths, so per the gate's own preferred remedy it's now fully disabled for local development
   * instead. This is a local dev-config setting only — no application-owned replacement control
   * was added in its place.
   */
  devIndicators: false,
  /** Native modules used by Ofertas Locales Gemini PDF rasterization (server-only). */
  serverExternalPackages: ["@napi-rs/canvas", "pdfjs-dist", "@google/generative-ai", "sharp"],
  /** Reduce parallel manifest writers on Windows (intermittent ENOENT during `collecting page data`). */
  experimental: {
    webpackBuildWorker: false,
  },
  /** Windows/CI: webpack persistent cache can race on rename (ENOENT on manifest). */
  webpack: (config, { dev }) => {
    if (!dev) {
      config.cache = false;
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "/**",
      },
      /** Supabase Storage public URLs (listing flyers, etc.) — required if any route still uses `next/image` for these hosts. */
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  async redirects() {
    return [
      {
        source: "/clasificados/publicar/BR",
        destination: "/clasificados/publicar",
        permanent: true,
      },
      {
        source: "/clasificados/publicar/BR/negocio",
        destination: "/clasificados/publicar",
        permanent: true,
      },
      {
        source: "/clasificados/publicar/BR/privado",
        destination: "/clasificados/publicar",
        permanent: true,
      },
      {
        source: "/clasificados/bienes-raices/negocio/preview",
        destination: "/clasificados/publicar",
        permanent: true,
      },
      {
        source: "/clasificados/bienes-raices/privado/preview",
        destination: "/clasificados/publicar",
        permanent: true,
      },
      {
        source: "/clasificados/bienes-raices/negocio/publicar",
        destination: "/clasificados/publicar",
        permanent: true,
      },
      {
        source: "/clasificados/bienes-raices/privado/publicar",
        destination: "/clasificados/publicar",
        permanent: true,
      },
      {
        source: "/clasificados/bienes-raices/results",
        destination: "/clasificados/bienes-raices/resultados",
        permanent: true,
      },
      {
        source: "/clasificados/en-venta/resultados",
        destination: "/clasificados/en-venta/results",
        permanent: true,
      },
    ];
  },

  eslint: {
    // TEMPORARY: allow build even if ESLint fails (we will turn this back on later)
    ignoreDuringBuilds: true,
  },

  typescript: {
    // TypeScript must block builds again for production safety
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
