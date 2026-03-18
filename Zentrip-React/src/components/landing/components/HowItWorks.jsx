import { STEPS } from "../constants";
import SectionTag from "./ui/SectionTag";
import SectionHeading from "./ui/SectionHeading";

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="px-6 md:px-16 py-16 md:py-24 bg-slate-50">
      <div className="text-center mb-16">
        <SectionTag>Cómo funciona</SectionTag>
        <SectionHeading>De la idea al viaje en <span className="text-primary-3">4 pasos</span></SectionHeading>
        <p className="text-lg text-neutral-4 font-medium max-w-md mx-auto">Sin complicaciones. Sin apps de más. Sin caos en el grupo.</p>
      </div>

      <div className="grid grid-cols-2 md:flex relative gap-y-10 md:gap-0">
        {/* connector line — solo desktop */}
        <div className="hidden md:block absolute top-8 left-24 right-24 h-0.5 bg-gradient-to-r from-primary-2 to-secondary-2 opacity-40" />

        {STEPS.map((s, i) => (
          <div key={i} className="flex flex-col items-center text-center px-4 md:px-6 relative group">
            <div className="w-16 h-16 rounded-full bg-white border-2 border-neutral-2 flex items-center justify-center text-2xl mb-5 shadow-sm transition-all duration-300 group-hover:bg-primary-3 group-hover:border-primary-3 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary-1">
              {s.emoji}
            </div>
            <p className="text-sm font-extrabold text-secondary-5 mb-2">{s.title}</p>
            <p className="text-sm text-neutral-4 font-medium leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
