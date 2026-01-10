import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      // Prevent PDFs under /magazine from being cached forever on mobile
      {
        source: "/magazine/:path*\\.pdf",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },

      // (Optional but recommended) prevent JSON under /magazine from sticking too
      {
        source: "/magazine/:path*\\.json",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;

