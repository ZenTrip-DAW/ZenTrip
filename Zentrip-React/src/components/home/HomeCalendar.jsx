import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTHS_LONG = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function toISO(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function parseDate(isoStr) {
  const [y, m, d] = isoStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function mondayOffset(date) {
  return (date.getDay() + 6) % 7;
}

function generateMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = [];
  const cur = new Date(firstDay);
  cur.setDate(cur.getDate() - mondayOffset(cur));
  while (cur <= lastDay || days.length % 7 !== 0) {
    days.push({ dateStr: toISO(new Date(cur)), inMonth: cur.getMonth() === month });
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

export default function HomeCalendar({ activeTripDayMap, pastTripDaySet, activitiesByDate }) {
  const navigate = useNavigate();
  const todayStr = toISO(new Date());
  const todayDate = new Date();

  const [year, setYear] = useState(todayDate.getFullYear());
  const [month, setMonth] = useState(todayDate.getMonth());

  const grid = useMemo(() => generateMonthGrid(year, month), [year, month]);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  return (
    <div className="rounded-2xl border border-white/40 bg-white/70 p-2 sm:p-3 md:p-4 w-full">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={prevMonth}
          className="w-7 h-7 rounded-full border border-white/50 flex items-center justify-center text-secondary-6 hover:bg-white/30 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-bold text-neutral-7">
          {MONTHS_LONG[month]} {year}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="w-7 h-7 rounded-full border border-white/50 flex items-center justify-center text-secondary-6 hover:bg-white/30 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-secondary-6/70 py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {grid.map(({ dateStr, inMonth }) => {
          const isToday = dateStr === todayStr;
          const isPast = dateStr < todayStr;
          const tripId = activeTripDayMap[dateStr];
          const isActiveTripDay = !!tripId && inMonth;
          const isPastTripDay = !isActiveTripDay && pastTripDaySet.has(dateStr) && inMonth;
          const actCount = isActiveTripDay ? (activitiesByDate[dateStr]?.length ?? 0) : 0;
          const dayNum = parseDate(dateStr).getDate();

          if (!inMonth) {
            return <div key={dateStr} className="h-9" />;
          }

          let cellClass = 'relative flex flex-col items-center justify-center rounded-lg h-9 transition-all ';

          if (isActiveTripDay) {
            cellClass += isToday
              ? 'bg-secondary-5 cursor-pointer hover:bg-secondary-6'
              : 'bg-secondary-1/60 border border-secondary-4 hover:bg-secondary-1 cursor-pointer';
          } else if (isPastTripDay || (isPast && !isToday)) {
            cellClass += 'cursor-default opacity-40';
          } else {
            cellClass += isToday ? 'cursor-default' : 'cursor-default hover:bg-white/20';
          }

          let dayNumClass = 'text-xs font-bold leading-none ';
          if (isActiveTripDay) {
            dayNumClass += isToday ? 'text-white' : 'text-secondary-6';
          } else {
            dayNumClass += isToday ? 'text-primary-3 font-extrabold' : 'text-secondary-6';
          }

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => tripId && navigate(`/trips/${tripId}`)}
              className={cellClass}
            >
              {isToday && !isActiveTripDay && (
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-primary-3" />
              )}
              <span className={dayNumClass}>{dayNum}</span>
              {actCount > 0 && (
                <span className="absolute -top-1 -right-1 text-[9px] font-bold bg-primary-3 text-white rounded-full min-w-3.75 h-3.75 flex items-center justify-center leading-none px-0.5">
                  {actCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
