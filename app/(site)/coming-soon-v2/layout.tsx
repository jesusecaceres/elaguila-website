/**
 * Standalone launch preview — hide global site chrome.
 */
export default function ComingSoonV2Layout({ children }: { children: React.ReactNode }) {
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
