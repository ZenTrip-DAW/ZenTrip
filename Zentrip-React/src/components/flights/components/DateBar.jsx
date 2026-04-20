import { useState, useRef, useEffect } from 'react';
import { getFlights } from '../../../services/flightService';
import { toPrice, fmt, addDays, todayStr } from './flightUtils';
import { IcChevLeft, IcChevRight } from './flightIcons';

export default function DateBar({ baseDate, fromId, toId, cabinClass, activeDateStr, onSelectDate, currencyCode = 'EUR' }) {
  const [prices, setPrices] = useState({});
  const [offset, setOffset] = useState(0);
  const priceCacheRef = useRef(new Map());

  // Solo muestra fechas >= hoy; calcula ventana de 7 días centrada en offset
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(baseDate, offset - 3 + i);
    return d < todayStr ? null : d;
  });

  const validDays = days.filter(Boolean);

  // Impide retroceder más allá de hoy
  const leftmostNext = addDays(baseDate, offset - 4);
  const canGoLeftActual = leftmostNext >= todayStr;

  useEffect(() => {
    if (!fromId || !toId || validDays.length === 0) return;

    let cancelled = false;
    const routeKey = `${fromId}|${toId}|${cabinClass}`;

    // Primero muestra lo que ya está en caché
    const cachedSnapshot = {};
    validDays.forEach((d) => {
      const cacheKey = `${routeKey}|${d}`;
      cachedSnapshot[d] = priceCacheRef.current.has(cacheKey) ? priceCacheRef.current.get(cacheKey) : undefined;
    });
    setPrices(cachedSnapshot);

    const fetchPrices = async () => {
      const unfetched = validDays.filter((d) => {
        const cacheKey = `${routeKey}|${d}`;
        return !priceCacheRef.current.has(cacheKey);
      });
      if (unfetched.length === 0) return;

      const results = await Promise.allSettled(
        unfetched.map(async (d) => {
          const res = await getFlights({
            fromId,
            toId,
            departDate: d,
            adults: 1,
            sort: 'CHEAPEST',
            cabinClass,
            currencyCode,
            pageNo: 1,
          });
          const firstOffer = res?.data?.flightOffers?.[0];
          const p = firstOffer?.priceBreakdown?.total;
          return { date: d, price: p ? toPrice(p) : null };
        })
      );

      if (cancelled) return;

      const updates = {};
      results.forEach((result, index) => {
        const d = unfetched[index];
        const cacheKey = `${routeKey}|${d}`;
        const value = result.status === 'fulfilled' ? result.value.price : null;
        priceCacheRef.current.set(cacheKey, value);
        updates[d] = value;
      });

      setPrices((prev) => ({ ...prev, ...updates }));
    };

    fetchPrices();
    return () => { cancelled = true; };
  }, [fromId, toId, cabinClass, offset, baseDate]);

  // Al cambiar ruta o cabina, recentra la barra para mostrar precios útiles antes
  useEffect(() => {
    setOffset(0);
  }, [fromId, toId, cabinClass, baseDate]);

  const priceValues = Object.values(prices).filter(Number.isFinite);
  const minPrice = priceValues.length ? Math.min(...priceValues) : null;

  return (
    <div className="bg-white border border-neutral-1 rounded-2xl px-2 py-2.5">
      <div className="flex items-center gap-1">
        <button
          onClick={() => setOffset(o => o - 1)}
          disabled={!canGoLeftActual}
          className="cursor-pointer w-8 h-8 rounded-full border border-neutral-2 flex items-center justify-center hover:bg-neutral-1 shrink-0 disabled:opacity-30 disabled:cursor-default"
        >
          <IcChevLeft size={13} color="#7A7270" />
        </button>

        <div className="flex-1 flex gap-1 overflow-hidden">
          {days.map((d, i) => {
            if (!d) return <div key={i} className="flex-1" />;
            const price = prices[d];
            const isActive = d === activeDateStr;
            const isCheapest = minPrice !== null && Number.isFinite(price) && price === minPrice;
            const dt = new Date(d + 'T12:00:00');
            const weekday = dt.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '').toUpperCase();
            const dayNum = dt.getDate();
            const month = dt.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '').toUpperCase();

            return (
              <button
                key={d}
                onClick={() => onSelectDate(d)}
                className={`cursor-pointer flex-1 flex flex-col items-center py-2 px-0.5 rounded-xl transition-all border ${
                  isActive
                    ? 'bg-secondary-3 border-secondary-3 text-white'
                    : isCheapest
                      ? 'bg-auxiliary-green-1 border-auxiliary-green-2 text-auxiliary-green-6'
                      : 'border-transparent hover:bg-neutral-1 text-neutral-6'
                }`}
              >
                <span className="tracking-wide font-semibold" style={{ fontSize: 9, opacity: isActive ? 0.85 : 0.7 }}>
                  {weekday}
                </span>
                <span className="font-titles font-bold leading-none mt-0.5" style={{ fontSize: 18 }}>
                  {dayNum}
                </span>
                <span className="tracking-wide" style={{ fontSize: 9, opacity: isActive ? 0.8 : 0.6 }}>
                  {month}
                </span>
                <div className="mt-1 h-4 flex items-center justify-center">
                  {price === undefined
                    ? <div className={`w-7 h-1.5 rounded animate-pulse ${isActive ? 'bg-white/30' : 'bg-neutral-2'}`} />
                    : price === null
                      ? <span style={{ fontSize: 8 }} className={isActive ? 'text-white/50' : 'text-neutral-3'}>–</span>
                      : <span className="font-bold" style={{ fontSize: 10 }}>{fmt(price, 'EUR')}</span>
                  }
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setOffset(o => o + 1)}
          className="cursor-pointer w-8 h-8 rounded-full border border-neutral-2 flex items-center justify-center hover:bg-neutral-1 shrink-0"
        >
          <IcChevRight size={13} color="#7A7270" />
        </button>
      </div>
    </div>
  );
}
