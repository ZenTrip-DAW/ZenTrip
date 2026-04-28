import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTHS_SHORT = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const MONTHS_LONG = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function parseDate(isoStr) {
  const [y, m, d] = isoStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

// Monday offset: how many days to go back to reach Monday (0=Mon … 6=Sun)
function mondayOffset(date) {
  return (date.getDay() + 6) % 7;
}

const VIEW_OPTIONS = [
  { key: 'week1', label: '1 sem' },
  { key: 'week2', label: '2 sem' },
  { key: 'month', label: 'Mes' },
];

// Week1: starts from Monday of the first trip day's week, pads to fill complete 7-day pages
function generateExtendedDays(tripDays) {
  if (tripDays.length === 0) return [];
  const tripSet = new Set(tripDays);
  const firstDay = parseDate(tripDays[0]);
  const lastDay = parseDate(tripDays[tripDays.length - 1]);

  const start = addDays(firstDay, -mondayOffset(firstDay));

  const days = [];
  let cur = new Date(start);
  while (cur <= lastDay) {
    const iso = toISO(cur);
    days.push({ dateStr: iso, inTrip: tripSet.has(iso) });
    cur = addDays(cur, 1);
  }
  while (days.length % 7 !== 0) {
    const iso = toISO(cur);
    days.push({ dateStr: iso, inTrip: false });
    cur = addDays(cur, 1);
  }
  return days;
}

// Week2: starts from Monday of the week containing first trip day
function generateWeek2Days(tripDays) {
  if (tripDays.length === 0) return [];
  const tripSet = new Set(tripDays);
  const firstDay = parseDate(tripDays[0]);
  const lastDay = parseDate(tripDays[tripDays.length - 1]);

  const weekStart = addDays(firstDay, -mondayOffset(firstDay));

  const days = [];
  let cur = new Date(weekStart);
  while (cur <= lastDay || days.length % 14 !== 0) {
    const iso = toISO(cur);
    days.push({ dateStr: iso, inTrip: tripSet.has(iso) });
    cur = addDays(cur, 1);
  }
  return days;
}

function generateMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const days = [];
  let cur = new Date(firstDay);
  cur.setDate(cur.getDate() - mondayOffset(cur));

  while (cur <= lastDay || days.length % 7 !== 0) {
    days.push({ dateStr: toISO(cur), inMonth: cur.getMonth() === month });
    cur = addDays(cur, 1);
  }
  return days;
}

function formatNavLabel(view, offset, tripDays) {
  if (tripDays.length === 0) return '';

  if (view === 'week1') {
    const days = generateExtendedDays(tripDays);
    const slice = days.slice(offset * 7, offset * 7 + 7);
    if (slice.length === 0) return '';
    const first = parseDate(slice[0].dateStr);
    const last = parseDate(slice[slice.length - 1].dateStr);
    if (first.getMonth() === last.getMonth())
      return `${first.getDate()} - ${last.getDate()} ${MONTHS_SHORT[first.getMonth()]} ${first.getFullYear()}`;
    return `${first.getDate()} ${MONTHS_SHORT[first.getMonth()]} – ${last.getDate()} ${MONTHS_SHORT[last.getMonth()]} ${last.getFullYear()}`;
  }

  if (view === 'week2') {
    const days = generateWeek2Days(tripDays);
    const slice = days.slice(offset * 14, offset * 14 + 14);
    if (slice.length === 0) return '';
    const first = parseDate(slice[0].dateStr);
    const last = parseDate(slice[slice.length - 1].dateStr);
    if (first.getMonth() === last.getMonth())
      return `${first.getDate()} - ${last.getDate()} ${MONTHS_SHORT[first.getMonth()]} ${first.getFullYear()}`;
    return `${first.getDate()} ${MONTHS_SHORT[first.getMonth()]} – ${last.getDate()} ${MONTHS_SHORT[last.getMonth()]} ${last.getFullYear()}`;
  }

  const start = parseDate(tripDays[0]);
  const d = new Date(start.getFullYear(), start.getMonth() + offset, 1);
  return `${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
}

function getTotalPages(view, tripDays) {
  if (tripDays.length === 0) return 1;
  if (view === 'week1') return Math.max(1, Math.ceil(generateExtendedDays(tripDays).length / 7));
  if (view === 'week2') return Math.max(1, Math.ceil(generateWeek2Days(tripDays).length / 14));
  const start = parseDate(tripDays[0]);
  const end = parseDate(tripDays[tripDays.length - 1]);
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
}

function getOngoingPageIndex(view, tripDays, dateStr) {
  if (tripDays.length === 0) return 0;
  if (view === 'week1') {
    const days = generateExtendedDays(tripDays);
    const idx = days.findIndex((d) => d.dateStr === dateStr);
    return idx >= 0 ? Math.floor(idx / 7) : 0;
  }
  if (view === 'week2') {
    const days = generateWeek2Days(tripDays);
    const idx = days.findIndex((d) => d.dateStr === dateStr);
    return idx >= 0 ? Math.floor(idx / 14) : 0;
  }
  return 0;
}

function DayTile({ dayInfo, isSelected, count, weather, onSelect, isMonthView = false }) {
  const { dateStr, inTrip } = dayInfo;
  const inMonth = dayInfo.inMonth !== undefined ? dayInfo.inMonth : true;
  const date = parseDate(dateStr);
  const dayNum = date.getDate();

  if (isMonthView && !inMonth) {
    return (
      <div className="flex flex-col items-center justify-start py-2 min-h-21">
        <span className="text-[11px] text-neutral-2">{dayNum}</span>
      </div>
    );
  }

  const sizeClass = isMonthView
    ? 'rounded-xl py-1.5 w-full min-h-21'
    : 'rounded-2xl py-2.5 px-1 w-full';

  const hasWeather = weather != null;
  const weatherEmoji = hasWeather ? weather.emoji : null;
  const weatherTemp = hasWeather ? (weather.temp != null ? `${weather.temp}ºC` : '—') : '—';

  if (!inTrip) {
    return (
      <button
        type="button"
        onClick={() => onSelect(dateStr)}
        className={`flex flex-col items-center gap-1 ${sizeClass} bg-neutral-1 border transition-colors cursor-pointer ${isSelected ? 'border-neutral-3' : 'border-neutral-2 hover:bg-neutral-2/50'}`}
      >
        <span className="text-base font-bold leading-none mt-0.5 text-neutral-3">{dayNum}</span>
        <span className="text-base sm:text-lg leading-none mt-0.5">
          {weatherEmoji ?? <span className="text-neutral-3 text-xs leading-none">—</span>}
        </span>
        <span className="text-xs sm:text-[13px] font-normal leading-none text-neutral-3">{weatherTemp}</span>
        <span className="h-4.5 mt-0.5" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(dateStr)}
      className={`flex flex-col items-center gap-1 ${sizeClass} transition-all cursor-pointer ${isSelected ? 'bg-secondary-5 shadow-sm' : 'bg-blue-50 border border-blue-200 hover:bg-blue-100'}`}
    >
      <span className={`text-base font-bold leading-none mt-0.5 ${isSelected ? 'text-white' : 'text-secondary-5'}`}>
        {dayNum}
      </span>
      <span className="text-base sm:text-xl leading-none mt-0.5">
        {weatherEmoji ?? <span className={`text-xs leading-none ${isSelected ? 'text-blue-200' : 'text-blue-300'}`}>—</span>}
      </span>
      <span className={`text-xs sm:text-[13px] font-normal leading-none ${isSelected ? 'text-blue-100' : 'text-blue-500'}`}>
        {weatherTemp}
      </span>
      {count > 0 ? (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-4.5 text-center leading-none bg-orange-400 text-white mt-0.5">
          {count}
        </span>
      ) : (
        <span className="h-4.5 mt-0.5" />
      )}
    </button>
  );
}

function DayNameHeader() {
  return (
    <div className="grid grid-cols-7 gap-2 mb-1">
      {DAY_NAMES.map((d) => (
        <div key={d} className="text-center text-[11px] font-semibold text-neutral-4 py-1">
          {d}
        </div>
      ))}
    </div>
  );
}

export default function DayCalendar({ tripDays, selectedDay, onSelectDay, activitiesByDate = {}, weatherByDate = {} }) {
  const [view, setView] = React.useState('week1');
  const [offset, setOffset] = React.useState(0);

  React.useEffect(() => {
    if (tripDays.length === 0) return;
    if (view !== 'week1' && view !== 'week2') return;
    const todayIso = toISO(new Date());
    if (!tripDays.includes(todayIso)) return;
    const pageIndex = getOngoingPageIndex(view, tripDays, todayIso);
    setOffset(pageIndex);
  }, [tripDays, view]);

  const tripSet = new Set(tripDays);
  const totalPages = getTotalPages(view, tripDays);
  const canPrev = offset > 0;
  const canNext = offset < totalPages - 1;

  let visibleRows = [];

  if (view === 'week1') {
    const days = generateExtendedDays(tripDays);
    visibleRows = [days.slice(offset * 7, offset * 7 + 7)];
  } else if (view === 'week2') {
    const days = generateWeek2Days(tripDays);
    const page = days.slice(offset * 14, offset * 14 + 14);
    visibleRows = [page.slice(0, 7), page.slice(7, 14)];
  } else if (tripDays.length > 0) {
    const start = parseDate(tripDays[0]);
    const d = new Date(start.getFullYear(), start.getMonth() + offset, 1);
    const monthDays = generateMonthGrid(d.getFullYear(), d.getMonth());
    for (let i = 0; i < monthDays.length; i += 7) {
      visibleRows.push(
        monthDays.slice(i, i + 7).map(({ dateStr, inMonth }) => ({
          dateStr,
          inTrip: inMonth && tripSet.has(dateStr),
          inMonth,
        }))
      );
    }
  }

  const isMonthView = view === 'month';

  return (
    <div className="bg-white rounded-2xl border border-neutral-1 p-3 sm:p-4">
      {/* Navigation bar */}
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
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
            {formatNavLabel(view, offset, tripDays)}
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

        <div className="flex rounded-full border border-neutral-1 overflow-hidden shrink-0">
          {VIEW_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => { setView(opt.key); setOffset(0); }}
              className={`px-2.5 sm:px-3 py-1 body-3 transition-colors ${view === opt.key ? 'bg-secondary-5 text-white' : 'text-neutral-4 hover:bg-neutral-1'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Header row: all views */}
      <DayNameHeader />

      {/* Day tiles */}
      <div className="flex flex-col gap-1">
        {visibleRows.map((row, ri) => (
          <div key={ri} className="grid grid-cols-7 gap-2">
            {row.map((dayInfo) => (
              <DayTile
                key={dayInfo.dateStr}
                dayInfo={dayInfo}
                isSelected={selectedDay === dayInfo.dateStr}
                count={dayInfo.inTrip ? (activitiesByDate[dayInfo.dateStr] || []).length : 0}
                weather={weatherByDate[dayInfo.dateStr]}
                onSelect={onSelectDay}
                isMonthView={isMonthView}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
