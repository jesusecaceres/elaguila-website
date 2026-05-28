/**
 * Standalone preview: hide global site chrome so layout matches the approved coming-soon mockup.
 */
export default function ComingSoonLiveLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        nav[data-navbar-root] { display: none !important; }
        footer.w-full { display: none !important; }
      `}</style>
      {children}
    </>
  );
}
