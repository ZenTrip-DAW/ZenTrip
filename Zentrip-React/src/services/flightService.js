import { apiClient } from './apiClient';

function buildQuery(params) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || String(value).trim() === '') {
      return;
    }
    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export function getFlightDestinations(query) {
  return apiClient.get(`/flights/destinations${buildQuery({ query })}`);
}

export function getFlights(params) {
  return apiClient.get(`/flights/search${buildQuery(params)}`);
}

export function getFlightsMultiStops(params) {
  return apiClient.get(`/flights/search-multi-stops${buildQuery(params)}`);
}

export function getFlightDetails(currencyCode) {
  return apiClient.get(`/flights/details${buildQuery({ currencyCode })}`);
}

export function getFlightMinPrice(params) {
  return apiClient.get(`/flights/min-price${buildQuery(params)}`);
}

export function getFlightMinPriceMultiStops(params) {
  return apiClient.get(`/flights/min-price-multi-stops${buildQuery(params)}`);
}

export function getFlightSeatMap(currencyCode) {
  return apiClient.get(`/flights/seat-map${buildQuery({ currencyCode })}`);
}
