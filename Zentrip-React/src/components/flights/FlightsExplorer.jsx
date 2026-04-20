import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getFlights, getFlightsMultiStops } from '../../services/flightService';
import { getFlightDestinations } from '../../services/flightService';
import { resolveToEnglish } from '../../services/geocodingService';
import { useAuth } from '../../context/AuthContext';
import TripContextBanner from '../trips/shared/TripContextBanner';
import { getFlightErrorMessage } from '../../utils/errors/flightErrors';
import FlightSaveModal from './FlightSaveModal';
import { ROUTES } from '../../config/routes';
import FlightSearchForm from './components/FlightSearchForm';
import FlightResults from './components/FlightResults';
import DateBar from './components/DateBar';
import FlightDetailDrawer from './components/FlightDetailDrawer';
import PurchaseModal from './components/PurchaseModal';
import {
  DEFAULT_FILTERS, today, nextWeek, todayStr,
  paxToApiChildren, emptyLeg, matchesFilters, addDays,
} from './components/flightUtils';
import { IcChevLeft } from './components/flightIcons';

export default function FlightsExplorer({ tripContext: tripContextProp, embedded = false }) {
  const { user, profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const tripContext = tripContextProp ?? location.state?.tripContext ?? null;
  const currencyCode = profile?.currency?.split(' ')[0] ?? 'EUR';

  // ── Estado del formulario de búsqueda ─────────────────────────────────────
  const [tripType, setTripType] = useState('ROUND_TRIP');
  const [from, setFrom] = useState(() => {
    const origin = tripContext?.origin;
    return origin ? { id: '', label: origin, code: '', cityName: origin } : { id: '', label: '', code: '' };
  });
  const [to, setTo] = useState(() => {
    const destination = tripContext?.destination;
    return destination ? { id: '', label: destination, code: '', cityName: destination } : { id: '', label: '', code: '' };
  });
  const [departDate, setDepartDate] = useState(today);
  const [returnDate, setReturnDate] = useState(nextWeek);
  const [legs, setLegs] = useState([emptyLeg(today), emptyLeg(nextWeek)]);
  const [pax, setPax] = useState({ adults: tripContext?.memberCount ?? 1, youth: 0, infants: 0 });
  const [cabinClass, setCabinClass] = useState('ECONOMY');

  // ── Estado de resultados y filtros ────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [response, setResponse] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sort, setSort] = useState('BEST');
  const [showDateBar, setShowDateBar] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // ── Estado de modales ─────────────────────────────────────────────────────
  const [detailOffer, setDetailOffer] = useState(null);
  const [saveOffer, setSaveOffer] = useState(() => {
    // Recupera vuelo pendiente guardado antes de crear un nuevo viaje
    const pending = sessionStorage.getItem('zt_pending_flight');
    if (pending) {
      sessionStorage.removeItem('zt_pending_flight');
      try { return JSON.parse(pending); } catch { return null; }
    }
    return null;
  });
  const [purchaseOffer, setPurchaseOffer] = useState(null);

  // Resetea paginación al cambiar resultados o filtros
  useEffect(() => { setCurrentPage(1); }, [response, filters]);

  // Resuelve aeropuertos desde el contexto del viaje al cargar
  useEffect(() => {
    if (!tripContext) return;

    const resolveToAirport = async (raw) => {
      if (!raw) return { id: '', label: '', code: '' };
      const originalName = raw.split(',')[0].trim();
      const english = await resolveToEnglish(originalName) ?? originalName;
      try {
        const res = await getFlightDestinations(english);
        const items = (res?.data ?? [])
          .filter((i) => i.type === 'CITY' || i.type === 'AIRPORT')
          .map((i) => ({ ...i, cityName: originalName || i.cityName || i.name || i.code }));
        if (items.length === 0) return { id: '', label: originalName, code: '', cityName: originalName };
        const airports = items.filter((i) => i.type === 'AIRPORT');
        const city = items.find((i) => i.type === 'CITY');
        const match = (city && airports.length > 1) ? city : (airports[0] ?? city ?? items[0]);
        const lbl = match.type === 'CITY'
          ? `${match.cityName} (todos los aeropuertos)`
          : `${match.cityName} (${match.code})`;
        return { id: match.id, label: lbl, code: match.code, cityName: match.cityName, type: match.type };
      } catch {
        return { id: '', label: originalName, code: '', cityName: originalName };
      }
    };

    const stops = [...(tripContext.stops ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    if (stops.length >= 2) {
      setTripType('MULTI_STOP');
      const cities = [tripContext.origin, ...stops.map((s) => s.name)].filter(Boolean);
      Promise.all(cities.map(resolveToAirport)).then((airports) => {
        const newLegs = stops.map((stop, i) => ({
          from: airports[i] ?? emptyLeg('').from,
          to: airports[i + 1] ?? emptyLeg('').to,
          date: stop.startDate || addDays(tripContext.startDate || today, i * 3),
        }));
        if (newLegs.length > 0) setLegs(newLegs);
      });
    } else {
      Promise.all([
        resolveToAirport(tripContext.origin),
        resolveToAirport(tripContext.destination),
      ]).then(([fromAirport, toAirport]) => {
        if (fromAirport.id) setFrom(fromAirport);
        if (toAirport.id) setTo(toAirport);
      });
      if (tripContext.startDate >= today) setDepartDate(tripContext.startDate);
      if (tripContext.endDate >= (tripContext.startDate || today)) setReturnDate(tripContext.endDate);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Búsqueda de vuelos ────────────────────────────────────────────────────
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
      const params = { fromId: from.id, toId: to.id, departDate, adults: pax.adults, sort, cabinClass, currencyCode };
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

  const handleSearchMultiStop = async () => {
    if (legs.length < 2) {
      setError(getFlightErrorMessage('INSUFFICIENT_LEGS'));
      return;
    }
    if (legs.some(leg => !leg.from.id || !leg.to.id || !leg.date)) {
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
      const legsData = legs.map(leg => ({ fromId: leg.from.id, toId: leg.to.id, departDate: leg.date }));
      const params = { legs: JSON.stringify(legsData), adults: pax.adults, sort, cabinClass, currencyCode, pageNo: 1 };
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

  // Búsqueda rápida al seleccionar un día en la barra de fechas
  const handleDateBarSelect = (d) => {
    setDepartDate(d);
    setIsLoading(true);
    setError(null);
    setResponse(null);
    const params = { fromId: from.id, toId: to.id, departDate: d, adults: pax.adults, sort, cabinClass, currencyCode };
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

  const allOffers = response?.data?.flightOffers ?? [];
  const filteredOffers = allOffers.filter((o) => matchesFilters(o, filters, tripType));

  return (
    <div className={!embedded ? 'max-w-7xl mx-auto' : ''}>

      {/* Cabecera en modo standalone sin contexto de viaje */}
      {!embedded && !tripContext && (
        <div className="flex items-center gap-4 mb-6">
          <button
            type="button"
            onClick={() => navigate(ROUTES.HOME)}
            className="cursor-pointer w-9 h-9 rounded-full border border-neutral-2 flex items-center justify-center text-neutral-5 hover:bg-neutral-1 transition shrink-0"
          >
            <IcChevLeft size={16} color="#7A7270" />
          </button>
          <h1 className="title-h1-mobile md:title-h1-desktop text-secondary-5">
            Buscar <span className="text-primary-3">vuelos</span>
          </h1>
        </div>
      )}

      <div className="space-y-4 py-4">
        {/* Banner del viaje cuando viene desde un trip */}
        {tripContext && !embedded && <TripContextBanner tripContext={tripContext} activeTab="reservas" />}

        {/* Formulario de búsqueda */}
        <FlightSearchForm
          tripType={tripType}
          onTripTypeChange={setTripType}
          from={from} onFromChange={setFrom}
          to={to} onToChange={setTo}
          departDate={departDate} onDepartDateChange={setDepartDate}
          returnDate={returnDate} onReturnDateChange={setReturnDate}
          legs={legs} onLegsChange={setLegs}
          pax={pax} onPaxChange={setPax}
          cabinClass={cabinClass} onCabinClassChange={setCabinClass}
          isLoading={isLoading}
          error={error}
          onSearch={tripType === 'MULTI_STOP' ? handleSearchMultiStop : handleSearch}
        />

        {/* Barra de precios por día */}
        {showDateBar && from.id && to.id && (
          <DateBar
            baseDate={departDate}
            fromId={from.id}
            toId={to.id}
            cabinClass={cabinClass}
            activeDateStr={departDate}
            onSelectDate={handleDateBarSelect}
            currencyCode={currencyCode}
          />
        )}

        {/* Estado de carga */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-10 h-10 border-2 border-secondary-3 border-t-transparent rounded-full animate-spin" />
            <p className="body-2 text-neutral-5">Buscando los mejores vuelos...</p>
          </div>
        )}

        {/* Resultados */}
        {!isLoading && response && (
          <FlightResults
            response={response}
            filteredOffers={filteredOffers}
            allOffers={allOffers}
            filters={filters}
            onFiltersChange={setFilters}
            sort={sort}
            onSortChange={setSort}
            tripType={tripType}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters(v => !v)}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onShowDetail={setDetailOffer}
            onPurchase={setPurchaseOffer}
          />
        )}

        {/* Panel lateral de detalles del vuelo */}
        {detailOffer && (
          <FlightDetailDrawer
            offer={detailOffer}
            onClose={() => setDetailOffer(null)}
            onPurchase={(offer) => { setDetailOffer(null); setPurchaseOffer(offer); }}
          />
        )}

        {/* Modal para guardar vuelo en el itinerario */}
        {saveOffer && user && (
          <FlightSaveModal
            offer={saveOffer}
            user={user}
            tripContext={tripContext}
            onClose={() => setSaveOffer(null)}
          />
        )}

        {/* Modal de compra / enlace a Booking.com */}
        {purchaseOffer && (
          <PurchaseModal
            offer={purchaseOffer}
            fromState={from}
            toState={to}
            onClose={() => setPurchaseOffer(null)}
            onSave={(offer) => { setPurchaseOffer(null); setSaveOffer(offer); }}
          />
        )}
      </div>
    </div>
  );
}
