import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFlightDestinations, getFlights, getFlightsMultiStops } from '../../services/flightService';
import { useAuth } from '../../context/AuthContext';
import { getUserTrips } from '../../services/tripService';
import { getFlightErrorMessage } from '../../utils/errors/flightErrors';

// ── Helpers ───────────────────────────────────────────────────────────────────
const toPrice = (p) => (p?.units ?? 0) + (p?.nanos ?? 0) / 1e9;
const fmt = (amount, currency = 'EUR') => {
  try {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
};
const secToHM = (s) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${m}m`;
};
const minToHM = (min) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${m}m`;
};
const fmtTime = (dt) => dt?.slice(11, 16) ?? '--:--';
const fmtDate = (dt) => {
  if (!dt) return '';
  return new Date(dt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
};
const getLegsWithStops = (seg) => seg?.legs ?? [];
const getStops = (offer) => {
  const seg = offer.segments[0];
  if (!seg) return 0;
  return (seg.legs.length - 1) + seg.legs.reduce((a, l) => a + (l.flightStops?.length ?? 0), 0);
};
const getSegmentStops = (seg) => {
  if (!seg?.legs?.length) return 0;
  return (seg.legs.length - 1) + seg.legs.reduce((a, l) => a + (l.flightStops?.length ?? 0), 0);
};
const getSegmentStopDetails = (seg) => {
  const legs = seg?.legs ?? [];
  if (legs.length <= 1) return null;
  return legs.slice(0, -1).map((leg, i) => {
    const nextLeg = legs[i + 1];
    const arrMs = new Date(leg.arrivalTime).getTime();
    const depMs = new Date(nextLeg?.departureTime).getTime();
    const diffMin = Math.round((depMs - arrMs) / 60000);
    return {
      city: leg.arrivalAirport?.cityName ?? leg.arrivalAirport?.code ?? '?',
      waitMin: Number.isFinite(diffMin) && diffMin > 0 ? diffMin : null,
    };
  });
};
const getCheckin = (offer, segIdx = 0) => {
  const ip = offer.includedProducts;
  const list = ip?.areAllSegmentsIdentical ? (ip.segments[0] ?? []) : (ip?.segments[segIdx] ?? []);
  return list?.find((b) => b.luggageType === 'CHECKED_IN');
};
const getHand = (offer, segIdx = 0) => {
  const ip = offer.includedProducts;
  const list = ip?.areAllSegmentsIdentical ? (ip.segments[0] ?? []) : (ip?.segments[segIdx] ?? []);
  return list?.find((b) => b.luggageType === 'HAND');
};
const addDays = (dateStr, n) => {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
};
const todayStr = new Date().toISOString().split('T')[0];

// ── Icons ─────────────────────────────────────────────────────────────────────
// Plane: Material Design "flight" filled icon — clearly recognizable
const IcPlaneFly = ({ size = 16, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
  </svg>
);
const IcSwap = ({ size = 16, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
  </svg>
);
const IcChevDown = ({ size = 14, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const IcChevLeft = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const IcChevRight = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
const IcBag = ({ size = 14, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="8" width="18" height="14" rx="2" />
    <path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);
const IcCheck = ({ size = 14, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IcX = ({ size = 14, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IcUser = ({ size = 16, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);
const IcChild = ({ size = 16, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="5" r="3" /><path d="M9 20v-5H7l2-6h6l2 6h-2v5" />
  </svg>
);
const IcSeat = ({ size = 14, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" />
    <path d="M3 11v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H7v-2a2 2 0 0 0-4 0z" />
    <path d="M5 18v2M19 18v2" />
  </svg>
);
const IcFilter = ({ size = 16, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" />
    <line x1="11" y1="18" x2="13" y2="18" />
  </svg>
);
const IcClock = ({ size = 14, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);
const IcPlane = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
  </svg>
);
const IcPlus = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IcCreditCard = ({ size = 16, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="1" y="4" width="22" height="16" rx="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);
const IcTrash = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);
const IcWifi = ({ size = 13, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0" />
    <circle cx="12" cy="20" r="1" fill={color} />
  </svg>
);

// ── AirportInput ──────────────────────────────────────────────────────────────
const AirportInput = ({ label, displayValue, onSelect, placeholder }) => {
  const [query, setQuery] = useState(displayValue);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timerRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => { setQuery(displayValue); }, [displayValue]);

  useEffect(() => {
    const h = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    onSelect({ id: '', label: val, code: '', cityName: val });
    clearTimeout(timerRef.current);
    if (val.length < 2) { setSuggestions([]); setOpen(false); return; }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await getFlightDestinations(val);
        const items = (res?.data ?? []).filter((i) => i.type === 'AIRPORT');
        setSuggestions(items);
        setOpen(items.length > 0);
      } catch { setSuggestions([]); setOpen(false); }
      finally { setLoading(false); }
    }, 350);
  };

  const handleSelect = (item) => {
    const lbl = `${item.cityName} (${item.code})`;
    setQuery(lbl);
    setSuggestions([]);
    setOpen(false);
    onSelect({ id: item.id, label: lbl, code: item.code, cityName: item.cityName });
  };

  return (
    <div ref={wrapRef} className="flex-1 relative">
      <label className="absolute -top-2 left-3 bg-white px-1 body-3 text-neutral-4 z-10">{label}</label>
      <div className="flex items-center gap-2 border border-neutral-2 rounded-xl px-3 py-3 focus-within:border-secondary-3 transition-colors">
        <IcPlaneFly size={15} color="#A19694" />
        <input value={query} onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="flex-1 body-2 text-neutral-7 placeholder:text-neutral-3 bg-transparent border-none outline-none" />
        {loading && <div className="w-4 h-4 border-2 border-secondary-3 border-t-transparent rounded-full animate-spin shrink-0" />}
      </div>
      {open && suggestions.length > 0 && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 bg-white border border-neutral-1 rounded-2xl shadow-xl overflow-hidden max-h-64 overflow-y-auto">
          {suggestions.map((item) => (
            <button key={item.id} onClick={() => handleSelect(item)}
              className="cursor-pointer w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-1 transition-colors text-left border-b border-neutral-1 last:border-0">
              <div className="w-9 h-9 rounded-xl bg-secondary-1 flex items-center justify-center shrink-0">
                <span className="body-3 font-bold text-secondary-4">{item.code}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="body-2-semibold text-neutral-7 truncate">{item.cityName}</p>
                <p className="body-3 text-neutral-4 truncate">{item.name}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── DateBar ───────────────────────────────────────────────────────────────────
const DateBar = ({ baseDate, fromId, toId, cabinClass, activeDateStr, onSelectDate }) => {
  const [prices, setPrices] = useState({});
  const [offset, setOffset] = useState(0);
  const priceCacheRef = useRef(new Map());

  // Only show dates >= today; compute center safely
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(baseDate, offset - 3 + i);
    return d < todayStr ? null : d;
  });

  const validDays = days.filter(Boolean);

  // Prevent going left past today
  const leftmostNext = addDays(baseDate, offset - 4);
  const canGoLeftActual = leftmostNext >= todayStr;

  useEffect(() => {
    if (!fromId || !toId || validDays.length === 0) return;

    let cancelled = false;
    const routeKey = `${fromId}|${toId}|${cabinClass}`;

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
            currencyCode: 'EUR',
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
    return () => {
      cancelled = true;
    };
  }, [fromId, toId, cabinClass, offset, baseDate]);

  useEffect(() => {
    // Si cambia ruta/cabina, recentramos la barra para que el usuario vea antes precios útiles.
    setOffset(0);
  }, [fromId, toId, cabinClass, baseDate]);

  const priceValues = Object.values(prices).filter(Number.isFinite);
  const minPrice = priceValues.length ? Math.min(...priceValues) : null;

  return (
    <div className="bg-white border border-neutral-1 rounded-2xl px-2 py-2.5">
      <div className="flex items-center gap-1">
        <button onClick={() => setOffset(o => o - 1)} disabled={!canGoLeftActual}
          className="cursor-pointer w-8 h-8 rounded-full border border-neutral-2 flex items-center justify-center hover:bg-neutral-1 shrink-0 disabled:opacity-30 disabled:cursor-default">
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
              <button key={d} onClick={() => onSelectDate(d)}
                className={`cursor-pointer flex-1 flex flex-col items-center py-2 px-0.5 rounded-xl transition-all border ${
                  isActive
                    ? 'bg-secondary-3 border-secondary-3 text-white'
                    : isCheapest
                      ? 'bg-auxiliary-green-1 border-auxiliary-green-2 text-auxiliary-green-6'
                      : 'border-transparent hover:bg-neutral-1 text-neutral-6'
                }`}>
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
        <button onClick={() => setOffset(o => o + 1)}
          className="cursor-pointer w-8 h-8 rounded-full border border-neutral-2 flex items-center justify-center hover:bg-neutral-1 shrink-0">
          <IcChevRight size={13} color="#7A7270" />
        </button>
      </div>
    </div>
  );
};

// ── PassengerDropdown ─────────────────────────────────────────────────────────
const PassengerDropdown = ({ pax, onChange, onClose }) => {
  const [local, setLocal] = useState({ ...pax });

  const counter = (key, min, max) => (
    <div className="flex items-center gap-3">
      <button onClick={() => setLocal(p => ({ ...p, [key]: Math.max(min, p[key] - 1) }))}
        disabled={local[key] <= min}
        className="cursor-pointer w-9 h-9 rounded-full border-2 border-secondary-3 flex items-center justify-center text-secondary-3 text-lg font-bold hover:bg-secondary-1 transition-colors disabled:opacity-30">−</button>
      <span className="body-semibold text-neutral-7 w-5 text-center">{local[key]}</span>
      <button onClick={() => setLocal(p => ({ ...p, [key]: Math.min(max, p[key] + 1) }))}
        disabled={local[key] >= max}
        className="cursor-pointer w-9 h-9 rounded-full bg-secondary-3 flex items-center justify-center text-white text-lg font-bold hover:bg-secondary-4 transition-colors disabled:opacity-30">+</button>
    </div>
  );

  const rows = [
    { key: 'adults', label: 'Adultos', sub: '12+ años', min: 1, max: 9 },
    { key: 'youth', label: 'Jóvenes', sub: '2–11 años', min: 0, max: 6 },
    { key: 'infants', label: 'Bebés', sub: 'Menos de 2 años', min: 0, max: local.adults },
  ];

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-neutral-7/20" />
      <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-sm p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="title-h3-desktop text-neutral-7">Pasajeros</h3>
          <button onClick={onClose} className="cursor-pointer w-8 h-8 rounded-full bg-neutral-1 flex items-center justify-center hover:bg-neutral-2 transition-colors">
            <IcX size={15} color="#7A7270" />
          </button>
        </div>
        {rows.map(({ key, label, sub, min, max }) => (
          <div key={key} className="flex items-center justify-between py-3 border-b border-neutral-1 last:border-0">
            <div>
              <p className="body-semibold text-neutral-7">{label}</p>
              <p className="body-3 text-neutral-4">{sub}</p>
            </div>
            {counter(key, min, max)}
          </div>
        ))}
        <button onClick={() => { onChange(local); onClose(); }}
          className="cursor-pointer w-full py-3 bg-primary-3 text-white rounded-full body-semibold hover:bg-primary-4 transition-colors">
          Confirmar
        </button>
      </div>
    </div>
  );
};

// ── FlightDetailDrawer ────────────────────────────────────────────────────────
const FlightDetailDrawer = ({ offer, onClose, onPurchase }) => {
  if (!offer) return null;
  const currency = offer.priceBreakdown?.total?.currencyCode ?? 'EUR';
  const total = toPrice(offer.priceBreakdown?.total);

  return (
    <div className="fixed inset-0 z-200 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-neutral-7/30" />
      <div className="relative bg-white w-full max-w-md h-full flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-1 shrink-0">
          <div>
            <h3 className="title-h3-desktop text-neutral-7">Detalles del vuelo</h3>
            {/* Fix: show outbound origin → outbound destination, not round-trip endpoint */}
            <p className="body-3 text-neutral-4 mt-0.5">
              {offer.segments[0]?.departureAirport?.cityName} → {offer.segments[0]?.arrivalAirport?.cityName}
            </p>
          </div>
          <button onClick={onClose} className="cursor-pointer w-9 h-9 rounded-full bg-neutral-1 flex items-center justify-center hover:bg-neutral-2 transition-colors">
            <IcX size={16} color="#7A7270" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {offer.segments.map((seg, si) => {
            const isReturn = si > 0;
            const checkin = getCheckin(offer, si);
            const hand = getHand(offer, si);
            const legs = getLegsWithStops(seg);

            return (
              <div key={si}>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full body-3 font-semibold mb-4 ${isReturn ? 'bg-primary-1 text-primary-4' : 'bg-secondary-1 text-secondary-4'}`}>
                  <IcPlaneFly size={12} color={isReturn ? '#C35001' : '#016FC1'} />
                  {isReturn ? 'Regreso' : 'Ida'} · {fmtDate(seg.departureTime)}
                </div>

                <div className="space-y-0">
                  {legs.map((leg, li) => {
                    const carrier = leg?.carriersData?.[0];
                    const isFirst = li === 0;
                    const isLast = li === legs.length - 1;
                    const stopTime = !isLast
                      ? (() => {
                          const arrMs = new Date(leg.arrivalTime).getTime();
                          const nextDepMs = new Date(legs[li + 1]?.departureTime).getTime();
                          const diffMin = Math.round((nextDepMs - arrMs) / 60000);
                          return Number.isFinite(diffMin) && diffMin > 0 ? diffMin : null;
                        })()
                      : null;

                    return (
                      <div key={li}>
                        {/* Punto de salida — solo para el primer tramo */}
                        {isFirst && (
                          <div className="flex items-start gap-3">
                            <div className="flex flex-col items-center shrink-0" style={{ width: 14 }}>
                              <div className="w-3.5 h-3.5 rounded-full bg-secondary-3 border-2 border-white shrink-0 mt-1.5" />
                              <div className="w-0.5 bg-neutral-2 flex-1 mt-1" style={{ minHeight: 32 }} />
                            </div>
                            <div className="pb-3 flex-1">
                              <p className="font-titles font-bold text-neutral-7" style={{ fontSize: 20, lineHeight: 1.1 }}>{fmtTime(leg.departureTime)}</p>
                              <p className="body-2-semibold text-neutral-6">{leg.departureAirport?.cityName} · {leg.departureAirport?.code}</p>
                              {leg.departureAirport?.name && (
                                <p className="body-3 text-neutral-4">{leg.departureAirport.name}{leg.departureTerminal ? ` · T${leg.departureTerminal}` : ''}</p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Info del vuelo */}
                        <div className="flex items-stretch gap-3">
                          <div className="flex flex-col items-center shrink-0" style={{ width: 14 }}>
                            <div className="w-0.5 bg-neutral-2 flex-1" />
                          </div>
                          <div className="flex-1 bg-neutral-1 rounded-xl px-3 py-2.5 my-1 mb-2 space-y-1">
                            <div className="flex items-center gap-2">
                              {carrier?.logo && <img src={carrier.logo} alt={carrier.name} className="w-5 h-5 object-contain" />}
                              <span className="body-3 font-semibold text-neutral-7">{carrier?.name} · {carrier?.code}{leg?.flightInfo?.flightNumber}</span>
                            </div>
                            <div className="flex items-center gap-3 body-3 text-neutral-5 flex-wrap">
                              <span className="flex items-center gap-1"><IcClock size={12} color="#A19694" />{secToHM(leg.totalTime ?? 0)}</span>
                              {leg.flightInfo?.planeType && <span>· {leg.flightInfo.planeType}</span>}
                              {leg.cabinClass && <span>· {leg.cabinClass}</span>}
                            </div>
                            {leg.amenities && Object.keys(leg.amenities).length > 0 && (
                              <div className="flex flex-wrap gap-2 pt-1">
                                {leg.amenities.wifi?.isAvailable && (
                                  <span className="flex items-center gap-1 body-3 text-secondary-4">
                                    <IcWifi size={12} color="#016FC1" /> Wi-Fi
                                  </span>
                                )}
                                {leg.amenities.seatLegroom && (
                                  <span className="body-3 text-neutral-5">{leg.amenities.seatLegroom} cm espacio</span>
                                )}
                                {leg.amenities.usbPower && <span className="body-3 text-neutral-5">USB</span>}
                                {leg.amenities.videoStreaming && <span className="body-3 text-neutral-5">Video</span>}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Punto de llegada — naranja en escalas, azul en destino final */}
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col items-center shrink-0" style={{ width: 14 }}>
                            <div className={`w-3.5 h-3.5 rounded-full border-2 border-white shrink-0 mt-1.5 ${isLast ? 'bg-secondary-3' : 'bg-primary-3'}`} />
                            {!isLast && <div className="w-0.5 bg-neutral-2 flex-1 mt-1" style={{ minHeight: 16 }} />}
                          </div>
                          <div className={`${!isLast ? 'pb-2' : ''} flex-1`}>
                            <p className="font-titles font-bold text-neutral-7" style={{ fontSize: 20, lineHeight: 1.1 }}>{fmtTime(leg.arrivalTime)}</p>
                            <p className="body-2-semibold text-neutral-6">{leg.arrivalAirport?.cityName} · {leg.arrivalAirport?.code}</p>
                            {leg.arrivalAirport?.name && (
                              <p className="body-3 text-neutral-4">{leg.arrivalAirport.name}{leg.arrivalTerminal ? ` · T${leg.arrivalTerminal}` : ''}</p>
                            )}
                          </div>
                        </div>

                        {/* Escala + salida desde la escala */}
                        {!isLast && (
                          <>
                            <div className="flex items-stretch gap-3">
                              <div className="flex flex-col items-center shrink-0" style={{ width: 14 }}>
                                <div className="flex-1 border-l border-dashed border-primary-2" />
                              </div>
                              <div className="flex-1 bg-primary-1 border border-primary-2 rounded-xl px-3 py-2 my-2">
                                <p className="body-3 text-primary-4 font-semibold">
                                  {stopTime ? `${minToHM(stopTime)} de escala` : 'Escala'} · {leg.arrivalAirport?.cityName ?? leg.arrivalAirport?.code}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <div className="flex flex-col items-center shrink-0" style={{ width: 14 }}>
                                <div className="w-3.5 h-3.5 rounded-full bg-primary-3 border-2 border-white shrink-0 mt-1.5" />
                                <div className="w-0.5 bg-neutral-2 flex-1 mt-1" style={{ minHeight: 32 }} />
                              </div>
                              <div className="pb-3 flex-1">
                                <p className="font-titles font-bold text-neutral-7" style={{ fontSize: 20, lineHeight: 1.1 }}>{fmtTime(legs[li + 1].departureTime)}</p>
                                <p className="body-2-semibold text-neutral-6">{legs[li + 1].departureAirport?.cityName} · {legs[li + 1].departureAirport?.code}</p>
                                {legs[li + 1].departureAirport?.name && (
                                  <p className="body-3 text-neutral-4">{legs[li + 1].departureAirport.name}{legs[li + 1].departureTerminal ? ` · T${legs[li + 1].departureTerminal}` : ''}</p>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Equipaje */}
                <div className="mt-4 border border-neutral-1 rounded-2xl overflow-hidden">
                  <div className="px-4 py-2.5 bg-neutral-1">
                    <p className="body-3 font-semibold text-neutral-6">Equipaje incluido</p>
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    {checkin ? (
                      <div className="flex items-center gap-2">
                        <IcCheck size={13} color="#2E7D32" />
                        <span className="body-3 text-neutral-7">
                          Maleta facturada{checkin.maxPiece ? ` · ${checkin.maxPiece} pieza${checkin.maxPiece > 1 ? 's' : ''}` : ''}
                          {checkin.maxWeightPerPiece ? ` · ${checkin.maxWeightPerPiece}${checkin.massUnit ?? 'KG'}` : ''}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <IcX size={13} color="#DC2626" /><span className="body-3 text-neutral-5">Sin maleta facturada</span>
                      </div>
                    )}
                    {hand ? (
                      <div className="flex items-center gap-2">
                        <IcCheck size={13} color="#2E7D32" />
                        <span className="body-3 text-neutral-7">
                          Equipaje de mano{hand.maxPiece ? ` · ${hand.maxPiece} pieza${hand.maxPiece > 1 ? 's' : ''}` : ''}
                          {hand.maxWeightPerPiece ? ` · ${hand.maxWeightPerPiece}${hand.massUnit ?? 'KG'}` : ''}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <IcX size={13} color="#DC2626" /><span className="body-3 text-neutral-5">Sin equipaje de mano</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Precio por pasajero */}
          {offer.travellerPrices?.length > 0 && (
            <div className="border border-neutral-1 rounded-2xl overflow-hidden">
              <div className="px-4 py-2.5 bg-neutral-1">
                <p className="body-3 font-semibold text-neutral-6">Precio por pasajero</p>
              </div>
              {offer.travellerPrices.map((tp, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 border-t border-neutral-1">
                  <div className="flex items-center gap-2">
                    {tp.travellerType === 'ADULT' ? <IcUser size={14} color="#A19694" /> : <IcChild size={14} color="#A19694" />}
                    <span className="body-2 text-neutral-6">
                      {tp.travellerType === 'ADULT' ? `Adulto ${tp.travellerReference}` : `Niño ${tp.travellerReference}`}
                    </span>
                  </div>
                  <span className="body-2-semibold text-neutral-7">{fmt(toPrice(tp.travellerPriceBreakdown?.total), currency)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between px-4 py-3 bg-secondary-1 border-t border-secondary-2">
                <span className="body-semibold text-secondary-5">Total del viaje</span>
                <span className="title-h3-desktop text-secondary-4">{fmt(total, currency)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-neutral-1 shrink-0">
          <button onClick={() => { onPurchase(offer); onClose(); }}
            className="cursor-pointer w-full py-3.5 bg-primary-3 text-white rounded-full body-bold hover:bg-primary-4 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            <IcCreditCard size={16} color="white" />
            Comprar vuelo · {fmt(total, currency)}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── PurchaseModal ─────────────────────────────────────────────────────────────
const PurchaseModal = ({ offer, onClose, onSave }) => {
  const [step, setStep] = useState('summary'); // summary | payment | done
  const [paying, setPaying] = useState(false);
  const bookingRef = useRef(`ZT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`);

  if (!offer) return null;
  const currency = offer.priceBreakdown?.total?.currencyCode ?? 'EUR';
  const total = toPrice(offer.priceBreakdown?.total);
  const seg0 = offer.segments[0];

  const handlePay = () => {
    setPaying(true);
    setTimeout(() => { setPaying(false); setStep('done'); }, 1500);
  };

  return (
    <div className="fixed inset-0 z-300 flex items-center justify-center p-4" onClick={step !== 'done' ? onClose : undefined}>
      <div className="absolute inset-0 bg-neutral-7/50" />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}>

        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-neutral-1 shrink-0">
          <h3 className="title-h3-desktop text-neutral-7">
            {step === 'summary' && 'Resumen del vuelo'}
            {step === 'payment' && 'Pago simulado'}
            {step === 'done' && '¡Reserva confirmada!'}
          </h3>
          {step !== 'done' && (
            <button onClick={onClose} className="cursor-pointer w-8 h-8 rounded-full bg-neutral-1 flex items-center justify-center hover:bg-neutral-2 transition-colors">
              <IcX size={15} color="#7A7270" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Resumen siempre visible */}
          <div className="bg-secondary-1 rounded-2xl px-4 py-3 flex items-center gap-3">
            <IcPlane size={20} color="#016FC1" />
            <div className="flex-1 min-w-0">
              <p className="body-2-semibold text-neutral-7">
                {seg0?.departureAirport?.code} → {seg0?.arrivalAirport?.code}
              </p>
              <p className="body-3 text-neutral-4">
                {fmtDate(seg0?.departureTime)} · {seg0?.legs[0]?.carriersData?.[0]?.name}
              </p>
            </div>
            <p className="font-titles font-bold text-neutral-7" style={{ fontSize: 18 }}>{fmt(total, currency)}</p>
          </div>

          {step === 'summary' && (
            <div className="space-y-3">
              <div className="border border-neutral-1 rounded-2xl p-4 space-y-2">
                {offer.travellerPrices?.map((tp, i) => (
                  <div key={i} className="flex justify-between body-3 text-neutral-6">
                    <span>{tp.travellerType === 'ADULT' ? 'Adulto' : 'Niño'} {tp.travellerReference}</span>
                    <span className="font-semibold">{fmt(toPrice(tp.travellerPriceBreakdown?.total), currency)}</span>
                  </div>
                ))}
                <div className="flex justify-between body-semibold text-neutral-7 pt-2 border-t border-neutral-1">
                  <span>Total</span>
                  <span>{fmt(total, currency)}</span>
                </div>
              </div>
            </div>
          )}

          {step === 'payment' && (
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="body-3 text-neutral-5">Número de tarjeta</label>
                <div className="border border-neutral-2 rounded-xl px-3 py-3 body-2 text-neutral-7 bg-neutral-1 select-none tracking-widest">
                  4242 4242 4242 4242
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1 space-y-2">
                  <label className="body-3 text-neutral-5">Caducidad</label>
                  <div className="border border-neutral-2 rounded-xl px-3 py-3 body-2 text-neutral-7 bg-neutral-1 select-none">12/28</div>
                </div>
                <div className="w-24 space-y-2">
                  <label className="body-3 text-neutral-5">CVV</label>
                  <div className="border border-neutral-2 rounded-xl px-3 py-3 body-2 text-neutral-7 bg-neutral-1 select-none">···</div>
                </div>
              </div>
            </div>
          )}

          {step === 'done' && (
            <div className="flex flex-col items-center py-4 gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-auxiliary-green-1 flex items-center justify-center">
                <IcCheck size={28} color="#2E7D32" />
              </div>
              <div>
                <p className="body-semibold text-neutral-7">Tu vuelo ha sido reservado</p>
                <p className="body-3 text-neutral-4 mt-1">Referencia: <span className="font-bold text-neutral-7">{bookingRef.current}</span></p>
              </div>
              <div className="bg-neutral-1 rounded-2xl px-4 py-3 w-full text-left space-y-1">
                <p className="body-3 text-neutral-4">Vuelo</p>
                <p className="body-2-semibold text-neutral-7">{seg0?.departureAirport?.cityName} → {seg0?.arrivalAirport?.cityName}</p>
                <p className="body-3 text-neutral-5">{fmtDate(seg0?.departureTime)} · {fmt(total, currency)}</p>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-neutral-1 shrink-0">
          {step === 'summary' && (
            <button onClick={() => setStep('payment')}
              className="cursor-pointer w-full py-3.5 bg-primary-3 text-white rounded-full body-bold hover:bg-primary-4 transition-all flex items-center justify-center gap-2">
              <IcCreditCard size={16} color="white" />
              Continuar al pago
            </button>
          )}
          {step === 'payment' && (
            <button onClick={handlePay} disabled={paying}
              className="cursor-pointer w-full py-3.5 bg-primary-3 text-white rounded-full body-bold hover:bg-primary-4 transition-all disabled:opacity-70 flex items-center justify-center gap-2">
              {paying
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><IcCheck size={16} color="white" /> Confirmar compra · {fmt(total, currency)}</>
              }
            </button>
          )}
          {step === 'done' && (
            <div className="space-y-2">
              <button onClick={() => { onSave(offer); onClose(); }}
                className="cursor-pointer w-full py-3.5 bg-secondary-3 text-white rounded-full body-bold hover:bg-secondary-4 transition-all flex items-center justify-center gap-2">
                <IcPlane size={15} color="white" />
                Añadir al viaje
              </button>
              <button onClick={onClose}
                className="cursor-pointer w-full py-2.5 body-3 font-semibold text-neutral-4 hover:text-neutral-6 transition-colors">
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── FlightCard ────────────────────────────────────────────────────────────────
const FlightCard = ({ offer, isBest, onShowDetail, onPurchase }) => {
  const currency = offer.priceBreakdown?.total?.currencyCode ?? 'EUR';
  const total = toPrice(offer.priceBreakdown?.total);
  const adultP = offer.travellerPrices?.find((t) => t.travellerType === 'ADULT');
  const kidPs = offer.travellerPrices?.filter((t) => t.travellerType === 'KID') ?? [];
  const stops = getStops(offer);
  const seats = offer.seatAvailability?.numberOfSeatsAvailable;
  const seg0 = offer.segments[0];
  const segR = offer.segments.length > 1 ? offer.segments[offer.segments.length - 1] : null;
  const segRStops = segR ? getSegmentStops(segR) : 0;
  const carrier = seg0?.legs[0]?.carriersData?.[0];
  const checkin = getCheckin(offer, 0);
  const hand = getHand(offer, 0);
  const hasFlex = offer.extraProducts?.some((e) => e.type === 'flexibleTicket');

  const stopDetails = getSegmentStopDetails(seg0);
  const stopDetailsReturn = getSegmentStopDetails(segR);

  return (
    <div className={`bg-white rounded-2xl border transition-all ${isBest ? 'border-primary-3' : 'border-neutral-1 hover:border-secondary-2 hover:shadow-sm'}`}>
      {isBest && (
        <div className="flex items-center gap-2 px-5 py-2 bg-primary-1 rounded-t-2xl border-b border-primary-2">
          <IcPlaneFly size={12} color="#C35001" />
          <span className="body-3 font-bold text-primary-4 uppercase tracking-wide">Mejor opción</span>
        </div>
      )}

      <div className="px-5 py-4">
        <div className="flex items-center gap-4">
          {/* Aerolínea */}
          <div className="flex flex-col items-center gap-1 shrink-0 w-16">
            {carrier?.logo
              ? <img src={carrier.logo} alt={carrier.name} className="w-10 h-10 object-contain rounded-xl border border-neutral-1 p-1" />
              : <div className="w-10 h-10 rounded-xl bg-secondary-1 flex items-center justify-center body-3 font-bold text-secondary-4">{carrier?.code}</div>
            }
            <p className="body-3 text-neutral-4 text-center leading-tight" style={{ fontSize: 10 }}>{carrier?.name}</p>
          </div>

          {/* Segmento IDA */}
          <div className="flex-1 flex items-center gap-2">
            <div className="text-center">
              <p className="font-titles font-bold text-neutral-7" style={{ fontSize: 24, lineHeight: 1 }}>{fmtTime(seg0?.departureTime)}</p>
              <p className="body-3 font-semibold text-neutral-5">{seg0?.departureAirport?.code}</p>
            </div>
            <div className="flex-1 flex flex-col items-center gap-0.5">
              <p className="body-3 text-neutral-4">{secToHM(seg0?.totalTime ?? 0)}</p>
              <div className="flex items-center w-full gap-1">
                <div className="flex-1 border-t-2 border-dashed border-neutral-2" />
                <IcPlaneFly size={14} color="#0194FE" />
                <div className="flex-1 border-t-2 border-dashed border-neutral-2" />
              </div>
              <p className={`body-3 font-semibold ${stops === 0 ? 'text-auxiliary-green-5' : 'text-primary-3'}`}>
                {stops === 0 ? 'Directo' : `${stops} escala${stops > 1 ? 's' : ''}`}
              </p>
              {stopDetails && stopDetails.length > 0 && (
                <p className="body-3 text-neutral-4" style={{ fontSize: 9 }}>
                  {stopDetails.map(s => `${s.city}${s.waitMin ? ` ${minToHM(s.waitMin)}` : ''}`).join(' · ')}
                </p>
              )}
            </div>
            <div className="text-center">
              <p className="font-titles font-bold text-neutral-7" style={{ fontSize: 24, lineHeight: 1 }}>{fmtTime(seg0?.arrivalTime)}</p>
              <p className="body-3 font-semibold text-neutral-5">{seg0?.arrivalAirport?.code}</p>
            </div>
          </div>

          {/* Vuelta */}
          {segR && (
            <>
              <div className="w-px h-12 bg-neutral-1 shrink-0" />
              <div className="flex-1 flex items-center gap-2">
                <div className="text-center">
                  <p className="font-titles font-bold text-neutral-7" style={{ fontSize: 24, lineHeight: 1 }}>{fmtTime(segR.departureTime)}</p>
                  <p className="body-3 font-semibold text-neutral-5">{segR.departureAirport?.code}</p>
                </div>
                <div className="flex-1 flex flex-col items-center gap-0.5">
                  <p className="body-3 text-neutral-4">{secToHM(segR.totalTime ?? 0)}</p>
                  <div className="flex items-center w-full gap-1">
                    <div className="flex-1 border-t-2 border-dashed border-neutral-2" />
                    <IcPlaneFly size={14} color="#FE6B01" />
                    <div className="flex-1 border-t-2 border-dashed border-neutral-2" />
                  </div>
                  <p className={`body-3 font-semibold ${segRStops === 0 ? 'text-auxiliary-green-5' : 'text-primary-3'}`}>
                    {segRStops === 0 ? 'Directo' : `${segRStops} escala${segRStops > 1 ? 's' : ''}`}
                  </p>
                  {stopDetailsReturn && stopDetailsReturn.length > 0 && (
                    <p className="body-3 text-neutral-4" style={{ fontSize: 9 }}>
                      {stopDetailsReturn.map(s => `${s.city}${s.waitMin ? ` ${minToHM(s.waitMin)}` : ''}`).join(' · ')}
                    </p>
                  )}
                </div>
                <div className="text-center">
                  <p className="font-titles font-bold text-neutral-7" style={{ fontSize: 24, lineHeight: 1 }}>{fmtTime(segR.arrivalTime)}</p>
                  <p className="body-3 font-semibold text-neutral-5">{segR.arrivalAirport?.code}</p>
                </div>
              </div>
            </>
          )}

          {/* Precio */}
          <div className="shrink-0 text-right border-l border-neutral-1 pl-4" style={{ minWidth: 130 }}>
            {adultP && <p className="body-3 text-neutral-4">{fmt(toPrice(adultP.travellerPriceBreakdown?.total), currency)} / adulto</p>}
            {kidPs.length > 0 && <p className="body-3 text-neutral-4">{fmt(toPrice(kidPs[0].travellerPriceBreakdown?.total), currency)} / niño</p>}
            <p className="font-titles font-bold text-neutral-7 mt-0.5" style={{ fontSize: 24, lineHeight: 1 }}>{fmt(total, currency)}</p>
            <p className="body-3 text-neutral-4">precio total</p>
            {seats && <p className="body-3 text-primary-3 font-semibold mt-1">¡Solo {seats} plazas!</p>}
            {/* Ver y reservar → abre compra */}
            <button onClick={() => onPurchase(offer)}
              className="cursor-pointer mt-2.5 w-full py-2.5 bg-primary-3 text-white rounded-full body-2-semibold hover:bg-primary-4 active:scale-95 transition-all">
              Ver y reservar
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-neutral-1 flex-wrap">
          {checkin
            ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-auxiliary-green-1 body-3 text-auxiliary-green-5">
                <IcCheck size={11} color="#2E7D32" />
                Maleta incluida{checkin.maxWeightPerPiece ? ` · ${checkin.maxWeightPerPiece}${checkin.massUnit ?? 'KG'}` : ''}
              </span>
            : <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-1 body-3 text-neutral-4">
                <IcX size={11} color="#A19694" />Sin maleta
              </span>
          }
          {hand && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary-1 body-3 text-secondary-4">
              <IcBag size={11} color="#016FC1" />
              Mano{hand.maxWeightPerPiece ? ` · ${hand.maxWeightPerPiece}${hand.massUnit ?? 'KG'}` : ''}
            </span>
          )}
          {hasFlex && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-1 body-3 text-primary-4">Billete flexible</span>}
          {/* Ver detalles → abre drawer */}
          <button onClick={() => onShowDetail(offer)} className="cursor-pointer ml-auto body-3 text-secondary-4 font-semibold hover:text-secondary-3 transition-colors">
            Ver detalles →
          </button>
        </div>
      </div>
    </div>
  );
};

// ── FilterSheet ───────────────────────────────────────────────────────────────
const TIME_SLOTS = [
  { key: 'madrugada', label: 'Madrugada', sub: '00–06h', min: 0, max: 6 },
  { key: 'manana', label: 'Mañana', sub: '06–12h', min: 6, max: 12 },
  { key: 'tarde', label: 'Tarde', sub: '12–18h', min: 12, max: 18 },
  { key: 'noche', label: 'Noche', sub: '18–24h', min: 18, max: 24 },
];

const DEFAULT_FILTERS = { stopsOutbound: null, stopsReturn: null, airline: null, maxPrice: null, timeSlots: [] };

const FilterSheet = ({ aggregation, offers, filters, tripType, onChange, onClose }) => {
  const maxB = toPrice(aggregation?.budget?.max ?? { units: 2000 });
  const minB = toPrice(aggregation?.budget?.min ?? { units: 0 });
  const currency = aggregation?.budget?.min?.currencyCode ?? 'EUR';
  const [local, setLocal] = useState({ ...filters });
  const isRoundTrip = tripType === 'ROUND_TRIP';
  const stopOptions = [{ label: 'Cualquiera', value: null }, { label: 'Sin escalas', value: 0 }, { label: '1 escala', value: 1 }];

  const matchesOfferWithFilters = (offer, activeFilters) => {
    const segments = offer.segments ?? [];
    const outSeg = segments[0];
    const retSeg = segments.length > 1 ? segments[segments.length - 1] : null;

    if (activeFilters.stopsOutbound !== null && getSegmentStops(outSeg) !== activeFilters.stopsOutbound) return false;
    if (tripType === 'ROUND_TRIP' && activeFilters.stopsReturn !== null) {
      if (!retSeg || getSegmentStops(retSeg) !== activeFilters.stopsReturn) return false;
    }
    if (activeFilters.maxPrice !== null && toPrice(offer.priceBreakdown?.total) > activeFilters.maxPrice) return false;
    if (activeFilters.timeSlots?.length > 0) {
      const hour = parseInt(offer.segments[0]?.departureTime?.slice(11, 13) ?? '0', 10);
      const inSlot = activeFilters.timeSlots.some(k => {
        const slot = TIME_SLOTS.find(s => s.key === k);
        return slot && hour >= slot.min && hour < slot.max;
      });
      if (!inSlot) return false;
    }
    return true;
  };

  const localFiltersWithoutAirline = { ...local, airline: null };
  const offersForAirlineFilter = (offers ?? []).filter((offer) => matchesOfferWithFilters(offer, localFiltersWithoutAirline));
  const availableAirlineCodes = new Set(
    offersForAirlineFilter
      .map((offer) => offer.segments?.[0]?.legs?.[0]?.carriersData?.[0]?.code)
      .filter(Boolean)
  );
  const visibleAirlines = (aggregation?.airlines ?? []).filter((al) => availableAirlineCodes.has(al.iataCode));

  useEffect(() => {
    if (local.airline && !availableAirlineCodes.has(local.airline)) {
      setLocal((prev) => ({ ...prev, airline: null }));
    }
  }, [local.airline, local.stopsOutbound, local.stopsReturn, local.maxPrice, local.timeSlots]);

  const toggleSlot = (key) => {
    setLocal(p => {
      const slots = p.timeSlots ?? [];
      return { ...p, timeSlots: slots.includes(key) ? slots.filter(s => s !== key) : [...slots, key] };
    });
  };

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-neutral-7/30" />
      <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}>

        <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
          <h3 className="title-h3-desktop text-neutral-7">Filtrar vuelos</h3>
          <button onClick={onClose} className="cursor-pointer w-8 h-8 rounded-full bg-neutral-1 flex items-center justify-center hover:bg-neutral-2 transition-colors">
            <IcX size={15} color="#7A7270" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 space-y-5 pb-4">
          {/* Escalas */}
          <div>
            <p className="body-2-semibold text-neutral-6 mb-3">Escalas ida</p>
            <div className="grid grid-cols-3 gap-2">
              {stopOptions.map((opt) => (
                <button key={`out-${String(opt.value)}`} onClick={() => setLocal((p) => ({ ...p, stopsOutbound: opt.value }))}
                  className={`cursor-pointer py-3 rounded-xl border body-3 font-semibold transition-all ${local.stopsOutbound === opt.value ? 'bg-secondary-3 border-secondary-3 text-white' : 'bg-white border-neutral-2 text-neutral-5 hover:border-secondary-2'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {isRoundTrip && (
            <div>
              <p className="body-2-semibold text-neutral-6 mb-3">Escalas vuelta</p>
              <div className="grid grid-cols-3 gap-2">
                {stopOptions.map((opt) => (
                  <button key={`ret-${String(opt.value)}`} onClick={() => setLocal((p) => ({ ...p, stopsReturn: opt.value }))}
                    className={`cursor-pointer py-3 rounded-xl border body-3 font-semibold transition-all ${local.stopsReturn === opt.value ? 'bg-secondary-3 border-secondary-3 text-white' : 'bg-white border-neutral-2 text-neutral-5 hover:border-secondary-2'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Precio */}
          <div>
            <div className="flex justify-between mb-3">
              <p className="body-2-semibold text-neutral-6">Precio máximo</p>
              <p className="body-2-semibold text-secondary-4">{fmt(local.maxPrice ?? maxB, currency)}</p>
            </div>
            <input type="range" min={Math.floor(minB)} max={Math.ceil(maxB)} step={10}
              value={local.maxPrice ?? maxB}
              onChange={(e) => setLocal((p) => ({ ...p, maxPrice: Number(e.target.value) }))}
              className="w-full cursor-pointer" style={{ accentColor: '#0194FE' }} />
            <div className="flex justify-between body-3 text-neutral-4 mt-1">
              <span>{fmt(minB, currency)}</span><span>{fmt(maxB, currency)}</span>
            </div>
          </div>

          {/* Hora de salida — chips intuitivos */}
          <div>
            <p className="body-2-semibold text-neutral-6 mb-3">Hora de salida</p>
            <div className="grid grid-cols-2 gap-2">
              {TIME_SLOTS.map((slot) => {
                const active = (local.timeSlots ?? []).includes(slot.key);
                return (
                  <button key={slot.key} onClick={() => toggleSlot(slot.key)}
                    className={`cursor-pointer flex flex-col items-center py-3 px-2 rounded-xl border body-3 transition-all ${active ? 'bg-secondary-3 border-secondary-3 text-white' : 'bg-white border-neutral-2 text-neutral-5 hover:border-secondary-2'}`}>
                    <span className="font-semibold">{slot.label}</span>
                    <span style={{ fontSize: 10 }} className={active ? 'text-white/80' : 'text-neutral-4'}>{slot.sub}</span>
                  </button>
                );
              })}
            </div>
            {(local.timeSlots ?? []).length > 0 && (
              <p className="body-3 text-neutral-4 mt-2">
                Mostrando salidas: {(local.timeSlots ?? []).map(k => TIME_SLOTS.find(s => s.key === k)?.label).join(', ')}
              </p>
            )}
          </div>

          {/* Aerolíneas */}
          {visibleAirlines?.length > 0 && (
            <div className="pb-2">
              <p className="body-2-semibold text-neutral-6 mb-3">Aerolínea</p>
              <div className="space-y-2">
                {visibleAirlines.map((al) => {
                  const active = local.airline === al.iataCode;
                  return (
                    <button key={al.iataCode} onClick={() => setLocal((p) => ({ ...p, airline: active ? null : al.iataCode }))}
                      className={`cursor-pointer w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all ${active ? 'bg-secondary-1 border-secondary-3' : 'bg-white border-neutral-1 hover:border-neutral-2'}`}>
                      {al.logoUrl
                        ? <img src={al.logoUrl} alt={al.name} className="w-8 h-8 object-contain rounded-lg border border-neutral-1 p-0.5" />
                        : <div className="w-8 h-8 rounded-lg bg-secondary-1 flex items-center justify-center body-3 font-bold text-secondary-4">{al.iataCode}</div>
                      }
                      <span className="body-2 text-neutral-7 flex-1 text-left">{al.name}</span>
                      {al.minPrice && <span className="body-3 text-neutral-4">desde {fmt(toPrice(al.minPrice), al.minPrice.currencyCode)}</span>}
                      {active && <IcCheck size={15} color="#016FC1" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {visibleAirlines?.length === 0 && (
            <div className="rounded-xl bg-neutral-1 px-4 py-3 body-3 text-neutral-5">
              No hay aerolíneas que coincidan con tus filtros actuales.
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-neutral-1 shrink-0">
          <button onClick={() => setLocal(DEFAULT_FILTERS)}
            className="cursor-pointer flex-1 py-3 rounded-full border-2 border-neutral-2 body-semibold text-neutral-5 hover:border-neutral-3 transition-colors">
            Limpiar
          </button>
          <button onClick={() => { onChange(local); onClose(); }}
            className="cursor-pointer flex-1 py-3 rounded-full bg-secondary-3 text-white body-semibold hover:bg-secondary-4 transition-colors">
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
};

// ── SaveFlightModal ───────────────────────────────────────────────────────────
const SaveFlightModal = ({ offer, user, onClose }) => {
  const navigate = useNavigate();
  const [trips, setTrips] = useState(null);
  const [step, setStep] = useState('loading');
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [creating, setSaving] = useState(false);

  const seg0 = offer?.segments[0];
  const dest = seg0?.arrivalAirport?.cityName ?? seg0?.arrivalAirport?.code ?? '';
  const currency = offer?.priceBreakdown?.total?.currencyCode ?? 'EUR';
  const total = toPrice(offer?.priceBreakdown?.total);

  useEffect(() => {
    getUserTrips(user.uid).then((list) => {
      setTrips(list ?? []);
      setStep(list?.length ? 'choose' : 'create');
    }).catch(() => { setTrips([]); setStep('create'); });
  }, [user.uid]);

  const handleConfirm = async () => {
    setSaving(true);
    setTimeout(() => { setSaving(false); setStep('done'); }, 800);
  };

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-neutral-7/40" />
      <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-sm flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}>

        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-neutral-1 shrink-0">
          <h3 className="title-h3-desktop text-neutral-7">
            {step === 'done' ? '¡Vuelo guardado!' : 'Añadir al viaje'}
          </h3>
          <button onClick={onClose} className="cursor-pointer w-8 h-8 rounded-full bg-neutral-1 flex items-center justify-center hover:bg-neutral-2 transition-colors">
            <IcX size={15} color="#7A7270" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="bg-secondary-1 rounded-2xl px-4 py-3 mb-4 flex items-center gap-3">
            <IcPlane size={18} color="#016FC1" />
            <div className="flex-1 min-w-0">
              <p className="body-2-semibold text-neutral-7 truncate">{seg0?.departureAirport?.code} → {seg0?.arrivalAirport?.code}</p>
              <p className="body-3 text-neutral-4">{fmtDate(seg0?.departureTime)} · {fmt(total, currency)}</p>
            </div>
          </div>

          {step === 'loading' && (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-2 border-secondary-3 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {step === 'choose' && (
            <div className="space-y-3">
              <p className="body-2 text-neutral-5 mb-2">¿A qué viaje quieres añadirlo?</p>
              {trips.map((trip) => {
                const destMatch = trip.destination && dest && trip.destination.toLowerCase().includes(dest.toLowerCase());
                const noDestino = !trip.destination;
                return (
                  <button key={trip.id} onClick={() => { setSelectedTrip(trip); setStep('confirm'); }}
                    className="cursor-pointer w-full flex items-start gap-3 p-4 rounded-2xl border border-neutral-1 hover:border-secondary-3 hover:bg-secondary-1 transition-all text-left">
                    <div className="flex-1 min-w-0">
                      <p className="body-semibold text-neutral-7 truncate">{trip.name || 'Viaje sin nombre'}</p>
                      {trip.destination && <p className="body-3 text-neutral-4">📍 {trip.destination}</p>}
                      {!destMatch && !noDestino && dest && (
                        <p className="body-3 text-primary-3 mt-0.5">⚠ Destino diferente ({dest})</p>
                      )}
                      {noDestino && dest && (
                        <p className="body-3 text-auxiliary-green-5 mt-0.5">✓ Se añadirá {dest} como destino</p>
                      )}
                    </div>
                    <IcChevRight size={16} color="#A19694" />
                  </button>
                );
              })}
              <button onClick={() => setStep('create')}
                className="cursor-pointer w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-neutral-2 hover:border-secondary-3 transition-all text-left">
                <div className="w-9 h-9 rounded-full bg-secondary-1 flex items-center justify-center shrink-0">
                  <IcPlus size={16} color="#016FC1" />
                </div>
                <span className="body-semibold text-secondary-4">Crear nuevo viaje</span>
              </button>
            </div>
          )}

          {step === 'confirm' && selectedTrip && (
            <div className="space-y-4">
              <p className="body-2 text-neutral-6">
                ¿Confirmas añadir este vuelo al viaje <span className="font-semibold text-neutral-7">"{selectedTrip.name || 'Sin nombre'}"</span>?
              </p>
              <p className="body-3 text-neutral-4">
                Una vez confirmado aparecerá en el itinerario del viaje.
              </p>
            </div>
          )}

          {step === 'done' && (
            <div className="flex flex-col items-center py-4 gap-3 text-center">
              <div className="w-14 h-14 rounded-full bg-auxiliary-green-1 flex items-center justify-center">
                <IcCheck size={24} color="#2E7D32" />
              </div>
              <p className="body-semibold text-neutral-7">Vuelo añadido a "{selectedTrip?.name}"</p>
              <p className="body-3 text-neutral-4">Puedes verlo en el itinerario de tu viaje.</p>
            </div>
          )}

          {step === 'create' && (
            <p className="body-2 text-neutral-5">No tienes ningún viaje activo. ¿Quieres crear uno?</p>
          )}
        </div>

        <div className="px-6 py-4 border-t border-neutral-1 shrink-0 space-y-2">
          {step === 'confirm' && (
            <button onClick={handleConfirm} disabled={creating}
              className="cursor-pointer w-full py-3.5 bg-primary-3 text-white rounded-full body-bold hover:bg-primary-4 transition-all disabled:opacity-70 flex items-center justify-center gap-2">
              {creating ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
              Confirmar
            </button>
          )}
          {step === 'done' && (
            <button onClick={onClose}
              className="cursor-pointer w-full py-3.5 bg-secondary-3 text-white rounded-full body-bold hover:bg-secondary-4 transition-all">
              Listo
            </button>
          )}
          {step === 'create' && (
            <button onClick={() => { navigate('/trips/create'); onClose(); }}
              className="cursor-pointer w-full py-3.5 bg-primary-3 text-white rounded-full body-bold hover:bg-primary-4 transition-all">
              Crear viaje
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── FlightsExplorer ───────────────────────────────────────────────────────────
// Clases de vuelo estándar soportadas por la API RapidAPI/Booking.com
const CABIN_LABELS = {
  ECONOMY: 'Económica',
  PREMIUM_ECONOMY: 'Premium Economy',
  BUSINESS: 'Business',
  FIRST: 'Primera clase',
};

const today = new Date().toISOString().split('T')[0];
const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

const paxToApiChildren = (pax) => {
  const ages = [];
  for (let i = 0; i < pax.youth; i++) ages.push(8);
  for (let i = 0; i < pax.infants; i++) ages.push(1);
  return ages.length ? ages.join(',') : undefined;
};

const emptyLeg = (date) => ({ from: { id: '', label: '' }, to: { id: '', label: '' }, date });

export default function FlightsExplorer() {
  const { user } = useAuth();
  const [tripType, setTripType] = useState('ROUND_TRIP');
  const [from, setFrom] = useState({ id: '', label: '', code: '' });
  const [to, setTo] = useState({ id: '', label: '', code: '' });
  const [departDate, setDepartDate] = useState(today);
  const [returnDate, setReturnDate] = useState(nextWeek);
  const [legs, setLegs] = useState([emptyLeg(today), emptyLeg(nextWeek)]);
  const [pax, setPax] = useState({ adults: 1, youth: 0, infants: 0 });
  const [cabinClass, setCabinClass] = useState('ECONOMY');
  const [showPax, setShowPax] = useState(false);
  const [showCabin, setShowCabin] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [detailOffer, setDetailOffer] = useState(null);
  const [saveOffer, setSaveOffer] = useState(null);
  const [purchaseOffer, setPurchaseOffer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [response, setResponse] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sort, setSort] = useState('BEST');
  const [showDateBar, setShowDateBar] = useState(false);
  const cabinRef = useRef(null);

  useEffect(() => {
    const h = (e) => { if (cabinRef.current && !cabinRef.current.contains(e.target)) setShowCabin(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleSearch = async () => {
    if (!from.id || !to.id) {
      setError(getFlightErrorMessage('MISSING_AIRPORTS'));
      return;
    }
    if (departDate < todayStr) {
      setError(getFlightErrorMessage('DATE_IN_PAST'));
      return;
    }
    if (tripType === 'ROUND_TRIP' && returnDate < departDate) {
      setError(getFlightErrorMessage('RETURN_BEFORE_DEPART'));
      return;
    }
    setIsLoading(true);
    setError(null);
    setResponse(null);
    setShowDateBar(false);
    try {
      const params = { fromId: from.id, toId: to.id, departDate, adults: pax.adults, sort, cabinClass, currencyCode: 'EUR' };
      if (tripType === 'ROUND_TRIP' && returnDate) params.returnDate = returnDate;
      const childrenStr = paxToApiChildren(pax);
      if (childrenStr) params.children = childrenStr;
      const res = await getFlights(params);
      setResponse(res);
      setFilters(DEFAULT_FILTERS);
      setShowDateBar(true);
    } catch (err) {
      const errorCode = err.code || 'RAPIDAPI_REQUEST_ERROR';
      setError(getFlightErrorMessage(errorCode));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateBarSelect = (d) => {
    setDepartDate(d);
    setIsLoading(true);
    setError(null);
    setResponse(null);
    const params = { fromId: from.id, toId: to.id, departDate: d, adults: pax.adults, sort, cabinClass, currencyCode: 'EUR' };
    if (tripType === 'ROUND_TRIP' && returnDate) params.returnDate = returnDate;
    const childrenStr = paxToApiChildren(pax);
    if (childrenStr) params.children = childrenStr;
    getFlights(params)
      .then((res) => { setResponse(res); })
      .catch((err) => {
        const errorCode = err.code || 'RAPIDAPI_REQUEST_ERROR';
        setError(getFlightErrorMessage(errorCode));
      })
      .finally(() => setIsLoading(false));
  };

  const handleSearchMultiStop = async () => {
    if (legs.length < 2) {
      setError(getFlightErrorMessage('INSUFFICIENT_LEGS'));
      return;
    }
    const incompleteLegs = legs.some(leg => !leg.from.id || !leg.to.id || !leg.date);
    if (incompleteLegs) {
      setError(getFlightErrorMessage('INCOMPLETE_LEGS'));
      return;
    }
    for (let i = 0; i < legs.length; i++) {
      if (legs[i].date < todayStr) {
        setError(getFlightErrorMessage('DATE_IN_PAST'));
        return;
      }
      if (i > 0 && legs[i].date < legs[i - 1].date) {
        setError(getFlightErrorMessage('INVALID_LEG_SEQUENCE'));
        return;
      }
    }
    setIsLoading(true);
    setError(null);
    setResponse(null);
    try {
      const legsData = legs.map(leg => ({
        fromId: leg.from.id,
        toId: leg.to.id,
        departDate: leg.date,
      }));
      const params = {
        legs: JSON.stringify(legsData),
        adults: pax.adults,
        sort,
        cabinClass,
        currencyCode: 'EUR',
        pageNo: 1,
      };
      const childrenStr = paxToApiChildren(pax);
      if (childrenStr) params.children = childrenStr;
      const res = await getFlightsMultiStops(params);
      setResponse(res);
      setFilters(DEFAULT_FILTERS);
    } catch (err) {
      const errorCode = err.code || 'RAPIDAPI_REQUEST_ERROR';
      setError(getFlightErrorMessage(errorCode));
    } finally {
      setIsLoading(false);
    }
  };

  const swap = () => { const t = from; setFrom(to); setTo(t); };

  const paxLabel = () => {
    const total = pax.adults + pax.youth + pax.infants;
    return `${total} pasajero${total > 1 ? 's' : ''}`;
  };

  const updateLeg = (i, field, val) => {
    setLegs(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: val } : l));
  };

  const matchesOfferWithFilters = (offer, activeFilters) => {
    const segments = offer.segments ?? [];
    const outSeg = segments[0];
    const retSeg = segments.length > 1 ? segments[segments.length - 1] : null;

    if (activeFilters.stopsOutbound !== null && getSegmentStops(outSeg) !== activeFilters.stopsOutbound) return false;
    if (tripType === 'ROUND_TRIP' && activeFilters.stopsReturn !== null) {
      if (!retSeg || getSegmentStops(retSeg) !== activeFilters.stopsReturn) return false;
    }
    if (activeFilters.airline && offer.segments[0]?.legs[0]?.carriersData?.[0]?.code !== activeFilters.airline) return false;
    if (activeFilters.maxPrice !== null && toPrice(offer.priceBreakdown?.total) > activeFilters.maxPrice) return false;
    if (activeFilters.timeSlots?.length > 0) {
      const hour = parseInt(offer.segments[0]?.departureTime?.slice(11, 13) ?? '0', 10);
      const inSlot = activeFilters.timeSlots.some(k => {
        const slot = TIME_SLOTS.find(s => s.key === k);
        return slot && hour >= slot.min && hour < slot.max;
      });
      if (!inSlot) return false;
    }
    return true;
  };

  const allOffers = response?.data?.flightOffers ?? [];
  const filteredOffers = allOffers.filter((o) => matchesOfferWithFilters(o, filters));

  const activeFilters = [
    filters.stopsOutbound !== null,
    tripType === 'ROUND_TRIP' && filters.stopsReturn !== null,
    filters.airline !== null,
    filters.maxPrice !== null,
    (filters.timeSlots?.length ?? 0) > 0,
  ].filter(Boolean).length;

  return (
    <div className="space-y-4 py-4">

      {/* ── Buscador ─────────────────────────────────────────────────────── */}
      <div className="bg-white border border-neutral-1 rounded-2xl overflow-visible">
        <div className="flex border-b border-neutral-1">
          {[['ONE_WAY', 'Solo ida'], ['ROUND_TRIP', 'Ida y vuelta'], ['MULTI_STOP', 'Varios destinos']].map(([val, lbl]) => (
            <button key={val} onClick={() => setTripType(val)}
              className={`cursor-pointer flex-1 py-2.5 body-3 font-semibold transition-all border-b-2 ${tripType === val ? 'text-secondary-4 border-secondary-3 bg-secondary-1' : 'text-neutral-4 border-transparent hover:text-neutral-6'}`}>
              {lbl}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-3">
          {tripType === 'MULTI_STOP' ? (
            /* ── Multi-stop: tramos individuales ── */
            <div className="space-y-3">
              {legs.map((leg, i) => (
                <div key={i} className="border border-neutral-1 rounded-2xl p-3 space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="body-3 font-semibold text-neutral-5">Tramo {i + 1}</span>
                    {legs.length > 2 && (
                      <button onClick={() => setLegs(prev => prev.filter((_, idx) => idx !== i))}
                        className="cursor-pointer w-6 h-6 rounded-full bg-neutral-1 flex items-center justify-center hover:bg-primary-1 transition-colors">
                        <IcTrash size={12} color="#A19694" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <AirportInput label="Desde" displayValue={leg.from.label}
                      onSelect={(v) => updateLeg(i, 'from', v)} placeholder="Ciudad de origen" />
                    <button onClick={() => {
                      const t = leg.from; updateLeg(i, 'from', leg.to); updateLeg(i, 'to', t);
                    }} className="cursor-pointer w-10 h-10 rounded-full border border-neutral-2 flex items-center justify-center shrink-0 hover:border-secondary-3 hover:bg-secondary-1 transition-all">
                      <IcSwap size={15} color="#0194FE" />
                    </button>
                    <AirportInput label="Hasta" displayValue={leg.to.label}
                      onSelect={(v) => updateLeg(i, 'to', v)} placeholder="Ciudad de destino" />
                  </div>
                  <div className="relative">
                    <label className="absolute -top-2 left-3 bg-white px-1 body-3 text-neutral-4 z-10">Fecha</label>
                    <input type="date" value={leg.date} min={today}
                      onChange={(e) => updateLeg(i, 'date', e.target.value)}
                      className="w-full border border-neutral-2 rounded-xl px-3 py-3 body-2 text-neutral-7 bg-transparent outline-none focus:border-secondary-3 transition-colors" />
                  </div>
                </div>
              ))}
              {legs.length < 5 && (
                <button onClick={() => setLegs(prev => [...prev, emptyLeg(addDays(prev[prev.length - 1].date, 3))])}
                  className="cursor-pointer w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-neutral-2 hover:border-secondary-3 body-3 font-semibold text-secondary-4 transition-colors">
                  <IcPlus size={14} color="#016FC1" /> Añadir tramo
                </button>
              )}
              <div className="bg-secondary-1 rounded-xl px-4 py-3 body-3 text-secondary-4">
                Puedes buscar vuelos en múltiples destinos. Añade los tramos necesarios (mínimo 2) y presiona buscar.
              </div>
            </div>
          ) : (
            /* ── Ida / Ida y vuelta ── */
            <>
              <div className="flex items-center gap-2">
                <AirportInput label="Desde" displayValue={from.label} onSelect={setFrom} placeholder="Ciudad de origen" />
                <button onClick={swap}
                  className="cursor-pointer w-10 h-10 rounded-full border border-neutral-2 flex items-center justify-center shrink-0 hover:border-secondary-3 hover:bg-secondary-1 transition-all">
                  <IcSwap size={15} color="#0194FE" />
                </button>
                <AirportInput label="Hasta" displayValue={to.label} onSelect={setTo} placeholder="Ciudad de destino" />
              </div>

              {/* Fechas — sin ícono de calendario extra (el input type=date ya lo tiene) */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <label className="absolute -top-2 left-3 bg-white px-1 body-3 text-neutral-4 z-10">Salida</label>
                  <input type="date" value={departDate} min={today}
                    onChange={(e) => setDepartDate(e.target.value)}
                    className="w-full border border-neutral-2 rounded-xl px-3 py-3 body-2 text-neutral-7 bg-transparent outline-none focus:border-secondary-3 transition-colors" />
                </div>
                {tripType === 'ROUND_TRIP' && (
                  <div className="flex-1 relative">
                    <label className="absolute -top-2 left-3 bg-white px-1 body-3 text-neutral-4 z-10">Regreso</label>
                    <input type="date" value={returnDate} min={departDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      className="w-full border border-neutral-2 rounded-xl px-3 py-3 body-2 text-neutral-7 bg-transparent outline-none focus:border-secondary-3 transition-colors" />
                  </div>
                )}
              </div>
            </>
          )}

          {/* Pasajeros + Clase */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <label className="absolute -top-2 left-3 bg-white px-1 body-3 text-neutral-4 z-10">Pasajeros</label>
              <button onClick={() => setShowPax(true)}
                className="cursor-pointer w-full flex items-center gap-2 border border-neutral-2 rounded-xl px-3 py-3 hover:border-secondary-3 transition-colors text-left">
                <IcUser size={16} color="#A19694" />
                <span className="body-2 text-neutral-7 flex-1">{paxLabel()}</span>
                <IcChevDown size={13} color="#A19694" />
              </button>
            </div>

            <div ref={cabinRef} className="relative" style={{ minWidth: 150 }}>
              <label className="absolute -top-2 left-3 bg-white px-1 body-3 text-neutral-4 z-10">Clase</label>
              <button onClick={() => setShowCabin(!showCabin)}
                className="cursor-pointer w-full flex items-center gap-2 border border-neutral-2 rounded-xl px-3 py-3 hover:border-secondary-3 transition-colors text-left">
                <IcSeat size={16} color="#A19694" />
                <span className="body-2 text-neutral-7 flex-1 truncate">{CABIN_LABELS[cabinClass]}</span>
                <IcChevDown size={13} color="#A19694" className={`transition-transform shrink-0 ${showCabin ? 'rotate-180' : ''}`} />
              </button>
              {showCabin && (
                <div className="absolute bottom-[calc(100%+6px)] right-0 z-50 bg-white border border-neutral-1 rounded-2xl shadow-xl p-2 w-52">
                  {Object.entries(CABIN_LABELS).map(([val, lbl]) => (
                    <button key={val} onClick={() => { setCabinClass(val); setShowCabin(false); }}
                      className={`cursor-pointer w-full flex items-center justify-between px-3 py-2.5 rounded-xl body-2 transition-all ${cabinClass === val ? 'bg-secondary-1 text-secondary-4 font-semibold' : 'text-neutral-6 hover:bg-neutral-1'}`}>
                      {lbl}
                      {cabinClass === val && <IcCheck size={14} color="#016FC1" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {error && <p className="body-3 text-primary-3 bg-primary-1 rounded-xl px-4 py-2.5">{error}</p>}

          <button onClick={() => tripType === 'MULTI_STOP' ? handleSearchMultiStop() : handleSearch()} disabled={isLoading}
            className="cursor-pointer w-full py-3.5 bg-primary-3 text-white rounded-xl body-bold hover:bg-primary-4 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70">
            {isLoading ? 'Buscando...' : 'Buscar vuelos'}
          </button>
        </div>
      </div>

      {/* ── Barra de días ────────────────────────────────────────────────── */}
      {showDateBar && from.id && to.id && (
        <DateBar
          baseDate={departDate}
          fromId={from.id}
          toId={to.id}
          cabinClass={cabinClass}
          activeDateStr={departDate}
          onSelectDate={handleDateBarSelect}
        />
      )}

      {/* ── Resultados ───────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-10 h-10 border-2 border-secondary-3 border-t-transparent rounded-full animate-spin" />
          <p className="body-2 text-neutral-5">Buscando los mejores vuelos...</p>
        </div>
      )}

      {!isLoading && response && (
        <>
          {response.data?.flightDeals?.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {response.data.flightDeals.map((d) => {
                const labels = { CHEAPEST: 'Más barato', FASTEST: 'Más rápido', BEST: 'Mejor opción' };
                return (
                  <div key={d.key} className="shrink-0 border border-neutral-1 rounded-xl px-3 py-2 bg-white text-center min-w-27.5">
                    <p className="body-3 text-neutral-4 mb-0.5">{labels[d.key] ?? d.key}</p>
                    <p className={`body-2-semibold ${d.key === 'CHEAPEST' ? 'text-auxiliary-green-5' : 'text-neutral-7'}`}>
                      {fmt(toPrice(d.price), d.price.currencyCode)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="body-2 text-neutral-5">
              <span className="body-bold text-neutral-7">{filteredOffers.length} vuelos</span> disponibles
            </p>
            <div className="flex items-center gap-2">
              <select value={sort} onChange={(e) => setSort(e.target.value)}
                className="cursor-pointer body-3 border border-neutral-2 rounded-xl px-3 py-2 bg-white text-neutral-6 focus:outline-none focus:border-secondary-3">
                <option value="BEST">Mejor opción</option>
                <option value="CHEAPEST">Precio más bajo</option>
                <option value="FASTEST">Más rápido</option>
              </select>
              <button onClick={() => setShowFilters(true)}
                className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-xl border body-3 font-semibold transition-all ${activeFilters > 0 ? 'bg-secondary-1 border-secondary-3 text-secondary-4' : 'bg-white border-neutral-2 text-neutral-5 hover:border-neutral-3'}`}>
                <IcFilter size={13} />
                Filtrar
                {activeFilters > 0 && (
                  <span className="w-5 h-5 rounded-full bg-secondary-3 text-white flex items-center justify-center" style={{ fontSize: 10, fontWeight: 700 }}>
                    {activeFilters}
                  </span>
                )}
              </button>
            </div>
          </div>

          {filteredOffers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 border-2 border-dashed border-neutral-2 rounded-2xl">
              <IcPlaneFly size={36} color="#C3BEBD" />
              <p className="body-semibold text-neutral-5">No hay vuelos con estos filtros</p>
              <button onClick={() => setFilters(DEFAULT_FILTERS)}
                className="cursor-pointer body-3 text-primary-3 font-semibold hover:text-primary-4">
                Quitar filtros
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOffers.map((offer, i) => (
                <FlightCard key={offer.token ?? i} offer={offer}
                  isBest={i === 0 && sort === 'BEST'}
                  onShowDetail={setDetailOffer}
                  onPurchase={setPurchaseOffer} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Modales ───────────────────────────────────────────────────────── */}
      {showPax && <PassengerDropdown pax={pax} onChange={setPax} onClose={() => setShowPax(false)} />}

      {showFilters && (
        <FilterSheet aggregation={response?.data?.aggregation}
          offers={allOffers}
          filters={filters} tripType={tripType} onChange={setFilters}
          onClose={() => setShowFilters(false)} />
      )}

      {detailOffer && (
        <FlightDetailDrawer
          offer={detailOffer}
          onClose={() => setDetailOffer(null)}
          onPurchase={(offer) => { setDetailOffer(null); setPurchaseOffer(offer); }}
        />
      )}

      {saveOffer && user && (
        <SaveFlightModal offer={saveOffer} user={user} onClose={() => setSaveOffer(null)} />
      )}

      {purchaseOffer && (
        <PurchaseModal
          offer={purchaseOffer}
          onClose={() => setPurchaseOffer(null)}
          onSave={(offer) => { setPurchaseOffer(null); setSaveOffer(offer); }}
        />
      )}
    </div>
  );
}
