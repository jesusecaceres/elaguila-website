import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
      // Package F Build F2, Gate 4 (P0 SEO fix) — F1 found ~10 categories serving byte-identical
      // duplicate content between an English `/results` path and a Spanish `/resultados` path
      // (one side a literal `export { default } from "..."` re-export of the other), with no
      // redirect and no distinguishing canonical — confirmed duplicate-content indexing risk.
      // Direction per category was verified against REAL live navigational callers (hero
      // search/quick-chip hrefs, shared URL-builder constants), not assumed — Autos, Restaurantes,
      // and Servicios turned out to have `/results` as the true live-linked route (same situation
      // already fixed for En Venta above), while the rest have `/resultados` as the real target
      // (same situation already fixed for Bienes Raíces above).
      {
        source: "/clasificados/autos/resultados",
        destination: "/clasificados/autos/results",
        permanent: true,
      },
      {
        source: "/clasificados/restaurantes/resultados",
        destination: "/clasificados/restaurantes/results",
        permanent: true,
      },
      {
        source: "/clasificados/servicios/resultados",
        destination: "/clasificados/servicios/results",
        permanent: true,
      },
      {
        source: "/clasificados/empleos/results",
        destination: "/clasificados/empleos/resultados",
        permanent: true,
      },
      {
        source: "/clasificados/busco/results",
        destination: "/clasificados/busco/resultados",
        permanent: true,
      },
      {
        source: "/clasificados/clases/results",
        destination: "/clasificados/clases/resultados",
        permanent: true,
      },
      {
        source: "/clasificados/mascotas-y-perdidos/results",
        destination: "/clasificados/mascotas-y-perdidos/resultados",
        permanent: true,
      },
      {
        source: "/clasificados/comunidad/results",
        destination: "/clasificados/comunidad/resultados",
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
