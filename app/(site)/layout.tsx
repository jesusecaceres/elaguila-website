import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { SiteWideBanners } from "../components/SiteWideBanners";
import { LeonixCookieConsent } from "../components/LeonixCookieConsent";
import { Suspense } from "react";

/**
 * Public / marketing shell: main nav, sitewide banners, footer.
 * Admin routes live under `app/admin` (sibling segment) and do not use this layout.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <SiteWideBanners />
      <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
      <Footer />
      <LeonixCookieConsent />
    </>
  );
}
