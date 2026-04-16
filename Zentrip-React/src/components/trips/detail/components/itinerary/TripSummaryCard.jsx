
function countTripDays(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  const s = new Date(startDate + 'T00:00:00');
  const e = new Date(endDate + 'T00:00:00');
  return Math.round((e - s) / 86400000) + 1;
}

function SummaryItem({ emoji, value, label }) {
  return (
    <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-slate-50">
      <span className="w-5 h-5 text-lg" role="img" aria-label={label}>{emoji}</span>
      <span className="body-bold text-secondary-5">{value}</span>
      <span className="body-3 text-neutral-3 text-center leading-tight">{label}</span>
    </div>
  );
}

export default function TripSummaryCard({ trip, activityCount = 0, budget = 0 }) {
  const days = countTripDays(trip?.startDate, trip?.endDate);

  return (
    <div className="bg-white rounded-2xl border border-neutral-1 p-4">
      <p className="body-3 text-neutral-4 font-semibold uppercase tracking-wide mb-3">Resumen</p>
      <div className="grid grid-cols-2 gap-2">
        <SummaryItem emoji="📅" value={days || '—'} label="días" />
        <SummaryItem emoji="📝" value={activityCount} label="actividades" />
        <SummaryItem emoji="💸" value={budget ? Intl.NumberFormat('es', { notation: 'compact', maximumFractionDigits: 1 }).format(budget) : '—'} label="gastos" />
        <SummaryItem emoji="🧳" value="—" label="equipaje" />
      </div>
    </div>
  );
}
