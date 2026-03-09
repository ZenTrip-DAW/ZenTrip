import { PET_FEATURES } from "../constants";

export default function PetSection() {
  return (
    <section className="px-16 py-24 bg-blue-900 flex items-center gap-20 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(255,107,44,.18) 0%, transparent 65%)", transform: "translate(30%, -30%)" }} />

      <div className="flex-1 relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-400 border-opacity-30 bg-orange-500 bg-opacity-15 text-xs font-bold text-orange-400 mb-6">
          🐾 Diferencial ZenTrip
        </div>
        <h2 className="text-4xl font-extrabold text-white leading-tight mb-5" style={{ fontFamily: "'Georgia', serif" }}>
          Viaja con tu peludo<br />
          sin <span className="italic text-orange-400">sorpresas</span>.
        </h2>
        <p className="text-base text-blue-200 leading-relaxed mb-8 max-w-md">
          El único planificador de viajes con módulo específico para mascotas. Filtra hoteles, consulta políticas de aerolíneas y calcula costes adicionales automáticamente.
        </p>
        <div className="flex flex-col gap-3.5">
          {PET_FEATURES.map((t, i) => (
            <div key={i} className="flex items-center gap-3 text-sm font-semibold text-blue-100">
              <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
              {t}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 relative z-10">
        <div className="rounded-3xl overflow-hidden" style={{ boxShadow: "0 24px 64px rgba(0,0,0,.3)" }}>
          <img
            src="https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?w=800&q=80&fit=crop"
            className="w-full block object-cover"
            style={{ height: 340 }}
            alt="Viaje con mascota"
          />
        </div>
      </div>
    </section>
  );
}
