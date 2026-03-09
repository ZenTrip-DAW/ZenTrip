export default function Navbar({ onLogin, onRegister }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-16 h-16 bg-white bg-opacity-90 backdrop-blur border-b border-blue-50">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 bg-blue-900 rounded-xl flex items-center justify-center text-xl">🌊</div>
        <span className="text-xl font-extrabold">
          <span className="text-blue-900">Zen</span>
          <span className="text-orange-500">Trip</span>
        </span>
      </div>

      <div className="flex items-center gap-9 text-sm font-semibold text-slate-500">
        {["Funcionalidades", "Cómo funciona", "Pet-friendly", "Comunidad"].map(l => (
          <a key={l} className="cursor-pointer hover:text-blue-900 transition-colors">{l}</a>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onLogin}
          className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-blue-900 bg-transparent hover:bg-blue-50 transition-colors cursor-pointer">
          Iniciar sesión
        </button>
        <button
          onClick={onRegister}
          className="px-5 py-2.5 rounded-xl border-none text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 transition-all cursor-pointer shadow-md shadow-orange-100">
          Empieza gratis →
        </button>
      </div>
    </nav>
  );
}
