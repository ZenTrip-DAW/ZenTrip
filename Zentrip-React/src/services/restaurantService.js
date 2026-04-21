import { apiClient } from './apiClient';

function buildQuery(params) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || String(value).trim() === '') return;
    searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export function searchRestaurants(params) {
  return apiClient.get(`/restaurants/search${buildQuery(params)}`);
}

export function getRestaurantDetails(params) {
  return apiClient.get(`/restaurants/details${buildQuery(params)}`);
}
