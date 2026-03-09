import { FEATURES } from "../constants";
import SectionTag from "./ui/SectionTag";
import SectionHeading from "./ui/SectionHeading";

export default function Features() {
  return (
    <section className="px-16 py-24 bg-white">
      <div className="text-center mb-16">
        <SectionTag>Funcionalidades</SectionTag>
        <SectionHeading>Todo lo que necesitas,<br /><span className="italic text-orange-500">nada de lo que no</span></SectionHeading>
        <p className="text-lg text-slate-500 font-medium max-w-md mx-auto">Diseñado para que organizar un viaje sea tan fácil como planear una tarde.</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {FEATURES.map((f, i) => (
          <div key={i}
            className="p-7 rounded-2xl border border-slate-100 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-orange-100 hover:shadow-xl hover:shadow-slate-100 cursor-default">
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
