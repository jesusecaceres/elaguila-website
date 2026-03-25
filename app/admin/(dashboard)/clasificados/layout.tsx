export default function AdminClasificadosSegmentLayout({ children }: { children: React.ReactNode }) {
  /* Cookie + shell handled by parent (dashboard) layout. Legacy sidebar removed — use global AdminSidebar. */
  return <>{children}</>;
}
