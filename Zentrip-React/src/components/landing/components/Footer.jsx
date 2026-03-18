export default function Footer() {
  return (
    <footer className="px-6 md:px-16 pt-16 pb-8 bg-secondary-7">
      <div className="flex flex-col md:flex-row gap-10 md:gap-16 mb-12">
        <div className="max-w-xs">
          <div className="flex items-center gap-2.5 mb-4">
            <img src="/img/logo/logo-sin-texto-png.png" alt="ZenTrip" className="h-10 w-auto" />
            <span className="text-xl font-extrabold">
              <span className="text-white">Zen</span>
              <span className="text-primary-3">Trip</span>
            </span>
          </div>
          <p className="text-sm leading-relaxed text-secondary-2">
            Plan, Pack & Go. El planificador de viajes que tu grupo necesitaba.
          </p>
        </div>

        <div className="flex flex-wrap gap-10 md:flex-1 md:justify-end">
          {[
            { title: "Producto", links: ["Funcionalidades", "Precios", "Comunidad", "Novedades"] },
            { title: "Empresa", links: ["Sobre nosotros", "Blog", "Contacto"] },
            { title: "Legal", links: ["Privacidad", "Términos de uso", "Cookies"] },
          ].map(col => (
            <div key={col.title}>
              <h4 className="text-xs font-bold uppercase tracking-widest mb-4 text-secondary-2">
                {col.title}
              </h4>
              {col.links.map(l => (
                <a key={l} className="block text-sm font-medium mb-2.5 cursor-pointer transition-colors text-secondary-3"
                  onMouseEnter={e => e.target.style.color = "#fff"}
                  onMouseLeave={e => e.target.style.color = "var(--color-secondary-3)"}
                >{l}</a>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-7 border-t border-secondary-6">
        <span className="text-sm font-medium text-secondary-3">
          © 2026 ZenTrip. Hecho con ❤️ para viajeros.
        </span>
        <div className="flex gap-3">
          {["🐦", "📸", "💼"].map((icon, i) => (
            <button key={i} className="w-9 h-9 rounded-xl border-none cursor-pointer flex items-center justify-center text-base transition-colors"
              style={{ background: "rgba(255,255,255,.08)" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.15)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.08)"}
            >{icon}</button>
          ))}
        </div>
      </div>
    </footer>
  );
}
