import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS_SHORT = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

function parseDate(isoStr) {
  const [y, m, d] = isoStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatNavLabel(days) {
  if (days.length === 0) return '';
  const first = parseDate(days[0]);
  const last  = parseDate(days[days.length - 1]);
  const fm = first.getMonth();
  const lm = last.getMonth();
  if (fm === lm)
    return `${first.getDate()}-${last.getDate()} ${MONTHS_SHORT[fm]} ${first.getFullYear()}`;
  return `${first.getDate()} ${MONTHS_SHORT[fm]} - ${last.getDate()} ${MONTHS_SHORT[lm]} ${last.getFullYear()}`;
}

const VIEW_OPTIONS = [
  { key: 'week1', label: '1 sem' },
  { key: 'week2', label: '2 sem' },
  { key: 'month', label: 'Mes' },
];

function getVisibleDays(allDays, view, offset) {
  const size = view === 'week1' ? 7 : view === 'week2' ? 14 : 30;
  return allDays.slice(offset * size, offset * size + size);
}

export default function DayCalendar({ tripDays, selectedDay, onSelectDay, activitiesByDate = {} }) {
  const [view, setView]     = React.useState('week1');
  const [offset, setOffset] = React.useState(0);

  const pageSize   = view === 'week1' ? 7 : view === 'week2' ? 14 : 30;
  const totalPages = Math.ceil(tripDays.length / pageSize);
  const visibleDays = getVisibleDays(tripDays, view, offset);

  const canPrev = offset > 0;
  const canNext = offset < totalPages - 1;

  return (
    <div className="bg-white rounded-2xl border border-neutral-1 p-3 sm:p-4">
      {/* Navigation bar */}
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        {/* Flechas + label */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={!canPrev}
            onClick={() => setOffset((p) => p - 1)}
            className="w-7 h-7 rounded-full border border-neutral-1 flex items-center justify-center text-neutral-4 hover:bg-neutral-1 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="body-3 font-semibold text-secondary-5 whitespace-nowrap">
            {formatNavLabel(visibleDays)}
          </span>
          <button
            type="button"
            disabled={!canNext}
            onClick={() => setOffset((p) => p + 1)}
            className="w-7 h-7 rounded-full border border-neutral-1 flex items-center justify-center text-neutral-4 hover:bg-neutral-1 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Selector de vista */}
        <div className="flex rounded-full border border-neutral-1 overflow-hidden shrink-0">
          {VIEW_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => { setView(opt.key); setOffset(0); }}
              className={`px-2.5 sm:px-3 py-1 body-3 transition-colors ${
                view === opt.key ? 'bg-secondary-5 text-white' : 'text-neutral-4 hover:bg-neutral-1'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Day tiles — scroll horizontal en móvil */}
      <div className="flex gap-1 sm:gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        {visibleDays.map((dayStr) => {
          const date      = parseDate(dayStr);
          const dayName   = DAY_NAMES[date.getDay()];
          const dayNum    = date.getDate();
          const isSelected = selectedDay === dayStr;
          const count     = (activitiesByDate[dayStr] || []).length;

          return (
            <button
              key={dayStr}
              type="button"
              onClick={() => onSelectDay(dayStr)}
              className={`
                flex flex-col items-center gap-0.5 rounded-2xl px-2 sm:px-3 py-2 sm:py-3
                min-w-13 sm:min-w-15 shrink-0 transition-colors
                ${isSelected ? 'bg-secondary-5 text-white' : 'hover:bg-slate-50 text-neutral-5'}
              `}
            >
              <span className={`body-3 ${isSelected ? 'text-secondary-2' : 'text-neutral-3'}`}>
                {dayName}
              </span>
              <span className={`text-base sm:text-lg font-semibold leading-none ${isSelected ? 'text-white' : 'text-secondary-5'}`}>
                {dayNum}
              </span>
              {/* Placeholder clima — se llenará cuando se integre la API */}
              <span className="text-sm opacity-0 select-none leading-none">☀</span>
              <span className={`body-3 ${isSelected ? 'text-secondary-1' : 'text-neutral-3'}`}>—</span>
              {count > 0 ? (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-4.5 text-center leading-none ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-primary-1 text-primary-3'
                }`}>
                  {count}
                </span>
              ) : (
                <span className="h-4" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
