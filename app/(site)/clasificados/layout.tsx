/**
 * Segment layout for /clasificados/* — do not set hub title, description, canonical, or OG url.
 * Those leak onto child hubs (Viajes, Autos, etc.). Each public leaf sets its own metadata.
 */
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
