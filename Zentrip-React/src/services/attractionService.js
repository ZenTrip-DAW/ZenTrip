import { apiClient } from './apiClient';

function buildQuery(params) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || String(value).trim() === '') return;
    searchParams.set(key, String(value));
  });
  const q = searchParams.toString();
  return q ? `?${q}` : '';
}

export function searchAttractions(params) {
  return apiClient.get(`/attractions/search${buildQuery(params)}`);
}

export function getAttractionDetails(params) {
  return apiClient.get(`/attractions/details${buildQuery(params)}`);
}
