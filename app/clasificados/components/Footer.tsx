// Footer.tsx
export default function Footer() {
  return (
    <footer className="w-full bg-white/18 text-white py-12 mt-20 border-t border-yellow-500/45">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10">

        {/* Social Media */}
        <div>
          <h3 className="text-xl font-bold text-yellow-400 mb-3">Síguenos</h3>
          <ul className="space-y-2">
            <li>
              <a
                href="https://facebook.com/elaguilamagazine"
                target="_blank"
              rel="noopener noreferrer"
                className="hover:text-yellow-300"
              >
                Facebook
              </a>
            </li>
            <li>
              <a
                href="https://instagram.com/elaguila_magazine"
                target="_blank"
              rel="noopener noreferrer"
                className="hover:text-yellow-300"
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
          <h3 className="text-xl font-bold text-yellow-400 mb-3">Contacto</h3>
          <p>Email: support@elaguilamedia.com</p>
          <p>Tel: 4081234567</p>
        </div>

        {/* Advertising */}
        <div>
          <h3 className="text-xl font-bold text-yellow-400 mb-3">Anuncia con Nosotros</h3>
          <p className="text-gray-300">
            El Águila es tu mejor plataforma para llegar a la comunidad Latina del Área de la Bahía.
          </p>
          <a
            href="/contact?lang=es"
            className="text-yellow-300 underline mt-2 inline-block"
          >
            Más información →
          </a>
        </div>

      </div>

      <p className="text-center text-gray-400 mt-10 text-sm">
        © 2026 El Águila — Orgullo Latino Sin Fronteras.
      </p>
    </footer>
  );
}