import { INTEGRATIONS } from "../constants";

export default function LogosBar() {
  return (
    <div className="px-6 md:px-16 py-6 bg-white border-b border-neutral-1">
      <div className="text-sm font-bold uppercase tracking-widest text-neutral-3 text-center mb-6">
        Integrado con
      </div>
      <div className="flex items-center justify-center gap-6 sm:gap-12 md:gap-24 flex-wrap">
        {INTEGRATIONS.map(l => (
          <span key={l} className="text-sm font-extrabold text-neutral-3 tracking-tight">{l}</span>
        ))}
      </div>
    </div>
  );
}
