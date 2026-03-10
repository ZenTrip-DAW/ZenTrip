import { useState, useEffect } from "react";

const NAV_LINKS = [
  { label: "Funcionalidades", id: "funcionalidades" },
  { label: "Cómo funciona",   id: "como-funciona"   },
  { label: "Pet-friendly",    id: "pet-friendly"    },
  { label: "Comunidad",       id: "comunidad"       },
];

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function Navbar({ onLogin, onRegister }) {
  const [open, setOpen]     = useState(false);
  const [active, setActive] = useState("");

  useEffect(() => {
    const observers = NAV_LINKS.map(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(id); },
        { threshold: 0.35 }
      );
      obs.observe(el);
      return obs;
    });
    return () => observers.forEach(o => o?.disconnect());
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white bg-opacity-90 backdrop-blur border-b border-blue-50">
      <div className="flex items-center justify-between px-6 md:px-10 lg:px-16 h-16">

        {/* Logo */}
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex items-center gap-2.5 cursor-pointer bg-transparent border-none p-0">
          <div className="w-9 h-9 bg-blue-900 rounded-xl flex items-center justify-center text-xl">🌊</div>
          <span className="text-xl font-extrabold">
            <span className="text-blue-900">Zen</span>
            <span className="text-orange-500">Trip</span>
          </span>
        </button>

        {/* Links — desktop */}
        <div className="hidden md:flex items-center gap-5 lg:gap-9 text-sm font-semibold whitespace-nowrap">
          {NAV_LINKS.map(({ label, id }) => (
            <a key={id}
              onClick={() => scrollTo(id)}
              className={`cursor-pointer transition-colors ${
                active === id
                  ? "text-blue-900 font-extrabold"
                  : "text-slate-500 hover:text-blue-900"
              }`}>
              {label}
              {active === id && (
                <span className="block h-0.5 mt-0.5 rounded-full bg-orange-500" />
              )}
            </a>
          ))}
        </div>

        {/* Botones — desktop */}
        <div className="hidden md:flex items-center gap-2 lg:gap-3 shrink-0">
          <button onClick={onLogin}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-blue-900 bg-transparent hover:bg-blue-50 transition-colors cursor-pointer">
            Iniciar sesión
          </button>
          <button onClick={onRegister}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 transition-all cursor-pointer shadow-md shadow-orange-100">
            Empieza gratis →
          </button>
        </div>

        {/* Hamburguesa — móvil */}
        <button onClick={() => setOpen(o => !o)}
          className="md:hidden flex flex-col gap-1.5 p-2 cursor-pointer bg-transparent border-none"
          aria-label="Menú">
          <span className={`block w-6 h-0.5 bg-blue-900 transition-all duration-300 ${open ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`block w-6 h-0.5 bg-blue-900 transition-all duration-300 ${open ? "opacity-0" : ""}`} />
          <span className={`block w-6 h-0.5 bg-blue-900 transition-all duration-300 ${open ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </div>

      {/* Menú móvil */}
      {open && (
        <div className="md:hidden flex flex-col px-6 pb-6 gap-4 bg-white border-t border-blue-50">
          {NAV_LINKS.map(({ label, id }) => (
            <a key={id}
              onClick={() => { scrollTo(id); setOpen(false); }}
              className={`text-sm font-semibold cursor-pointer py-1 transition-colors ${
                active === id ? "text-blue-900 font-extrabold" : "text-slate-500"
              }`}>
              {label}
            </a>
          ))}
          <div className="flex flex-col gap-2 pt-2">
            <button onClick={() => { setOpen(false); onLogin(); }}
              className="w-full px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-blue-900 bg-transparent hover:bg-blue-50 cursor-pointer">
              Iniciar sesión
            </button>
            <button onClick={() => { setOpen(false); onRegister(); }}
              className="w-full px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 cursor-pointer shadow-md shadow-orange-100">
              Empieza gratis →
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
