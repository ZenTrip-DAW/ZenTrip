import { useState } from 'react';
import { searchCars, getCarLocations } from '../../services/carService';
import { mapApiCar, getDays, TIPS } from '../trips/detail/components/bookings/cars/carUtils';
import { SectionLabel, TipCard } from '../trips/detail/components/bookings/hotels/HotelAtoms';
import CarSearchForm from '../trips/detail/components/bookings/cars/CarSearchForm';
import CarResults from '../trips/detail/components/bookings/cars/CarResults';
import CarDetailModal from '../trips/detail/components/bookings/cars/CarDetailModal';

export default function CarsExplorer() {
  const today    = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [pickUpLocation,  setPickUpLocation]  = useState(null);
  const [dropOffLocation, setDropOffLocation] = useState(null);
  const [sameLocation,    setSameLocation]    = useState(true);
  const [pickUpDate,      setPickUpDate]      = useState(today);
  const [dropOffDate,     setDropOffDate]     = useState(tomorrow);
  const [pickUpTime,      setPickUpTime]      = useState('10:00');
  const [dropOffTime,     setDropOffTime]     = useState('10:00');
  const [driverAge,       setDriverAge]       = useState(30);

  const [cars,            setCars]            = useState([]);
  const [searched,        setSearched]        = useState(false);
  const [searchedLocation, setSearchedLocation] = useState('');
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState(null);

  const [filter,   setFilter]   = useState('all');
  const [sortKey,  setSortKey]  = useState('price-asc');
  const [page,     setPage]     = useState(1);

  const [selectedCar,  setSelectedCar]  = useState(null);
  const [pickUpText,   setPickUpText]   = useState('');
  const [dropOffText,  setDropOffText]  = useState('');

  const days = getDays(pickUpDate, dropOffDate);
  const effectiveDropOffText = sameLocation ? pickUpText : dropOffText;

  const canSearch = Boolean(
    pickUpText.trim().length >= 2 &&
    effectiveDropOffText.trim().length >= 2 &&
    pickUpDate && dropOffDate && days > 0 &&
    driverAge >= 18,
  );

  const resolveCoords = async (location, text) => {
    if (location?.coordinates) return location;
    const data = await getCarLocations(text);
    const results = data?.data ?? data ?? [];
    if (!results.length) throw new Error(`No se encontró ubicación para "${text}".`);
    return results[0];
  };

  const handleSearch = async () => {
    if (!canSearch) return;
    setLoading(true);
    setError(null);
    setCars([]);
    setSearched(false);
    try {
      const resolvedPickUp  = await resolveCoords(pickUpLocation, pickUpText);
      const resolvedDropOff = sameLocation ? resolvedPickUp : await resolveCoords(dropOffLocation, dropOffText);

      if (!resolvedPickUp?.coordinates || !resolvedDropOff?.coordinates) {
        throw new Error('No se encontraron coordenadas. Selecciona una sugerencia del desplegable.');
      }

      const data = await searchCars({
        pickUpLatitude:   resolvedPickUp.coordinates.latitude,
        pickUpLongitude:  resolvedPickUp.coordinates.longitude,
        dropOffLatitude:  resolvedDropOff.coordinates.latitude,
        dropOffLongitude: resolvedDropOff.coordinates.longitude,
        pickUpDate,
        dropOffDate,
        pickUpTime,
        dropOffTime,
        driverAge,
        currencyCode: 'EUR',
        units:        'metric',
        languageCode: 'en-us',
      });

      const searchKey  = data?.data?.search_key ?? null;
      const rawCars    = data?.data?.search_results ?? [];

      setCars(rawCars.map((c) => ({ ...mapApiCar(c, days), searchKey })));
      setSearchedLocation(resolvedPickUp.name + (resolvedPickUp.city ? ` – ${resolvedPickUp.city}` : ''));
      setFilter('all');
      setPage(1);
      setSearched(true);
    } catch (err) {
      setError(err.message || 'No se pudo realizar la búsqueda. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key) => { setFilter(key); setPage(1); };
  const handleSortChange   = (key) => { setSortKey(key); setPage(1); };

  return (
    <div className="min-h-screen bg-neutral-1/50">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Hero */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-1 rounded-[50%_50%_50%_0] mx-auto mb-4 flex items-center justify-center text-3xl">
            🚗
          </div>
          <h1 className="title-h2-desktop text-neutral-7 mb-2">Alquila tu coche</h1>
          <p className="body-2 text-neutral-4">Encuentra el coche perfecto para tu viaje en cualquier destino</p>
        </div>

        {/* Formulario */}
        <div className="mb-7">
          <CarSearchForm
            pickUpLocation={pickUpLocation}     onPickUpLocationChange={setPickUpLocation}
            dropOffLocation={dropOffLocation}   onDropOffLocationChange={setDropOffLocation}
            sameLocation={sameLocation}         onSameLocationChange={setSameLocation}
            pickUpDate={pickUpDate}             onPickUpDateChange={setPickUpDate}
            dropOffDate={dropOffDate}           onDropOffDateChange={setDropOffDate}
            pickUpTime={pickUpTime}             onPickUpTimeChange={setPickUpTime}
            dropOffTime={dropOffTime}           onDropOffTimeChange={setDropOffTime}
            driverAge={driverAge}               onDriverAgeChange={setDriverAge}
            pickUpQuery={pickUpText}            onPickUpQueryChange={setPickUpText}
            dropOffQuery={dropOffText}          onDropOffQueryChange={setDropOffText}
            loading={loading}
            canSearch={canSearch}
            onSearch={handleSearch}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-feedback-error/10 border border-feedback-error/30 rounded-xl px-4 py-3 mb-5 body-3 text-feedback-error-strong flex items-center gap-2">
            ⚠️ {error}
          </div>
        )}

        {/* Resultados */}
        {searched && (
          <CarResults
            cars={cars}
            searchedLocation={searchedLocation}
            days={days}
            filter={filter}       onFilterChange={handleFilterChange}
            sortKey={sortKey}     onSortChange={handleSortChange}
            page={page}           onPageChange={setPage}
            onView={setSelectedCar}
          />
        )}

        {/* Tips */}
        {!searched && (
          <div className="mt-2">
            <SectionLabel>Consejos para el alquiler</SectionLabel>
            <div className="grid grid-cols-2 gap-3">
              {TIPS.map((t) => <TipCard key={t.title} {...t} />)}
            </div>
          </div>
        )}

      </div>

      {/* Modal de detalles */}
      {selectedCar && (
        <CarDetailModal
          car={selectedCar}
          searchParams={{ pickUpDate, dropOffDate, pickUpTime, dropOffTime, currencyCode: 'EUR' }}
          onClose={() => setSelectedCar(null)}
        />
      )}
    </div>
  );
}
