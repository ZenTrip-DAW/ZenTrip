import useTypewriter from "../hooks/useTypewriter";

const TYPEWRITER_TEXTS = [
  "Viaja sin caos, disfruta sin límites.",
  "Planifica juntos, vive la aventura.",
  "Organízate mejor, viaja sin límites.",
];

export default function Hero({ onRegister }) {
  const { displayed, full } = useTypewriter(TYPEWRITER_TEXTS);
  const done = displayed.length >= full.length;

  const commaIdx = full.indexOf(",");
  const orangeStart = commaIdx + 2;
  const spaceAfter = full.indexOf(" ", orangeStart);
  const orangeEnd = spaceAfter === -1 ? full.length : spaceAfter;
  const count = displayed.length;
  const blue1 = displayed.slice(0, Math.min(count, commaIdx + 1));
  const orange = count > orangeStart ? displayed.slice(orangeStart, Math.min(count, orangeEnd)) : "";
  const blue2 = count > orangeEnd ? displayed.slice(orangeEnd) : "";

  return (
    <section className="min-h-screen bg-slate-50 flex flex-col md:flex-row items-center pt-24 md:pt-16 px-6 md:px-16 gap-10 md:gap-16 relative overflow-hidden">
      {/* Left */}
      <div className="flex-1 relative z-10 max-w-xl w-full text-center md:text-left">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-1 border border-primary-2 text-xs font-bold text-primary-3 mb-7">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
          Nuevo · Gestión de equipaje colaborativo
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-secondary-5 leading-tight mb-6">
          {blue1}
          {orange && <><br /><span className="text-primary-3">{orange}</span></>}
          {blue2}
          {!done && <span className="animate-pulse text-primary-2">|</span>}
        </h1>

        <p className="text-base md:text-lg text-neutral-4 font-medium leading-relaxed mb-10 max-w-md mx-auto md:mx-0">
          ZenTrip centraliza todo lo que necesitas para organizar un viaje perfecto: itinerario, presupuesto, equipaje y decisiones en grupo.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mb-10">
          <button
            onClick={onRegister}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl border-none text-base font-extrabold text-white cursor-pointer transition-all bg-primary-3 hover:bg-primary-4 shadow-md shadow-primary-1">
            Empieza gratis →
          </button>
          <button className="w-full sm:w-auto px-8 py-4 rounded-2xl border-2 border-neutral-2 text-base font-bold text-secondary-5 bg-white hover:bg-neutral-1 cursor-pointer transition-colors">
            Ver cómo funciona
          </button>
        </div>

        <div className="flex items-center justify-center md:justify-start gap-3">
          <div className="flex">
            {[47, 11, 9, 20, 1].map(n => (
              <img key={n} src={`https://i.pravatar.cc/80?img=${n}`}
                className="w-9 h-9 rounded-full border-2 border-white object-cover -ml-2.5 first:ml-0" />
            ))}
          </div>
          <p className="text-sm text-neutral-4 font-semibold">
            <span className="text-secondary-5 font-extrabold">+12.000 viajeros</span> ya lo usan · Gratis para siempre
          </p>
        </div>
      </div>

      {/* Right: mockup — oculto en móvil pequeño */}
      <div className="hidden sm:flex flex-1 relative z-10 items-center justify-center w-full">
        <div className="relative w-full max-w-lg">
          <div className="w-full rounded-3xl overflow-hidden"
            style={{ boxShadow: "0 32px 80px rgba(15,37,71,.18), 0 8px 24px rgba(0,0,0,.08)" }}>
            <img
              src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=900&q=80&fit=crop"
              className="w-full block"
              alt="ZenTrip dashboard"
            />
          </div>

          {/* Float 1 */}
          <div className="absolute -top-5 -right-4 md:-right-8 bg-white rounded-2xl px-3 md:px-4 py-3 flex items-center gap-3"
            style={{ boxShadow: "0 8px 24px rgba(0,0,0,.1)", animation: "floatY 3s ease-in-out infinite" }}>
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-lg">🗳️</div>
            <div>
              <p className="text-xs text-slate-400 font-semibold m-0">Votación activa</p>
              <p className="text-sm font-bold text-blue-900 m-0">¿Roma o Lisboa? 🔥</p>
            </div>
          </div>

          {/* Float 2 */}
          <div className="absolute -bottom-4 -left-4 md:-left-8 bg-white rounded-2xl px-3 md:px-4 py-3 flex items-center gap-3"
            style={{ boxShadow: "0 8px 24px rgba(0,0,0,.1)", animation: "floatY 3.5s ease-in-out infinite reverse" }}>
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-lg">💰</div>
            <div>
              <p className="text-xs text-slate-400 font-semibold m-0">Presupuesto</p>
              <p className="text-sm font-bold text-blue-900 m-0">340€ / 1.200€</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes floatY {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </section>
  );
}
