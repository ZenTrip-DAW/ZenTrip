import { Star } from 'lucide-react';
// componentes atomicos reutilizables
export function SectionLabel({ children }) {
  return (
    <p className="body-3 font-bold text-neutral-4 uppercase tracking-widest mb-3">
      {children}
    </p>
  );
}

export function ScoreBadge({ score }) {
  if (!score) return null;
  return (
    <span className="bg-secondary-4 text-secondary-1 text-[11px] font-bold px-2 py-0.5 rounded font-titles">
      {score}
    </span>
  );
}

export function StarRow({ stars }) {
  if (!stars) return null;
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${i < stars ? 'fill-yellow-400 text-yellow-400' : 'text-neutral-2'}`}
        />
      ))}
    </div>
  );
}

export function TipCard({ icon, iconBg, title, text }) {
  return (
    <div className="bg-white border border-neutral-1 rounded-xl p-3 flex items-start gap-3">
      <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center text-base shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="body-3 font-bold text-neutral-7 mb-1">{title}</p>
        <p className="text-[11px] text-neutral-4 leading-relaxed">{text}</p>
      </div>
    </div>
  );
}
