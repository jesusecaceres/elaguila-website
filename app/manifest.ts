import type { MetadataRoute } from "next";

/**
 * Leonix Business Concierge — one shared installable PWA.
 * Identity is the product, not a person. Login/session decides who is using it.
 * No per-user manifest. No separate PWA auth.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Leonix Business Concierge",
    short_name: "Leonix Concierge",
    description: "Staff operating system for the Leonix Business Concierge platform.",
    id: "/admin/businesses",
    start_url: "/admin/businesses",
    scope: "/admin/",
    display: "standalone",
    background_color: "#FAF6EE",
    theme_color: "#7A1E2C",
    icons: [
      {
        src: "/pwa/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa/icon-512-maskable.png",
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
