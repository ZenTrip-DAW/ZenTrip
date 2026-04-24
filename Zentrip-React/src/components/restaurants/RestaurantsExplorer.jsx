import RestaurantSearch from '../trips/detail/components/bookings/restaurants/RestaurantSearch';

export default function RestaurantsExplorer() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <RestaurantSearch trip={null} tripId={null} members={[]} />
    </div>
  );
}
