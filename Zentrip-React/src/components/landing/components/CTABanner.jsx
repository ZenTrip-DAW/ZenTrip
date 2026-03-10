export default function CTABanner({ onRegister, onLogin }) {
  return (
    <section className="px-6 md:px-16 py-16 md:py-24 text-center relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0F2547 0%, #1B3F72 100%)" }}>
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-96 h-96 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(255,107,44,.15) 0%, transparent 65%)" }} />
      </div>
      <div className="relative z-10">
        <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4 leading-tight" style={{ fontFamily: "'Georgia', serif" }}>
          ¿Listo para tu próxima<br />
          <span className="italic text-orange-400">aventura</span>?
        </h2>
        <p className="text-base md:text-lg text-blue-200 mb-10">Únete a más de 12.000 viajeros que ya organizan sus viajes sin estrés.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onRegister}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl border-none text-base font-extrabold text-blue-900 bg-white hover:shadow-xl cursor-pointer transition-all">
            Empieza gratis →
          </button>
          <button
            onClick={onLogin}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl border-2 border-white border-opacity-25 text-base font-bold text-white bg-transparent hover:border-opacity-50 cursor-pointer transition-colors">
            Ya tengo cuenta
          </button>
        </div>
      </div>
    </section>
  );
}
