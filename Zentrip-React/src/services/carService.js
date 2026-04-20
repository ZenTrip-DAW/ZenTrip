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

export function getCarLocations(query) {
  return apiClient.get(`/cars/location${buildQuery({ query })}`);
}

export function searchCars(params) {
  return apiClient.get(`/cars/search${buildQuery(params)}`);
}

export function getCarDetails(params) {
  return apiClient.get(`/cars/details${buildQuery(params)}`);
}
