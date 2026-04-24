import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import CarSearch from '../trips/detail/components/bookings/cars/CarSearch';

export default function CarsExplorer() {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-4">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 body-3 text-neutral-4 hover:text-neutral-6 w-fit transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Volver
      </button>
      <CarSearch trip={null} tripId={null} members={[]} />
    </div>
  );
}
