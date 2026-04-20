import { useState } from 'react';
import { searchCars } from '../../../../../../services/carService';
import { mapApiCar, getDays, fmtDate, TIPS } from './carUtils';
import { SectionLabel, TipCard } from '../hotels/HotelAtoms';
import CarSearchForm from './CarSearchForm';
import CarResults from './CarResults';
import CarDetailModal from './CarDetailModal';
import { useAuth } from '../../../../../../context/AuthContext';

export default function CarSearch({ trip, members = [], tripId }) {
  const { user } = useAuth();

  const [pickUpLocation,  setPickUpLocation]  = useState(null);
  const [dropOffLocation, setDropOffLocation] = useState(null);
  const [sameLocation,    setSameLocation]    = useState(true);
  const [pickUpDate,      setPickUpDate]      = useState(trip?.startDate || '');
  const [dropOffDate,     setDropOffDate]     = useState(trip?.endDate || '');
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

  const [selectedCar, setSelectedCar] = useState(null);

  if (!user) {
    return (
      <div className="text-center py-16">
        <div className="w-14 h-14 bg-primary-1 rounded-[50%_50%_50%_0] mx-auto mb-4 flex items-center justify-center text-2xl">
          🔒
        </div>
        <h2 className="title-h3-desktop text-neutral-7 mb-2">Acceso restringido</h2>
        <p className="body-2 text-neutral-4">Debes iniciar sesión para buscar coches.</p>
      </div>
    );
  }

  const effectiveDropOff = sameLocation ? pickUpLocation : dropOffLocation;
  const days = getDays(pickUpDate, dropOffDate);

  const canSearch = Boolean(
    pickUpLocation?.coordinates &&
    effectiveDropOff?.coordinates &&
    pickUpDate && dropOffDate && days > 0 &&
    driverAge >= 18,
  );

  const handleSearch = async () => {
    if (!canSearch) return;
    setLoading(true);
    setError(null);
    setCars([]);
    setSearched(false);
    try {
      const data = await searchCars({
        pickUpLatitude:   pickUpLocation.coordinates.latitude,
        pickUpLongitude:  pickUpLocation.coordinates.longitude,
        dropOffLatitude:  effectiveDropOff.coordinates.latitude,
        dropOffLongitude: effectiveDropOff.coordinates.longitude,
        pickUpDate,
        dropOffDate,
        pickUpTime,
        dropOffTime,
        driverAge,
        currencyCode: trip?.currency || 'EUR',
        units:        'metric',
        languageCode: 'en-us',
      });

      const searchKey = data?.data?.search_key ?? null;
      const rawCars   = data?.data?.search_results ?? [];

      setCars(rawCars.map((c) => ({ ...mapApiCar(c, days), searchKey })));
      setSearchedLocation(
        pickUpLocation.name + (pickUpLocation.city ? ` – ${pickUpLocation.city}` : ''),
      );
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
    <>
      {/* Hero */}
      <div className="text-center mb-7">
        <div className="w-14 h-14 bg-primary-1 rounded-[50%_50%_50%_0] mx-auto mb-3 flex items-center justify-center text-2xl">
          🚗
        </div>
        <h2 className="title-h3-desktop text-neutral-7 mb-1">¿Necesitáis coche?</h2>
        <p className="body-2 text-neutral-4">Busca el alquiler de coche perfecto para tu grupo</p>
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

      {/* Destino del viaje */}
      {trip?.destination && !searched && (
        <div className="mb-6">
          <SectionLabel>Destino del viaje</SectionLabel>
          <div className="flex items-center gap-3 bg-white border border-neutral-1 rounded-xl px-4 py-3">
            <span className="text-2xl">🚗</span>
            <div>
              <p className="body-2-semibold text-neutral-7">{trip.destination}</p>
              {trip.origin && <p className="body-3 text-neutral-4">Desde {trip.origin}</p>}
              {days > 0 && (
                <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-1 text-primary-4 font-titles">
                  {days} día{days !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      {!searched && (
        <div>
          <SectionLabel>Consejos para el alquiler</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            {TIPS.map((t) => <TipCard key={t.title} {...t} />)}
          </div>
        </div>
      )}

      {/* Modal de detalles */}
      {selectedCar && (
        <CarDetailModal
          car={selectedCar}
          searchParams={{ pickUpDate, dropOffDate, pickUpTime, dropOffTime, currencyCode: trip?.currency || 'EUR' }}
          onClose={() => setSelectedCar(null)}
        />
      )}
    </>
  );
}
