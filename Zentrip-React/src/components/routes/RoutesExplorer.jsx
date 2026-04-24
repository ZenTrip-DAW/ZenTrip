import RouteExplorer from '../trips/detail/components/bookings/routes/RouteExplorer';

export default function RoutesExplorer() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <RouteExplorer trip={null} tripId={null} tripDays={[]} activitiesByDate={{}} />
    </div>
  );
}
