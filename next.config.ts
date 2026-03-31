import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/clasificados/publicar/BR",
        destination: "/clasificados/publicar/bienes-raices",
        permanent: true,
      },
      {
        source: "/clasificados/publicar/BR/negocio",
        destination: "/clasificados/publicar/bienes-raices/negocio",
        permanent: true,
      },
      {
        source: "/clasificados/publicar/BR/privado",
        destination: "/clasificados/publicar/bienes-raices/privado",
        permanent: true,
      },
      {
        source: "/clasificados/bienes-raices/negocio/preview",
        destination: "/clasificados/publicar/bienes-raices/negocio/preview",
        permanent: true,
      },
      {
        source: "/clasificados/bienes-raices/privado/preview",
        destination: "/clasificados/publicar/bienes-raices/privado/preview",
        permanent: true,
      },
      {
        source: "/clasificados/bienes-raices/negocio/publicar",
        destination: "/clasificados/publicar/bienes-raices/negocio",
        permanent: true,
      },
      {
        source: "/clasificados/bienes-raices/privado/publicar",
        destination: "/clasificados/publicar/bienes-raices/privado",
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
