import { INTEGRATIONS } from "../constants";

export default function LogosBar() {
  return (
    <div className="flex flex-wrap items-center px-6 md:px-16 py-6 bg-white border-b border-slate-100 gap-6 md:gap-10">
      <span className="text-xs font-bold uppercase tracking-widest text-slate-300 whitespace-nowrap">Integrado con</span>
      <div className="flex items-center gap-10 flex-wrap">
        {INTEGRATIONS.map(l => (
          <span key={l} className="text-sm font-extrabold text-slate-300 tracking-tight">{l}</span>
        ))}
      </div>
    </div>
  );
}
