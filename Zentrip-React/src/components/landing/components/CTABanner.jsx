export default function CTABanner({ onRegister, onLogin }) {
  return (
    <section className="px-6 md:px-16 py-16 md:py-24 text-center relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #002C51 0%, #004C87 100%)" }}>
      <div className="relative z-10">
        <h2 className="text-xl sm:text-3xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
          ¿Listo para tu próxima<br />
          <span className="text-primary-3">aventura</span>?
        </h2>
        <p className="text-base md:text-lg text-secondary-1 mb-10">Únete a más de 12.000 viajeros que ya organizan sus viajes sin estrés.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onRegister}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl border-none text-base font-extrabold text-secondary-5 bg-white hover:shadow-xl cursor-pointer transition-all">
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
