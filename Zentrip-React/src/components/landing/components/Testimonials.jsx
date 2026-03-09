import { TESTIMONIALS } from "../constants";
import SectionTag from "./ui/SectionTag";
import SectionHeading from "./ui/SectionHeading";

export default function Testimonials() {
  return (
    <section className="px-16 py-24 bg-slate-50">
      <div className="text-center mb-16">
        <SectionTag>Testimonios</SectionTag>
        <SectionHeading>Lo que dicen nuestros <span className="italic text-orange-500">viajeros</span></SectionHeading>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {TESTIMONIALS.map((t, i) => (
          <div key={i}
            className="bg-white rounded-2xl p-7 border border-slate-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-100">
            <p className="text-sm text-yellow-400 tracking-widest mb-4">{t.stars}</p>
            <p className="text-sm text-blue-900 font-medium leading-relaxed mb-5">
              "{t.quote} <span className="font-extrabold text-orange-500">{t.highlight}</span>"
            </p>
            <div className="flex items-center gap-3">
              <img src={t.img} className="w-11 h-11 rounded-full object-cover" />
              <div>
                <p className="text-sm font-extrabold text-blue-900 m-0">{t.name}</p>
                <p className="text-xs text-slate-400 font-medium m-0">{t.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
