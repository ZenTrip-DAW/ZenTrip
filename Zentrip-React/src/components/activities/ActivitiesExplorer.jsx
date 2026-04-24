import ActivitySearch from '../trips/detail/components/bookings/activities/ActivitySearch';

export default function ActivitiesExplorer() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <ActivitySearch trip={null} tripId={null} members={[]} />
    </div>
  );
}
