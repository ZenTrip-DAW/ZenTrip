import { useState, useRef } from "react";
import { TESTIMONIALS } from "../constants";
import SectionTag from "./ui/SectionTag";
import SectionHeading from "./ui/SectionHeading";

function TestimonialCard({ t }) {
  const ref = useRef(null);
  const [style, setStyle] = useState({});
  const [spotlight, setSpotlight] = useState(null);

  const onMove = (e) => {
    const card = ref.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width  / 2;
    const cy = rect.height / 2;
    const rotateX = ((y - cy) / cy) * -8;   // max ±8deg
    const rotateY = ((x - cx) / cx) *  8;

    setStyle({
      transform: `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`,
      transition: "transform 0.1s ease",
    });
    setSpotlight({ x, y });
  };

  const onLeave = () => {
    setStyle({ transform: "perspective(600px) rotateX(0deg) rotateY(0deg) scale(1)", transition: "transform 0.4s ease" });
    setSpotlight(null);
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={style}
      className="relative bg-white rounded-2xl p-7 border border-neutral-1 overflow-hidden cursor-default">

      {/* Spotlight que sigue el cursor */}
      {spotlight && (
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-200"
          style={{
            background: `radial-gradient(320px circle at ${spotlight.x}px ${spotlight.y}px,
              rgba(254,107,1,0.08) 0%,
              rgba(1,148,254,0.05) 40%,
              transparent 70%)`,
          }}
        />
      )}

      <div className="relative">
        <p className="text-sm text-primary-3 tracking-widest mb-4">{t.stars}</p>
        <p className="text-sm text-secondary-5 font-medium leading-relaxed mb-5">
          "{t.quote} <span className="font-extrabold text-primary-3">{t.highlight}</span>"
        </p>
        <div className="flex items-center gap-3">
          <img src={t.img} className="w-11 h-11 rounded-full object-cover" />
          <div>
            <p className="text-sm font-extrabold text-secondary-5 m-0">{t.name}</p>
            <p className="text-xs text-neutral-4 font-medium m-0">{t.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Testimonials() {
  return (
    <section id="comunidad" className="px-6 md:px-16 py-16 md:py-24 bg-slate-50">
      <div className="text-center mb-16">
        <SectionTag>Testimonios</SectionTag>
        <SectionHeading>Lo que dicen nuestros <span className="text-primary-3">viajeros</span></SectionHeading>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {TESTIMONIALS.map((t, i) => (
          <TestimonialCard key={i} t={t} />
        ))}
      </div>
    </section>
  );
}
