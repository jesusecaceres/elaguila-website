// Footer.tsx
export default function Footer() {
  return (
    <footer className="w-full bg-[color:var(--lx-section)] text-[color:var(--lx-text)] py-12 mt-20 border-t border-[color:var(--lx-nav-border)]">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10">

        {/* Social Media */}
        <div>
          <h3 className="text-xl font-bold text-[color:var(--lx-gold)] mb-3">Síguenos</h3>
          <ul className="space-y-2">
            <li>
              <a
                href="https://facebook.com/elaguilamagazine"
                target="_blank"
              rel="noopener noreferrer"
                className="hover:text-[color:var(--lx-gold)] transition"
              >
                Facebook
              </a>
            </li>
            <li>
              <a
                href="https://instagram.com/elaguila_magazine"
                target="_blank"
              rel="noopener noreferrer"
                className="hover:text-[color:var(--lx-gold)] transition"
              >
                Instagram
              </a>
            </li>
            <li>
              <a href="#" aria-disabled="true" title="Pronto" className="hover:text-yellow-300 opacity-60 cursor-not-allowed pointer-events-none">
                TikTok
              </a>
            </li>
            <li>
              <a href="#" aria-disabled="true" title="Pronto" className="hover:text-yellow-300 opacity-60 cursor-not-allowed pointer-events-none">
                YouTube
              </a>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-xl font-bold text-[color:var(--lx-gold)] mb-3">Contacto</h3>
          <p>Email: support@elaguilamedia.com</p>
          <p>Tel: 4081234567</p>
        </div>

        {/* Advertising */}
        <div>
          <h3 className="text-xl font-bold text-[color:var(--lx-gold)] mb-3">Anuncia con Nosotros</h3>
          <p className="text-[color:var(--lx-text-2)]/85">
            El Águila es tu mejor plataforma para llegar a la comunidad Latina del Área de la Bahía.
          </p>
          <a
            href="/contact?lang=es"
            className="text-[color:var(--lx-text)] underline decoration-[color:var(--lx-gold)] underline-offset-4 mt-2 inline-block hover:text-[color:var(--lx-gold)] transition"
          >
            Más información →
          </a>
        </div>

      </div>

      <p className="text-center text-[color:var(--lx-muted)] mt-10 text-sm">
        © 2026 El Águila — Orgullo Latino Sin Fronteras.
      </p>
    </footer>
  );
}