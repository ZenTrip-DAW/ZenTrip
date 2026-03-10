import { useRef } from "react";
import { FEATURES } from "../constants";
import SectionTag from "./ui/SectionTag";
import SectionHeading from "./ui/SectionHeading";
import useParticles from "../hooks/useParticles";

export default function Features() {
  const canvasRef = useRef(null);
  useParticles(canvasRef, { count: 40, speed: 0.3 });

  return (
    <section id="funcionalidades" className="relative px-6 md:px-16 py-16 md:py-24 bg-white overflow-hidden">
      {/* Luciérnagas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      <div className="relative z-10 text-center mb-16">
        <SectionTag>Funcionalidades</SectionTag>
        <SectionHeading>Todo lo que necesitas,<br /><span className="italic text-orange-500">nada de lo que no</span></SectionHeading>
        <p className="text-lg text-slate-500 font-medium max-w-md mx-auto">Diseñado para que organizar un viaje sea tan fácil como planear una tarde.</p>
      </div>

      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {FEATURES.map((f, i) => (
          <div key={i}
            className="p-7 rounded-2xl border border-gray-100 bg-gray-100 transition-all duration-300 hover:-translate-y-1 hover:border-orange-100 hover:shadow-xl hover:shadow-slate-100 cursor-default">
            <div className={`w-13 h-13 rounded-2xl ${f.bg} flex items-center justify-center text-2xl mb-5`}
              style={{ width: 52, height: 52 }}>
              {f.icon}
            </div>
            <p className="text-base font-extrabold text-blue-900 mb-2">{f.title}</p>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
