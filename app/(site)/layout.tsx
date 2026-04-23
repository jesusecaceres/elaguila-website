import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { SiteWideBanners } from "../components/SiteWideBanners";
import { LeonixCookieConsent } from "../components/LeonixCookieConsent";

/**
 * Public / marketing shell: main nav, sitewide banners, footer.
 * Admin routes live under `app/admin` (sibling segment) and do not use this layout.
 *
 * Do not wrap `{children}` in a root `<Suspense>` here: it deferred **all** `(site)` page SSR
 * (initial HTML was only the fallback), which broke Servicios public-detail HTTP smoke and hid
 * listing content from plain HTML probes / crawlers for dynamic routes.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <SiteWideBanners />
      {children}
      <Footer />
      <LeonixCookieConsent />
    </>
  );
}
