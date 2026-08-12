import type { MetadataRoute } from "next";

/**
 * Program 7, Gate 7G — Staff Field Agent PWA manifest.
 * Conservative, truthful installability. No fake offline behavior.
 * Uses existing authentication — no separate PWA auth.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Leonix Business Concierge — Field Agent",
    short_name: "Leonix Field",
    description: "Staff field agent tools for the Leonix Business Concierge platform.",
    start_url: "/admin/businesses",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0f0f0f",
    theme_color: "#7A1E2C",
    icons: [
      {
        src: "/logo.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    categories: ["business", "productivity"],
    lang: "es",
    dir: "ltr",
  };
}
